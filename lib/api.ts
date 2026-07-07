import axios from 'axios';

// Car Price API. Trim + strip trailing slashes so a stray space/slash in
// NEXT_PUBLIC_API_URL (e.g. "= http://127.0.0.1:8000") can't break requests.
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').trim().replace(/\/+$/, '');

export const carApi = axios.create({
    baseURL: API_BASE,
    headers: { 'Content-Type': 'application/json' },
});