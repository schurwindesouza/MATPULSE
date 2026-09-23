import api from './api';

export const importService = {
  // Step 1 -> 2: Upload file and auto-detect columns & sample rows
  async previewFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/api/v1/import/preview', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Step 2 -> 3: Validate mapped dataset
  async validateImport(file, mapping, defaultCpse = null) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mapping', JSON.stringify(mapping));
    if (defaultCpse) {
      formData.append('default_cpse', defaultCpse);
    }

    const response = await api.post('/api/v1/import/validate', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Step 3 -> 4: Execute database ingestion of valid records
  async executeImport(file, mapping, defaultCpse = null) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mapping', JSON.stringify(mapping));
    if (defaultCpse) {
      formData.append('default_cpse', defaultCpse);
    }

    const response = await api.post('/api/v1/import/execute', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default importService;
