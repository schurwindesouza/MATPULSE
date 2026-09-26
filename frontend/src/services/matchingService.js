import api from './api';

export const matchingService = {
  // Fetch human review queue items
  async getReviewQueue(params = {}) {
    const response = await api.get('/api/v1/matching/review-queue', { params });
    return response.data;
  },

  // Fetch matching pipeline statistics
  async getMatchingStats() {
    const response = await api.get('/api/v1/matching/stats');
    return response.data;
  },

  // Fetch full match details by ID
  async getMatchDetails(matchId) {
    const response = await api.get(`/api/v1/matching/${matchId}`);
    return response.data;
  },

  // Trigger batch recommendation generation with extended 180s timeout
  async generateMatches(params = { top_k: 5, min_confidence: 70.0 }) {
    const response = await api.post('/api/v1/matching/generate', params, {
      timeout: 180000,
    });
    return response.data;
  },

  // Approve a recommendation and assign common material code
  async approveMatch(matchId, commonMaterialCode) {
    const response = await api.post(`/api/v1/matching/${matchId}/approve`, {
      common_material_code: commonMaterialCode,
    });
    return response.data;
  },

  // Reject a recommendation
  async rejectMatch(matchId, reason = null) {
    const response = await api.post(`/api/v1/matching/${matchId}/reject`, { reason });
    return response.data;
  },
};

export default matchingService;
