import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from '../components/ui/Alert';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
} from '../components/ui/Icons';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
}

interface NotificationContextData {
  addNotification: (
    type: NotificationType,
    title: string,
    message?: string
  ) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextData | null>(null);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

const NotificationItem: React.FC<{
  notification: Notification;
  onClose: () => void;
}> = ({ notification, onClose }) => {
  useEffect(() => {
    const timer = window.setTimeout(onClose, 4500);
    return () => window.clearTimeout(timer);
  }, [onClose]);

  const iconMap = {
    success: <CheckCircle2 className="h-4 w-4 text-zinc-300" />,
    error: <AlertCircle className="h-4 w-4 text-zinc-300" />,
    warning: <AlertTriangle className="h-4 w-4 text-zinc-300" />,
    info: <Info className="h-4 w-4 text-zinc-300" />,
  };

  return (
    <Alert className="animate-scale-in">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">{iconMap[notification.type]}</div>
        <div className="min-w-0">
          <AlertTitle>{notification.title}</AlertTitle>
          {notification.message && (
            <AlertDescription className="mt-1">
              {notification.message}
            </AlertDescription>
          )}
        </div>
      </div>
      <AlertAction>
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 transition hover:bg-white/5 hover:text-zinc-100"
          aria-label="Fechar notificacao"
        >
          <X className="h-4 w-4" />
        </button>
      </AlertAction>
    </Alert>
  );
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );
  }, []);

  const addNotification = useCallback(
    (type: NotificationType, title: string, message?: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

      setNotifications((prev) => {
        const next = [...prev, { id, type, title, message }];
        return next.slice(-5);
      });
    },
    []
  );

  return (
    <NotificationContext.Provider value={{ addNotification, removeNotification }}>
      {children}
      {isMounted &&
        createPortal(
          <div
            className="pointer-events-none fixed inset-x-4 top-4 z-[2147483647] flex flex-col gap-3 sm:left-auto sm:w-full sm:max-w-sm"
            aria-live="polite"
            aria-atomic="true"
          >
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="pointer-events-auto animate-fade-in"
              >
                <NotificationItem
                  notification={notification}
                  onClose={() => removeNotification(notification.id)}
                />
              </div>
            ))}
          </div>,
          document.body
        )}
    </NotificationContext.Provider>
  );
};
