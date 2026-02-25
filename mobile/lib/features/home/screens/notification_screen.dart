import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:sanjeevani/config/theme/app_theme.dart';
import 'package:sanjeevani/core/providers/notification_provider.dart';

/// Notifications tab — shows real-time notifications from WebSocket events.
///
/// **Pharmacy** sees: `new_request`, `request_taken` events.
/// **Customer** sees: `pharmacy_response` events.
class NotificationScreen extends StatelessWidget {
  const NotificationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<NotificationProvider>(
      builder: (context, provider, _) {
        final notifications = provider.notifications;

        return Column(
          children: [
            // ── Header ─────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Notifications',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${provider.unreadCount} unread',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                  Row(
                    children: [
                      if (provider.unreadCount > 0)
                        TextButton(
                          onPressed: () => provider.markAllAsRead(),
                          child: const Text(
                            'Mark all read',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      if (notifications.isNotEmpty)
                        IconButton(
                          icon: const Icon(
                            Icons.delete_sweep_outlined,
                            size: 22,
                            color: AppColors.textSecondary,
                          ),
                          tooltip: 'Clear all',
                          onPressed: () => _confirmClear(context, provider),
                        ),
                    ],
                  ),
                ],
              ),
            ),

            const Divider(height: 20),

            // ── Notification list ──────────────────────────
            Expanded(
              child: notifications.isEmpty
                  ? const _EmptyNotifications()
                  : ListView.separated(
                      padding: const EdgeInsets.fromLTRB(16, 4, 16, 20),
                      itemCount: notifications.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 8),
                      itemBuilder: (context, index) {
                        final n = notifications[index];
                        return _NotificationTile(
                          notification: n,
                          onTap: () {
                            provider.markAsRead(n.id);
                          },
                          onDismiss: () {
                            // Remove single notification
                            provider.markAsRead(n.id);
                          },
                        );
                      },
                    ),
            ),
          ],
        );
      },
    );
  }

  void _confirmClear(BuildContext context, NotificationProvider provider) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Clear Notifications'),
        content: const Text('Remove all notifications?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              provider.clearNotifications();
              Navigator.pop(ctx);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
              foregroundColor: Colors.white,
            ),
            child: const Text('Clear All'),
          ),
        ],
      ),
    );
  }
}

// ── Notification tile ────────────────────────────────────────────────────────

class _NotificationTile extends StatelessWidget {
  final AppNotification notification;
  final VoidCallback onTap;
  final VoidCallback onDismiss;

  const _NotificationTile({
    required this.notification,
    required this.onTap,
    required this.onDismiss,
  });

  @override
  Widget build(BuildContext context) {
    final isUnread = !notification.isRead;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isUnread
              ? AppColors.primary.withValues(alpha: 0.04)
              : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isUnread
                ? AppColors.primary.withValues(alpha: 0.15)
                : AppColors.border.withValues(alpha: 0.4),
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Icon
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: _iconColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(_icon, color: _iconColor, size: 20),
            ),
            const SizedBox(width: 12),

            // Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      if (isUnread)
                        Container(
                          width: 7,
                          height: 7,
                          margin: const EdgeInsets.only(right: 6),
                          decoration: const BoxDecoration(
                            shape: BoxShape.circle,
                            color: AppColors.primary,
                          ),
                        ),
                      Expanded(
                        child: Text(
                          notification.title,
                          style: TextStyle(
                            fontWeight: isUnread
                                ? FontWeight.w700
                                : FontWeight.w600,
                            fontSize: 14,
                          ),
                        ),
                      ),
                      Text(
                        _relativeTime(notification.timestamp),
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    notification.body,
                    style: TextStyle(
                      fontSize: 13,
                      color: isUnread
                          ? AppColors.textPrimary
                          : AppColors.textSecondary,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  IconData get _icon {
    switch (notification.type) {
      case 'new_request':
        return Icons.medical_services_outlined;
      case 'pharmacy_response':
        final accepted = notification.payload['response_type'] == 'ACCEPTED';
        return accepted ? Icons.check_circle_outline : Icons.cancel_outlined;
      case 'request_taken':
        return Icons.info_outline;
      default:
        return Icons.notifications_outlined;
    }
  }

  Color get _iconColor {
    switch (notification.type) {
      case 'new_request':
        return AppColors.accent;
      case 'pharmacy_response':
        final accepted = notification.payload['response_type'] == 'ACCEPTED';
        return accepted ? AppColors.success : AppColors.error;
      case 'request_taken':
        return const Color(0xFF6366F1);
      default:
        return AppColors.primary;
    }
  }

  String _relativeTime(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inSeconds < 60) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m';
    if (diff.inHours < 24) return '${diff.inHours}h';
    return '${diff.inDays}d';
  }
}

// ── Empty state ──────────────────────────────────────────────────────────────

class _EmptyNotifications extends StatelessWidget {
  const _EmptyNotifications();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.notifications_none,
            size: 64,
            color: AppColors.border.withValues(alpha: 0.6),
          ),
          const SizedBox(height: 12),
          const Text(
            'No Notifications',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            "You're all caught up!",
            style: TextStyle(fontSize: 14, color: AppColors.textSecondary),
          ),
        ],
      ),
    );
  }
}
