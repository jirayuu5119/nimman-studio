const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_MAX_LENGTH = 128;

export type PasswordPolicyError =
  | "length"
  | "lowercase"
  | "uppercase"
  | "digit"
  | "symbol";

export function validateAdminPassword(
  password: string
): PasswordPolicyError | null {
  if (
    password.length < PASSWORD_MIN_LENGTH ||
    password.length > PASSWORD_MAX_LENGTH
  ) {
    return "length";
  }
  if (!/[a-z]/.test(password)) return "lowercase";
  if (!/[A-Z]/.test(password)) return "uppercase";
  if (!/[0-9]/.test(password)) return "digit";
  if (!/[^A-Za-z0-9]/.test(password)) return "symbol";
  return null;
}

export function getPasswordPolicyMessage(error: PasswordPolicyError) {
  switch (error) {
    case "length":
      return "รหัสผ่านต้องมี 12-128 ตัวอักษร";
    case "lowercase":
      return "รหัสผ่านต้องมีตัวพิมพ์เล็กอย่างน้อย 1 ตัว";
    case "uppercase":
      return "รหัสผ่านต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว";
    case "digit":
      return "รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว";
    case "symbol":
      return "รหัสผ่านต้องมีสัญลักษณ์อย่างน้อย 1 ตัว";
  }
}
