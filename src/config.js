import axios from 'axios';

export const API_URL = 'https://kashny-backend.onrender.com';

const api = axios.create({
  baseURL: API_URL
});

export default api;
