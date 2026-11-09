// Verhoeff checksum — the algorithm UIDAI uses for the 12th digit of an Aadhaar number.
const D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];
const P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];
const INV = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

export const digitsOnly = (s: string) => s.replace(/\D/g, "");

export function verhoeffCheckDigit(base: string): number {
  let c = 0;
  const digits = digitsOnly(base).split("").reverse().map(Number);
  for (let i = 0; i < digits.length; i++) c = D[c][P[(i + 1) % 8][digits[i]]];
  return INV[c];
}

export function isValidVerhoeff(num: string): boolean {
  const digits = digitsOnly(num).split("").reverse().map(Number);
  let c = 0;
  for (let i = 0; i < digits.length; i++) c = D[c][P[i % 8][digits[i]]];
  return c === 0;
}

/** Aadhaar: 12 digits, cannot start with 0 or 1, valid Verhoeff checksum. */
export function validateAadhaar(input: string): { valid: boolean; message: string } {
  const d = digitsOnly(input);
  if (d.length === 0) return { valid: false, message: "" };
  if (d.length !== 12) return { valid: false, message: `${d.length}/12 digits entered` };
  if (/^[01]/.test(d)) return { valid: false, message: "Aadhaar cannot start with 0 or 1" };
  if (!isValidVerhoeff(d)) return { valid: false, message: "Checksum failed — please re-check" };
  return { valid: true, message: "Valid Aadhaar number" };
}

/** PAN: AAAAA9999A, 4th character 'P' for an individual holder. */
export function validatePan(input: string): { valid: boolean; message: string } {
  const v = input.trim().toUpperCase();
  if (!v) return { valid: false, message: "" };
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(v))
    return { valid: false, message: "Format must be ABCDE1234F" };
  if (v[3] !== "P") return { valid: false, message: "4th letter must be 'P' for individuals" };
  return { valid: true, message: "Valid individual PAN" };
}

export function formatAadhaar(input: string): string {
  return digitsOnly(input)
    .slice(0, 12)
    .replace(/(\d{4})(?=\d)/g, "$1 ");
}

export function maskAadhaar(input?: string): string {
  if (!input) return "—";
  const d = digitsOnly(input);
  return `XXXX XXXX ${d.slice(-4)}`;
}

export function makeAadhaar(base11: string): string {
  const b = digitsOnly(base11).slice(0, 11);
  return b + verhoeffCheckDigit(b);
}

/** Whole days between two ISO dates (discharge − admission). */
export function daysBetween(fromISO: string, toISO: string): number {
  const a = Date.UTC(+fromISO.slice(0, 4), +fromISO.slice(5, 7) - 1, +fromISO.slice(8, 10));
  const b = Date.UTC(+toISO.slice(0, 4), +toISO.slice(5, 7) - 1, +toISO.slice(8, 10));
  return Math.round((b - a) / 86_400_000);
}
