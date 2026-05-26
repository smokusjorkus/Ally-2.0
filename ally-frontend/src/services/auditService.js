import { getAuthData } from '../utils/auth.jsx';

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/audit-logs`;

export const auditService = {
  getAuditLogs: async ({ moduleName = '', action = '', actorId = '', limit = 200 } = {}) => {
    const authData = getAuthData();
    if (!authData) {
      throw new Error('Not authenticated');
    }

    const params = new URLSearchParams();
    if (moduleName) params.set('moduleName', moduleName);
    if (action) params.set('action', action);
    if (actorId) params.set('actorId', actorId);
    params.set('limit', String(limit));

    const response = await fetch(`${API_BASE_URL}?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${authData.token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to load audit logs');
    }

    return response.json();
  },
};
