export const ADMIN_SECTION_IDS = {
  portfolio: "portfolio",
  payments: "payments",
  security: "security",
  bookings: "bookings",
} as const;

export type AdminNavigationIcon =
  | "dashboard"
  | "calendar"
  | "portfolio"
  | "payment"
  | "security"
  | "bookings";

export type AdminNavigationItem = {
  label: string;
  href: string;
  icon: AdminNavigationIcon;
};

export const ADMIN_NAVIGATION: readonly AdminNavigationItem[] = [
  { label: "แดชบอร์ด", href: "/admin", icon: "dashboard" },
  { label: "ปฏิทินคิว", href: "/admin/calendar", icon: "calendar" },
  { label: "ช่องทางติดต่อ", href: "/admin#portfolio", icon: "portfolio" },
  { label: "การรับชำระเงิน", href: "/admin#payments", icon: "payment" },
  { label: "ความปลอดภัย", href: "/admin#security", icon: "security" },
  { label: "รายการจอง", href: "/admin#bookings", icon: "bookings" },
];

export function isAdminNavigationActive(
  pathname: string,
  href: string,
  hash = ""
) {
  const [route, anchor] = href.split("#");
  if (anchor) return pathname === route && hash === `#${anchor}`;
  if (href === "/admin") return pathname === href && hash === "";
  return pathname === href || pathname.startsWith(`${href}/`);
}
