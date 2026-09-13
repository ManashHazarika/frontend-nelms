import React, { useState } from 'react';
import { X, ShieldCheck, MapPin, Activity, Droplets, Building2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useSelection } from '../../app/providers/SelectionContext.jsx';
import { alertService } from '../../services/alerts/alertService.js';
import { RiskBadge } from '../ui/RiskBadge.jsx';
import { Button } from '../ui/Button.jsx';

export function LocationDetailsPanel() {
  const { selectedFeature, clearSelection } = useSelection();
  const [ackLoading, setAckLoading] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [remarks, setRemarks] = useState('');

  if (!selectedFeature) return null;

  const handleAcknowledge = async () => {
    try {
      setAckLoading(true);
      await alertService.acknowledgeAlert(selectedFeature.id, remarks || 'Acknowledged by DDMO officer');
      setAcknowledged(true);
    } catch (err) {
      console.error('[LocationDetailsPanel] Acknowledge error:', err);
    } finally {
      setAckLoading(false);
    }
  };

  return (
    <aside className="w-88 max-w-[calc(100vw-32px)] bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-xl shadow-overlay flex flex-col max-h-[calc(100vh-140px)] z-30 pointer-events-auto overflow-hidden transition-all animate-in fade-in slide-in-from-right-4 duration-200">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-sky-400" />
          <h2 className="font-semibold text-xs tracking-tight">Location & Warning Details</h2>
        </div>
        <button
          onClick={clearSelection}
          className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md cursor-pointer transition-colors"
          aria-label="Close detail panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Title & Priority Badge */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <RiskBadge level={selectedFeature.severity || 'HIGH'} size="sm" />
            <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 font-medium">
              {acknowledged ? 'Acknowledged' : (selectedFeature.status || 'Active')}
            </span>
          </div>

          <h3 className="font-semibold text-sm text-slate-900 leading-snug">
            {selectedFeature.title || 'Selected Risk Feature'}
          </h3>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{selectedFeature.location_name || 'Papum Pare District'}</span>
            {selectedFeature.coordinates && (
              <span className="text-slate-400 font-mono text-[10px]">
                [{selectedFeature.coordinates[1].toFixed(3)}°N, {selectedFeature.coordinates[0].toFixed(3)}°E]
              </span>
            )}
          </div>
        </div>

        {/* Risk Score & Model Confidence Grid */}
        <div className="grid grid-cols-2 gap-2 bg-slate-50/80 border border-slate-200/80 p-3 rounded-lg">
          <div>
            <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Risk Score</div>
            <div className="text-lg font-bold text-slate-900 flex items-baseline gap-1 mt-0.5">
              {((selectedFeature.risk_score || 0.88) * 100).toFixed(0)}%
              <span className="text-xs font-medium text-rose-600">Critical</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">ML Confidence</div>
            <div className="text-lg font-bold text-slate-900 mt-0.5">
              {((selectedFeature.confidence || 0.92) * 100).toFixed(0)}%
              <span className="text-[10px] text-slate-400 font-mono block">v1.4-XGBoost</span>
            </div>
          </div>
        </div>

        {/* Environmental Triggers & Sensor Telemetry */}
        <div>
          <h4 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
            <Droplets className="w-3.5 h-3.5 text-sky-500" />
            Sensor Telemetry & Triggers
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-sky-50/60 border border-sky-100 p-2.5 rounded-lg">
              <span className="text-[10px] text-sky-700 font-medium block">24h Rainfall</span>
              <span className="text-sm font-bold text-sky-950 font-mono">{selectedFeature.rainfall_24h || 142.0} mm</span>
            </div>
            <div className="bg-amber-50/60 border border-amber-100 p-2.5 rounded-lg">
              <span className="text-[10px] text-amber-700 font-medium block">Soil Saturation</span>
              <span className="text-sm font-bold text-amber-950 font-mono">{selectedFeature.soil_saturation || 84.0}%</span>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 p-2.5 rounded-lg">
              <span className="text-[10px] text-slate-500 font-medium block">Terrain Slope</span>
              <span className="text-sm font-bold text-slate-800 font-mono">32.5°</span>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 p-2.5 rounded-lg">
              <span className="text-[10px] text-slate-500 font-medium block">SAR Shift Rate</span>
              <span className="text-sm font-bold text-slate-800 font-mono">-14.2 mm/yr</span>
            </div>
          </div>
        </div>

        {/* Affected Infrastructure */}
        <div>
          <h4 className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            Affected Infrastructure & Corridors
          </h4>
          <ul className="text-xs space-y-1 text-slate-600 bg-slate-50 border border-slate-200/80 p-2.5 rounded-lg">
            {(selectedFeature.affected_infrastructure || ['Trans-Arunachal Highway (NH-229)', 'Sagalee PHC Hospital']).map((item, idx) => (
              <li key={idx} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Recommended Action */}
        <div className="bg-amber-50/70 border border-amber-200/80 p-3 rounded-lg">
          <div className="flex items-center gap-1.5 text-amber-900 font-semibold text-xs">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Recommended Operational Action
          </div>
          <p className="text-xs text-amber-800 mt-1 leading-relaxed">
            {selectedFeature.recommended_action || 'Deploy PWD earthmovers and restrict heavy vehicle movement along NH-229.'}
          </p>
        </div>

        {/* Officer Action Form */}
        <div className="border-t border-slate-100 pt-3">
          <h4 className="text-xs font-semibold text-slate-800 mb-2">Officer Verification & Acknowledgement</h4>

          {acknowledged ? (
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
              <p className="text-xs font-semibold text-emerald-900">Warning Acknowledged</p>
              <p className="text-[10px] text-emerald-700 mt-0.5">Recorded in DDMO Yupia Control Room audit log.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter officer dispatch notes..."
                className="w-full text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 focus:bg-white transition-all"
              />
              <Button
                variant="dark"
                size="sm"
                onClick={handleAcknowledge}
                disabled={ackLoading}
                className="w-full"
                icon={ShieldCheck}
              >
                {ackLoading ? 'Recording...' : 'Acknowledge Bulletin'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
