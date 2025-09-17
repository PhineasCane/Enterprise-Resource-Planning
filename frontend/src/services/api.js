import axios from "axios";

// In Electron, the backend runs on localhost:5000
// In browser dev mode, it also runs on localhost:5000
const baseURL = "http://localhost:5000/api";

const api = axios.create({ baseURL, timeout: 10000 });

// Create a function to set the auth token
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export default api;
