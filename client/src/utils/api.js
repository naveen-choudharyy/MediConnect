const API_BASE = import.meta.env.VITE_API_URL || '/api';


export const getAuthToken = () => localStorage.getItem('telemedicine_token');
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('telemedicine_token', token);
  } else {
    localStorage.removeItem('telemedicine_token');
  }
};

export const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  // If request contains body and isn't a string, stringify it
  if (config.body && typeof config.body !== 'string' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }
    
    return data;
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error.message);
    throw error;
  }
};
