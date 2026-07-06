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

  // เวลาเริ่ม / เวลาสิ้นสุด
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
  slipUrl: string;

  status: BookingStatus;
};

export type Booking = {
  id: string;

  booking_no: string;
  booking_date: string;

  period: string;

  start_time: string | null;
  end_time: string | null;

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

export type BookingPackage = {
  id: string;
  name: string;
  title: string;

  hours: 3 | 4;
  graduates: number;

  price: number;
  basePrice: number;
  extraGraduatePrice: number;
};