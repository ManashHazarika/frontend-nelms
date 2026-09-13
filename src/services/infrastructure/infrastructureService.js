import { INFRASTRUCTURE_GEOJSON, VILLAGES_GEOJSON } from '../../data/geojson/infrastructure.js';
import { ROAD_NETWORK_GEOJSON } from '../../data/geojson/roadNetwork.js';
import { apiFetch } from '../apiClient.js';

export const infrastructureService = {
  /**
   * Fetch critical facilities list or GeoJSON
   */
  async getFacilities() {
    try {
      const data = await apiFetch('/infrastructure');
      if (Array.isArray(data) && data.length > 0) {
        // Convert list of backend Infrastructure objects into GeoJSON if needed
        return {
          type: 'FeatureCollection',
          features: data.map(item => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [item.longitude, item.latitude]
            },
            properties: item
          }))
        };
      }
      return INFRASTRUCTURE_GEOJSON;
    } catch {
      return INFRASTRUCTURE_GEOJSON;
    }
  },

  /**
   * Fetch road network LineString GeoJSON
   */
  async getRoadNetwork() {
    try {
      const data = await apiFetch('/roads/geojson');
      if (data && data.features && data.features.length > 0) {
        return data;
      }
      return ROAD_NETWORK_GEOJSON;
    } catch {
      return ROAD_NETWORK_GEOJSON;
    }
  },

  /**
   * Fetch villages data
   */
  async getVillages() {
    try {
      const data = await apiFetch('/villages');
      if (Array.isArray(data) && data.length > 0) {
        return {
          type: 'FeatureCollection',
          features: data.map(item => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [item.longitude, item.latitude]
            },
            properties: item
          }))
        };
      }
      return VILLAGES_GEOJSON;
    } catch {
      return VILLAGES_GEOJSON;
    }
  }
};

