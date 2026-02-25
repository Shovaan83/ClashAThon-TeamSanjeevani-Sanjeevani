/// Represents a single message in the chat conversation.
enum MessageRole { user, assistant, system }

class ChatMessage {
  final String content;
  final MessageRole role;
  final DateTime timestamp;

  const ChatMessage({
    required this.content,
    required this.role,
    required this.timestamp,
  });

  /// Serialises to the format expected by the OpenRouter / OpenAI API.
  Map<String, String> toApiMap() => {
    'role': role.name, // "user" | "assistant" | "system"
    'content': content,
  };
}
