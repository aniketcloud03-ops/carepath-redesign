import { format, parseISO } from "date-fns";
import { daysBetween } from "./validation";

export const todayISO = () => new Date().toISOString().slice(0, 10);

export function fmtDate(iso?: string, pattern = "d MMM yyyy") {
  if (!iso) return "—";
  try {
    return format(parseISO(iso), pattern);
  } catch {
    return iso;
  }
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function stayDays(admissionDate: string, dischargeDate?: string) {
  return Math.max(0, daysBetween(admissionDate, dischargeDate ?? todayISO()));
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86_400_000);
  if (d <= 0) {
    const h = Math.floor(diff / 3_600_000);
    if (h <= 0) return "just now";
    return `${h}h ago`;
  }
  if (d === 1) return "yesterday";
  if (d < 30) return `${d} days ago`;
  return fmtDate(iso);
}
