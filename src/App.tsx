import { useState, useEffect } from "react";
import { Routes, Route, Outlet, NavLink, useOutletContext } from "react-router-dom";
import { Icon } from "./icons";
import {
  api,
  getToken,
  clearToken,
  type SummaryResponse,
  type ApiTransaction,
  type ApiCategory,
  type TrendResponse,
  type ReceiptReview,
  type MeResponse,
} from "./api";
import { formatTL, formatDateShort, initial } from "./format";
import { AddTransactionModal, ReceiptModal, EditTransactionModal } from "./components/Modals";
import { TrendChart } from "./components/TrendChart";
import { BudgetPage } from "./components/BudgetPage";
import { SettingsPage } from "./components/SettingsPage";
import { AuthPage } from "./components/AuthPage";
import { AuthContext, useAuth } from "./authContext";

type Ctx = { openAdd: () => void; openEdit: (t: ApiTransaction) => void; refreshKey: number };

function Sidebar() {
  const { me, logout } = useAuth();
  const email = me?.email ?? "";
  const name = email ? email.split("@")[0] : "Kullanıcı";
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    "nav-item" + (isActive ? " active" : "");
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark">
          <Icon name="budget" size={20} />
        </span>
        <span className="brand-name">Kese</span>
      </div>
      <nav className="nav">
        <NavLink to="/" end className={linkClass}>
          <Icon name="home" />
          <span>Pano</span>
        </NavLink>
        <NavLink to="/islemler" className={linkClass}>
          <Icon name="list" />
          <span>İşlemler</span>
        </NavLink>
        <NavLink to="/butce" className={linkClass}>
          <Icon name="budget" />
          <span>Bütçe</span>
        </NavLink>
        <NavLink to="/ayarlar" className={linkClass}>
          <Icon name="settings" />
          <span>Ayarlar</span>
        </NavLink>
      </nav>
      <div className="side-foot">
        <span className="avatar">{(email[0] ?? "K").toUpperCase()}</span>
        <div className="side-user">
          <div className="nm">{name}</div>
          <div className="em">{email || "—"}</div>
        </div>
        <button className="logout-btn" onClick={logout} title="Çıkış" aria-label="Çıkış">
          <Icon name="logout" size={18} />
        </button>
      </div>
    </aside>
  );
}

const API_ERR = "API'ye ulaşılamadı. Backend çalışıyor mu? (http://localhost:3000/api)";

function monthLabel(m: string): string {
  const [y, mo] = m.split("-").map(Number);
  return new Date(y, mo - 1, 1).toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
}

