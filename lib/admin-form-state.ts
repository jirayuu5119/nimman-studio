import {
  validateAdminPassword,
  type PasswordPolicyError,
} from "@/lib/auth/password-policy";

export type PasswordConfirmationError = PasswordPolicyError | "mismatch";

export function validatePasswordConfirmation(
  password: string,
  confirmation: string
): PasswordConfirmationError | null {
  const policyError = validateAdminPassword(password);
  if (policyError) return policyError;
  return password === confirmation ? null : "mismatch";
}

export function describeSelectedFile(fileName: string | undefined) {
  return fileName?.trim() || "ยังไม่ได้เลือกไฟล์";
}

export type AdminFormState = {
  tone: "idle" | "success" | "error";
  message: string;
};

export const INITIAL_ADMIN_FORM_STATE: AdminFormState = {
  tone: "idle",
  message: "",
};
