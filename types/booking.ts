export type Booking = {
  id: string;

  booking_no: string;
  booking_date: string;

  period: string;
  hours: number;
  graduates: number;

  fullname: string;
  phone: string;
  line: string;
  facebook: string;

  university: string;
  faculty: string;

  note: string;

  total_price: number;

  slip_url: string;

  status: string;

  created_at: string;
  updated_at: string;
};

export type BookingPeriod = "morning" | "afternoon";

export type BookingStatus =
  | "draft"
  | "pending"
  | "paid"
  | "confirmed"
  | "completed"
  | "cancelled";