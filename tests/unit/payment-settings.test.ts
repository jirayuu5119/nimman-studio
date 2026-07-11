import { describe, expect, it } from "vitest";
import { normalizePromptPayNumber } from "@/lib/payment-settings";

describe("PromptPay settings", () => {
  it("accepts 10-15 digits and removes spaces or hyphens", () => {
    expect(normalizePromptPayNumber("830-237-6723")).toBe("8302376723");
    expect(normalizePromptPayNumber("1234567890123")).toBe("1234567890123");
  });

  it("rejects invalid PromptPay identifiers", () => {
    expect(() => normalizePromptPayNumber("123")).toThrow(
      "INVALID_PROMPTPAY_NUMBER"
    );
    expect(() => normalizePromptPayNumber("08123abc45")).toThrow(
      "INVALID_PROMPTPAY_NUMBER"
    );
  });
});
