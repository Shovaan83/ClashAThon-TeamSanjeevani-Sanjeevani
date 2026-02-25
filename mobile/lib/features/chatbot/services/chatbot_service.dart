import 'dart:convert';

import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;

import 'package:sanjeevani/features/chatbot/models/chat_message.dart';

/// Communicates with the OpenRouter chat-completions endpoint.
///
/// The API key is read from the `.env` file (`apikey` field) which is loaded
/// by `flutter_dotenv` at app start-up.
class ChatbotService {
  static const String _endpoint =
      'https://openrouter.ai/api/v1/chat/completions';

  /// Free, reasoning-capable model available on OpenRouter.
  static const String _model = 'arcee-ai/trinity-large-preview:free';

  String get _apiKey => dotenv.env['apikey'] ?? '';

  /// Sends the full [messages] history to OpenRouter and returns the
  /// assistant's reply text.
  ///
  /// Throws an [Exception] on non-2xx responses.
  Future<String> sendMessage(List<ChatMessage> messages) async {
    final response = await http
        .post(
          Uri.parse(_endpoint),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer $_apiKey',
            'HTTP-Referer': 'https://sanjeevani.app',
            'X-Title': 'Sanjeevani AI',
          },
          body: jsonEncode({
            'model': _model,
            'messages': messages.map((m) => m.toApiMap()).toList(),
          }),
        )
        .timeout(const Duration(seconds: 60));

    final data = jsonDecode(response.body) as Map<String, dynamic>;

    if (response.statusCode == 200) {
      final content =
          data['choices']?[0]?['message']?['content'] as String? ?? '';
      return content.trim();
    }

    final errMsg =
        (data['error'] as Map<String, dynamic>?)?['message'] as String? ??
        'Request failed (${response.statusCode})';
    throw Exception(errMsg);
  }
}
