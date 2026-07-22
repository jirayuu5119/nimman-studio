import { beforeEach, describe, expect, it, vi } from "vitest";
import { INITIAL_RESET_CALENDAR_DAY_STATE } from "@/lib/admin-calendar";

const doubles = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  rpc: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/require-admin", () => ({
  requireAdmin: doubles.requireAdmin,
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ rpc: doubles.rpc }),
}));
vi.mock("next/cache", () => ({
  revalidatePath: doubles.revalidatePath,
}));

import { resetCalendarDay } from "@/app/admin/actions";

function resetForm(date: string) {
  const formData = new FormData();
  formData.set("bookingDate", date);
  return formData;
}

describe("resetCalendarDay", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    doubles.requireAdmin.mockResolvedValue({
      userId: "00000000-0000-4000-8000-000000000001",
    });
  });

  it("reopens all administrator blocks for the date", async () => {
    doubles.rpc.mockResolvedValue({ data: 2, error: null });

    await expect(
      resetCalendarDay(
        INITIAL_RESET_CALENDAR_DAY_STATE,
        resetForm("2027-12-01")
      )
    ).resolves.toEqual({
      status: "success",
      message: "เปิดคิวทั้งวันเรียบร้อยแล้ว",
    });
    expect(doubles.rpc).toHaveBeenCalledWith("reset_booking_day_atomic", {
      p_booking_date: "2027-12-01",
      p_actor_user_id: "00000000-0000-4000-8000-000000000001",
    });
    expect(doubles.revalidatePath).toHaveBeenCalledWith("/admin/calendar");
  });

  it("rejects an invalid admin calendar date before the RPC", async () => {
    await expect(
      resetCalendarDay(
        INITIAL_RESET_CALENDAR_DAY_STATE,
        resetForm("2101-01-01")
      )
    ).resolves.toEqual({
      status: "error",
      message: "วันที่สำหรับเปิดคิวไม่ถูกต้อง",
    });
    expect(doubles.rpc).not.toHaveBeenCalled();
  });

  it("returns an inline error when the RPC fails", async () => {
    doubles.rpc.mockResolvedValue({
      data: null,
      error: {
        code: "XX000",
        message: "database failure",
        details: "",
        hint: "",
      },
    });

    await expect(
      resetCalendarDay(
        INITIAL_RESET_CALENDAR_DAY_STATE,
        resetForm("2027-12-01")
      )
    ).resolves.toEqual({
      status: "error",
      message: "เปิดคิวไม่สำเร็จ กรุณาลองอีกครั้ง",
    });
    expect(doubles.revalidatePath).not.toHaveBeenCalled();
  });
});

