import React, { useEffect, useState, useCallback } from 'react';
import { AlertTriangle, Clock, MapPin, CheckCircle2, ChevronRight, Filter, ChevronUp, ChevronDown, RefreshCw } from 'lucide-react';
import { alertService } from '../../services/alerts/alertService.js';
import { useSelection } from '../../app/providers/SelectionContext.jsx';

function formatRelativeTime(dateStr) {
  if (!dateStr) return 'Just now';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / (1000 * 60));
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function WarningPriorityQueue() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [isMinimized, setIsMinimized] = useState(false);

  const { selectedFeature, selectFeature } = useSelection();

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await alertService.getActiveAlerts();
      const priorityOrder = { P1: 1, P2: 2, P3: 3, P4: 4, CRITICAL: 1, HIGH: 2, MODERATE: 3, LOW: 4 };
      const sorted = [...data].sort((a, b) => {
        const pA = priorityOrder[a.priority || a.severity] || 99;
        const pB = priorityOrder[b.priority || b.severity] || 99;
        return pA - pB;
      });
      setAlerts(sorted);
      setError(null);
    } catch (err) {
      console.error('[WarningPriorityQueue] Error fetching alerts:', err);
      setError('Unable to load warnings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    alertService.getActiveAlerts()
      .then(data => {
        if (!active) return;
        const priorityOrder = { P1: 1, P2: 2, P3: 3, P4: 4, CRITICAL: 1, HIGH: 2, MODERATE: 3, LOW: 4 };
        const sorted = [...data].sort((a, b) => {
          const pA = priorityOrder[a.priority || a.severity] || 99;
          const pB = priorityOrder[b.priority || b.severity] || 99;
          return pA - pB;
        });
        setAlerts(sorted);
        setError(null);
        setLoading(false);
      })
      .catch(err => {
        if (!active) return;
        console.error('[WarningPriorityQueue] Error fetching alerts:', err);
        setError('Unable to load warnings');
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleSelectWarning = (alertItem) => {
    selectFeature({
      type: 'ALERT',
      id: alertItem.id,
      title: alertItem.title,
      severity: alertItem.severity,
      priority: alertItem.priority || 'P1',
      coordinates: alertItem.coordinates || [93.42, 27.24],
      location_name: alertItem.location_name || 'Papum Pare Zone',
      message: alertItem.message || alertItem.bulletin_details,
      risk_score: alertItem.risk_score || 0.88,
      rainfall_24h: alertItem.rainfall_24h || 142.0,
      soil_saturation: alertItem.soil_saturation || 84.0,
      affected_infrastructure: alertItem.affected_infrastructure || [],
      recommended_action: alertItem.recommended_action || 'Inspect area',
      status: alertItem.status || 'ACTIVE',
      created_at: alertItem.created_at || new Date().toISOString(),
    }, { zoom: 13 });
  };

  const filteredAlerts = alerts.filter(item => {
    if (filterSeverity === 'ALL') return true;
    return item.severity === filterSeverity || item.priority === filterSeverity;
  });

  const getPriorityStyle = (severity, priority) => {
    if (severity === 'CRITICAL' || priority === 'P1') {
      return {
        badge: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold',
        border: 'border-l-rose-500',
        bg: 'hover:bg-rose-50/40',
        label: 'P1 Critical',
      };
    }
    if (severity === 'HIGH' || priority === 'P2') {
      return {
        badge: 'bg-orange-50 text-orange-700 border-orange-200 font-semibold',
        border: 'border-l-orange-500',
        bg: 'hover:bg-orange-50/40',
        label: 'P2 High',
      };
    }
    if (severity === 'MODERATE' || priority === 'P3') {
      return {
        badge: 'bg-amber-50 text-amber-700 border-amber-200 font-medium',
        border: 'border-l-amber-500',
        bg: 'hover:bg-amber-50/40',
        label: 'P3 Moderate',
      };
    }
    return {
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium',
      border: 'border-l-emerald-500',
      bg: 'hover:bg-emerald-50/40',
      label: 'P4 Low',
    };
  };

  // Minimized Floating Pill Render
  if (isMinimized) {
    return (
      <aside
        onClick={() => setIsMinimized(false)}
        className="w-72 max-w-[calc(100vw-32px)] bg-slate-900/95 backdrop-blur-md text-white border border-slate-800 rounded-xl shadow-panel px-3.5 py-2.5 flex items-center justify-between z-20 pointer-events-auto cursor-pointer hover:bg-slate-900 transition-all"
        title="Click to expand Warning Queue"
      >
        <div className="flex items-center gap-2 text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-semibold tracking-tight">Warning Queue</span>
          <span className="text-[10px] font-bold bg-rose-600 text-white px-2 py-0.5 rounded-full">
            {alerts.length} Active
          </span>
        </div>
        <div className="flex items-center gap-1 text-slate-400 hover:text-white">
          <span className="text-[11px]">Expand</span>
          <ChevronUp className="w-3.5 h-3.5" />
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-80 max-w-[calc(100vw-32px)] bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-xl shadow-panel flex flex-col max-h-84 z-20 pointer-events-auto overflow-hidden transition-all duration-200">
      {/* Header */}
      <div className="px-3.5 py-2.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <h2 className="font-semibold text-xs tracking-tight">Warning Priority Queue</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold bg-white/15 text-slate-200 px-2 py-0.5 rounded-full">
            {alerts.length} Active
          </span>
          <button
            onClick={fetchAlerts}
            disabled={loading}
            className="p-1 hover:bg-white/15 rounded-md text-slate-300 hover:text-white cursor-pointer transition-colors"
            title="Refresh Warning Queue"
            aria-label="Refresh Warning Queue"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 hover:bg-white/15 rounded-md text-slate-300 hover:text-white cursor-pointer transition-colors"
            title="Minimize Warning Queue"
            aria-label="Minimize Warning Queue"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-3 py-1.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-xs shrink-0">
        <span className="text-slate-500 text-[11px] font-medium flex items-center gap-1">
          <Filter className="w-3 h-3 text-slate-400" /> Filter:
        </span>
        <div className="flex items-center gap-1">
          {['ALL', 'CRITICAL', 'HIGH'].map(sev => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-2 py-0.5 text-[10px] font-semibold rounded-md cursor-pointer transition-colors ${filterSeverity === sev
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-slate-200/70 text-slate-600 hover:bg-slate-200'
                }`}
            >
              {sev === 'ALL' ? 'All' : sev === 'CRITICAL' ? 'Critical' : 'High'}
            </button>
          ))}
        </div>
      </div>

      {/* Warning Cards List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {loading && (
          <div className="p-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <div className="w-3.5 h-3.5 border-2 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Loading active warnings...</span>
          </div>
        )}

        {!loading && error && (
          <div className="p-3 text-center text-xs text-rose-600 bg-rose-50">
            {error}
          </div>
        )}

        {!loading && !error && filteredAlerts.length === 0 && (
          <div className="p-5 text-center text-xs text-slate-500">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5 opacity-90" />
            <p className="font-semibold text-slate-700">No Active Warnings</p>
            <p className="text-[11px] text-slate-400 mt-0.5">All monitored sectors normal.</p>
          </div>
        )}

        {!loading && !error && filteredAlerts.map(alert => {
          const isSelected = selectedFeature?.id === alert.id;
          const style = getPriorityStyle(alert.severity, alert.priority);

          return (
            <div
              key={alert.id}
              onClick={() => handleSelectWarning(alert)}
              className={`p-3 cursor-pointer transition-all border-l-4 ${style.border} ${isSelected
                  ? 'bg-sky-50/80 ring-1 ring-sky-500/50'
                  : `bg-white ${style.bg}`
                }`}
            >
              <div className="flex items-center justify-between gap-1.5">
                <span className={`px-1.5 py-0.5 text-[10px] rounded border ${style.badge}`}>
                  {style.label}
                </span>
                <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                  <Clock className="w-2.5 h-2.5" /> {formatRelativeTime(alert.created_at)}
                </span>
              </div>

              <h3 className="font-semibold text-xs text-slate-800 mt-1.5 leading-snug line-clamp-2">
                {alert.title}
              </h3>

              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                <span className="flex items-center gap-1 font-medium text-slate-600 truncate max-w-[160px]">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  {alert.location_name || 'Papum Pare'}
                </span>
                <span className="text-sky-600 font-medium flex items-center text-[10px] gap-0.5">
                  Inspect <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="px-3 py-1.5 bg-slate-50/80 border-t border-slate-100 text-[10px] text-slate-400 text-center shrink-0">
        Click warning item to fly to location
      </div>
    </aside>
  );
}
