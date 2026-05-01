import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  timeout: 8000,
});

let serverKnownOnline = true;

api.interceptors.response.use(
  (res) => {
    if (!serverKnownOnline) {
      serverKnownOnline = true;
      window.dispatchEvent(new Event('planme:server-back-online'));
    }
    return res;
  },
  (err) => {
    if (!err.response || err.code === 'ECONNABORTED' || err.message === 'Network Error') {
      if (serverKnownOnline) {
        serverKnownOnline = false;
        window.dispatchEvent(new Event('planme:server-offline'));
      }
      const offline = new Error('offline');
      offline.isOffline = true;
      offline.originalError = err;
      return Promise.reject(offline);
    }
    return Promise.reject(err);
  },
);

export default api;
