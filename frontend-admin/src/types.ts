export interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    created_at: string;
    balance: number;
    is_active: boolean; // Added
}

export interface Transaction {
    id: string;
    sender_id?: string;
    receiver_id: string;
    amount: number;
    type: 'issue' | 'transfer';
    created_at: string;
}
