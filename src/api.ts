const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API ${res.status}`);
  return (await res.json()) as T;
}

async function postJSON<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return (await res.json()) as T;
}

async function putJSON<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return (await res.json()) as T;
}

async function delJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return (await res.json()) as T;
}

export interface ApiCategory {
  id: string;
  name: string;
  color: string;
}

export interface ApiTransaction {
  id: string;
  amount: string; // Prisma Decimal -> JSON string
  date: string; // ISO
  description: string | null;
  source: string;
  categoryId: string | null;
  category: ApiCategory | null;
}

export interface SummaryResponse {
  total: number;
  categories: Array<{ category: string; color: string; amount: number }>;
}

export interface TrendResponse {
  label: string;
  points: Array<{ day: number; amount: number }>;
}

export interface CreateTransactionInput {
  amount: number;
  date: string;
  description?: string;
  categoryId?: string;
}

export interface ReceiptItem {
  name: string;
  amount: number;
}

export interface ReceiptExtraction {
  merchant: string;
  total: number;
  date: string; // ISO
  items: ReceiptItem[];
}

// POST /receipts yaniti — AI'nin okudugu alanlar + kategori onerisi.
export interface ReceiptReview {
  id: string;
  status: string;
  extracted: ReceiptExtraction;
  suggestedCategory: ApiCategory | null;
}

export interface ConfirmReceiptInput {
  amount: number;
  date: string;
  description?: string;
  categoryId?: string;
}

export interface ImportCsvRow {
  amount: number;
  date: string;
  description?: string;
  categoryId?: string;
}

export interface BudgetItem {
  categoryId: string;
  category: string;
  color: string;
  budgetId: string | null;
  limit: number | null;
  spent: number;
}

export interface BudgetsResponse {
  period: string;
  label: string;
  totalLimit: number;
  totalSpent: number;
  items: BudgetItem[];
}

export interface MeResponse {
  id: string;
  email: string;
  createdAt: string;
}

export interface CreateCategoryInput {
  name: string;
  color?: string;
}

export const api = {
  getSummary: () => getJSON<SummaryResponse>("/dashboard/summary"),
  getInsights: () => getJSON<{ text: string }>("/dashboard/insights"),
  getTrend: () => getJSON<TrendResponse>("/dashboard/trend"),
  getTransactions: () => getJSON<ApiTransaction[]>("/transactions"),
  getCategories: () => getJSON<ApiCategory[]>("/categories"),
  createTransaction: (input: CreateTransactionInput) =>
    postJSON<ApiTransaction>("/transactions", input),
  // Fis fotografini data URL (base64) olarak yolla; AI alanlari okur.
  uploadReceipt: (image: string, filename?: string) =>
    postJSON<ReceiptReview>("/receipts", { image, filename }),
  confirmReceipt: (id: string, input: ConfirmReceiptInput) =>
    postJSON<ApiTransaction>(`/receipts/${id}/confirm`, input),
  importCsv: (rows: ImportCsvRow[]) =>
    postJSON<{ created: number }>("/import/csv", { rows }),
  getBudgets: () => getJSON<BudgetsResponse>("/budgets"),
  setBudget: (categoryId: string, limit: number) =>
    putJSON<{ ok: boolean }>("/budgets", { categoryId, limit }),
  getMe: () => getJSON<MeResponse>("/users/me"),
  createCategory: (input: CreateCategoryInput) =>
    postJSON<ApiCategory>("/categories", input),
  deleteCategory: (id: string) => delJSON<{ ok: boolean }>(`/categories/${id}`),
};
