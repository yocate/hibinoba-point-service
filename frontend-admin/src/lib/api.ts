// import axios from 'axios'; // Removing axios
import type { User } from '../types';

console.log("Initializing API module (Fetch)");

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const customFetch = async <T>(endpoint: string, options: RequestInit = {}): Promise<{ data: T }> => {
    const url = `${BASE_URL}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    const response = await fetch(url, {
        ...options,
        headers,
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        const data = await response.json();
        return { data };
    }

    // Return empty object for non-JSON responses (like 200 OK with no body)
    return { data: {} as T };
};

export const api = {
    get: <T>(url: string) => customFetch<T>(url, { method: 'GET' }),
    post: <T>(url: string, body: any) => customFetch<T>(url, { method: 'POST', body: JSON.stringify(body) }),
    put: <T>(url: string, body: any) => customFetch<T>(url, { method: 'PUT', body: JSON.stringify(body) }),
    delete: <T>(url: string) => customFetch<T>(url, { method: 'DELETE' }),
};

export const UserApi = {
    getAll: async () => {
        const res = await api.get<User[]>('/users');
        return res.data;
    },
    create: async (data: Partial<User> & { password?: string }) => {
        const res = await api.post<User>('/users', data);
        return res.data;
    },
    update: async (id: string, data: Partial<User> & { password?: string }) => {
        const res = await api.put<User>(`/users/${id}`, data);
        return res.data;
    },
    delete: async (id: string) => {
        await api.delete(`/users/${id}`);
    },
};

export const TransactionApi = {
    issue: async (receiverId: string, amount: number, senderId?: string) => {
        const res = await api.post('/transactions/issue', { receiver_id: receiverId, amount, sender_id: senderId });
        return res.data;
    }
};
