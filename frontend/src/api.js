// In local development, connects to localhost:5000.
// In production deployment (single link), uses relative path "" to hit the same origin.
const API = import.meta.env.VITE_API_URL !== undefined
  ? import.meta.env.VITE_API_URL
  : (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
    ? 'http://localhost:5000'
    : '';

export default API;
