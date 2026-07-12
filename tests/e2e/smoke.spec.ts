import { test, expect, request as requestFactory } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { addDaysToDateKey, getBangkokDateKey } from "@/lib/booking-rules";

test.skip(!process.env.RUN_E2E, "Set RUN_E2E=1 to run browser smoke tests");

test.beforeAll(async () => {
  if (process.env.E2E_BASE_URL) return;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("Local E2E requires Supabase server configuration");
  }

  const client = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await client
    .from("api_rate_limits")
    .delete()
    .in("scope", ["booking-create", "booking-lookup", "booking-status"]);
  if (error) throw error;
});

test("public booking landing page is reachable", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.ok()).toBeTruthy();
});

test("booking page is reachable and admin is protected", async ({ page }) => {
  await page.goto("/booking");
  await expect(page).toHaveURL(/\/booking$/);

  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login$/);
});

test("booking APIs reject malformed input", async ({ request }) => {
  const lookup = await request.post("/api/bookings/lookup", {
    data: { bookingNo: "invalid", phone: "invalid" },
  });
  expect(lookup.status()).toBe(400);

  const create = await request.post("/api/bookings/create", {
    multipart: { fullname: "Incomplete" },
  });
  expect(create.status()).toBe(400);
});

test("customer can create, view, look up, and cannot double-book a slot", async ({
  request,
}) => {
  test.skip(
    Boolean(process.env.E2E_BASE_URL),
    "The data-creating flow runs only against the disposable local database"
  );

  const availability = await request.get("/api/bookings/availability");
  expect(availability.ok()).toBeTruthy();
  const occupied = new Set(
    ((await availability.json()) as { booking_date: string; period: string }[])
      .map((slot) => `${slot.booking_date}:${slot.period}`)
  );

  let bookingDate = "";
  let period: "morning" | "afternoon" = "morning";
  for (let day = 1; day <= 30 && !bookingDate; day++) {
    const candidate = addDaysToDateKey(getBangkokDateKey(), day);
    for (const candidatePeriod of ["morning", "afternoon"] as const) {
      if (!occupied.has(`${candidate}:${candidatePeriod}`)) {
        bookingDate = candidate;
        period = candidatePeriod;
        break;
      }
    }
  }
  expect(bookingDate).not.toBe("");

  const slot = period === "morning"
    ? { startTime: "07:00", endTime: "10:00" }
    : { startTime: "13:00", endTime: "16:00" };
  const multipart = {
    bookingDate,
    period,
    startTime: slot.startTime,
    endTime: slot.endTime,
    hours: "3",
    graduates: "1",
    fullname: "E2E Customer",
    phone: "0812345678",
    line: "",
    facebook: "",
    university: "Chiang Mai University",
    faculty: "Test Faculty",
    note: "Automated local test",
    slip: {
      name: "slip.png",
      mimeType: "image/png",
      buffer: Buffer.from([
        137, 80, 78, 71, 13, 10, 26, 10,
        0, 0, 0, 13, 73, 72, 68, 82,
      ]),
    },
  };

  const created = await request.post("/api/bookings/create", { multipart });
  expect(created.status()).toBe(201);
  const createdBody = (await created.json()) as { bookingNo: string };
  expect(createdBody.bookingNo).toMatch(/^NF-\d{8}-\d{4}$/);

  const status = await request.get(
    `/api/bookings/status?bookingNo=${encodeURIComponent(createdBody.bookingNo)}`
  );
  expect(status.status()).toBe(200);
  await expect(status.json()).resolves.toMatchObject({
    booking: { booking_no: createdBody.bookingNo, status: "pending" },
  });

  const duplicate = await request.post("/api/bookings/create", { multipart });
  expect(duplicate.status()).toBe(409);

  const lookupClient = await requestFactory.newContext({
    baseURL: "http://127.0.0.1:3100",
  });
  try {
    const lookup = await lookupClient.post("/api/bookings/lookup", {
      data: { bookingNo: createdBody.bookingNo, phone: "0812345678" },
    });
    expect(lookup.status()).toBe(200);

    const lookedUpStatus = await lookupClient.get(
      `/api/bookings/status?bookingNo=${encodeURIComponent(createdBody.bookingNo)}`
    );
    expect(lookedUpStatus.status()).toBe(200);
  } finally {
    await lookupClient.dispose();
  }
});
