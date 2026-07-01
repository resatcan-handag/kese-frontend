import { useState, useEffect } from "react";
import { Icon } from "../icons";
import { api, type ApiCategory, type ReceiptReview } from "../api";
import { CsvImport } from "./CsvImport";

function useEscapeToClose(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
}

// number -> "1.234,56" (para gösterimi, TR)
function fmtNum(n: number): string {
  return n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

type Tab = "manuel" | "fis" | "csv";

export function AddTransactionModal({
  open,
  onClose,
  onCreated,
  onScanned,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  onScanned: (review: ReceiptReview) => void;
}) {
  const [tab, setTab] = useState<Tab>("manuel");
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanErr, setScanErr] = useState<string | null>(null);

  useEscapeToClose(open, onClose);

  // Modal acildiginda formu sifirla ve kategorileri cek.
  useEffect(() => {
    if (!open) return;
    setTab("manuel");
    setAmount("");
    setDescription("");
    setCategoryId("");
    setErr(null);
    setScanErr(null);
    setScanning(false);
    setDate(new Date().toISOString().slice(0, 10));
    api.getCategories().then(setCategories).catch(() => setCategories([]));
  }, [open]);

  if (!open) return null;

  const save = async () => {
    const amt = Number(amount.replace(",", "."));
    if (!amt || amt <= 0) {
      setErr("Geçerli bir tutar gir.");
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      await api.createTransaction({
        amount: amt,
        date,
        description: description || undefined,
        categoryId: categoryId || undefined,
      });
      onCreated();
    } catch {
      setErr("Kaydedilemedi. Backend çalışıyor mu?");
    } finally {
      setSaving(false);
    }
  };

  const scan = async (file: File) => {
    setScanErr(null);
    setScanning(true);
    try {
      const dataUrl = await readAsDataUrl(file);
      const review = await api.uploadReceipt(dataUrl, file.name);
      onScanned(review);
    } catch {
      setScanErr("Fiş okunamadı. Backend çalışıyor mu?");
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <span className="modal-title">İşlem ekle</span>
          <button className="x" onClick={onClose} aria-label="Kapat">
            <Icon name="x" size={18} />
          </button>
        </div>
        <div className="modal-body">
          <div className="seg">
            <button className={"seg-btn" + (tab === "manuel" ? " active" : "")} onClick={() => setTab("manuel")}>
              <Icon name="plus" size={15} />Manuel
            </button>
            <button className={"seg-btn" + (tab === "fis" ? " active" : "")} onClick={() => setTab("fis")}>
              Fiş yükle
            </button>
            <button className={"seg-btn" + (tab === "csv" ? " active" : "")} onClick={() => setTab("csv")}>
              CSV içe aktar
            </button>
          </div>

          {tab === "manuel" && (
            <>
              <div className="field">
                <label>Tutar (₺)</label>
                <input
                  className="control amt"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  placeholder="0,00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="field">
                <label>Tarih</label>
                <input className="control" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="field">
                <label>Kategori</label>
                <select className="control" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                  <option value="">AI seçsin (otomatik)</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <span className="ai-hint">
                  <Icon name="spark" size={14} />Boş bırakırsan AI açıklamadan seçer
                </span>
              </div>
              <div className="field">
                <label>Açıklama</label>
                <input
                  className="control"
                  placeholder="Örn. haftalık market"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              {err && <div className="form-err">{err}</div>}
            </>
          )}

          {tab === "fis" && (
            <div className="dropzone">
              <Icon name="upload" size={26} />
              <div className="dz-title">Fiş fotoğrafını seç</div>
              <div className="dz-sub">JPG veya PNG · AI alanları otomatik okur</div>
              <label className="btn" style={{ marginTop: 16, cursor: scanning ? "default" : "pointer" }}>
                <Icon name="spark" size={16} />
                {scanning ? "Okunuyor…" : "Fiş seç ve tara"}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  disabled={scanning}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) scan(f);
                    e.target.value = "";
                  }}
                />
              </label>
              {scanErr && <div className="form-err" style={{ marginTop: 12 }}>{scanErr}</div>}
            </div>
          )}

          {tab === "csv" && <CsvImport onImported={onCreated} />}
        </div>
        <div className="modal-foot">
          <button className="btn-ghost" onClick={onClose}>
            İptal
          </button>
          {tab === "manuel" && (
            <button className="btn" onClick={save} disabled={saving}>
              <Icon name="check" size={16} />
              {saving ? "Kaydediliyor…" : "Kaydet"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ReceiptModal({
  open,
  onClose,
  data,
  onConfirmed,
}: {
  open: boolean;
  onClose: () => void;
  data: ReceiptReview | null;
  onConfirmed: () => void;
}) {
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEscapeToClose(open, onClose);

  // Modal acilinca alanlari AI ciktisindan doldur.
  useEffect(() => {
    if (!open || !data) return;
    const ex = data.extracted;
    setAmount(String(ex.total));
    setDate(ex.date.slice(0, 10));
    setDescription(ex.merchant);
    setCategoryId(data.suggestedCategory?.id ?? "");
    setErr(null);
    api.getCategories().then(setCategories).catch(() => setCategories([]));
  }, [open, data]);

  if (!open || !data) return null;

  const ex = data.extracted;
  const cat = categories.find((c) => c.id === categoryId) ?? data.suggestedCategory;
  const catColor = cat?.color ?? "#1b5e45";

  const confirm = async () => {
    const amt = Number(amount.replace(",", "."));
    if (!amt || amt <= 0) {
      setErr("Geçerli bir tutar gir.");
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      await api.confirmReceipt(data.id, {
        amount: amt,
        date,
        description: description || undefined,
        categoryId: categoryId || undefined,
      });
      onConfirmed();
    } catch {
      setErr("Kaydedilemedi. Backend çalışıyor mu?");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <span className="modal-title">Fişi onayla</span>
          <button className="x" onClick={onClose} aria-label="Kapat">
            <Icon name="x" size={18} />
          </button>
        </div>
        <div className="modal-body">
          <div className="ai-note">
            <Icon name="spark" size={15} />AI fişi okudu — alanları kontrol et
          </div>
          <div className="rgrid">
            <div className="receipt">
              <div className="r-h">{ex.merchant.toUpperCase()}</div>
              <div className="r-meta">{new Date(ex.date).toLocaleDateString("tr-TR")}</div>
              {ex.items.map((it, i) => (
                <div className="r-line" key={i}>
                  <span>{it.name}</span>
                  <span>{fmtNum(it.amount)}</span>
                </div>
              ))}
              <div className="r-div" />
              <div className="r-tot">
                <span>TOPLAM</span>
                <span>{fmtNum(ex.total)}</span>
              </div>
            </div>
            <div>
              <div className="field">
                <label>Satıcı / açıklama</label>
                <input
                  className="control"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="field">
                <label>Tarih</label>
                <input className="control" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="field">
                <label>Tutar (₺)</label>
                <input
                  className="control amt"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="field">
                <label>
                  <Icon name="spark" size={13} />Kategori
                </label>
                <select className="control" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                  <option value="">AI seçsin (otomatik)</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {cat && (
                  <span className="cat-chip" style={{ background: catColor + "1a", color: catColor, marginTop: 8 }}>
                    <span className="d" style={{ background: catColor }} />
                    {cat.name}
                  </span>
                )}
              </div>
              <div className="items-head">Kalemler ({ex.items.length})</div>
              {ex.items.slice(0, 4).map((it, i) => (
                <div className="il" key={i}>
                  <span className="nm">{it.name}</span>
                  <span className="leader" />
                  <span className="am">₺{fmtNum(it.amount)}</span>
                </div>
              ))}
            </div>
          </div>
          {err && <div className="form-err">{err}</div>}
        </div>
        <div className="modal-foot">
          <button className="btn-ghost" onClick={onClose}>
            Vazgeç
          </button>
          <button className="btn" onClick={confirm} disabled={saving}>
            <Icon name="check" size={16} />
            {saving ? "Kaydediliyor…" : "Onayla ve kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
}
