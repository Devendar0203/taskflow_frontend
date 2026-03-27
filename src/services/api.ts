import axios from "axios";

const api = axios.create({
  baseURL: "/api", // changed to use Vite proxy to prevent CORS errors
});

// ✅ Attach token to every request (except login/register)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    const isPublicEndpoint = config.url === '/users/login' || (config.url === '/users' && config.method === 'post');
    if (token && !isPublicEndpoint) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Handle expired/invalid token
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthEndpoint = error.config?.url?.includes('/login');
    if (error.response && error.response.status === 401 && !isAuthEndpoint) {
      console.log("🔒 Session expired. Redirecting to login...");

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;