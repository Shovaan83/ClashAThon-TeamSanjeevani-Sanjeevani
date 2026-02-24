import 'dart:io';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:image_picker/image_picker.dart';
import 'package:sanjeevani/config/theme/app_theme.dart';

/// Full-screen editor that lets the patient draw opaque redaction boxes over
/// sensitive areas of a prescription image (PII protection).
///
/// Push this as a route via [PrescriptionRedactEditor.show] and receive back
/// an [XFile] with the redactions baked in, or [null] if the user cancelled.
class PrescriptionRedactEditor extends StatefulWidget {
  final XFile source;

  const PrescriptionRedactEditor({super.key, required this.source});

  /// Convenience: push editor and return the redacted [XFile] (or null).
  static Future<XFile?> show(BuildContext context, XFile source) {
    return Navigator.of(context).push<XFile>(
      MaterialPageRoute(
        fullscreenDialog: true,
        builder: (_) => PrescriptionRedactEditor(source: source),
      ),
    );
  }

  @override
  State<PrescriptionRedactEditor> createState() =>
      _PrescriptionRedactEditorState();
}

class _PrescriptionRedactEditorState extends State<PrescriptionRedactEditor> {
  // ── State ─────────────────────────────────────────────────────────────────
  final List<Rect> _rects = [];
  Offset? _dragStart;
  Offset? _dragCurrent;
  bool _isSaving = false;
  final _repaintKey = GlobalKey();

  // ── Helpers ───────────────────────────────────────────────────────────────
  Rect? get _liveRect {
    if (_dragStart == null || _dragCurrent == null) return null;
    return Rect.fromPoints(_dragStart!, _dragCurrent!);
  }

  Future<void> _saveAndReturn() async {
    setState(() => _isSaving = true);

    try {
      // Capture the RepaintBoundary as a ui.Image
      final boundary =
          _repaintKey.currentContext!.findRenderObject()
              as RenderRepaintBoundary;
      final image = await boundary.toImage(pixelRatio: 3.0);
      final byteData = await image.toByteData(format: ui.ImageByteFormat.png);

      if (byteData == null) throw Exception('Failed to encode image');

      // Write to a temp file and return as XFile
      final tmpDir = Directory.systemTemp;
      final file = File(
        '${tmpDir.path}/redacted_${DateTime.now().millisecondsSinceEpoch}.png',
      );
      await file.writeAsBytes(byteData.buffer.asUint8List());

      if (mounted) Navigator.of(context).pop(XFile(file.path));
    } catch (e) {
      if (mounted) {
        setState(() => _isSaving = false);
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Could not save: $e')));
      }
    }
  }

  // ── Build ─────────────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        title: const Text(
          'Redact Sensitive Info',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        ),
        actions: [
          // Clear all
          if (_rects.isNotEmpty)
            TextButton(
              onPressed: () => setState(() => _rects.clear()),
              child: const Text(
                'Clear',
                style: TextStyle(color: AppColors.accent),
              ),
            ),
          // Done / Save
          _isSaving
              ? const Padding(
                  padding: EdgeInsets.all(14),
                  child: SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                      color: Colors.white,
                      strokeWidth: 2,
                    ),
                  ),
                )
              : TextButton(
                  onPressed: _saveAndReturn,
                  child: const Text(
                    'Done',
                    style: TextStyle(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w700,
                      fontSize: 15,
                    ),
                  ),
                ),
        ],
      ),
      body: Column(
        children: [
          // ── Instruction banner ────────────────────────────
          Container(
            width: double.infinity,
            color: AppColors.primary.withValues(alpha: 0.9),
            padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
            child: const Row(
              children: [
                Icon(Icons.draw_outlined, size: 15, color: Colors.white),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Draw on the image to redact private information',
                    style: TextStyle(fontSize: 12, color: Colors.white),
                  ),
                ),
              ],
            ),
          ),

          // ── Canvas ───────────────────────────────────────
          Expanded(
            child: LayoutBuilder(
              builder: (context, constraints) {
                return GestureDetector(
                  onPanStart: (d) =>
                      setState(() => _dragStart = d.localPosition),
                  onPanUpdate: (d) =>
                      setState(() => _dragCurrent = d.localPosition),
                  onPanEnd: (_) {
                    final rect = _liveRect;
                    if (rect != null && rect.width > 4 && rect.height > 4) {
                      _rects.add(rect);
                    }
                    setState(() {
                      _dragStart = null;
                      _dragCurrent = null;
                    });
                  },
                  child: RepaintBoundary(
                    key: _repaintKey,
                    child: Stack(
                      fit: StackFit.expand,
                      children: [
                        // Base image
                        Image.file(
                          File(widget.source.path),
                          fit: BoxFit.contain,
                        ),
                        // Committed redact boxes + live drag box
                        CustomPaint(
                          painter: _RedactPainter(
                            committed: _rects,
                            live: _liveRect,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),

          // ── Bottom hint ───────────────────────────────────
          Container(
            color: const Color(0xFF111111),
            padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(
                  Icons.info_outline,
                  size: 13,
                  color: AppColors.textSecondary,
                ),
                const SizedBox(width: 6),
                Text(
                  '${_rects.length} redaction${_rects.length == 1 ? '' : 's'} applied',
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Painter ───────────────────────────────────────────────────────────────────

class _RedactPainter extends CustomPainter {
  final List<Rect> committed;
  final Rect? live;

  const _RedactPainter({required this.committed, required this.live});

  @override
  void paint(Canvas canvas, Size size) {
    final fillPaint = Paint()
      ..color = Colors.black
      ..style = PaintingStyle.fill;

    final borderPaint = Paint()
      ..color = AppColors.primary
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;

    // Draw committed boxes (solid black)
    for (final rect in committed) {
      canvas.drawRect(rect, fillPaint);
    }

    // Draw live drag box (semi-transparent with border)
    if (live != null) {
      canvas.drawRect(
        live!,
        Paint()
          ..color = Colors.black.withValues(alpha: 0.7)
          ..style = PaintingStyle.fill,
      );
      canvas.drawRect(live!, borderPaint);
    }
  }

  @override
  bool shouldRepaint(_RedactPainter old) =>
      old.committed != committed || old.live != live;
}
