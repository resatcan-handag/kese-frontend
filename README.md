# Kese — Önyüz (frontend)

Harcama takip + AI içgörü uygulamasının önyüzü. React + TypeScript + Vite.
Şu an Pano ekranı, tasarım sistemiyle ve sahte (mock) veriyle çalışıyor.

## Çalıştırma

```bash
npm install
npm run dev
```

Ardından terminalde çıkan adresi (genelde http://localhost:5173) tarayıcıda aç.

## Yapı

```
kese-frontend/
├─ index.html            # Vite girişi + Google Fonts
├─ package.json
├─ vite.config.ts
├─ tsconfig.json
└─ src/
   ├─ main.tsx           # React kök render
   ├─ App.tsx            # Pano: Sidebar + Topbar + kartlar
   ├─ index.css          # Kese tasarım token'ları + tüm bileşen stilleri
   ├─ icons.tsx          # SVG ikon seti (Icon bileşeni)
   └─ data.ts            # Tipli mock veri (backend gelince burası API'ye bağlanır)
```

## Sıradaki adımlar

- Diğer ekranları rota olarak ekle (İşlemler, İşlem Ekle, Fiş Tarama) — react-router.
- Backend'i kur (NestJS + Prisma + PostgreSQL) ve `data.ts` yerine gerçek API çağrıları koy.
- AI: fiş okuma (görüntü LLM) ve kategori/içgörü (LLM) uçlarını bağla.
