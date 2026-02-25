import 'dart:io';

import 'package:flutter/material.dart';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import 'package:image_picker/image_picker.dart';

import 'package:sanjeevani/config/theme/app_theme.dart';
import 'package:sanjeevani/core/constants/system_prompt.dart';
import 'package:sanjeevani/features/chatbot/models/chat_message.dart';
import 'package:sanjeevani/features/chatbot/services/chatbot_service.dart';

/// Full-screen chat interface for the Sanjeevani AI health assistant.
class ChatbotScreen extends StatefulWidget {
  const ChatbotScreen({super.key});

  @override
  State<ChatbotScreen> createState() => _ChatbotScreenState();
}

class _ChatbotScreenState extends State<ChatbotScreen> {
  final TextEditingController _inputController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final ChatbotService _service = ChatbotService();

  /// Full history including the hidden system prompt.
  final List<ChatMessage> _messages = [];

  bool _isLoading = false;

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  @override
  void initState() {
    super.initState();
    // Prepend the system prompt (never shown in the UI).
    _messages.add(
      ChatMessage(
        content: kChatSystemPrompt,
        role: MessageRole.system,
        timestamp: DateTime.now(),
      ),
    );
    // Greeting from the assistant.
    _messages.add(
      ChatMessage(
        content:
            "Hello! I'm Sanjeevani AI, your personal health assistant 🌿\n\nI can help you with health information, medication queries, finding nearby pharmacies, and more. How can I help you today?",
        role: MessageRole.assistant,
        timestamp: DateTime.now(),
      ),
    );
  }

  @override
  void dispose() {
    _inputController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  /// Only the messages shown in the chat list (excludes system prompt and
  /// hidden OCR prompt messages).
  List<ChatMessage> get _visibleMessages => _messages
      .where(
        (m) =>
            m.role != MessageRole.system &&
            !(m.role == MessageRole.user &&
                m.content.startsWith('Here is text extracted from')),
      )
      .toList();

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  // ── Action ─────────────────────────────────────────────────────────────────

  Future<void> _sendMessage() async {
    final text = _inputController.text.trim();
    if (text.isEmpty || _isLoading) return;

    _inputController.clear();
    setState(() {
      _messages.add(
        ChatMessage(
          content: text,
          role: MessageRole.user,
          timestamp: DateTime.now(),
        ),
      );
      _isLoading = true;
    });
    _scrollToBottom();

    try {
      final reply = await _service.sendMessage(_messages);
      if (!mounted) return;
      setState(() {
        _messages.add(
          ChatMessage(
            content: reply,
            role: MessageRole.assistant,
            timestamp: DateTime.now(),
          ),
        );
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _messages.add(
          ChatMessage(
            content:
                'Sorry, I encountered an error. Please check your connection and try again.',
            role: MessageRole.assistant,
            timestamp: DateTime.now(),
          ),
        );
        _isLoading = false;
      });
    }
    _scrollToBottom();
  }

  /// Lets the user pick or capture a prescription / report image, runs
  /// ML Kit OCR, then sends the extracted text to the chatbot for analysis.
  Future<void> _pickAndAnalyseImage() async {
    if (_isLoading) return;

    // Let the user choose camera or gallery
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 12),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.camera_alt_outlined),
                title: const Text('Camera'),
                onTap: () => Navigator.pop(ctx, ImageSource.camera),
              ),
              ListTile(
                leading: const Icon(Icons.photo_library_outlined),
                title: const Text('Gallery'),
                onTap: () => Navigator.pop(ctx, ImageSource.gallery),
              ),
            ],
          ),
        ),
      ),
    );

    if (source == null) return;

    final picked = await ImagePicker().pickImage(
      source: source,
      imageQuality: 85,
    );
    if (picked == null) return;

    // Show the image as a user message immediately
    setState(() {
      _messages.add(
        ChatMessage(
          content: '📷 Prescription image sent for analysis…',
          role: MessageRole.user,
          timestamp: DateTime.now(),
          imagePath: picked.path,
        ),
      );
      _isLoading = true;
    });
    _scrollToBottom();

    try {
      // Run OCR
      final inputImage = InputImage.fromFilePath(picked.path);
      final textRecognizer = TextRecognizer();
      final recognised = await textRecognizer.processImage(inputImage);
      await textRecognizer.close();

      final ocrText = recognised.text.trim();

      if (ocrText.isEmpty) {
        if (!mounted) return;
        setState(() {
          _messages.add(
            ChatMessage(
              content:
                  "I couldn't extract any text from that image. Please try a clearer photo of the prescription or report.",
              role: MessageRole.assistant,
              timestamp: DateTime.now(),
            ),
          );
          _isLoading = false;
        });
        _scrollToBottom();
        return;
      }

      // Build a prompt with the extracted text
      final prompt =
          'Here is text extracted from a prescription / medical report image '
          '(via OCR). Please analyse this and explain what the report says, '
          'including any medications, dosages, and recommendations:\n\n'
          '--- OCR TEXT ---\n$ocrText\n--- END ---';

      // Add as a hidden user message (the visible one already shows the image)
      _messages.add(
        ChatMessage(
          content: prompt,
          role: MessageRole.user,
          timestamp: DateTime.now(),
        ),
      );

      final reply = await _service.sendMessage(_messages);
      if (!mounted) return;
      setState(() {
        _messages.add(
          ChatMessage(
            content: reply,
            role: MessageRole.assistant,
            timestamp: DateTime.now(),
          ),
        );
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _messages.add(
          ChatMessage(
            content:
                'Sorry, I encountered an error analysing the image. Please try again.',
            role: MessageRole.assistant,
            timestamp: DateTime.now(),
          ),
        );
        _isLoading = false;
      });
    }
    _scrollToBottom();
  }

  // ── Build ──────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF0F4F1),
      appBar: _ChatAppBar(onClear: _clearChat),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              itemCount: _visibleMessages.length + (_isLoading ? 1 : 0),
              itemBuilder: (context, index) {
                if (index == _visibleMessages.length) {
                  return const _TypingIndicator();
                }
                return _MessageBubble(message: _visibleMessages[index]);
              },
            ),
          ),
          _ChatInputBar(
            controller: _inputController,
            isLoading: _isLoading,
            onSend: _sendMessage,
            onPickImage: _pickAndAnalyseImage,
          ),
        ],
      ),
    );
  }

  void _clearChat() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Clear conversation?'),
        content: const Text(
          'This will remove all messages in the current session.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              setState(() {
                _messages.removeWhere((m) => m.role != MessageRole.system);
                _messages.add(
                  ChatMessage(
                    content: "Conversation cleared. How can I help you today?",
                    role: MessageRole.assistant,
                    timestamp: DateTime.now(),
                  ),
                );
              });
            },
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: const Text('Clear'),
          ),
        ],
      ),
    );
  }
}

