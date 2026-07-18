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

describe("privacy and retention controls", () => {
  it("accepts only the configured retention safety range", () => {
    expect(parseCustomerDataRetentionDays("")).toBeNull();
    expect(parseCustomerDataRetentionDays("364")).toBeNull();
    expect(parseCustomerDataRetentionDays("730")).toBe(730);
    expect(parseCustomerDataRetentionDays("3651")).toBeNull();
    expect(parseCustomerDataRetentionDays("730.5")).toBeNull();
  });

  it("requires the current privacy notice version on booking input", () => {
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
