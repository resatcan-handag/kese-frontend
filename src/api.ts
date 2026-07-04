const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";
const TOKEN_KEY = "kese_token";

// --- Oturum token'i (localStorage) ---
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

function authHeaders(json: boolean): Record<string, string> {
  const h: Record<string, string> = {};
  if (json) h["Content-Type"] = "application/json";
  const t = getToken();
  if (t) h["Authorization"] = `Bearer ${t}`;
  return h;
}

// 401'de token'i temizle ve uygulamayi giris ekranina dusur.
async function handle<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    clearToken();
    window.dispatchEvent(new Event("kese-unauth"));
    throw new Error("API 401");
  }
  if (!res.ok) throw new Error(`API ${res.status}`);
  return (await res.json()) as T;
}

async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: authHeaders(false) });
  return handle<T>(res);
}

async function postJSON<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify(body),
  });
  return handle<T>(res);
}

async function putJSON<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "PUT",
    headers: authHeaders(true),
    body: JSON.stringify(body),
  });
  return handle<T>(res);
}

async function patchJSON<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "PATCH",
    headers: authHeaders(true),
    body: JSON.stringify(body),
  });
  return handle<T>(res);
}

async function delJSON<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "DELETE",
    headers: authHeaders(body !== undefined),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return handle<T>(res);
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
  label: string; // secili ayin etiketi (ör. "Haziran 2026")
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

export interface AuthResponse {
  token: string;
  user: MeResponse;
}

export interface CreateCategoryInput {
  name: string;
  color?: string;
}

export const api = {
  getSummary: (month?: string) =>
    getJSON<SummaryResponse>(`/dashboard/summary${month ? `?month=${month}` : ""}`),
  getInsights: (month?: string) =>
    getJSON<{ text: string }>(`/dashboard/insights${month ? `?month=${month}` : ""}`),
  getTrend: (month?: string) =>
    getJSON<TrendResponse>(`/dashboard/trend${month ? `?month=${month}` : ""}`),
  getMonths: () => getJSON<string[]>("/dashboard/months"),
  getTransactions: () => getJSON<ApiTransaction[]>("/transactions"),
  getCategories: () => getJSON<ApiCategory[]>("/categories"),
  createTransaction: (input: CreateTransactionInput) =>
    postJSON<ApiTransaction>("/transactions", input),
  updateTransaction: (
    id: string,
    input: { amount?: number; date?: string; description?: string; categoryId?: string },
  ) => patchJSON<ApiTransaction>(`/transactions/${id}`, input),
  deleteTransaction: (id: string) => delJSON<{ ok: boolean }>(`/transactions/${id}`),
  // Fis fotografini data URL (base64) olarak yolla; AI alanlari okur.
  uploadReceipt: (image: string, filename?: string) =>
    postJSON<ReceiptReview>("/receipts", { image, filename }),
  confirmReceipt: (id: string, input: ConfirmReceiptInput) =>
    postJSON<ApiTransaction>(`/receipts/${id}/confirm`, input),
  importCsv: (rows: ImportCsvRow[]) =>
    postJSON<{ created: number }>("/import/csv", { rows }),
  getBudgets: (month?: string) =>
    getJSON<BudgetsResponse>(`/budgets${month ? `?month=${month}` : ""}`),
  setBudget: (categoryId: string, limit: number, month?: string) =>
    putJSON<{ ok: boolean }>("/budgets", { categoryId, limit, month }),
  getMe: () => getJSON<MeResponse>("/users/me"),
  // Oturumu yenile: taze token al ve sakla (kayan oturum).
  refreshToken: async () => {
    const res = await postJSON<{ token: string }>("/users/refresh-token", {});
    setToken(res.token);
    return res;
  },
  changePassword: (currentPassword: string, newPassword: string) =>
    postJSON<{ ok: boolean }>("/users/change-password", { currentPassword, newPassword }),
  deleteAccount: (password: string) =>
    delJSON<{ ok: boolean }>("/users/me", { password }),
  createCategory: (input: CreateCategoryInput) =>
    postJSON<ApiCategory>("/categories", input),
  updateCategory: (id: string, input: { name?: string; color?: string }) =>
    patchJSON<ApiCategory>(`/categories/${id}`, input),
  deleteCategory: (id: string) => delJSON<{ ok: boolean }>(`/categories/${id}`),
  register: async (email: string, password: string) => {
    const res = await postJSON<AuthResponse>("/auth/register", { email, password });
    setToken(res.token);
    return res;
  },
  login: async (email: string, password: string) => {
    const res = await postJSON<AuthResponse>("/auth/login", { email, password });
    setToken(res.token);
    return res;
  },
};
