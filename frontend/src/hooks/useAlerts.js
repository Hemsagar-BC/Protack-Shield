import { useState, useEffect, useCallback, useRef } from 'react';
import { getSocket } from '../services/socket';
import { acknowledgeAlert as ackAlertAPI, clearAlerts as clearAlertsAPI } from '../services/api';
import { mockAlerts } from '../mock/data';

const ALERT_COOLDOWN = 30000; // 30 seconds per rule type
const MAX_ALERTS = 100;

export function useAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('all');
  const cooldownMap = useRef({});

  // Clear backend alert history on mount so refresh starts fresh
  useEffect(() => {
    clearAlertsAPI();
  }, []);

  // WebSocket alerts
  useEffect(() => {
    const socket = getSocket();

    const handleAlert = (alert) => {
      if (!alert || !alert.id) return;

      // Cooldown dedup by rule_id
      const ruleKey = alert.rule_id || 'unknown';
      const now = Date.now();
      if (cooldownMap.current[ruleKey] && now - cooldownMap.current[ruleKey] < ALERT_COOLDOWN) {
        return;
      }
      cooldownMap.current[ruleKey] = now;

      setAlerts(prev => {
        // Dedup by id
        if (prev.find(a => a.id === alert.id)) return prev;
        return [alert, ...prev].slice(0, MAX_ALERTS);
      });
    };

    const handleExplained = ({ alert_id, explanation }) => {
      if (!alert_id || !explanation) return;
      setAlerts(prev =>
        prev.map(a => a.id === alert_id ? { ...a, explanation } : a)
      );
    };

    socket.on('alert', handleAlert);
    socket.on('alert:explained', handleExplained);
    return () => {
      socket.off('alert', handleAlert);
      socket.off('alert:explained', handleExplained);
    };
  }, []);

  const acknowledgeAlert = useCallback(async (alertId) => {
    await ackAlertAPI(alertId);
    setAlerts(prev =>
      prev.map(a => a.id === alertId ? { ...a, acknowledged: true } : a)
    );
  }, []);

  const dismissAlert = useCallback((alertId) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  }, []);

  const acknowledgeAll = useCallback(() => {
    setAlerts(prev => prev.map(a => ({ ...a, acknowledged: true })));
  }, []);

  const filteredAlerts = alerts.filter(a => {
    switch (filter) {
      case 'active': return !a.acknowledged;
      case 'blocked': return a.acknowledged;
      case 'ml': return a.title?.includes('ML:') || a.rule_id?.startsWith('ml_');
      case 'acknowledged': return a.acknowledged;
      default: return true;
    }
  });

  const stats = {
    total: alerts.length,
    active: alerts.filter(a => !a.acknowledged).length,
    critical: alerts.filter(a => a.severity === 'critical').length,
    acknowledged: alerts.filter(a => a.acknowledged).length,
  };

  return {
    alerts: filteredAlerts,
    allAlerts: alerts,
    filter,
    setFilter,
    acknowledgeAlert,
    dismissAlert,
    acknowledgeAll,
    stats,
  };
}
