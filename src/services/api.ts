import axios from 'axios';
import { auth } from '../config/firebase';

// TODO : Update the API base URL 
const API_BASE_URL = __DEV__ ? 'http://localhost:3000' : 'https://api.example.com';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
});

api.interceptors.request.use(async (config) => {
    const user = auth.currentUser;
    if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;

