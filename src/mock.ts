// Fiş okuma akışı (görüntü LLM) henüz bağlanmadığı için örnek (mock) veri.
// Backend'e POST /receipts eklenince burası gerçek AI çıktısıyla değişecek.
export const receipt = {
  merchant: "Migros",
  dateLine: "24.06.2026 · 14:32",
  dateFull: "24 Haziran 2026",
  total: "₺486,50",
  totalRaw: "486,50",
  category: "Market",
  categoryColor: "#1b5e45",
  items: [
    { name: "Süt 1L", amount: "42,00" },
    { name: "Ekmek", amount: "18,50" },
    { name: "Yumurta 15'li", amount: "68,90" },
    { name: "Deterjan", amount: "126,00" },
    { name: "Domates 1kg", amount: "34,20" },
    { name: "Tavuk göğsü", amount: "96,90" },
  ],
};
