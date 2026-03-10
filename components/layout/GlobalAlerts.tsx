import React, { useEffect, useState } from 'react';
import { Alert } from '../../types';
import { alertService } from '../../services/alertService';
import {
  X,
  Info,
  AlertTriangle,
  AlertCircle,
  ShieldAlert,
  Trash2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

interface GlobalAlertsProps {
  userRole: string;
}

export const GlobalAlerts: React.FC<GlobalAlertsProps> = ({ userRole }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [expanded, setExpanded] = useState(false);
  const { addNotification } = useNotification();

  const isAdmin = userRole === 'admin';

  const fetchAlerts = async () => {
    try {
      const data = await alertService.list();

      const hiddenAlerts = JSON.parse(
        localStorage.getItem('hiddenAlerts') || '[]'
      );

      const filtered = data.filter(
        (alert: Alert) => !hiddenAlerts.includes(alert.id)
      );

      setAlerts(filtered);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await alertService.delete(id);

      setAlerts(prev => prev.filter(a => a.id !== id));

      addNotification(
        'success',
        'Alerta removido',
        'O alerta foi removido do sistema.'
      );
    } catch (error) {
      console.error('Failed to delete alert:', error);

      addNotification(
        'error',
        'Erro',
        'Não foi possível remover o alerta.'
      );
    }
  };

  const handleHide = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));

    const hiddenAlerts = JSON.parse(
      localStorage.getItem('hiddenAlerts') || '[]'
    );

    if (!hiddenAlerts.includes(id)) {
      hiddenAlerts.push(id);
      localStorage.setItem('hiddenAlerts', JSON.stringify(hiddenAlerts));
    }
  };

  if (alerts.length === 0) return null;

  const visibleAlerts = expanded ? alerts : alerts.slice(0, 1);

  const getAlertStyles = (level: string) => {
    switch (level) {
      case 'critical':
        return {
          bg: 'bg-red-600',
          text: 'text-white',
          icon: <ShieldAlert className="w-5 h-5" />
        };
      case 'error':
        return {
          bg: 'bg-red-500',
          text: 'text-white',
          icon: <AlertCircle className="w-5 h-5" />
        };
      case 'warning':
        return {
          bg: 'bg-amber-500',
          text: 'text-white',
          icon: <AlertTriangle className="w-5 h-5" />
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-500',
          text: 'text-white',
          icon: <Info className="w-5 h-5" />
        };
    }
  };

  return (
    <div className="flex flex-col w-full z-50">

      {visibleAlerts.map(alert => {
        const styles = getAlertStyles(alert.level);

        return (
          <div
            key={alert.id}
            className={`${styles.bg} ${styles.text} px-4 py-3 flex items-start sm:items-center justify-between shadow-sm`}
          >
            <div className="flex items-start sm:items-center gap-3">
              <div className="shrink-0 mt-0.5 sm:mt-0">
                {styles.icon}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <strong className="font-bold text-sm tracking-wide">
                  {alert.title}
                </strong>

                <span className="hidden sm:inline opacity-50 text-xs">
                  |
                </span>

                <span className="text-sm opacity-90">
                  {alert.message}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-4">

              {/* ocultar */}
              <button
                onClick={() => handleHide(alert.id)}
                className="p-1.5 hover:bg-black/10 rounded-md transition-colors"
                title="Ocultar alerta"
              >
                <X className="w-4 h-4" />
              </button>

              {/* deletar global */}
              {isAdmin && (
                <button
                  onClick={() => handleDelete(alert.id)}
                  className="p-1.5 hover:bg-black/10 rounded-md transition-colors"
                  title="Excluir do sistema"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

            </div>
          </div>
        );
      })}

      {/* botão expandir / recolher */}
      {alerts.length > 1 && (
        <div className="flex justify-center bg-gray-50 border-t">

          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-sm py-2 px-4 text-gray-600 hover:text-gray-900 transition"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Mostrar apenas o mais recente
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Mostrar mais {alerts.length - 1} alerta(s)
              </>
            )}
          </button>

        </div>
      )}

    </div>
  );
};