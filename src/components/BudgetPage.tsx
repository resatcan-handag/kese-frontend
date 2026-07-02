import { useState, useEffect } from "react";
import { Icon } from "../icons";
import { api, type BudgetsResponse, type BudgetItem } from "../api";
import { formatTL } from "../format";

const API_ERR = "API'ye ulaşılamadı. Backend çalışıyor mu? (http://localhost:3000/api)";

function pct(spent: number, limit: number | null): number {
  if (!limit || limit <= 0) return 0;
  return Math.min((spent / limit) * 100, 100);
}

function BudgetRow({ item, onSaved }: { item: BudgetItem; onSaved: () => void }) {
  const [value, setValue] = useState(item.limit != null ? String(item.limit) : "");
  const [saving, setSaving] = useState(false);

  // Ust veri yenilenince input'u eşitle.
  useEffect(() => {
    setValue(item.limit != null ? String(item.limit) : "");
  }, [item.limit]);

  const parsed = Number(value.replace(",", ".")) || 0;
  const dirty = parsed !== (item.limit ?? 0);
  const over = item.limit != null && item.limit > 0 && item.spent > item.limit;
  const barColor = over ? "var(--coral)" : item.color;

  const save = async () => {
    setSaving(true);
    try {
      await api.setBudget(item.categoryId, parsed);
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bud-row">
      <div className="bud-head">
        <span className="cat-dot" style={{ background: item.color }} />
        <span className="bud-name">{item.category}</span>
        <span className="leader" />
        <span className={"bud-amt" + (over ? " over" : "")}>
          {formatTL(item.spent)}
          {item.limit != null ? ` / ${formatTL(item.limit)}` : " · limit yok"}
        </span>
      </div>
      <div className="bud-bar">
        <span
          className="bud-fill"
          style={{ width: `${pct(item.spent, item.limit)}%`, background: barColor }}
        />
      </div>
      <div className="bud-edit">
        <span className="bud-cur">₺</span>
        <input
          className="control bud-input"
          type="number"
          inputMode="decimal"
          step="1"
          min="0"
          placeholder="Aylık limit"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && dirty && !saving) save();
          }}
        />
        <button className="btn" onClick={save} disabled={!dirty || saving}>
          <Icon name="check" size={15} />
          {saving ? "…" : "Kaydet"}
        </button>
      </div>
    </div>
  );
}

export function BudgetPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [data, setData] = useState<BudgetsResponse | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    api
      .getBudgets()
      .then((d) => {
        if (!active) return;
        setData(d);
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
  }, [reload]);

  const refresh = () => setReload((k) => k + 1);

  const overallPct = data ? pct(data.totalSpent, data.totalLimit || null) : 0;
  const overallOver = !!data && data.totalLimit > 0 && data.totalSpent > data.totalLimit;

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Bütçe</h1>
          <div className="page-sub">
            {loading ? "Yükleniyor…" : data ? data.label : ""}
          </div>
        </div>
      </div>

      {error ? (
        <div className="state error">{API_ERR}</div>
      ) : loading || !data ? (
        <div className="state">Yükleniyor…</div>
      ) : (
        <>
          <section className="card">
            <p className="eyebrow">Bu ay bütçe kullanımı</p>
            <div className="bud-total">
              <span className={"bud-total-spent" + (overallOver ? " over" : "")}>
                {formatTL(data.totalSpent)}
              </span>
              <span className="bud-total-limit">
                / {data.totalLimit > 0 ? formatTL(data.totalLimit) : "limit yok"}
              </span>
            </div>
            <div className="bud-bar big">
              <span
                className="bud-fill"
                style={{
                  width: `${overallPct}%`,
                  background: overallOver ? "var(--coral)" : "var(--evergreen)",
                }}
              />
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <h2 className="card-title">Kategori bütçeleri</h2>
              <span className="more">Aylık limit gir</span>
            </div>
            {data.items.map((it) => (
              <BudgetRow key={it.categoryId} item={it} onSaved={refresh} />
            ))}
          </section>
        </>
      )}
    </>
  );
}
