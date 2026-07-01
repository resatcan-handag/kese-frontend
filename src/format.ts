export function formatTL(n: number): string {
  return (
    "₺" +
    n.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })
  );
}

const dateFmt = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" });

export function formatDateShort(iso: string): string {
  return dateFmt.format(new Date(iso));
}

export function initial(name: string | null | undefined): string {
  return (name ?? "?").trim().charAt(0).toUpperCase() || "?";
}
