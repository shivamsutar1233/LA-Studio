import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.leananglestudio.shop',
});

export default api;
