import { useState } from "react";
import { Icon } from "../icons";
import { api, type ImportCsvRow } from "../api";

// --- Kucuk CSV yardimcilari (bagimlilik yok) ---

// `;` mi `,` mi ayirici? Ilk satirda hangisi cok geciyorsa onu sec (TR ekstrelerde `;` yaygin).
function detectDelimiter(line: string): "," | ";" {
  const semi = (line.match(/;/g) ?? []).length;
  const comma = (line.match(/,/g) ?? []).length;
  return semi > comma ? ";" : ",";
}

// Tirnakli alanlari da destekleyen basit CSV cozumleyici.
function parseCsv(text: string): string[][] {
  const clean = text.replace(/^﻿/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const firstLine = clean.split("\n").find((l) => l.trim().length > 0) ?? "";
  const delim = detectDelimiter(firstLine);

  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (inQuotes) {
      if (ch === '"') {
        if (clean[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delim) {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim().length > 0));
}

// "1.234,56" / "1234,56" / "1234.56" -> 1234.56
function parseAmount(raw: string): number | null {
  let s = (raw ?? "").replace(/[^\d.,-]/g, "").trim();
  if (!s) return null;
  const hasComma = s.includes(",");
  const hasDot = s.includes(".");
  if (hasComma && hasDot) {
    // Nokta binlik, virgul ondalik varsayimi.
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (hasComma) {
    s = s.replace(",", ".");
  }
  const n = Number(s);
  return Number.isFinite(n) ? Math.abs(n) : null;
}

// ISO (yyyy-mm-dd) ya da TR (dd.mm.yyyy | dd/mm/yyyy) -> yyyy-mm-dd
function parseDate(raw: string): string | null {
  const s = (raw ?? "").trim();
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const tr = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (tr) {
    const d = tr[1].padStart(2, "0");
    const m = tr[2].padStart(2, "0");
    let y = tr[3];
    if (y.length === 2) y = "20" + y;
    return `${y}-${m}-${d}`;
  }
  return null;
}

// Basliktan sutun tahmini.
function guessColumn(header: string[], keys: string[]): number {
  const idx = header.findIndex((h) =>
    keys.some((k) => h.toLowerCase().includes(k)),
  );
  return idx;
}

type Mapping = { date: number; amount: number; description: number };

export function CsvImport({ onImported }: { onImported: (created: number) => void }) {
  const [rows, setRows] = useState<string[][] | null>(null);
  const [hasHeader, setHasHeader] = useState(true);
  const [map, setMap] = useState<Mapping>({ date: -1, amount: -1, description: -1 });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");

  const onFile = async (file: File) => {
    setErr(null);
    const text = await file.text();
    const parsed = parseCsv(text);
    if (parsed.length === 0) {
      setErr("Dosya boş görünüyor.");
      return;
    }
    setFileName(file.name);
    setRows(parsed);
    const header = parsed[0];
    setMap({
      date: guessColumn(header, ["tarih", "date"]),
      amount: guessColumn(header, ["tutar", "amount", "miktar", "fiyat"]),
      description: guessColumn(header, ["açıkla", "aciklama", "descr", "işlem", "islem", "not"]),
    });
    setHasHeader(true);
  };

  const dataRows = rows ? (hasHeader ? rows.slice(1) : rows) : [];
  const header = rows?.[0] ?? [];
  const colCount = rows ? Math.max(...rows.map((r) => r.length)) : 0;
  const colLabel = (i: number) =>
    hasHeader && header[i]?.trim() ? header[i] : `Sütun ${i + 1}`;

  const doImport = async () => {
    if (map.date < 0 || map.amount < 0) {
      setErr("Tarih ve tutar sütunlarını eşle.");
      return;
    }
    const out: ImportCsvRow[] = [];
    let skipped = 0;
    for (const r of dataRows) {
      const amount = parseAmount(r[map.amount] ?? "");
      const date = parseDate(r[map.date] ?? "");
      if (amount === null || amount === 0 || !date) {
        skipped++;
        continue;
      }
      const description = map.description >= 0 ? (r[map.description] ?? "").trim() : "";
      out.push({ amount, date, description: description || undefined });
    }
    if (out.length === 0) {
      setErr("Geçerli satır bulunamadı. Eşlemeyi kontrol et.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const res = await api.importCsv(out);
      onImported(res.created);
    } catch {
      setErr(
        skipped
          ? `İçe aktarılamadı (${skipped} satır atlanmıştı). Backend çalışıyor mu?`
          : "İçe aktarılamadı. Backend çalışıyor mu?",
      );
    } finally {
      setBusy(false);
    }
  };

  if (!rows) {
    return (
      <div className="dropzone">
        <Icon name="upload" size={26} />
        <div className="dz-title">CSV / ekstre dosyasını yükle</div>
        <div className="dz-sub">Sonraki adımda sütunları eşlersin</div>
        <label className="btn-ghost" style={{ marginTop: 16, cursor: "pointer" }}>
          Dosya seç
          <input
            type="file"
            accept=".csv,text/csv"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
              e.target.value = "";
            }}
          />
        </label>
        {err && <div className="form-err" style={{ marginTop: 12 }}>{err}</div>}
      </div>
    );
  }

  const cols = Array.from({ length: colCount }, (_, i) => i);
  const mapSelect = (
    field: keyof Mapping,
    label: string,
    optional?: boolean,
  ) => (
    <div className="field">
      <label>
        {label}
        {optional ? " (isteğe bağlı)" : ""}
      </label>
      <select
        className="control"
        value={map[field]}
        onChange={(e) => setMap((m) => ({ ...m, [field]: Number(e.target.value) }))}
      >
        <option value={-1}>—</option>
        {cols.map((i) => (
          <option key={i} value={i}>
            {colLabel(i)}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <>
      <div className="ai-note">
        <Icon name="upload" size={15} />
        {fileName} · {dataRows.length} satır — sütunları eşle
      </div>

      {mapSelect("date", "Tarih")}
      {mapSelect("amount", "Tutar")}
      {mapSelect("description", "Açıklama", true)}

      <label
        className="ai-hint"
        style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
      >
        <input type="checkbox" checked={hasHeader} onChange={(e) => setHasHeader(e.target.checked)} />
        İlk satır başlık
      </label>

      {(map.date >= 0 || map.amount >= 0) && (
        <div className="csv-preview">
          <table>
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Tutar</th>
                <th>Açıklama</th>
              </tr>
            </thead>
            <tbody>
              {dataRows.slice(0, 4).map((r, i) => (
                <tr key={i}>
                  <td>{map.date >= 0 ? r[map.date] : "—"}</td>
                  <td className="t-amt">{map.amount >= 0 ? r[map.amount] : "—"}</td>
                  <td>{map.description >= 0 ? r[map.description] : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {err && <div className="form-err">{err}</div>}

      <div className="csv-actions">
        <button
          className="btn-ghost"
          onClick={() => {
            setRows(null);
            setErr(null);
          }}
        >
          Başka dosya
        </button>
        <button className="btn" onClick={doImport} disabled={busy}>
          <Icon name="check" size={16} />
          {busy ? "Aktarılıyor…" : `${dataRows.length} işlemi aktar`}
        </button>
      </div>
    </>
  );
}
