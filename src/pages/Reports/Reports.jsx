import React, { useEffect, useState, useCallback } from 'react';
import {
  Eye,
  FileText,
  MapPin,
  Search,
  ShieldCheck,
  User,
  RefreshCw,
} from 'lucide-react';
import { reportService } from '../../services/reports/reportService.js';
import { RiskBadge } from '../../components/ui/RiskBadge.jsx';
import { StatusBadge } from '../../components/ui/StatusBadge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { useSelection } from '../../app/providers/SelectionContext.jsx';
import { useNavigate } from 'react-router-dom';

export function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verificationFilter, setVerificationFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [verifyingId, setVerifyingId] = useState(null);

  const { selectFeature } = useSelection();
  const navigate = useNavigate();

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const data = await reportService.getReports({
        verification_status: verificationFilter,
        severity: severityFilter,
        search: searchQuery
      });
      setReports(data);
    } catch (err) {
      console.error("Failed to load reports:", err);
    } finally {
      setLoading(false);
    }
  }, [verificationFilter, severityFilter, searchQuery]);

  useEffect(() => {
    let active = true;
    reportService.getReports({
      verification_status: verificationFilter,
      severity: severityFilter,
      search: searchQuery
    })
      .then(data => {
        if (!active) return;
        setReports(data);
        setLoading(false);
      })
      .catch(err => {
        if (!active) return;
        console.error("Failed to load reports:", err);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [verificationFilter, severityFilter, searchQuery]);

  const handleVerify = async (reportId) => {
    try {
      setVerifyingId(reportId);
      await reportService.verifyReport(reportId, 'VERIFIED');
      await loadReports();
    } catch (err) {
      console.error("Verify report failed:", err);
    } finally {
      setVerifyingId(null);
    }
  };

  const handleInspectMap = (report) => {
    selectFeature({
      type: 'REPORT',
      id: report.id,
      title: report.title || report.description,
      location_name: report.location_name,
      severity: report.severity,
      status: report.verification_status,
      coordinates: report.coordinates,
      created_at: report.reported_at || report.created_at,
      risk_score: report.severity === 'CRITICAL' ? 0.9 : report.severity === 'HIGH' ? 0.75 : 0.4
    }, { zoom: 14 });
    navigate('/risk-map');
  };

  const pendingCount = reports.filter(r => r.verification_status === 'UNVERIFIED' || r.verification_status === 'PENDING').length;
  const verifiedCount = reports.filter(r => r.verification_status === 'VERIFIED').length;

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-lg tracking-tight">Citizen Field Reports</h1>
              <p className="text-xs text-slate-500">
                Crowdsourced incident reports from citizen mobile app and ground verification dispatch workflow.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={() => loadReports(true)} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh Ingestion'}
          </Button>
        </div>
      </div>

      {/* Metric KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-card">
          <span className="text-[11px] font-medium text-slate-500 block">Total Reports</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{reports.length}</div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Papum Pare ingestion</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-amber-200/80 bg-amber-50/20 shadow-card">
          <span className="text-[11px] font-medium text-amber-800 block">Pending Verification</span>
          <div className="text-2xl font-bold text-amber-600 mt-1">{pendingCount}</div>
          <span className="text-[10px] text-amber-600 mt-0.5 block font-medium">Requires DDMO inspection</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-emerald-200/80 bg-emerald-50/20 shadow-card">
          <span className="text-[11px] font-medium text-emerald-800 block">Verified & Geocoded</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{verifiedCount}</div>
          <span className="text-[10px] text-emerald-600 mt-0.5 block font-medium">Live on GIS hazard layer</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-card">
          <span className="text-[11px] font-medium text-slate-500 block">Avg Response Time</span>
          <div className="text-2xl font-bold text-slate-900 font-mono mt-1">18 min</div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">From report to EOC dispatch</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3.5 border border-slate-200/90 rounded-xl shadow-card flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative min-w-[220px] flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search location, description, report ID..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-sky-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium text-[11px]">Verification:</span>
            <select
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium outline-none cursor-pointer hover:bg-slate-100 transition-colors"
            >
              <option value="ALL">All States</option>
              <option value="UNVERIFIED">Unverified Only</option>
              <option value="VERIFIED">Verified Only</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium text-[11px]">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium outline-none cursor-pointer hover:bg-slate-100 transition-colors"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MODERATE">Moderate</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>

        <div className="text-slate-400 font-mono text-[11px]">
          Showing <strong>{reports.length}</strong> reports
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Loading field reports database...
          </div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <FileText className="w-8 h-8 text-slate-300 mx-auto" />
            <div className="font-semibold text-slate-700">No Reports Found</div>
            <p className="text-xs text-slate-400">No citizen submissions matching the current search criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Report ID</th>
                  <th className="py-3 px-4">Incident & Location</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Reporter</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {reports.map(report => (
                  <tr key={report.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-800">{report.id}</td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-medium text-slate-900 leading-snug">{report.description || report.title}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-sky-600 shrink-0" />
                        <span>{report.location_name}</span>
                        {report.coordinates && (
                          <span className="text-slate-400 font-mono text-[10px]">
                            [{report.coordinates[1].toFixed(2)}, {report.coordinates[0].toFixed(2)}]
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <RiskBadge level={report.severity} size="sm" />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={report.verification_status} />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <User className="w-3 h-3 text-slate-400" />
                        <span className="font-medium">{report.reporter_name || 'Citizen User'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {(report.reported_at || report.created_at) ? new Date(report.reported_at || report.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      {report.verification_status !== 'VERIFIED' && (
                        <Button
                          size="xs"
                          variant="secondary"
                          icon={ShieldCheck}
                          onClick={() => handleVerify(report.id)}
                          disabled={verifyingId === report.id}
                        >
                          {verifyingId === report.id ? 'Verifying...' : 'Verify'}
                        </Button>
                      )}
                      <Button
                        size="xs"
                        variant="outline"
                        icon={Eye}
                        onClick={() => handleInspectMap(report)}
                      >
                        Map View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
