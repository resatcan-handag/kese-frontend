import { useState, useEffect } from "react";
import { Icon } from "../icons";
import { api, type MeResponse, type ApiCategory } from "../api";

const API_ERR = "API'ye ulaşılamadı. Backend çalışıyor mu? (http://localhost:3000/api)";
const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

function formatJoined(iso: string): string {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [reload, setReload] = useState(0);

  // Yeni kategori formu
  const [name, setName] = useState("");
  const [color, setColor] = useState("#1b5e45");
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([api.getMe(), api.getCategories()])
      .then(([u, cats]) => {
        if (!active) return;
        setMe(u);
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
  }, [reload]);

  const refresh = () => setReload((k) => k + 1);

  const addCategory = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setFormErr("Kategori adı gir.");
      return;
    }
    setSaving(true);
    setFormErr(null);
    try {
      await api.createCategory({ name: trimmed, color });
      setName("");
      setColor("#1b5e45");
      refresh();
    } catch {
      setFormErr("Eklenemedi. Backend çalışıyor mu?");
    } finally {
      setSaving(false);
    }
  };

  const removeCategory = async (c: ApiCategory) => {
    if (!window.confirm(`"${c.name}" kategorisi silinsin mi? Bu kategorideki işlemler "kategorisiz" olur.`)) {
      return;
    }
    try {
      await api.deleteCategory(c.id);
      refresh();
    } catch {
      // Sessiz geç; liste yenilenince gerçek durum görünür.
      refresh();
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Ayarlar</h1>
          <div className="page-sub">Profil ve kategoriler</div>
        </div>
      </div>

      {error ? (
        <div className="state error">{API_ERR}</div>
      ) : loading ? (
        <div className="state">Yükleniyor…</div>
      ) : (
        <>
          <section className="card">
            <div className="card-head">
              <h2 className="card-title">Profil</h2>
              <span className="ai-tag">Oturum açık</span>
            </div>
            <div className="set-row">
              <span className="set-key">E-posta</span>
              <span className="set-val">{me?.email ?? "—"}</span>
            </div>
            <div className="set-row">
              <span className="set-key">Üyelik</span>
              <span className="set-val">{me ? formatJoined(me.createdAt) : "—"}</span>
            </div>
            <div className="set-row">
              <span className="set-key">API adresi</span>
              <span className="set-val mono">{BASE}</span>
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <h2 className="card-title">Kategoriler</h2>
              <span className="more">{categories.length} kategori</span>
            </div>

            {categories.map((c) => (
              <div className="cm-row" key={c.id}>
                <span className="cat-dot" style={{ background: c.color }} />
                <span className="cm-name">{c.name}</span>
                <span className="leader" />
                <button
                  className="cm-del"
                  onClick={() => removeCategory(c)}
                  aria-label={`${c.name} sil`}
                  title="Sil"
                >
                  <Icon name="x" size={16} />
                </button>
              </div>
            ))}

            <div className="cat-add">
              <input
                type="color"
                className="color-swatch"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                aria-label="Kategori rengi"
              />
              <input
                className="control"
                placeholder="Yeni kategori adı"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !saving) addCategory();
                }}
              />
              <button className="btn" onClick={addCategory} disabled={saving}>
                <Icon name="plus" size={16} />
                {saving ? "Ekleniyor…" : "Ekle"}
              </button>
            </div>
            {formErr && <div className="form-err">{formErr}</div>}
          </section>
        </>
      )}
    </>
  );
}
