import { create } from 'zustand';

export type NotificationType =
  | 'pharmacy_accepted'
  | 'pharmacy_rejected'
  | 'pharmacy_substitute'
  | 'new_request'
  | 'request_taken'
  | 'patient_selected_you';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  timestamp: number;
  unread: boolean;
  // Rich payload — populated depending on type
  audioUrl?: string | null;
  substituteName?: string | null;
  substitutePrice?: string | null;
  message?: string;
  requestId?: string;
}

interface NotificationState {
  notifications: AppNotification[];
  addNotification: (n: Omit<AppNotification, 'id' | 'timestamp' | 'unread'>) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  dismiss: (id: string) => void;
}

let _id = 0;

export const useNotificationStore = create<NotificationState>()((set) => ({
  notifications: [],

  addNotification: (n) =>
    set((state) => ({
      notifications: [
        { ...n, id: String(++_id), timestamp: Date.now(), unread: true },
        ...state.notifications,
      ],
    })),

  markRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, unread: false } : n,
      ),
    })),

  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, unread: false })),
    })),

  dismiss: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
}));