// ── App bar ────────────────────────────────────────────────────────────────────

class _ChatAppBar extends StatelessWidget implements PreferredSizeWidget {
  final VoidCallback onClear;
  const _ChatAppBar({required this.onClear});

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context) {
    return AppBar(
      backgroundColor: AppColors.primary,
      foregroundColor: Colors.white,
      titleSpacing: 0,
      leading: IconButton(
        icon: const Icon(Icons.arrow_back_ios_new, size: 20),
        onPressed: () => Navigator.pop(context),
      ),
      title: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.18),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.support_agent,
              color: Colors.white,
              size: 22,
            ),
          ),
          const SizedBox(width: 10),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'Sanjeevani AI',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
              Text(
                'Health Assistant',
                style: TextStyle(
                  fontSize: 11,
                  color: Colors.white.withValues(alpha: 0.8),
                ),
              ),
            ],
          ),
        ],
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.delete_sweep_outlined, color: Colors.white),
          tooltip: 'Clear chat',
          onPressed: onClear,
        ),
      ],
    );
  }
}

// ── Message bubble ─────────────────────────────────────────────────────────────

class _MessageBubble extends StatelessWidget {
  final ChatMessage message;
  const _MessageBubble({required this.message});

  bool get _isUser => message.role == MessageRole.user;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        mainAxisAlignment: _isUser
            ? MainAxisAlignment.end
            : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!_isUser) ...[
            CircleAvatar(
              radius: 16,
              backgroundColor: AppColors.primary,
              child: const Icon(
                Icons.support_agent,
                color: Colors.white,
                size: 16,
              ),
            ),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Container(
              constraints: BoxConstraints(
                maxWidth: MediaQuery.of(context).size.width * 0.75,
              ),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: _isUser ? AppColors.primary : Colors.white,
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(18),
                  topRight: const Radius.circular(18),
                  bottomLeft: Radius.circular(_isUser ? 18 : 4),
                  bottomRight: Radius.circular(_isUser ? 4 : 18),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.07),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Show image thumbnail if present
                  if (message.imagePath != null) ...[
                    ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Image.file(
                        File(message.imagePath!),
                        width: double.infinity,
                        height: 180,
                        fit: BoxFit.cover,
                      ),
                    ),
                    const SizedBox(height: 6),
                  ],
                  Text(
                    message.content,
                    style: TextStyle(
                      fontSize: 14,
                      height: 1.5,
                      color: _isUser ? Colors.white : AppColors.textPrimary,
                    ),
                  ),
                ],
              ),
            ),
          ),
          if (_isUser) ...[
            const SizedBox(width: 8),
            CircleAvatar(
              radius: 16,
              backgroundColor: AppColors.accent,
              child: const Icon(Icons.person, color: Colors.white, size: 16),
            ),
          ],
        ],
      ),
    );
  }
}

