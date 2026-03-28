/**
 * Database API — MongoDB via Backend
 * Replaces the former Supabase client. All data operations go through the FastAPI backend.
 */

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

async function apiPost<T>(path: string, body: object): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

// ── Expenses ──────────────────────────────────────────────────────────────

export async function getExpenses() {
  return apiGet<any[]>('/api/expenses');
}

export async function createExpense(expense: {
  amount: number;
  category: string;
  date: string;
  description: string;
}) {
  return apiPost<any>('/api/expenses', expense);
}

// ── Income ────────────────────────────────────────────────────────────────

export async function getIncome(month: number, year: number) {
  return apiGet<any | null>(`/api/income?month=${month}&year=${year}`);
}

export async function upsertIncome(data: {
  monthly_income: number;
  month: number;
  year: number;
}) {
  return apiPost<any>('/api/income', data);
}

// ── DB Status ─────────────────────────────────────────────────────────────

export async function checkDbStatus(): Promise<boolean> {
  try {
    const res = await apiGet<{ connected: boolean }>('/api/db-status');
    return res.connected;
  } catch {
    return false;
  }
}
