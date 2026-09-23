import api from './api';

export const materialService = {
  // Fetch executive harmonization statistics
  async getStats() {
    const response = await api.get('/api/v1/materials/stats');
    return response.data;
  },

  // Fetch materials with optional filtering and pagination
  async getMaterials(params = {}) {
    const response = await api.get('/api/v1/materials/', { params });
    return response.data;
  },

  // Fetch single material by ID
  async getMaterial(id) {
    const response = await api.get(`/api/v1/materials/${id}`);
    return response.data;
  },

  // Fetch Common National Material Codes master catalog
  async getCommonCatalog(params = {}) {
    const response = await api.get('/api/v1/materials/common-catalog', { params });
    return response.data;
  },

  // Fetch materials mapped to a given Common National Material Code
  async getMaterialsByCommonCode(commonCode) {
    const response = await api.get(`/api/v1/materials/common/${commonCode}`);
    return response.data;
  },

  // Health check
  async checkHealth() {
    const response = await api.get('/health');
    return response.data;
  },
};

export default materialService;
