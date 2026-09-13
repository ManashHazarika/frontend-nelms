import React, { useState } from 'react';
import { MapLibreViewer } from '../../components/map/MapLibreViewer.jsx';
import { useRegion } from '../../app/providers/RegionContext.jsx';
import { RiskBadge } from '../../components/ui/RiskBadge.jsx';
import { Filter, Search, Compass } from 'lucide-react';

export function RiskMap() {
  const { selectedDistrict } = useRegion();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="w-full h-full relative flex flex-col overflow-hidden bg-slate-100">
      {/* Top Operational Toolbar */}
      <div className="bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 py-2 flex items-center justify-between z-10 shrink-0 text-xs shadow-2xs select-none">
        <div className="flex items-center gap-3">
          <div className="font-semibold text-slate-800 flex items-center gap-1.5 text-xs">
            <Compass className="w-4 h-4 text-sky-600" />
            <span>Hazard Analysis View — {selectedDistrict?.name || 'Sector'}</span>
          </div>
          <RiskBadge level="HIGH" score={0.78} size="xs" />
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search coordinates or locality..."
              className="pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:ring-1 focus:ring-sky-500 focus:bg-white w-48 sm:w-56 transition-all"
            />
          </div>
          <button className="flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer font-medium text-xs transition-colors">
            <Filter className="w-3 h-3" />
            <span className="hidden sm:inline">Spatial Filter</span>
          </button>
        </div>
      </div>

      {/* Main Map Container */}
      <div className="flex-1 relative overflow-hidden">
        <MapLibreViewer />
      </div>
    </div>
  );
}
