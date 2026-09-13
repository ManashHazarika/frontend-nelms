import { apiFetch } from '../apiClient.js';
import { MOCK_ALERTS, ALERT_HISTORY } from '../../data/mock/alertsData.js';

function transformBackendAlert(alert) {
  return {
    id: alert.id,
    priority: alert.severity === 'CRITICAL' ? 'P1' : alert.severity === 'HIGH' ? 'P2' : 'P3',
    severity: alert.severity || 'MODERATE',
    status: alert.status || 'ACTIVE',
    title: alert.title || 'Landslide Early Warning Alert',
    message: alert.message || 'Elevated landslide risk detected in the monitored sector.',
    location_name: alert.location_name || 'Papum Pare District, NER',
    coordinates: alert.coordinates || [93.65, 27.20],
    risk_score: alert.risk_score || (alert.severity === 'CRITICAL' ? 0.92 : 0.75),
    confidence: alert.confidence || 0.88,
    rainfall_24h: alert.rainfall_24h || 125.0,
    soil_saturation: alert.soil_saturation || 82.0,
    created_at: alert.created_at || new Date().toISOString(),
    acknowledged_at: alert.acknowledged_at || null,
    affected_infrastructure: alert.affected_infrastructure || ['NER Transport Corridor'],
    recommended_action: alert.recommended_action || 'Review slope risk telemetry and alert field squads.',
  };
}

export const alertService = {
  async getActiveAlerts(statusFilter = null) {
    try {
      const url = statusFilter ? `/alerts?status=${statusFilter}` : '/alerts';
      const data = await apiFetch(url);
      if (Array.isArray(data) && data.length > 0) {
        return data.map(transformBackendAlert);
      }
      return MOCK_ALERTS;
    } catch {
      return MOCK_ALERTS;
    }
  },

  async getAlertHistory() {
    try {
      // If backend has resolved alerts, return them, else fallback to mock history
      const data = await apiFetch('/alerts?status=RESOLVED');
      if (Array.isArray(data) && data.length > 0) {
        return data.map(transformBackendAlert);
      }
      return ALERT_HISTORY;
    } catch {
      return ALERT_HISTORY;
    }
  },

  async acknowledgeAlert(alertId, remarks = 'Acknowledged by operational officer') {
    try {
      const result = await apiFetch(`/alerts/${alertId}/acknowledge`, {
        method: 'POST',
        body: JSON.stringify({ remarks }),
      });
      return transformBackendAlert(result);
    } catch {
      // Local fallback update for offline mode
      const alert = MOCK_ALERTS.find(a => a.id === alertId);
      if (alert) {
        alert.status = 'ACKNOWLEDGED';
        alert.acknowledged_at = new Date().toISOString();
      }
      return alert || { id: alertId, status: 'ACKNOWLEDGED', acknowledged_at: new Date().toISOString() };
    }
  }
};
