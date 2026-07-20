import { describe, expect, it } from "vitest";
import { buildBookingCreatedMessage } from "@/lib/notifications/format-booking";
import { normalizeRateLimitResult } from "@/lib/security/rate-limit-result";
import { parseAllowedSiteUrl } from "@/lib/site-url";
import { detectValidSlipType } from "@/lib/slip-validation";
import { createCsv, escapeCsvCell } from "@/lib/csv";
import { getClientIpFromHeaders } from "@/lib/security/client-ip";
import {
  normalizeAdminBookingSearch,
  normalizeAdminBookingStatus,
} from "@/lib/admin-booking-filters";

describe("file signatures", () => {
  it("detects JPEG and PNG from magic bytes", async () => {
    const jpeg = Uint8Array.from([0xff, 0xd8, 0xff, 0xdb, 0, 0x43, 0, 1]);
    const png = Uint8Array.from([
      137, 80, 78, 71, 13, 10, 26, 10,
      0, 0, 0, 13, 73, 72, 68, 82,
    ]);
    expect((await detectValidSlipType(jpeg))?.ext).toBe("jpg");
    expect((await detectValidSlipType(png))?.ext).toBe("png");
  });

  it("rejects text that claims to be an image", async () => {
    expect(await detectValidSlipType(new TextEncoder().encode("fake jpg"))).toBeNull();
  });
});

describe("safe external output", () => {
  it("removes control characters and bounds Telegram plain text", () => {
    const message = buildBookingCreatedMessage({
      booking_no: "NF-20260710-0001",
      fullname: `Name\u0000${"x".repeat(5000)}`,
      phone: "0812345678",
      line: null,
      booking_date: "2026-07-10",
      start_time: "07:00",
      end_time: "10:00",
      graduates: 1,
      university: null,
      faculty: null,
      total_price: 4000,
    });
    expect(message).not.toContain("\u0000");
    expect(message).toContain("Booking: NF-20260710-0001");
    expect(message.length).toBeLessThanOrEqual(4000);
  });

  it("allows only expected HTTPS social hosts", () => {
    expect(
      parseAllowedSiteUrl("instagram.com/nimman", new Set(["instagram.com"]))
    ).toBe("https://instagram.com/nimman");
    expect(() =>
      parseAllowedSiteUrl("javascript:alert(1)", new Set(["instagram.com"]))
    ).toThrow();
    expect(() =>
      parseAllowedSiteUrl("https://instagram.com.evil.test", new Set(["instagram.com"]))
    ).toThrow();
  });
});

describe("rate limit decisions", () => {
  it("fails closed for malformed data and preserves retry-after", () => {
    expect(normalizeRateLimitResult(null)).toEqual({ allowed: false, retryAfter: 1 });
    expect(normalizeRateLimitResult([{ allowed: true, retry_after: 99 }])).toEqual({
      allowed: true,
      retryAfter: 0,
    });
    expect(normalizeRateLimitResult({ allowed: false, retry_after: 42 })).toEqual({
      allowed: false,
      retryAfter: 42,
    });
  });

  it("uses the trusted client IP without creating quotas per user-agent", () => {
    const first = new Headers({
      "x-vercel-forwarded-for": "203.0.113.10",
      "user-agent": "agent-one",
    });
    const second = new Headers({
      "x-vercel-forwarded-for": "203.0.113.10",
      "user-agent": "agent-two",
    });

    expect(getClientIpFromHeaders(first)).toBe("203.0.113.10");
    expect(getClientIpFromHeaders(second)).toBe("203.0.113.10");
  });

  it("rejects malformed forwarded addresses", () => {
    expect(
      getClientIpFromHeaders(new Headers({ "x-forwarded-for": "spoofed" }))
    ).toBe("unknown");
  });
});

describe("CSV export security", () => {
  it("neutralizes spreadsheet formulas while preserving CSV quoting", () => {
    expect(escapeCsvCell("=HYPERLINK(\"https://evil.test\")")).toBe(
      '"\'=HYPERLINK(""https://evil.test"")"'
    );
    expect(escapeCsvCell("+1+1")).toBe('"\'+1+1"');
    expect(escapeCsvCell("normal \"name\"")).toBe('"normal ""name"""');
  });

  it("uses CRLF rows for spreadsheet compatibility", () => {
    expect(createCsv(["name"], [["Alice"], ["Bob"]])).toBe(
      '"name"\r\n"Alice"\r\n"Bob"'
    );
  });
});

describe("admin booking filters", () => {
  it("supports every dashboard status and strips query syntax", () => {
    expect(normalizeAdminBookingStatus("draft")).toBe("draft");
    expect(normalizeAdminBookingStatus("unexpected")).toBe("all");
    expect(normalizeAdminBookingSearch("Alice,(status.eq.paid)")).toBe(
      "Alice  status.eq.paid"
    );
  });
});
