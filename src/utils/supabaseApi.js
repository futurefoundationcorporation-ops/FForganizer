const SUPABASE_URL = 'https://iqjdefgifijkhgfxwcir.supabase.co/functions/v1';

const getAuthHeaders = () => {
  const token = localStorage.getItem('session_token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const api = {
  async login(key) {
    const response = await fetch(`${SUPABASE_URL}/login`, {
      method: 'POST',
      headers: getAuthHeaders(), // CORREÇÃO AQUI
      body: JSON.stringify({ key }),
    });
    const data = await response.json();
    if (data && data.success && data.token) {
      localStorage.setItem('session_token', data.token);
    }
    return data;
  },

  async checkSession() {
    const response = await fetch(`${SUPABASE_URL}/session`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  async logout() {
    const headers = getAuthHeaders();
    localStorage.removeItem('session_token');
    const response = await fetch(`${SUPABASE_URL}/logout`, {
      method: 'POST',
      headers,
    });
    return response.json();
  },

  async generateAccessKey(label, isAdmin) {
    const response = await fetch(`${SUPABASE_URL}/generate-access-key`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ label, isAdmin }),
    });
    return response.json();
  },

  async listAccessKeys() {
    const response = await fetch(`${SUPABASE_URL}/list-access-keys`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  async deleteAccessKey(keyId) {
    const response = await fetch(`${SUPABASE_URL}/delete-access-key`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ keyId }),
    });
    return response.json();
  },
};

export default api;
