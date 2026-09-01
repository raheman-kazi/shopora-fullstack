// =====================================================
// API BASE URL
//
// Local development me .env nahi hoga to
// localhost:5000 use hoga.
//
// Production build ke waqt Vercel/Netlify me
// VITE_API_URL set karna hai, jaise:
//   VITE_API_URL=https://shopora-backend.onrender.com
//
// NOTE: Vite me env variable ka naam VITE_ se
// shuru hona zaroori hai, warna build me nahi aayega.
// =====================================================

export const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export default API_BASE;
