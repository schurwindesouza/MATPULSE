import api from './api';

export const analyticsService = {
  // Fetch full consolidated analytics overview with optional filtering
  async getOverview(params = {}) {
    const response = await api.get('/api/v1/analytics/overview', { params });
    return response.data;
  },

  // Fetch summary KPIs
  async getSummary(params = {}) {
    const response = await api.get('/api/v1/analytics/summary', { params });
    return response.data;
  },

  // Fetch CPSE volume distribution
  async getCpseDistribution(params = {}) {
    const response = await api.get('/api/v1/analytics/cpse-distribution', { params });
    return response.data;
  },

  // Fetch harmonization status breakdown
  async getHarmonizationStatus(params = {}) {
    const response = await api.get('/api/v1/analytics/harmonization-status', { params });
    return response.data;
  },

  // Fetch category-wise distribution
  async getCategoryDistribution(params = {}) {
    const response = await api.get('/api/v1/analytics/category-distribution', { params });
    return response.data;
  },

  // Fetch match confidence metrics
  async getConfidence(params = {}) {
    const response = await api.get('/api/v1/analytics/confidence', { params });
    return response.data;
  },

  // Fetch review & decision stats
  async getReview(params = {}) {
    const response = await api.get('/api/v1/analytics/review', { params });
    return response.data;
  },

  // Fetch cross-CPSE common materials analytics
  async getCommonMaterials(params = {}) {
    const response = await api.get('/api/v1/analytics/common-materials', { params });
    return response.data;
  },

  // Fetch migration readiness breakdown
  async getReadiness(params = {}) {
    const response = await api.get('/api/v1/analytics/readiness', { params });
    return response.data;
  },

  // Fetch catalog data quality metrics
  async getDataQuality(params = {}) {
    const response = await api.get('/api/v1/analytics/data-quality', { params });
    return response.data;
  },
};

export default analyticsService;
