import { INITIAL_REPORTS } from '../../data/mock/reportsData.js';
import { apiFetch } from '../apiClient.js';

let mockReportsStore = [...INITIAL_REPORTS];

function transformBackendReport(report) {
  const isVerified = report.status === 'VERIFIED';
  const isPending = report.status === 'PENDING';
  return {
    id: String(report.id),
    location_name: report.description ? report.description.slice(0, 35) : `Sector [${report.latitude?.toFixed(2)}, ${report.longitude?.toFixed(2)}]`,
    district: 'Papum Pare',
    coordinates: [report.longitude, report.latitude],
    severity: report.report_type === 'LANDSLIDE' ? 'CRITICAL' : 'HIGH',
    verification_status: isVerified ? 'VERIFIED' : (isPending ? 'UNVERIFIED' : report.status),
    status: isVerified ? 'UNDER_MONITORING' : (report.status === 'REJECTED' ? 'REJECTED' : 'PENDING_VERIFICATION'),
    reporter_type: 'CITIZEN',
    reporter_name: 'Field Contributor',
    reported_at: report.capture_timestamp || report.created_at || new Date().toISOString(),
    description: report.description || 'Ground observation report',
    media_available: Boolean(report.media && report.media.length > 0),
  };
}

export const reportService = {
  async getReports(filters = {}) {
    try {
      const params = {};
      if (filters.verification_status && filters.verification_status !== 'ALL') {
        params.status = filters.verification_status === 'VERIFIED' ? 'VERIFIED' : 'PENDING';
      }
      const query = new URLSearchParams(params).toString();
      const data = await apiFetch(`/reports${query ? `?${query}` : ''}`);
      if (Array.isArray(data) && data.length > 0) {
        let transformed = data.map(transformBackendReport);
        if (filters.severity && filters.severity !== 'ALL') {
          transformed = transformed.filter(r => r.severity === filters.severity);
        }
        if (filters.search) {
          const q = filters.search.toLowerCase();
          transformed = transformed.filter(r =>
            r.location_name.toLowerCase().includes(q) ||
            r.description.toLowerCase().includes(q) ||
            r.id.toLowerCase().includes(q)
          );
        }
        return transformed;
      }
      throw new Error('No backend data, fallback to mock store');
    } catch {
      let filtered = [...mockReportsStore];
      if (filters.verification_status && filters.verification_status !== 'ALL') {
        filtered = filtered.filter(r => r.verification_status === filters.verification_status);
      }
      if (filters.severity && filters.severity !== 'ALL') {
        filtered = filtered.filter(r => r.severity === filters.severity);
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        filtered = filtered.filter(r => 
          r.location_name.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q)
        );
      }
      return filtered;
    }
  },

  async verifyReport(reportId, status = 'VERIFIED', remarks = 'Verified by operational officer') {
    try {
      const decision = status === 'VERIFIED' ? 'VERIFY' : (status === 'REJECTED' ? 'REJECT' : 'NEEDS_INFORMATION');
      const result = await apiFetch(`/reports/${reportId}/verify`, {
        method: 'POST',
        body: JSON.stringify({ decision, remarks })
      });
      return result;
    } catch {
      mockReportsStore = mockReportsStore.map(r => {
        if (r.id === reportId) {
          return {
            ...r,
            verification_status: status,
            verified_by: 'DDMO Duty Officer (Local Verification)',
            verified_at: new Date().toISOString(),
            status: status === 'VERIFIED' ? 'UNDER_MONITORING' : 'REJECTED'
          };
        }
        return r;
      });
      return mockReportsStore.find(r => r.id === reportId);
    }
  },

  async submitReport(newReportData) {
    try {
      const payload = {
        report_type: newReportData.report_type || 'LANDSLIDE',
        description: newReportData.description || 'Landslide observed',
        latitude: newReportData.coordinates ? newReportData.coordinates[1] : (newReportData.latitude || 27.20),
        longitude: newReportData.coordinates ? newReportData.coordinates[0] : (newReportData.longitude || 93.65),
        capture_timestamp: newReportData.capture_timestamp || new Date().toISOString(),
      };
      const result = await apiFetch('/reports', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      return transformBackendReport(result);
    } catch {
      const created = {
        id: `REP-2026-${Math.floor(100 + Math.random() * 900)}`,
        reported_at: new Date().toISOString(),
        reporter_type: 'CITIZEN',
        verification_status: 'UNVERIFIED',
        status: 'PENDING_VERIFICATION',
        media_available: Boolean(newReportData.photo_url),
        ...newReportData
      };
      mockReportsStore.unshift(created);
      return created;
    }
  }
};
