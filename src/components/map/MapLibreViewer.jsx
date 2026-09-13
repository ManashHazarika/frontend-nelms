import { useEffect, useRef, useState, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import { useLayers } from '../../app/providers/LayerContext.jsx';
import { useSelection } from '../../app/providers/SelectionContext.jsx';
import { useRegion } from '../../app/providers/RegionContext.jsx';
import { MapControls } from './MapControls.jsx';
import { MapLegend } from './MapLegend.jsx';
import { LocationDetailsPanel } from './LocationDetailsPanel.jsx';

import { RISK_ZONES_GEOJSON } from '../../data/geojson/riskZones.js';
import { ROAD_NETWORK_GEOJSON } from '../../data/geojson/roadNetwork.js';
import { VILLAGES_GEOJSON, CRITICAL_INFRASTRUCTURE_GEOJSON } from '../../data/geojson/infrastructure.js';
import { CITIZEN_REPORTS_GEOJSON, VERIFIED_REPORTS_GEOJSON } from '../../data/mock/reportsData.js';
import { MOCK_ALERTS } from '../../data/mock/alertsData.js';
import { alertService } from '../../services/alerts/alertService.js';
import { infrastructureService } from '../../services/infrastructure/infrastructureService.js';
import { reportService } from '../../services/reports/reportService.js';

// Basemap style configurations (OpenStreetMap variants)
const BASEMAP_STYLES = {
  'osm-standard': {
    version: 8,
    sources: {
      'osm-tiles': {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }
    },
    layers: [
      {
        id: 'osm-tiles-layer',
        type: 'raster',
        source: 'osm-tiles',
        minzoom: 0,
        maxzoom: 19
      }
    ]
  },
  'osm-topo': {
    version: 8,
    sources: {
      'topo-tiles': {
        type: 'raster',
        tiles: [
          'https://a.tile.opentopomap.org/{z}/{x}/{y}.png',
          'https://b.tile.opentopomap.org/{z}/{x}/{y}.png',
          'https://c.tile.opentopomap.org/{z}/{x}/{y}.png'
        ],
        tileSize: 256,
        attribution: '&copy; OpenStreetMap contributors, SRTM | OpenTopoMap'
      }
    },
    layers: [
      {
        id: 'topo-tiles-layer',
        type: 'raster',
        source: 'topo-tiles',
        minzoom: 0,
        maxzoom: 17
      }
    ]
  },
  'osm-satellite': {
    version: 8,
    sources: {
      'satellite-tiles': {
        type: 'raster',
        tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
        tileSize: 256,
        attribution: 'Esri, Maxar, Earthstar Geographics, OpenStreetMap'
      }
    },
    layers: [
      {
        id: 'satellite-tiles-layer',
        type: 'raster',
        source: 'satellite-tiles',
        minzoom: 0,
        maxzoom: 19
      }
    ]
  },
  'osm-dark': 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  'osm-light': 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
};

export function MapLibreViewer() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  const { layers, activeBasemap } = useLayers();
  const { selectFeature, mapViewState } = useSelection();
  const { selectedState, selectedDistrict, selectedSubdivision } = useRegion();
  const [mapLoaded, setMapLoaded] = useState(false);

  const selectFeatureRef = useRef(selectFeature);
  useEffect(() => {
    selectFeatureRef.current = selectFeature;
  }, [selectFeature]);

  const prevDistrictIdRef = useRef(selectedDistrict?.id);
  const prevSubdivisionIdRef = useRef(selectedSubdivision?.id);
  const prevStateIdRef = useRef(selectedState?.id);

  // Setup GeoJSON Sources and Layers
  const setupSourcesAndLayers = useCallback((map) => {
    if (!map) return;

    // 1. RISK ZONES POLYGON LAYER
    if (!map.getSource('source-risk-zones')) {
      map.addSource('source-risk-zones', {
        type: 'geojson',
        data: RISK_ZONES_GEOJSON
      });

      map.addLayer({
        id: 'layer-risk-zones-fill',
        type: 'fill',
        source: 'source-risk-zones',
        paint: {
          'fill-color': [
            'match',
            ['get', 'risk_level'],
            'CRITICAL', '#C62828',
            'HIGH', '#EF6C00',
            'MODERATE', '#F9A825',
            'LOW', '#2E7D32',
            '#64748B'
          ],
          'fill-opacity': 0.45
        }
      });

      map.addLayer({
        id: 'layer-risk-zones-line',
        type: 'line',
        source: 'source-risk-zones',
        paint: {
          'line-color': [
            'match',
            ['get', 'risk_level'],
            'CRITICAL', '#C62828',
            'HIGH', '#EF6C00',
            'MODERATE', '#F9A825',
            'LOW', '#2E7D32',
            '#64748B'
          ],
          'line-width': 2
        }
      });

      map.on('click', 'layer-risk-zones-fill', (e) => {
        if (e.features && e.features.length > 0) {
          const props = e.features[0].properties;
          selectFeatureRef.current({
            type: 'RISK_ZONE',
            id: props.zone_id || 'zone-1',
            title: `Landslide Risk Zone — ${props.name || 'Sector'}`,
            severity: props.risk_level || 'CRITICAL',
            priority: props.risk_level === 'CRITICAL' ? 'P1' : 'P2',
            coordinates: [e.lngLat.lng, e.lngLat.lat],
            location_name: props.sub_division || 'Papum Pare',
            risk_score: props.risk_score || 0.88,
            confidence: props.confidence || 0.92,
            rainfall_24h: 142.0,
            soil_saturation: 84.0,
            affected_infrastructure: [props.primary_exposure || 'Trans-Arunachal Highway'],
            recommended_action: 'Deploy emergency monitoring team and inspect slopes.',
            status: 'ACTIVE'
          });
        }
      });

      map.on('mouseenter', 'layer-risk-zones-fill', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'layer-risk-zones-fill', () => { map.getCanvas().style.cursor = ''; });
    }

    // 2. ROAD NETWORK LINE LAYER
    if (!map.getSource('source-roads')) {
      map.addSource('source-roads', {
        type: 'geojson',
        data: ROAD_NETWORK_GEOJSON
      });

      map.addLayer({
        id: 'layer-roads-line',
        type: 'line',
        source: 'source-roads',
        paint: {
          'line-color': [
            'match',
            ['get', 'hazard_level'],
            'CRITICAL', '#C62828',
            'HIGH', '#EF6C00',
            'MODERATE', '#1F4E79',
            '#475569'
          ],
          'line-width': 4,
          'line-opacity': 0.85
        }
      });
    }

    // 3. VILLAGES LAYER
    if (!map.getSource('source-villages')) {
      map.addSource('source-villages', {
        type: 'geojson',
        data: VILLAGES_GEOJSON
      });

      map.addLayer({
        id: 'layer-villages-circle',
        type: 'circle',
        source: 'source-villages',
        paint: {
          'circle-radius': 5,
          'circle-color': '#475569',
          'circle-stroke-color': '#FFFFFF',
          'circle-stroke-width': 1.5
        }
      });
    }

    // 4. CRITICAL INFRASTRUCTURE LAYER
    if (!map.getSource('source-infra')) {
      map.addSource('source-infra', {
        type: 'geojson',
        data: CRITICAL_INFRASTRUCTURE_GEOJSON
      });

      map.addLayer({
        id: 'layer-infra-circle',
        type: 'circle',
        source: 'source-infra',
        paint: {
          'circle-radius': 8,
          'circle-color': '#7C3AED',
          'circle-stroke-color': '#FFFFFF',
          'circle-stroke-width': 2
        }
      });
    }

    // 5. ACTIVE WARNINGS MARKER LAYER
    if (!map.getSource('source-alerts')) {
      const alertsGeoJSON = {
        type: 'FeatureCollection',
        features: MOCK_ALERTS.map(alert => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: alert.coordinates },
          properties: alert
        }))
      };

      map.addSource('source-alerts', {
        type: 'geojson',
        data: alertsGeoJSON
      });

      map.addLayer({
        id: 'layer-active-alerts-circle',
        type: 'circle',
        source: 'source-alerts',
        paint: {
          'circle-radius': 11,
          'circle-color': [
            'match',
            ['get', 'severity'],
            'CRITICAL', '#C62828',
            'HIGH', '#EF6C00',
            'MODERATE', '#F9A825',
            '#2E7D32'
          ],
          'circle-stroke-color': '#FFFFFF',
          'circle-stroke-width': 3
        }
      });

      map.on('click', 'layer-active-alerts-circle', (e) => {
        if (e.features && e.features.length > 0) {
          selectFeatureRef.current(e.features[0].properties);
        }
      });

      map.on('mouseenter', 'layer-active-alerts-circle', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'layer-active-alerts-circle', () => { map.getCanvas().style.cursor = ''; });
    }

    // 6. CITIZEN REPORTS LAYER (unverified)
    if (!map.getSource('source-citizen-reports')) {
      map.addSource('source-citizen-reports', {
        type: 'geojson',
        data: CITIZEN_REPORTS_GEOJSON
      });

      map.addLayer({
        id: 'layer-citizen-reports-circle',
        type: 'circle',
        source: 'source-citizen-reports',
        paint: {
          'circle-radius': 7,
          'circle-color': '#EF6C00',
          'circle-stroke-color': '#FFFFFF',
          'circle-stroke-width': 2
        }
      });

      map.on('click', 'layer-citizen-reports-circle', (e) => {
        if (e.features && e.features.length > 0) {
          const props = e.features[0].properties;
          selectFeatureRef.current({
            type: 'CITIZEN_REPORT',
            id: props.id,
            title: `Citizen Report — ${props.location_name || 'Unknown'}`,
            severity: props.severity || 'MODERATE',
            priority: props.severity === 'CRITICAL' ? 'P1' : 'P3',
            coordinates: [e.lngLat.lng, e.lngLat.lat],
            location_name: props.location_name || 'Papum Pare',
            risk_score: 0.65,
            confidence: 0.72,
            rainfall_24h: 95.0,
            soil_saturation: 68.0,
            affected_infrastructure: [props.description || 'Reported via mobile app'],
            recommended_action: 'Dispatch field officer for ground verification.',
            status: props.verification_status || 'UNVERIFIED'
          });
        }
      });
      map.on('mouseenter', 'layer-citizen-reports-circle', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'layer-citizen-reports-circle', () => { map.getCanvas().style.cursor = ''; });
    }

    // 7. VERIFIED REPORTS LAYER
    if (!map.getSource('source-verified-reports')) {
      map.addSource('source-verified-reports', {
        type: 'geojson',
        data: VERIFIED_REPORTS_GEOJSON
      });

      map.addLayer({
        id: 'layer-verified-reports-circle',
        type: 'circle',
        source: 'source-verified-reports',
        paint: {
          'circle-radius': 7,
          'circle-color': '#2E7D32',
          'circle-stroke-color': '#FFFFFF',
          'circle-stroke-width': 2
        }
      });

      map.on('click', 'layer-verified-reports-circle', (e) => {
        if (e.features && e.features.length > 0) {
          const props = e.features[0].properties;
          selectFeatureRef.current({
            type: 'VERIFIED_REPORT',
            id: props.id,
            title: `Verified Report — ${props.location_name || 'Unknown'}`,
            severity: props.severity || 'MODERATE',
            priority: props.severity === 'CRITICAL' ? 'P1' : 'P2',
            coordinates: [e.lngLat.lng, e.lngLat.lat],
            location_name: props.location_name || 'Papum Pare',
            risk_score: 0.80,
            confidence: 0.90,
            rainfall_24h: 120.0,
            soil_saturation: 78.0,
            affected_infrastructure: [props.description || 'Ground-verified by DDMO'],
            recommended_action: 'Continue monitoring. Report verified by field team.',
            status: 'VERIFIED'
          });
        }
      });
      map.on('mouseenter', 'layer-verified-reports-circle', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'layer-verified-reports-circle', () => { map.getCanvas().style.cursor = ''; });
    }

    // Dynamic Live Data Sync (Async)
    (async () => {
      try {
        const [liveRoads, liveInfra, liveVillages, liveAlerts, liveReports] = await Promise.allSettled([
          infrastructureService.getRoadNetwork(),
          infrastructureService.getFacilities(),
          infrastructureService.getVillages(),
          alertService.getActiveAlerts(),
          reportService.getReports(),
        ]);

        if (mapRef.current && map.isStyleLoaded()) {
          if (liveRoads.status === 'fulfilled' && liveRoads.value && map.getSource('source-roads')) {
            map.getSource('source-roads').setData(liveRoads.value);
          }
          if (liveInfra.status === 'fulfilled' && liveInfra.value && map.getSource('source-infra')) {
            map.getSource('source-infra').setData(liveInfra.value);
          }
          if (liveVillages.status === 'fulfilled' && liveVillages.value && map.getSource('source-villages')) {
            map.getSource('source-villages').setData(liveVillages.value);
          }
          if (liveAlerts.status === 'fulfilled' && Array.isArray(liveAlerts.value) && map.getSource('source-alerts')) {
            map.getSource('source-alerts').setData({
              type: 'FeatureCollection',
              features: liveAlerts.value.map(alert => ({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: alert.coordinates },
                properties: alert
              }))
            });
          }
          if (liveReports.status === 'fulfilled' && Array.isArray(liveReports.value)) {
            const citizenFeatures = liveReports.value
              .filter(r => r.verification_status !== 'VERIFIED')
              .map(r => ({
                type: 'Feature',
                id: r.id,
                geometry: { type: 'Point', coordinates: r.coordinates },
                properties: r
              }));
            const verifiedFeatures = liveReports.value
              .filter(r => r.verification_status === 'VERIFIED')
              .map(r => ({
                type: 'Feature',
                id: r.id,
                geometry: { type: 'Point', coordinates: r.coordinates },
                properties: r
              }));

            if (map.getSource('source-citizen-reports')) {
              map.getSource('source-citizen-reports').setData({
                type: 'FeatureCollection',
                features: citizenFeatures
              });
            }
            if (map.getSource('source-verified-reports')) {
              map.getSource('source-verified-reports').setData({
                type: 'FeatureCollection',
                features: verifiedFeatures
              });
            }
          }
        }
      } catch (err) {
        console.warn('[MapLibreViewer] Live layer sync fallback:', err);
      }
    })();
  }, []);

  // Initialize MapLibre GL instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initialCenter = mapViewState?.center || selectedDistrict?.center || selectedState?.center || [93.6166, 27.1000];
    const initialZoom = mapViewState?.zoom || selectedDistrict?.defaultZoom || selectedState?.defaultZoom || 8.2;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: BASEMAP_STYLES[activeBasemap] || BASEMAP_STYLES['osm-standard'],
      center: initialCenter,
      zoom: initialZoom,
      pitch: 10,
      attributionControl: true
    });

    mapRef.current = map;

    map.on('load', () => {
      setMapLoaded(true);
      setupSourcesAndLayers(map);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [setupSourcesAndLayers]); // eslint-disable-line react-hooks/exhaustive-deps

  // Respond to SelectionContext mapViewState flyTo requests (e.g., clicking View on Map from Alerts / Reports)
  useEffect(() => {
    if (mapRef.current && mapLoaded && mapViewState?.center) {
      mapRef.current.flyTo({
        center: mapViewState.center,
        zoom: mapViewState.zoom || 13,
        essential: true,
        duration: 1000
      });
    }
  }, [mapViewState, mapLoaded]);

  // Respond ONLY when District / Subdivision / State dropdown selection actually changes in Header
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    const districtChanged = prevDistrictIdRef.current !== selectedDistrict?.id;
    const subdivisionChanged = prevSubdivisionIdRef.current !== selectedSubdivision?.id;
    const stateChanged = prevStateIdRef.current !== selectedState?.id;

    prevDistrictIdRef.current = selectedDistrict?.id;
    prevSubdivisionIdRef.current = selectedSubdivision?.id;
    prevStateIdRef.current = selectedState?.id;

    if (subdivisionChanged && selectedSubdivision?.center) {
      mapRef.current.flyTo({
        center: selectedSubdivision.center,
        zoom: 12.5,
        essential: true,
        duration: 1200
      });
    } else if (districtChanged && selectedDistrict?.center) {
      mapRef.current.flyTo({
        center: selectedDistrict.center,
        zoom: selectedDistrict.defaultZoom || 10.5,
        essential: true,
        duration: 1200
      });
    } else if (stateChanged && selectedState?.center) {
      mapRef.current.flyTo({
        center: selectedState.center,
        zoom: selectedState.defaultZoom || 8.2,
        essential: true,
        duration: 1200
      });
    }
  }, [selectedDistrict, selectedSubdivision, selectedState, mapLoaded]);

  // Update basemap style if switched by user
  useEffect(() => {
    if (mapRef.current && mapLoaded) {
      const style = BASEMAP_STYLES[activeBasemap] || BASEMAP_STYLES['osm-standard'];
      mapRef.current.setStyle(style);
      mapRef.current.once('style.load', () => {
        setupSourcesAndLayers(mapRef.current);
      });
    }
  }, [activeBasemap, mapLoaded, setupSourcesAndLayers]);

  // Handle layer toggling from LayerContext
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;

    const layerMap = {
      riskZones: ['layer-risk-zones-fill', 'layer-risk-zones-line'],
      roadNetwork: ['layer-roads-line'],
      infrastructure: ['layer-infra-circle'],
      villages: ['layer-villages-circle'],
      activeWarnings: ['layer-active-alerts-circle'],
      fieldReports: ['layer-citizen-reports-circle', 'layer-verified-reports-circle']
    };

    Object.entries(layerMap).forEach(([key, ids]) => {
      const isVisible = layers[key] !== false;
      ids.forEach(id => {
        if (map.getLayer(id)) {
          map.setLayoutProperty(id, 'visibility', isVisible ? 'visible' : 'none');
        }
      });
    });
  }, [layers, mapLoaded]);

  const zoomIn = () => mapRef.current?.zoomIn();
  const zoomOut = () => mapRef.current?.zoomOut();
  const resetView = () => {
    if (selectedDistrict?.center) {
      mapRef.current?.flyTo({ center: selectedDistrict.center, zoom: selectedDistrict.defaultZoom || 10.5, duration: 1000 });
    } else {
      mapRef.current?.flyTo({ center: [93.6166, 27.1000], zoom: 8.2, duration: 1000 });
    }
  };

  return (
    <div id="gis-map-viewport" className="relative w-full h-full bg-slate-100 overflow-hidden">
      {/* MapLibre DOM Target */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Active Basemap Badge */}
      <div className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur-md border border-slate-200/90 text-slate-700 text-[11px] font-medium px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1.5 pointer-events-none select-none">
        <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
        <span>
          {activeBasemap === 'osm-standard' ? 'OSM Standard' :
            activeBasemap === 'osm-topo' ? 'OpenTopoMap Terrain' :
              activeBasemap === 'osm-satellite' ? 'Esri Satellite' :
                activeBasemap === 'osm-dark' ? 'Carto Dark' : 'Carto Light'}
        </span>
      </div>

      {/* Floating Controls (Top Right) */}
      <div className="absolute top-11 right-3 z-20">
        <MapControls onZoomIn={zoomIn} onZoomOut={zoomOut} onResetView={resetView} />
      </div>

      {/* Floating Legend (Bottom Left) */}
      <div className="absolute bottom-3 left-3 z-20">
        <MapLegend />
      </div>

      {/* Location Detail Panel Overlay (Top Right / Sliding) */}
      <div className="absolute top-3 right-16 z-30">
        <LocationDetailsPanel />
      </div>
    </div>
  );
}
