/// Represents a single message in the chat conversation.
enum MessageRole { user, assistant, system }

class ChatMessage {
  final String content;
  final MessageRole role;
  final DateTime timestamp;

  /// Optional local image path to display in the message bubble.
  /// Only used for UI rendering — the API still receives OCR-extracted text.
  final String? imagePath;

  const ChatMessage({
    required this.content,
    required this.role,
    required this.timestamp,
    this.imagePath,
  });

  /// Serialises to the format expected by the OpenRouter / OpenAI API.
  Map<String, String> toApiMap() => {
    'role': role.name, // "user" | "assistant" | "system"
    'content': content,
  };
}
