import { afterEach, describe, expect, it } from "vitest";
import { determineAdminAccess } from "@/lib/auth/admin-access";
import {
  getSupabaseAuthCookiePrefix,
  isStaleSessionError,
  isSupabaseAuthCookieName,
} from "@/lib/auth/session-recovery";
import { bookingInputSchema } from "@/lib/booking-schema";
import { addDaysToDateKey, getBangkokDateKey } from "@/lib/booking-rules";
import {
  parseCustomerDataRetentionDays,
  PRIVACY_NOTICE_VERSION,
} from "@/lib/privacy";
import { getPublicSiteUrl } from "@/lib/site-url";
import { validateAdminPassword } from "@/lib/auth/password-policy";
import {
  CUSTOMER_DATA_RETENTION_DAYS,
  ORPHAN_SLIP_RETENTION_HOURS,
  parseOrphanSlipRetentionHours,
} from "@/lib/retention";
import { getLegacySlipPath } from "@/lib/slip-path";
import { selectBookingNotificationWebhook } from "@/lib/notifications/discord-config";

describe("admin MFA enforcement", () => {
  it("requires AAL2 for an active administrator", () => {
    expect(
      determineAdminAccess({
        authenticated: true,
        active: true,
        role: "admin",
        currentLevel: "aal1",
      })
    ).toBe("mfa_required");
    expect(
      determineAdminAccess({
        authenticated: true,
        active: true,
        role: "owner",
        currentLevel: "aal2",
      })
    ).toBe("authorized");
  });

  it("rejects inactive, unknown, and unauthenticated users", () => {
    expect(determineAdminAccess({ authenticated: false })).toBe(
      "unauthenticated"
    );
    expect(
      determineAdminAccess({
        authenticated: true,
        active: false,
        role: "admin",
        currentLevel: "aal2",
      })
    ).toBe("forbidden");
    expect(
      determineAdminAccess({
        authenticated: true,
        active: true,
        role: "viewer",
        currentLevel: "aal2",
      })
    ).toBe("forbidden");
  });
});

describe("stale Auth session recovery", () => {
  it("recognizes refresh-token failures that require local cleanup", () => {
    expect(isStaleSessionError({ code: "refresh_token_not_found" })).toBe(true);
    expect(isStaleSessionError({ code: "refresh_token_already_used" })).toBe(
      true
    );
    expect(isStaleSessionError({ code: "invalid_credentials" })).toBe(false);
  });

  it("targets only the current Supabase project's Auth cookies", () => {
    const url = "https://splzsolnwwnwkwhhdbnk.supabase.co";
    expect(getSupabaseAuthCookiePrefix(url)).toBe(
      "sb-splzsolnwwnwkwhhdbnk-auth-token"
    );
    expect(
      isSupabaseAuthCookieName(
        "sb-splzsolnwwnwkwhhdbnk-auth-token.0",
        url
      )
    ).toBe(true);
    expect(isSupabaseAuthCookieName("unrelated-cookie", url)).toBe(false);
  });
});

describe("admin password policy", () => {
  it("requires length, mixed case, a digit, and a symbol", () => {
    expect(validateAdminPassword("Short1!")).toBe("length");
    expect(validateAdminPassword("ALLUPPERCASE1!")).toBe("lowercase");
    expect(validateAdminPassword("alllowercase1!")).toBe("uppercase");
    expect(validateAdminPassword("NoDigitsHere!!")).toBe("digit");
    expect(validateAdminPassword("NoSymbolsHere1")).toBe("symbol");
    expect(validateAdminPassword("StrongPassword1!")).toBeNull();
  });
});

describe("privacy and retention controls", () => {
  it("normalizes only safe legacy public slip paths", () => {
    expect(
      getLegacySlipPath(
        "https://x.supabase.co/storage/v1/object/public/slips/a%2Fb.jpg"
      )
    ).toBe("a/b.jpg");
    expect(
      getLegacySlipPath(
        "https://x.supabase.co/storage/v1/object/sign/slips/a.jpg"
      )
    ).toBeNull();
    expect(
      getLegacySlipPath(
        "https://x.supabase.co/storage/v1/object/public/slips/%2e%2e/a.jpg"
      )
    ).toBeNull();
    expect(getLegacySlipPath("not-a-url")).toBeNull();
  });

  it("uses fail-closed production retention values", () => {
    expect(CUSTOMER_DATA_RETENTION_DAYS).toBe(365);
    expect(ORPHAN_SLIP_RETENTION_HOURS).toBe(720);
    expect(parseOrphanSlipRetentionHours("720")).toBe(720);
    expect(parseOrphanSlipRetentionHours("23")).toBeNull();
    expect(parseOrphanSlipRetentionHours("8761")).toBeNull();
    expect(parseOrphanSlipRetentionHours("720.5")).toBeNull();
    expect(parseOrphanSlipRetentionHours(720)).toBeNull();
  });

  it("accepts only the configured retention safety range", () => {
    expect(parseCustomerDataRetentionDays("")).toBeNull();
    expect(parseCustomerDataRetentionDays("364")).toBeNull();
    expect(parseCustomerDataRetentionDays("730")).toBe(730);
    expect(parseCustomerDataRetentionDays("3651")).toBeNull();
    expect(parseCustomerDataRetentionDays("730.5")).toBeNull();
  });

  it("requires the current privacy notice version on booking input", () => {
    expect(PRIVACY_NOTICE_VERSION).toBe("2026-07-20");

    const input = {
      bookingDate: addDaysToDateKey(getBangkokDateKey(), 1),
      period: "morning",
      startTime: "07:00",
      endTime: "10:00",
      hours: "3",
      graduates: "1",
      fullname: "Test Customer",
      phone: "0812345678",
      line: "",
      facebook: "",
      university: "Test University",
      faculty: "Test Faculty",
      note: "",
    };

    expect(bookingInputSchema.safeParse(input).success).toBe(false);
    expect(
      bookingInputSchema.safeParse({
        ...input,
        privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
      }).success
    ).toBe(true);
  });
});

describe("booking notification configuration", () => {
  it("falls back to the operational webhook when the booking webhook is absent", () => {
    expect(
      selectBookingNotificationWebhook({
        DISCORD_WEBHOOK_URL: "https://discord.example/booking",
        OPERATIONAL_ALERT_WEBHOOK_URL: "https://discord.example/operations",
      })
    ).toBe("https://discord.example/booking");
    expect(
      selectBookingNotificationWebhook({
        OPERATIONAL_ALERT_WEBHOOK_URL: "https://discord.example/operations",
      })
    ).toBe("https://discord.example/operations");
    expect(selectBookingNotificationWebhook({})).toBeNull();
  });
});

describe("public site URL", () => {
  const original = process.env.NEXT_PUBLIC_SITE_URL;

  afterEach(() => {
    if (original === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = original;
  });

  it("normalizes a safe HTTPS origin", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.com/path";
    expect(getPublicSiteUrl()).toBe("https://example.com");
  });

  it("falls back when the configured URL is unsafe", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "http://example.com";
    expect(getPublicSiteUrl()).toBe("https://grad.jirayufoto.net");
  });
});
