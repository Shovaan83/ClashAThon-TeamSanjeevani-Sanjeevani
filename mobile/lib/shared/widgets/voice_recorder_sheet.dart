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
///
/// Usage:
/// ```dart
/// final file = await showModalBottomSheet<File>(
///   context: context,
///   isScrollControlled: true,
///   builder: (_) => const VoiceRecorderSheet(),
/// );
/// ```
class VoiceRecorderSheet extends StatefulWidget {
  const VoiceRecorderSheet({super.key});

  @override
  State<VoiceRecorderSheet> createState() => _VoiceRecorderSheetState();
}

class _VoiceRecorderSheetState extends State<VoiceRecorderSheet> {
  final AudioRecorder _recorder = AudioRecorder();
  Timer? _timer;

  bool _isRecording = false;
  bool _hasRecording = false;
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
      _isRecording = true;
      _hasRecording = false;
      _elapsed = 0;
      _filePath = path;
    });

    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (_elapsed >= _kMaxDuration.inSeconds) {
        _stopRecording();
        return;
      }
      setState(() => _elapsed++);
    });
  }

  Future<void> _stopRecording() async {
    _timer?.cancel();
    final path = await _recorder.stop();
    setState(() {
      _isRecording = false;
      _hasRecording = path != null;
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
    return SafeArea(
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
                color: _isRecording ? AppColors.error : AppColors.textPrimary,
                fontFeatures: const [FontFeature.tabularFigures()],
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
                  _isRecording ? AppColors.error : AppColors.primary,
                ),
              ),
            ),
            const SizedBox(height: 28),

            // Controls
            if (!_hasRecording)
              // Record / stop button
              GestureDetector(
                onTap: _isRecording ? _stopRecording : _startRecording,
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  width: 72,
                  height: 72,
                  decoration: BoxDecoration(
                    color: _isRecording ? AppColors.error : AppColors.primary,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color:
                            (_isRecording ? AppColors.error : AppColors.primary)
                                .withValues(alpha: 0.3),
                        blurRadius: 16,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Icon(
                    _isRecording ? Icons.stop_rounded : Icons.mic,
                    color: Colors.white,
                    size: 36,
                  ),
                ),
              )
            else
              // Discard / Confirm
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Discard
                  OutlinedButton.icon(
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
                  const SizedBox(width: 16),
                  // Confirm
                  ElevatedButton.icon(
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
                ],
              ),

            const SizedBox(height: 12),

            // Cancel text button (always visible when not confirmed)
            if (!_hasRecording)
              TextButton(
                onPressed: _discard,
                child: const Text(
                  'Cancel',
                  style: TextStyle(color: AppColors.textSecondary),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
