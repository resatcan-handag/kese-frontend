import { useState, useEffect } from "react";
import { Routes, Route, Outlet, NavLink, useOutletContext } from "react-router-dom";
import { Icon } from "./icons";
import { api, type SummaryResponse, type ApiTransaction } from "./api";
import { formatTL, formatDateShort, initial } from "./format";
import { AddTransactionModal, ReceiptModal } from "./components/Modals";

type Ctx = { openAdd: () => void; refreshKey: number };

function Sidebar() {
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
        <a className="nav-item" href="#">
          <Icon name="budget" />
          <span>Bütçe</span>
        </a>
        <a className="nav-item" href="#">
          <Icon name="settings" />
          <span>Ayarlar</span>
        </a>
      </nav>
      <div className="side-foot">
        <span className="avatar">A</span>
        <div>
          <div className="nm">Ada Yılmaz</div>
          <div className="em">ada@kese.app</div>
        </div>
      </div>
    </aside>
  );
}

const API_ERR = "API'ye ulaşılamadı. Backend çalışıyor mu? (http://localhost:3000/api)";

function Dashboard() {
  const { openAdd, refreshKey } = useOutletContext<Ctx>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [insight, setInsight] = useState("");
  const [recent, setRecent] = useState<ApiTransaction[]>([]);

  useEffect(() => {
    let active = true;
    Promise.all([api.getSummary(), api.getInsights(), api.getTransactions()])
      .then(([s, ins, txns]) => {
        if (!active) return;
        setSummary(s);
        setInsight(ins.text);
        setRecent(txns.slice(0, 5));
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

  if (loading) return <div className="state">Yükleniyor…</div>;
  if (error || !summary) return <div className="state error">{API_ERR}</div>;

  const maxCat = Math.max(...summary.categories.map((c) => c.amount), 1);

  return (
    <>
      <div className="topbar">
        <div>
          <h1 className="hello">Merhaba, Ada</h1>
          <div className="sub">İşte bu ayki harcamaların.</div>
        </div>
        <div className="actions">
          <button className="pill">
            Bu ay <Icon name="chev" size={15} />
          </button>
          <button className="btn" onClick={openAdd}>
            <Icon name="plus" size={16} />İşlem ekle
          </button>
        </div>
      </div>

      <section className="hero">
        <div className="card">
          <p className="eyebrow">Bu ay toplam</p>
          <div className="total">
            <span className="cur">₺</span>
            {summary.total.toLocaleString("tr-TR")}
          </div>
          <div className="rule" />
          <div className="compare">
            <span>Haziran 2026</span>
            <span>{summary.categories.length} kategori</span>
          </div>
        </div>
        <div className="card ai">
          <div className="ai-badge">
            <Icon name="spark" size={16} />AI İçgörü
          </div>
          <p className="ai-text">{insight}</p>
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
          {summary.categories.map((c) => (
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
          ))}
        </div>

        <div className="card">
          <div className="card-head">
            <h2 className="card-title">Günlük harcama</h2>
            <span className="more">Haziran</span>
          </div>
          {/* TODO: günlük seri için backend'e /dashboard/trend ucu eklenince gerçek veriyle değişecek */}
          <svg
            className="chart"
            viewBox="0 0 320 124"
            preserveAspectRatio="none"
            role="img"
            aria-label="Günlük harcama eğrisi (örnek)"
          >
            <line x1="10" y1="104" x2="310" y2="104" stroke="#e3e7e1" strokeWidth={1} />
            <line x1="10" y1="66" x2="310" y2="66" stroke="#eef1ee" strokeWidth={1} />
            <path
              d="M10 80 L31 60 L53 72 L74 44 L96 58 L117 38 L139 68 L160 50 L182 30 L203 62 L225 42 L246 74 L268 48 L289 34 L310 52 L310 104 L10 104 Z"
              fill="#1b5e45"
              fillOpacity={0.1}
            />
            <path
              d="M10 80 L31 60 L53 72 L74 44 L96 58 L117 38 L139 68 L160 50 L182 30 L203 62 L225 42 L246 74 L268 48 L289 34 L310 52"
              fill="none"
              stroke="#1b5e45"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <circle cx="182" cy="30" r="3.5" fill="#1b5e45" />
          </svg>
          <div className="chart-x">
            <span>1</span>
            <span>8</span>
            <span>15</span>
            <span>22</span>
            <span>30 Haz</span>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h2 className="card-title">Son işlemler</h2>
          <NavLink className="more" to="/islemler">
            Tümü
          </NavLink>
        </div>
        {recent.map((t) => {
          const color = t.category?.color ?? "#888888";
          return (
            <div className="txn" key={t.id}>
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
        })}
      </section>
    </>
  );
}

function Transactions() {
  const { openAdd, refreshKey } = useOutletContext<Ctx>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [txns, setTxns] = useState<ApiTransaction[]>([]);

  useEffect(() => {
    let active = true;
    api
      .getTransactions()
      .then((t) => {
        if (!active) return;
        setTxns(t);
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

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">İşlemler</h1>
          <div className="page-sub">{loading ? "Yükleniyor…" : `${txns.length} işlem`}</div>
        </div>
        <button className="btn" onClick={openAdd}>
          <Icon name="plus" size={16} />İşlem ekle
        </button>
      </div>

      <div className="toolbar">
        <div className="search">
          <Icon name="search" size={17} />İşlem ara
        </div>
        <button className="chip">
          Kategori <Icon name="chev" size={15} />
        </button>
        <button className="chip">
          Tarih <Icon name="chev" size={15} />
        </button>
      </div>

      {error ? (
        <div className="state error">{API_ERR}</div>
      ) : loading ? (
        <div className="state">Yükleniyor…</div>
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
                {txns.map((t) => {
                  const color = t.category?.color ?? "#888888";
                  return (
                    <tr key={t.id}>
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
            <span>{txns.length} işlem</span>
            <div className="pager">
              <button aria-label="Önceki">
                <Icon name="left" size={16} />
              </button>
              <button aria-label="Sonraki">
                <Icon name="right" size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function Layout() {
  const [addOpen, setAddOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const openAdd = () => setAddOpen(true);
  const openReceipt = () => {
    setAddOpen(false);
    setReceiptOpen(true);
  };
  const handleCreated = () => {
    setRefreshKey((k) => k + 1);
    setAddOpen(false);
  };

  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <Outlet context={{ openAdd, refreshKey } satisfies Ctx} />
      </main>
      <AddTransactionModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={handleCreated}
        onScan={openReceipt}
      />
      <ReceiptModal open={receiptOpen} onClose={() => setReceiptOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/islemler" element={<Transactions />} />
      </Route>
    </Routes>
  );
}