// ── Typing indicator ───────────────────────────────────────────────────────────

class _TypingIndicator extends StatefulWidget {
  const _TypingIndicator();

  @override
  State<_TypingIndicator> createState() => _TypingIndicatorState();
}

class _TypingIndicatorState extends State<_TypingIndicator>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  double _opacity(int index) {
    final phase = (_ctrl.value * 3 - index) % 3;
    if (phase < 1.0) return 0.3 + 0.7 * phase;
    if (phase < 2.0) return 1.0 - 0.7 * (phase - 1.0);
    return 0.3;
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          CircleAvatar(
            radius: 16,
            backgroundColor: AppColors.primary,
            child: const Icon(
              Icons.support_agent,
              color: Colors.white,
              size: 16,
            ),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(18),
                topRight: Radius.circular(18),
                bottomRight: Radius.circular(18),
                bottomLeft: Radius.circular(4),
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.07),
                  blurRadius: 6,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: AnimatedBuilder(
              animation: _ctrl,
              builder: (_, __) => Row(
                mainAxisSize: MainAxisSize.min,
                children: List.generate(3, (i) {
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 3),
                    child: Opacity(
                      opacity: _opacity(i),
                      child: Container(
                        width: 8,
                        height: 8,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                  );
                }),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Input bar ──────────────────────────────────────────────────────────────────

class _ChatInputBar extends StatelessWidget {
  final TextEditingController controller;
  final bool isLoading;
  final VoidCallback onSend;
  final VoidCallback onPickImage;

  const _ChatInputBar({
    required this.controller,
    required this.isLoading,
    required this.onSend,
    required this.onPickImage,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.white,
      padding: EdgeInsets.only(
        left: 12,
        right: 12,
        top: 10,
        bottom: MediaQuery.of(context).viewInsets.bottom + 10,
      ),
      child: SafeArea(
        top: false,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            // Image picker button
            IconButton(
              onPressed: isLoading ? null : onPickImage,
              icon: Icon(
                Icons.image_outlined,
                color: isLoading
                    ? AppColors.textSecondary
                    : AppColors.primary,
              ),
              tooltip: 'Send prescription image',
              padding: const EdgeInsets.only(bottom: 4),
              constraints: const BoxConstraints(minWidth: 40, minHeight: 40),
            ),
            Expanded(
              child: TextField(
                controller: controller,
                textCapitalization: TextCapitalization.sentences,
                minLines: 1,
                maxLines: 5,
                textInputAction: TextInputAction.send,
                onSubmitted: (_) => onSend(),
                decoration: InputDecoration(
                  hintText: 'Ask Sanjeevani AI…',
                  hintStyle: TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 14,
                  ),
                  filled: true,
                  fillColor: const Color(0xFFF0F4F1),
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 10,
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(26),
                    borderSide: BorderSide.none,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),
            Material(
              color: isLoading ? AppColors.textSecondary : AppColors.primary,
              shape: const CircleBorder(),
              elevation: isLoading ? 0 : 2,
              child: InkWell(
                customBorder: const CircleBorder(),
                onTap: isLoading ? null : onSend,
                child: const Padding(
                  padding: EdgeInsets.all(12),
                  child: Icon(
                    Icons.send_rounded,
                    color: Colors.white,
                    size: 20,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
