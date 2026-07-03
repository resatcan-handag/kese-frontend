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

// Tek kategori satiri: gorunum (ad + sil/duzenle) ve satir ici duzenleme (ad + renk).
function CategoryRow({
  item,
  onChanged,
  onDelete,
}: {
  item: ApiCategory;
  onChanged: () => void;
  onDelete: (c: ApiCategory) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [color, setColor] = useState(item.color);
  const [saving, setSaving] = useState(false);

  // Liste yenilenince (dis veri degisince) alanlari esitle.
  useEffect(() => {
    setName(item.name);
    setColor(item.color);
  }, [item.name, item.color]);

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await api.updateCategory(item.id, { name: trimmed, color });
      setEditing(false);
      onChanged();
    } catch {
      onChanged();
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    setName(item.name);
    setColor(item.color);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="cm-row">
        <input
          type="color"
          className="color-swatch sm"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          aria-label="Renk"
        />
        <input
          className="control cm-edit-name"
          value={name}
          autoFocus
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !saving) save();
            if (e.key === "Escape") cancel();
          }}
        />
        <button className="btn cm-save" onClick={save} disabled={saving}>
          <Icon name="check" size={15} />
          {saving ? "…" : "Kaydet"}
        </button>
        <button className="cm-del" onClick={cancel} title="Vazgeç" aria-label="Vazgeç">
          <Icon name="x" size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="cm-row">
      <span className="cat-dot" style={{ background: item.color }} />
      <span className="cm-name">{item.name}</span>
      <span className="leader" />
      <button
        className="cm-edit"
        onClick={() => setEditing(true)}
        title="Düzenle"
        aria-label={`${item.name} düzenle`}
      >
        <Icon name="pencil" size={16} />
      </button>
      <button
        className="cm-del"
        onClick={() => onDelete(item)}
        title="Sil"
        aria-label={`${item.name} sil`}
      >
        <Icon name="x" size={16} />
      </button>
    </div>
  );
}

// Sifre degistirme karti (kendi durumunu tutar).
function ChangePasswordCard() {
  const [cur, setCur] = useState("");
  const [nw, setNw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setMsg(null);
    setErr(null);
    if (nw.length < 6) {
      setErr("Yeni şifre en az 6 karakter olmalı.");
      return;
    }
    if (nw === cur) {
      setErr("Yeni şifre eskisiyle aynı olamaz.");
      return;
    }
    if (nw !== confirm) {
      setErr("Yeni şifreler eşleşmiyor.");
      return;
    }
    setSaving(true);
    try {
      await api.changePassword(cur, nw);
      setMsg("Şifre güncellendi.");
      setCur("");
      setNw("");
      setConfirm("");
    } catch (e) {
      const m = e instanceof Error ? e.message : "";
      setErr(m === "API 400" ? "Mevcut şifre hatalı." : "Değiştirilemedi. Backend çalışıyor mu?");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="card">
      <div className="card-head">
        <h2 className="card-title">Şifre</h2>
      </div>
      <div className="field">
        <label>Mevcut şifre</label>
        <input
          className="control"
          type="password"
          autoComplete="current-password"
          value={cur}
          onChange={(e) => setCur(e.target.value)}
        />
      </div>
      <div className="field">
        <label>Yeni şifre</label>
        <input
          className="control"
          type="password"
          autoComplete="new-password"
          placeholder="En az 6 karakter"
          value={nw}
          onChange={(e) => setNw(e.target.value)}
        />
      </div>
      <div className="field">
        <label>Yeni şifre (tekrar)</label>
        <input
          className="control"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>
      {err && <div className="form-err">{err}</div>}
      {msg && <div className="form-ok">{msg}</div>}
      <button className="btn" style={{ marginTop: 12 }} onClick={submit} disabled={saving}>
        <Icon name="check" size={16} />
        {saving ? "Kaydediliyor…" : "Şifreyi değiştir"}
      </button>
    </section>
  );
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

          <ChangePasswordCard />

          <section className="card">
            <div className="card-head">
              <h2 className="card-title">Kategoriler</h2>
              <span className="more">{categories.length} kategori</span>
            </div>

            {categories.map((c) => (
              <CategoryRow key={c.id} item={c} onChanged={refresh} onDelete={removeCategory} />
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
