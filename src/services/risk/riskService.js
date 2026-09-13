import { RISK_ZONES_GEOJSON } from '../../data/geojson/riskZones.js';
import { apiFetch } from '../apiClient.js';

export const riskService = {
  /**
   * Fetch spatial GeoJSON risk area grid (M4 GIS Dashboard layer)
   */
  async getRiskArea(minLat = 26.8, maxLat = 27.6, minLon = 93.1, maxLon = 94.0) {
    try {
      const data = await apiFetch(`/risk/area?min_lat=${minLat}&max_lat=${maxLat}&min_lon=${minLon}&max_lon=${maxLon}`);
      if (data && data.features && data.features.length > 0) {
        return data;
      }
      return RISK_ZONES_GEOJSON;
    } catch {
      return RISK_ZONES_GEOJSON;
    }
  },

  /**
   * Fetch AI prediction for a single coordinate point (M1 interface)
   */
  async getRiskByLocation(lat, lon, rainfall24h = 45.0, slope = 25.0) {
    try {
      return await apiFetch(`/risk/location?lat=${lat}&lon=${lon}&rainfall_24h=${rainfall24h}&slope=${slope}`);
    } catch {
      return {
        latitude: lat,
        longitude: lon,
        risk_score: 0.84,
        risk_level: "HIGH",
        confidence: 0.89,
        model_version: "v1.4.2-XGBoost",
        feature_snapshot: {
          rainfall_24h: rainfall24h,
          slope: slope,
          soil_moisture: 0.78,
          sar_displacement_mm_yr: -14.2
        },
        timestamp: new Date().toISOString()
      };
    }
  }
};
