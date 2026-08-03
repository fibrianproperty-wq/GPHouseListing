import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format harga dalam Rupiah
 * @example formatHarga(850000000) → "Rp 850.000.000"
 */
export function formatHarga(harga: number | null): string {
  if (harga === null || harga === undefined) return "-";
  return `Rp ${harga.toLocaleString("id-ID")}`;
}

/**
 * Format harga singkat (untuk display card)
 * @example formatHargaSingkat(850000000) → "850 Juta"
 * @example formatHargaSingkat(1500000000) → "1,5 Miliar"
 */
export function formatHargaSingkat(harga: number | null): string {
  if (harga === null || harga === undefined) return "-";

  if (harga >= 1_000_000_000) {
    const miliar = harga / 1_000_000_000;
    const formatted =
      miliar % 1 === 0
        ? miliar.toString()
        : miliar.toFixed(1).replace(".", ",");
    return `${formatted} Miliar`;
  }

  if (harga >= 1_000_000) {
    const juta = harga / 1_000_000;
    const formatted = juta % 1 === 0 ? juta.toString() : juta.toFixed(0);
    return `${formatted} Juta`;
  }

  return formatHarga(harga);
}

/**
 * Parse teks harga ke angka (Rupiah)
 * "850 Juta" → 850000000, "1.5 M" → 1500000000
 */
export function parseHargaText(text: string): number | null {
  if (!text) return null;

  const cleaned = text
    .toLowerCase()
    .replace(/[^\d.,a-z\s]/g, "")
    .trim();

  const miliarMatch = cleaned.match(/([\d.,]+)\s*(miliar|milyar|m\b)/);
  if (miliarMatch) {
    const num = parseFloat(miliarMatch[1].replace(",", "."));
    return Math.round(num * 1_000_000_000);
  }

  const jutaMatch = cleaned.match(/([\d.,]+)\s*(juta|jt)/);
  if (jutaMatch) {
    const num = parseFloat(jutaMatch[1].replace(",", "."));
    return Math.round(num * 1_000_000);
  }

  const rawMatch = cleaned.match(/^[\d.,]+$/);
  if (rawMatch) {
    const num = parseFloat(cleaned.replace(/\./g, "").replace(",", "."));
    if (!isNaN(num)) return Math.round(num);
  }

  return null;
}

/**
 * Truncate teks
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

/**
 * Format tanggal ke format Indonesia
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Format tanggal dengan waktu
 */
export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
