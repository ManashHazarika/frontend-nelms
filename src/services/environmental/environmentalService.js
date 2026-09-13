import { INSAR_DISPLACEMENT_GEOJSON, RAINFALL_GRID_GEOJSON } from '../../data/geojson/environmentalGrid.js';
import { apiFetch } from '../apiClient.js';

export const environmentalService = {
  /**
   * Fetch rainfall telemetry grid (M5 IMERG GPM integration)
   * Note: Backend route pending in satellite ingestion module; falls back to GeoJSON grid.
   */
  async getRainfallGrid() {
    try {
      return await apiFetch('/environmental/rainfall');
    } catch {
      return RAINFALL_GRID_GEOJSON;
    }
  },

  /**
   * Fetch Sentinel-1 InSAR millimeter slope displacement vector grid
   * Note: Backend route pending in satellite ingestion module; falls back to GeoJSON grid.
   */
  async getInSARDisplacement() {
    try {
      return await apiFetch('/environmental/insar');
    } catch {
      return INSAR_DISPLACEMENT_GEOJSON;
    }
  },

  /**
   * Fetch 24-hour rainfall cumulative progression timeline
   * Note: Backend route pending; falls back to operational baseline timeline series.
   */
  async getRainfallTimeline() {
    try {
      return await apiFetch('/environmental/rainfall-timeline');
    } catch {
      return [
        { time: '00:00', rainfall: 12.4, riskScore: 0.35, threshold: 80 },
        { time: '04:00', rainfall: 28.0, riskScore: 0.42, threshold: 80 },
        { time: '08:00', rainfall: 54.2, riskScore: 0.58, threshold: 80 },
        { time: '12:00', rainfall: 92.5, riskScore: 0.74, threshold: 80 },
        { time: '16:00', rainfall: 148.5, riskScore: 0.92, threshold: 80 },
        { time: '20:00', rainfall: 162.0, riskScore: 0.91, threshold: 80 }
      ];
    }
  }
};
