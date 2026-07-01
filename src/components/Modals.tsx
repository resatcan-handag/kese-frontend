import { useState, useEffect } from "react";
import { Icon } from "../icons";
import { api, type ApiCategory } from "../api";
import { receipt } from "../mock";

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

type Tab = "manuel" | "fis" | "csv";

export function AddTransactionModal({
  open,
  onClose,
  onCreated,
  onScan,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  onScan: () => void;
}) {
  const [tab, setTab] = useState<Tab>("manuel");
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEscapeToClose(open, onClose);

  // Modal acildiginda formu sifirla ve kategorileri cek.
  useEffect(() => {
    if (!open) return;
    setTab("manuel");
    setAmount("");
    setDescription("");
    setCategoryId("");
    setErr(null);
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
              <div className="dz-title">Fiş fotoğrafını sürükle ya da seç</div>
              <div className="dz-sub">JPG veya PNG · AI alanları otomatik okur</div>
              <button className="btn" style={{ marginTop: 16 }} onClick={onScan}>
                <Icon name="spark" size={16} />Örnek fişi tara
              </button>
            </div>
          )}

          {tab === "csv" && (
            <div className="dropzone">
              <Icon name="upload" size={26} />
              <div className="dz-title">CSV / ekstre dosyasını yükle</div>
              <div className="dz-sub">Sonraki adımda sütunları eşlersin</div>
              <button className="btn-ghost" style={{ marginTop: 16 }}>
                Dosya seç
              </button>
            </div>
          )}
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

export function ReceiptModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEscapeToClose(open, onClose);
  if (!open) return null;

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
              <div className="r-h">{receipt.merchant.toUpperCase()}</div>
              <div className="r-meta">{receipt.dateLine}</div>
              {receipt.items.map((it, i) => (
                <div className="r-line" key={i}>
                  <span>{it.name}</span>
                  <span>{it.amount}</span>
                </div>
              ))}
              <div className="r-div" />
              <div className="r-tot">
                <span>TOPLAM</span>
                <span>{receipt.totalRaw}</span>
              </div>
            </div>
            <div>
              <div className="read-field">
                <div className="rl">Satıcı</div>
                <div className="rv">{receipt.merchant}</div>
              </div>
              <div className="read-field">
                <div className="rl">Tarih</div>
                <div className="rv">{receipt.dateFull}</div>
              </div>
              <div className="read-field">
                <div className="rl">Tutar</div>
                <div className="rv big">{receipt.total}</div>
              </div>
              <div className="read-field">
                <div className="rl">
                  <Icon name="spark" size={13} />Kategori
                </div>
                <div>
                  <span className="cat-chip" style={{ background: receipt.categoryColor + "1a", color: receipt.categoryColor }}>
                    <span className="d" style={{ background: receipt.categoryColor }} />
                    {receipt.category}
                  </span>
                </div>
              </div>
              <div className="items-head">Kalemler ({receipt.items.length})</div>
              {receipt.items.slice(0, 4).map((it, i) => (
                <div className="il" key={i}>
                  <span className="nm">{it.name}</span>
                  <span className="leader" />
                  <span className="am">₺{it.amount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn-ghost" onClick={onClose}>
            Düzenle
          </button>
          <button className="btn" onClick={onClose}>
            <Icon name="check" size={16} />Onayla ve kaydet
          </button>
        </div>
      </div>
    </div>
  );
}
