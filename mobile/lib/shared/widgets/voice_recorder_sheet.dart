import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import 'package:record/record.dart';

import 'package:sanjeevani/config/theme/app_theme.dart';

/// Maximum recording duration (1 minute 30 seconds).
const _kMaxDuration = Duration(minutes: 1, seconds: 30);

/// Bottom-sheet widget that lets a pharmacy record a voice message.
///
/// Returns the recorded [File] via `Navigator.pop<File>`, or `null` if the
/// user cancels.
class VoiceRecorderSheet extends StatefulWidget {
  const VoiceRecorderSheet({super.key});

  @override
  State<VoiceRecorderSheet> createState() => _VoiceRecorderSheetState();
}

enum _RecordState { idle, recording, paused, done }

class _VoiceRecorderSheetState extends State<VoiceRecorderSheet> {
  final AudioRecorder _recorder = AudioRecorder();
  Timer? _timer;

  _RecordState _state = _RecordState.idle;
  int _elapsed = 0; // seconds
  String? _filePath;

  @override
  void dispose() {
    _timer?.cancel();
    _recorder.dispose();
    super.dispose();
  }

  // ── Actions ───────────────────────────────────────────────────────

  Future<void> _startRecording() async {
    final hasPermission = await _recorder.hasPermission();
    if (!hasPermission) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Microphone permission denied')),
        );
      }
      return;
    }

    final dir = await getTemporaryDirectory();
    final path =
        '${dir.path}/voice_${DateTime.now().millisecondsSinceEpoch}.m4a';

    await _recorder.start(
      const RecordConfig(encoder: AudioEncoder.aacLc, numChannels: 1),
      path: path,
    );

    setState(() {
      _state = _RecordState.recording;
      _elapsed = 0;
      _filePath = path;
    });

    _startTimer();
  }

  void _startTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (_elapsed >= _kMaxDuration.inSeconds) {
        _stopRecording();
        return;
      }
      setState(() => _elapsed++);
    });
  }

  Future<void> _pauseRecording() async {
    _timer?.cancel();
    await _recorder.pause();
    setState(() => _state = _RecordState.paused);
  }

  Future<void> _resumeRecording() async {
    await _recorder.resume();
    setState(() => _state = _RecordState.recording);
    _startTimer();
  }

  Future<void> _stopRecording() async {
    _timer?.cancel();
    final path = await _recorder.stop();
    setState(() {
      _state = path != null ? _RecordState.done : _RecordState.idle;
      if (path != null) _filePath = path;
    });
  }

  void _discard() {
    if (_filePath != null) {
      final f = File(_filePath!);
      if (f.existsSync()) f.deleteSync();
    }
    Navigator.pop(context);
  }

  void _confirm() {
    if (_filePath != null) {
      Navigator.pop(context, File(_filePath!));
    }
  }

  // ── UI helpers ────────────────────────────────────────────────────

  String _formatTime(int totalSeconds) {
    final m = totalSeconds ~/ 60;
    final s = totalSeconds % 60;
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  double get _progress => _elapsed / _kMaxDuration.inSeconds;

  // ── Build ─────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) async {
        if (didPop) return;
        final nav = Navigator.of(context);

        // Auto-stop & return file when dismissed during recording / paused
        if (_state == _RecordState.recording || _state == _RecordState.paused) {
          _timer?.cancel();
          final path = await _recorder.stop();
          final resolved = path ?? _filePath;
          if (resolved != null && mounted) {
            nav.pop(File(resolved));
          } else if (mounted) {
            nav.pop();
          }
          return;
        }

        // If done, return the recorded file
        if (_state == _RecordState.done && _filePath != null) {
          nav.pop(File(_filePath!));
          return;
        }

        // Idle — just close
        nav.pop();
      },
      child: SafeArea(
        child: Padding(
          padding: EdgeInsets.only(
            left: 24,
            right: 24,
            top: 20,
            bottom: MediaQuery.of(context).viewInsets.bottom + 20,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Drag handle
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 20),

              // Title
              const Text(
                'Record Voice Message',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 4),
              Text(
                'Max ${_kMaxDuration.inMinutes}m ${_kMaxDuration.inSeconds % 60}s',
                style: const TextStyle(
                  fontSize: 13,
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: 24),

              // Timer
              Text(
                _formatTime(_elapsed),
                style: TextStyle(
                  fontSize: 48,
                  fontWeight: FontWeight.w300,
                  color: _state == _RecordState.recording
                      ? AppColors.error
                      : _state == _RecordState.paused
                      ? AppColors.accent
                      : AppColors.textPrimary,
                  fontFeatures: const [FontFeature.tabularFigures()],
                ),
              ),
              if (_state == _RecordState.paused)
                const Text(
                  'PAUSED',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppColors.accent,
                    letterSpacing: 1.5,
                  ),
                ),
              const SizedBox(height: 8),

              // Progress bar
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: _progress,
                  minHeight: 4,
                  backgroundColor: Colors.grey.shade200,
                  valueColor: AlwaysStoppedAnimation<Color>(
                    _state == _RecordState.recording
                        ? AppColors.error
                        : AppColors.primary,
                  ),
                ),
              ),
              const SizedBox(height: 28),

              // ── Controls ────────────────────────────────────
              _buildControls(),

              const SizedBox(height: 12),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildControls() {
    switch (_state) {
      // ── Idle: big mic button + cancel ──
      case _RecordState.idle:
        return Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _circleButton(
              icon: Icons.mic,
              color: AppColors.primary,
              onTap: _startRecording,
            ),
            const SizedBox(height: 12),
            TextButton(
              onPressed: _discard,
              child: const Text(
                'Cancel',
                style: TextStyle(color: AppColors.textSecondary),
              ),
            ),
          ],
        );

      // ── Recording: pause + stop buttons ──
      case _RecordState.recording:
        return Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _circleButton(
              icon: Icons.pause_rounded,
              color: AppColors.accent,
              onTap: _pauseRecording,
              size: 56,
            ),
            const SizedBox(width: 28),
            _circleButton(
              icon: Icons.stop_rounded,
              color: AppColors.error,
              onTap: _stopRecording,
            ),
          ],
        );

      // ── Paused: resume + stop buttons ──
      case _RecordState.paused:
        return Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _circleButton(
              icon: Icons.play_arrow_rounded,
              color: AppColors.primary,
              onTap: _resumeRecording,
              size: 56,
            ),
            const SizedBox(width: 28),
            _circleButton(
              icon: Icons.stop_rounded,
              color: AppColors.error,
              onTap: _stopRecording,
            ),
          ],
        );

      // ── Done: discard / send buttons ──
      case _RecordState.done:
        return Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Flexible(
              child: OutlinedButton.icon(
                onPressed: _discard,
                icon: const Icon(Icons.delete_outline, size: 20),
                label: const Text('Discard'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.error,
                  side: const BorderSide(color: AppColors.error),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 12,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(24),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 16),
            Flexible(
              child: ElevatedButton.icon(
                onPressed: _confirm,
                icon: const Icon(Icons.check, size: 20),
                label: const Text('Send'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 24,
                    vertical: 12,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(24),
                  ),
                ),
              ),
            ),
          ],
        );
    }
  }

  /// Reusable circle icon button.
  Widget _circleButton({
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
    double size = 72,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          color: color,
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: color.withValues(alpha: 0.3),
              blurRadius: 16,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Icon(icon, color: Colors.white, size: size * 0.5),
      ),
    );
  }
}
