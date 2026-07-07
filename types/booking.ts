export type BookingPeriod = "morning" | "afternoon";

export type BookingStatus =
  | "draft"
  | "pending"
  | "paid"
  | "confirmed"
  | "completed"
  | "cancelled";

export type BookingData = {
  date: Date | null;
  period: BookingPeriod | null;

  startTime: string | null;
  endTime: string | null;

  hours: 3 | 4;
  graduates: number;

  fullname: string;
  phone: string;
  line: string;
  facebook: string;

  university: string;
  faculty: string;
  note: string;

  totalPrice: number;
  depositAmount: number;
  remainingAmount: number;

  slipUrl: string;

  status: BookingStatus;
};

export type Booking = {
  id: string;
  booking_no: string;

  booking_date: string;
  period: BookingPeriod;

  start_time: string | null;
  end_time: string | null;

  hours: number;
  graduates: number;

  fullname: string;
  phone: string;
  line: string | null;
  facebook: string | null;

  university: string | null;
  faculty: string | null;
  note: string | null;

  total_price: number;
  deposit_amount: number;
  remaining_amount: number;

  slip_url: string | null;

  status: BookingStatus;

  created_at: string;
  updated_at?: string;
};

export type BlockedSlot = {
  id: string;
  booking_date: string;
  period: BookingPeriod;
  reason: string | null;
  created_at: string;
};

export type AvailabilitySlot = {
  booking_date: string;
  period: BookingPeriod;
  status: BookingStatus | "blocked";
  source?: "booking" | "blocked";
  reason?: string | null;
};
