# Kese — (frontend)

Harcama takip + AI içgörü uygulamasının önyüzü. React + TypeScript + Vite, custom CSS (Tailwind yok), `react-router-dom` v6. Veriler gerçek API'den gelir (mock yok); backend'e JWT ile bağlanır.

## Çalıştırma

```bash
npm install
npm run dev        # http://localhost:5173
```

Backend'in ayakta olması gerekir (`http://localhost:3000/api`). Adres `VITE_API_URL` ile değiştirilebilir.

Uygulama açılınca token yoksa **giriş/kayıt** ekranı çıkar. Demo giriş: `ada@kese.app` / `demo1234` (backend seed'lendiyse).

## Yapı

```
kese-frontend/
├─ index.html
├─ vite.config.ts, tsconfig*.json, package.json
└─ src/
   ├─ main.tsx                  # React kök render (BrowserRouter)
   ├─ App.tsx                   # Oturum kapısı + Layout + sayfalar + rotalar
   ├─ authContext.ts            # AuthContext + useAuth (oturum kullanıcısı + logout)
   ├─ api.ts                    # TÜM fetch çağrıları (backend seam) + token yönetimi
   ├─ format.ts                 # formatTL, formatDateShort, initial
   ├─ icons.tsx                 # Icon bileşeni (inline SVG ikon seti)
   ├─ index.css                 # Kese tasarım token'ları + tüm bileşen stilleri
   └─ components/
      ├─ AuthPage.tsx           # Giriş / kayıt ekranı
      ├─ Modals.tsx             # İşlem ekle + Fiş onay + İşlem düzenle modalları
      ├─ CsvImport.tsx          # CSV çözümleme + sütun eşleme + önizleme
      ├─ TrendChart.tsx         # Günlük harcama SVG grafiği
      ├─ BudgetPage.tsx         # Bütçe sayfası (/butce)
      └─ SettingsPage.tsx       # Ayarlar (/ayarlar): profil + kategori yönetimi
```

## Sayfalar / akış

- **Giriş/Kayıt** — token yoksa gösterilir; token `localStorage`'da, her isteğe `Authorization: Bearer` eklenir, 401'de otomatik çıkış.
- **Pano** (`/`) — toplam, kategori dağılımı, günlük trend, AI içgörü (ayrı yüklenir), son işlemler.
- **İşlemler** (`/islemler`) — tablo; satıra tıkla → düzenle/sil.
- **İşlem ekle** — modal: Manuel / Fiş yükle / CSV içe aktar.
- **Bütçe** (`/butce`) — kategori limiti + ilerleme çubukları.
- **Ayarlar** (`/ayarlar`) — profil + kategori ekle/düzenle/sil.

## Konvansiyonlar

- Veri çekme **yalnızca** `api.ts`'te, biçimleme `format.ts`'te.
- Tasarım sistemi `index.css`'te; sınıf isimlerini bozma (`.card`, `.cat-row`, `.txn`, `.modal`, `.control` vb.). Yeni ikon `icons.tsx`'e eklenir.
