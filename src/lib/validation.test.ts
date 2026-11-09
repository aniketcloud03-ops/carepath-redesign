import { describe, expect, it } from "vitest";
import {
  daysBetween,
  makeAadhaar,
  maskAadhaar,
  validateAadhaar,
  validatePan,
} from "./validation";

describe("Aadhaar validation", () => {
  it("accepts a 12-digit number with a correct Verhoeff check digit", () => {
    expect(validateAadhaar(makeAadhaar("23456789012")).valid).toBe(true);
  });
  it("rejects a number whose check digit is wrong", () => {
    const good = makeAadhaar("23456789012");
    const bad = good.slice(0, 11) + ((Number(good[11]) + 1) % 10);
    expect(validateAadhaar(bad).valid).toBe(false);
  });
  it("rejects numbers that are not 12 digits", () => {
    expect(validateAadhaar("2345 6789 012").valid).toBe(false);
  });
  it("rejects numbers starting with 0 or 1", () => {
    expect(validateAadhaar(makeAadhaar("13456789012")).valid).toBe(false);
  });
  it("masks all but the last 4 digits", () => {
    expect(maskAadhaar("234567891234")).toBe("XXXX XXXX 1234");
  });
});

describe("PAN validation", () => {
  it("accepts an individual PAN (4th letter P)", () => {
    expect(validatePan("ABCPE1234F").valid).toBe(true);
  });
  it("rejects a non-individual PAN", () => {
    expect(validatePan("ABCDE1234F").valid).toBe(false);
  });
  it("rejects a malformed PAN", () => {
    expect(validatePan("ABC1234").valid).toBe(false);
  });
});

describe("Stay duration", () => {
  it("counts discharge minus admission in whole days", () => {
    expect(daysBetween("2026-08-17", "2026-08-25")).toBe(8);
    expect(daysBetween("2026-08-17", "2026-09-01")).toBe(15);
  });
});
