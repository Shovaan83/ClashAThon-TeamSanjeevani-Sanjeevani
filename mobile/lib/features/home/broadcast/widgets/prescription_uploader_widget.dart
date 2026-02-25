import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:sanjeevani/config/theme/app_theme.dart';
import 'package:sanjeevani/features/home/broadcast/widgets/prescription_redact_editor.dart';

/// Card that lets the patient attach a prescription image (gallery or camera).
/// Displays a dashed-border drop zone when no file is selected, or a preview
/// thumbnail when a file has been picked.
///
/// The caller provides [file] and handles [onFilePicked] / [onRemove].
class PrescriptionUploaderWidget extends StatelessWidget {
  /// Currently selected prescription file. Null when nothing is picked yet.
  final XFile? file;

  /// Called with the new [XFile] after the user selects an image.
  final ValueChanged<XFile> onFilePicked;

  /// Called when the user removes the attached file.
  final VoidCallback onRemove;

  /// Whether the "Auto-detect PII" toggle is enabled.
  final bool autoDetectPii;

  /// Called when the PII toggle changes.
  final ValueChanged<bool> onAutoDetectPiiChanged;

  const PrescriptionUploaderWidget({
    super.key,
    required this.file,
    required this.onFilePicked,
    required this.onRemove,
    required this.autoDetectPii,
    required this.onAutoDetectPiiChanged,
  });

  Future<void> _showPickerSheet(BuildContext context) async {
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (_) => const _PickerSourceSheet(),
    );
    if (source == null) return;

    final picker = ImagePicker();
    final picked = await picker.pickImage(source: source, imageQuality: 85);
    if (picked != null) onFilePicked(picked);
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // ── Upload card ──────────────────────────────────────
        GestureDetector(
          onTap: file == null ? () => _showPickerSheet(context) : null,
          child: Container(
            height: 160,
            width: double.infinity,
            decoration: BoxDecoration(
              color: const Color(0xFFF7F8FA),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: AppColors.border,
                width: 1.5,
                strokeAlign: BorderSide.strokeAlignInside,
              ),
            ),
            child: file == null
                ? _EmptyUploadArea()
                : _PreviewArea(
                    file: file!,
                    onTap: () => _showPickerSheet(context),
                  ),
          ),
        ),

        // ── Bottom toolbar ───────────────────────────────────
        Padding(
          padding: const EdgeInsets.only(top: 8),
          child: Row(
            children: [
              const SizedBox(width: 4),
              // Redact / blur PII
              _ToolbarButton(
                icon: Icons.draw_outlined,
                tooltip: 'Redact sensitive info',
                onTap: file != null
                    ? () async {
                        final redacted = await PrescriptionRedactEditor.show(
                          context,
                          file!,
                        );
                        if (redacted != null) onFilePicked(redacted);
                      }
                    : null,
              ),
              const SizedBox(width: 4),
              // Remove
              _ToolbarButton(
                icon: Icons.delete_outline,
                tooltip: 'Remove',
                onTap: file != null ? onRemove : null,
                isDestructive: true,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// ── Private helpers ───────────────────────────────────────────────────────────

class _EmptyUploadArea extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: AppColors.primary.withValues(alpha: 0.08),
            shape: BoxShape.circle,
          ),
          child: const Icon(
            Icons.description_outlined,
            color: AppColors.textSecondary,
            size: 22,
          ),
        ),
        const SizedBox(height: 10),
        const Text(
          'Drop prescription here',
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 2),
        const Text(
          'PDF, PNG or JPG',
          style: TextStyle(fontSize: 11, color: AppColors.textSecondary),
        ),
      ],
    );
  }
}

class _PreviewArea extends StatelessWidget {
  final XFile file;
  final VoidCallback onTap;

  const _PreviewArea({required this.file, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(11),
          child: Image.file(File(file.path), fit: BoxFit.cover),
        ),
        Positioned(
          top: 8,
          right: 8,
          child: GestureDetector(
            onTap: onTap,
            child: Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.55),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.swap_horiz,
                color: Colors.white,
                size: 16,
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _ToolbarButton extends StatelessWidget {
  final IconData icon;
  final String? tooltip;
  final VoidCallback? onTap;
  final bool isDestructive;

  const _ToolbarButton({
    required this.icon,
    this.tooltip,
    this.onTap,
    this.isDestructive = false,
  });

  @override
  Widget build(BuildContext context) {
    final enabled = onTap != null;
    final color = isDestructive ? Colors.red : AppColors.textSecondary;

    final button = GestureDetector(
      onTap: onTap,
      child: Container(
        width: 34,
        height: 34,
        decoration: BoxDecoration(
          color: enabled
              ? AppColors.border.withValues(alpha: 0.4)
              : AppColors.border.withValues(alpha: 0.2),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(
          icon,
          size: 17,
          color: enabled ? color : color.withValues(alpha: 0.35),
        ),
      ),
    );

    if (tooltip != null) {
      return Tooltip(message: tooltip!, child: button);
    }
    return button;
  }
}

class _PickerSourceSheet extends StatelessWidget {
  const _PickerSourceSheet();

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(height: 12),
          Container(
            width: 36,
            height: 4,
            decoration: BoxDecoration(
              color: AppColors.border,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'Add Prescription',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 16),
          ListTile(
            leading: const Icon(Icons.photo_library_outlined),
            title: const Text('Choose from gallery'),
            onTap: () => Navigator.pop(context, ImageSource.gallery),
          ),
          ListTile(
            leading: const Icon(Icons.camera_alt_outlined),
            title: const Text('Take a photo'),
            onTap: () => Navigator.pop(context, ImageSource.camera),
          ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }
}
