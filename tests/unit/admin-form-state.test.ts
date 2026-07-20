import { describe, expect, it } from "vitest";
import {
  describeSelectedFile,
  validatePasswordConfirmation,
} from "@/lib/admin-form-state";

describe("admin form state", () => {
  it("validates password policy before matching confirmation", () => {
    expect(validatePasswordConfirmation("Short1!", "Short1!")).toBe("length");
    expect(
      validatePasswordConfirmation("StrongPassword1!", "DifferentPassword1!")
    ).toBe("mismatch");
    expect(
      validatePasswordConfirmation("StrongPassword1!", "StrongPassword1!")
    ).toBeNull();
  });

  it("describes the selected QR file without inventing a name", () => {
    expect(describeSelectedFile(undefined)).toBe("ยังไม่ได้เลือกไฟล์");
    expect(describeSelectedFile("")).toBe("ยังไม่ได้เลือกไฟล์");
    expect(describeSelectedFile("promptpay.png")).toBe("promptpay.png");
  });
});