// İşlemleri CSV olarak indir (kendi içe aktarıcımızla uyumlu: `;`, ISO tarih, TR tutar).
function exportTransactionsCsv(rows: ApiTransaction[]) {
  const esc = (s: string) => (/[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  const header = "Tarih;Tutar;Kategori;Açıklama";
  const lines = rows.map((t) => {
    const date = t.date.slice(0, 10);
    const amount = Number(t.amount).toFixed(2).replace(".", ",");
    return [date, amount, esc(t.category?.name ?? ""), esc(t.description ?? "")].join(";");
  });
  const csv = "﻿" + [header, ...lines].join("\n"); // BOM: Excel'de Türkçe düzgün
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "kese-islemler.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function Dashboard() {
  const { openAdd, openEdit, refreshKey } = useOutletContext<Ctx>();
  const { me } = useAuth();
  const namePart = me?.email ? me.email.split("@")[0] : "";
  const greetName = namePart ? namePart.charAt(0).toUpperCase() + namePart.slice(1) : "";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [insight, setInsight] = useState("");
  const [insightLoading, setInsightLoading] = useState(true);
  const [recent, setRecent] = useState<ApiTransaction[]>([]);
  const [trend, setTrend] = useState<TrendResponse | null>(null);
  const [months, setMonths] = useState<string[]>([]);
  const [month, setMonth] = useState(""); // "" = son ay (backend varsayılanı)

  // Ay listesi (seçici için); yoksa son aya (ilk seçenek) ayarla.
  useEffect(() => {
    let active = true;
    api
      .getMonths()
      .then((ms) => {
        if (!active) return;
        setMonths(ms);
        setMonth((cur) => (cur === "" && ms.length ? ms[0] : cur));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [refreshKey]);

  // Ana pano verisi (seçili ay) — sayfayı bunlar açar.
  useEffect(() => {
    let active = true;
    Promise.all([api.getSummary(month), api.getTransactions(), api.getTrend(month)])
      .then(([s, txns, tr]) => {
        if (!active) return;
        setSummary(s);
        setRecent(txns.slice(0, 5));
        setTrend(tr);
        setError(false);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setError(true);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refreshKey, month]);

  // AI içgörü ayrı yüklenir (Ollama yavaş olabilir; sayfayı bloklamasın).
  useEffect(() => {
    let active = true;
    setInsightLoading(true);
    api
      .getInsights(month)
      .then((ins) => {
        if (!active) return;
        setInsight(ins.text);
        setInsightLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setInsight("");
        setInsightLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refreshKey, month]);

  if (loading) return <div className="state">Yükleniyor…</div>;
  if (error || !summary) return <div className="state error">{API_ERR}</div>;

  const maxCat = Math.max(...summary.categories.map((c) => c.amount), 1);

  return (
    <>
      <div className="topbar">
        <div>
          <h1 className="hello">Merhaba{greetName ? `, ${greetName}` : ""}</h1>
          <div className="sub">İşte harcamalarının özeti.</div>
        </div>
        <div className="actions">
          <select
            className="pill-select"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          >
            {months.length === 0 ? (
              <option value="">Bu ay</option>
            ) : (
              months.map((m) => (
                <option key={m} value={m}>
                  {monthLabel(m)}
                </option>
              ))
            )}
          </select>
          <button className="btn" onClick={openAdd}>
            <Icon name="plus" size={16} />İşlem ekle
          </button>
        </div>
      </div>

      <section className="hero">
        <div className="card">
          <p className="eyebrow">Ay toplamı</p>
          <div className="total">
            <span className="cur">₺</span>
            {summary.total.toLocaleString("tr-TR")}
          </div>
          <div className="rule" />
          <div className="compare">
            <span>{trend?.label ?? ""}</span>
            <span>{summary.categories.length} kategori</span>
          </div>
        </div>
        <div className="card ai">
          <div className="ai-badge">
            <Icon name="spark" size={16} />AI İçgörü
          </div>
          {insightLoading ? (
            <p className="ai-text ai-thinking">AI düşünüyor…</p>
          ) : (
            <p className="ai-text">{insight || "İçgörü alınamadı."}</p>
          )}
        </div>
      </section>

      <section className="grid2">
        <div className="card">
          <div className="card-head">
            <h2 className="card-title">Kategoriler</h2>
            <NavLink className="more" to="/islemler">
              Tümü
            </NavLink>
          </div>
          {summary.categories.length === 0 ? (
            <div className="empty-line">Bu ay harcama yok.</div>
          ) : (
            summary.categories.map((c) => (
              <div className="cat-row" key={c.category}>
                <span
                  className="cat-fill"
                  style={{ background: c.color, width: `${(c.amount / maxCat) * 100}%` }}
                />
                <span className="cat-dot" style={{ background: c.color }} />
                <span className="cat-name">{c.category}</span>
                <span className="leader" />
                <span className="cat-amt">{formatTL(c.amount)}</span>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <h2 className="card-title">Günlük harcama</h2>
            <span className="more">{trend?.label ?? ""}</span>
          </div>
          {trend ? (
            <TrendChart points={trend.points} />
          ) : (
            <div className="state">Yükleniyor…</div>
          )}
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h2 className="card-title">Son işlemler</h2>
          <NavLink className="more" to="/islemler">
            Tümü
          </NavLink>
        </div>
        {recent.length === 0 ? (
          <div className="empty-line">Henüz işlem yok.</div>
        ) : (
          recent.map((t) => {
            const color = t.category?.color ?? "#888888";
            return (
              <div className="txn row-click" key={t.id} onClick={() => openEdit(t)}>
                <span className="txn-mono" style={{ background: color + "1f", color }}>
                  {initial(t.description)}
                </span>
                <div className="txn-main">
                  <div className="txn-name">{t.description ?? "—"}</div>
                  <div className="txn-sub">
                    {(t.category?.name ?? "Diğer") + " · " + formatDateShort(t.date)}
                  </div>
                </div>
                <span className="txn-amt">{formatTL(Number(t.amount))}</span>
              </div>
            );
          })
        )}
      </section>
    </>
  );
}

function Transactions() {
  const { openAdd, openEdit, refreshKey } = useOutletContext<Ctx>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [txns, setTxns] = useState<ApiTransaction[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [period, setPeriod] = useState<"all" | "30d" | "90d">("all");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  // Filtre/veri değişince ilk sayfaya dön.
  useEffect(() => {
    setPage(1);
  }, [search, catFilter, period, refreshKey]);

  useEffect(() => {
    let active = true;
    Promise.all([api.getTransactions(), api.getCategories()])
      .then(([t, cats]) => {
        if (!active) return;
        setTxns(t);
        setCategories(cats);
        setError(false);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setError(true);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refreshKey]);

  // İstemci tarafı filtreleme (arama + kategori + dönem).
  const q = search.trim().toLowerCase();
  const periodMs = period === "30d" ? 30 * 86400000 : period === "90d" ? 90 * 86400000 : 0;
  const now = Date.now();
  const filtered = txns.filter((t) => {
    if (q && !(t.description ?? "").toLowerCase().includes(q)) return false;
    if (catFilter && t.categoryId !== catFilter) return false;
    if (periodMs && now - new Date(t.date).getTime() > periodMs) return false;
    return true;
  });

  // Sayfalama (istemci taraflı; filtreli liste dilimlenir).
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const pageItems = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">İşlemler</h1>
          <div className="page-sub">{loading ? "Yükleniyor…" : `${filtered.length} işlem`}</div>
        </div>
        <div className="actions">
          <button
            className="btn-ghost"
            onClick={() => exportTransactionsCsv(filtered)}
            disabled={filtered.length === 0}
          >
            <Icon name="download" size={16} />Dışa aktar
          </button>
          <button className="btn" onClick={openAdd}>
            <Icon name="plus" size={16} />İşlem ekle
          </button>
        </div>
      </div>

      <div className="toolbar">
        <div className="search">
          <Icon name="search" size={17} />
          <input
            className="search-input"
            placeholder="İşlem ara"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="chip-select"
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
        >
          <option value="">Tüm kategoriler</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          className="chip-select"
          value={period}
          onChange={(e) => setPeriod(e.target.value as "all" | "30d" | "90d")}
        >
          <option value="all">Tüm zamanlar</option>
          <option value="30d">Son 30 gün</option>
          <option value="90d">Son 90 gün</option>
        </select>
      </div>

      {error ? (
        <div className="state error">{API_ERR}</div>
      ) : loading ? (
        <div className="state">Yükleniyor…</div>
      ) : txns.length === 0 ? (
        <div className="state">
          Henüz işlem yok.
          <div style={{ marginTop: 14 }}>
            <button className="btn" onClick={openAdd}>
              <Icon name="plus" size={16} />İlk işlemini ekle
            </button>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="state">Eşleşen işlem yok.</div>
      ) : (
        <>
          <div className="ledger-card">
            <table>
              <thead>
                <tr>
                  <th>Tarih</th>
                  <th>İşlem</th>
                  <th>Kategori</th>
                  <th>Tutar</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((t) => {
                  const color = t.category?.color ?? "#888888";
                  return (
                    <tr key={t.id} className="row-click" onClick={() => openEdit(t)}>
                      <td className="t-date">{formatDateShort(t.date)}</td>
                      <td>
                        <div className="t-item">
                          <span className="mono-sq" style={{ background: color + "1f", color }}>
                            {initial(t.description)}
                          </span>
                          <span className="t-name">{t.description ?? "—"}</span>
                        </div>
                      </td>
                      <td>
                        <span className="cat-chip" style={{ background: color + "1a", color }}>
                          <span className="d" style={{ background: color }} />
                          {t.category?.name ?? "Diğer"}
                        </span>
                      </td>
                      <td className="t-amt">{formatTL(Number(t.amount))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="table-foot">
            <span>{filtered.length} işlem</span>
            {totalPages > 1 && (
              <div className="pager">
                <button
                  disabled={current <= 1}
                  onClick={() => setPage(current - 1)}
                  aria-label="Önceki"
                >
                  <Icon name="left" size={16} />
                </button>
                <span className="page-ind">
                  {current} / {totalPages}
                </span>
                <button
                  disabled={current >= totalPages}
                  onClick={() => setPage(current + 1)}
                  aria-label="Sonraki"
                >
                  <Icon name="right" size={16} />
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

function Layout() {
  const [addOpen, setAddOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptReview | null>(null);
  const [editTxn, setEditTxn] = useState<ApiTransaction | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const openAdd = () => setAddOpen(true);
  const openEdit = (t: ApiTransaction) => {
    setEditTxn(t);
    setEditOpen(true);
  };
  const handleEdited = () => {
    setRefreshKey((k) => k + 1);
    setEditOpen(false);
  };
  // Fiş taranınca AddModal'ı kapat, okunan alanları onay modalına aktar.
  const handleScanned = (review: ReceiptReview) => {
    setReceiptData(review);
    setAddOpen(false);
    setReceiptOpen(true);
  };
  const handleCreated = () => {
    setRefreshKey((k) => k + 1);
    setAddOpen(false);
  };
  const handleConfirmed = () => {
    setRefreshKey((k) => k + 1);
    setReceiptOpen(false);
  };

  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <Outlet context={{ openAdd, openEdit, refreshKey } satisfies Ctx} />
      </main>
      <AddTransactionModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={handleCreated}
        onScanned={handleScanned}
      />
      <ReceiptModal
        open={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        data={receiptData}
        onConfirmed={handleConfirmed}
      />
      <EditTransactionModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        txn={editTxn}
        onSaved={handleEdited}
      />
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState<string | null>(() => getToken());
  const [me, setMe] = useState<MeResponse | null>(null);

  // Token varsa profili çek; geçersizse çıkış.
  useEffect(() => {
    if (!token) {
      setMe(null);
      return;
    }
    let active = true;
    api
      .getMe()
      .then((u) => {
        if (!active) return;
        setMe(u);
        // Oturumu tazele (best-effort; hata olursa mevcut token'la devam).
        void api.refreshToken().catch(() => {});
      })
      .catch(() => {
        if (active) {
          clearToken();
          setToken(null);
        }
      });
    return () => {
      active = false;
    };
  }, [token]);

  // API katmanı 401'de bu olayı yayar → oturumu kapat.
  useEffect(() => {
    const onUnauth = () => setToken(null);
    window.addEventListener("kese-unauth", onUnauth);
    return () => window.removeEventListener("kese-unauth", onUnauth);
  }, []);

  const logout = () => {
    clearToken();
    setToken(null);
  };

  if (!token) return <AuthPage onAuthed={() => setToken(getToken())} />;

  return (
    <AuthContext.Provider value={{ me, logout }}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/islemler" element={<Transactions />} />
          <Route path="/butce" element={<BudgetPage />} />
          <Route path="/ayarlar" element={<SettingsPage />} />
        </Route>
      </Routes>
    </AuthContext.Provider>
  );
}
