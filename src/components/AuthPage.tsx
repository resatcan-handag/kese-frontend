import { useState } from "react";
import { Icon } from "../icons";
import { api } from "../api";

type Mode = "login" | "register";

export function AuthPage({ onAuthed }: { onAuthed: () => void }) {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const mail = email.trim();
    if (!mail || !password) {
      setErr("E-posta ve şifre gir.");
      return;
    }
    if (mode === "register" && password.length < 6) {
      setErr("Şifre en az 6 karakter olmalı.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      if (mode === "login") await api.login(mail, password);
      else await api.register(mail, password);
      onAuthed();
    } catch {
      setErr(
        mode === "login"
          ? "E-posta veya şifre hatalı."
          : "Kayıt başarısız. Bu e-posta kullanılıyor olabilir.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="brand auth-brand">
          <span className="brand-mark">
            <Icon name="budget" size={22} />
          </span>
          <span className="brand-name">Kese</span>
        </div>

        <h1 className="auth-title">
          {mode === "login" ? "Tekrar hoş geldin" : "Hesap oluştur"}
        </h1>
        <p className="auth-sub">
          {mode === "login"
            ? "Harcamalarını görmek için giriş yap."
            : "Birkaç saniyede başla — varsayılan kategoriler hazır gelir."}
        </p>

        <div className="seg auth-seg">
          <button
            type="button"
            className={"seg-btn" + (mode === "login" ? " active" : "")}
            onClick={() => {
              setMode("login");
              setErr(null);
            }}
          >
            Giriş
          </button>
          <button
            type="button"
            className={"seg-btn" + (mode === "register" ? " active" : "")}
            onClick={() => {
              setMode("register");
              setErr(null);
            }}
          >
            Kayıt ol
          </button>
        </div>

        <form onSubmit={submit}>
          <div className="field">
            <label>E-posta</label>
            <input
              className="control"
              type="email"
              autoComplete="email"
              placeholder="ornek@kese.app"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Şifre</label>
            <input
              className="control"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              placeholder={mode === "register" ? "En az 6 karakter" : "••••••••"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {err && <div className="form-err">{err}</div>}
          <button className="btn auth-submit" type="submit" disabled={busy}>
            <Icon name="check" size={16} />
            {busy
              ? "Lütfen bekle…"
              : mode === "login"
                ? "Giriş yap"
                : "Kayıt ol"}
          </button>
        </form>

        <p className="auth-demo">Demo hesap: ada@kese.app · demo1234</p>
      </div>
    </div>
  );
}
