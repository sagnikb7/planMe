import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  timeout: 8000,
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (!err.response || err.code === 'ECONNABORTED' || err.message === 'Network Error') {
      const offline = new Error('offline');
      offline.isOffline = true;
      offline.originalError = err;
      return Promise.reject(offline);
    }
    return Promise.reject(err);
  },
);

export default api;
