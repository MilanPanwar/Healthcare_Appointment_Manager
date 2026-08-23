import api from './api';

export const aiService = {
  analyzeSymptoms: async (symptoms: string): Promise<{ success: boolean; data: any }> => {
    return api.post('/ai/pre-visit-summary', { symptoms });
  },

  summarizeClinicalNotes: async (clinicalNotes: string): Promise<{ success: boolean; data: any }> => {
    return api.post('/ai/post-visit-summary', { clinicalNotes });
  },

  retryPreVisitSummary: async (appointmentId: string): Promise<{ success: boolean; data: any }> => {
    return api.post(`/ai/retry-pre-visit/${appointmentId}`);
  },

  retryPostVisitSummary: async (prescriptionId: string): Promise<{ success: boolean; data: any }> => {
    return api.post(`/ai/retry-post-visit/${prescriptionId}`);
  },
};
