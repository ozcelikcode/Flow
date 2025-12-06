export interface Transaction {
    id: string;
    name: string;
    category: string;
    date: string;
    amount: number;
    type: 'income' | 'expense';
}
