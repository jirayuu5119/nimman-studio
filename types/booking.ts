export type BookingPeriod = "morning" | "afternoon";

export type BookingStatus =
  | "draft"
  | "pending"
  | "paid"
  | "confirmed"
  | "completed"
  | "cancelled";

export interface BookingData {
  date: Date | null;
  period: BookingPeriod | null;

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
}

export interface BookingPackage {
  title: string;
  hours: 3 | 4;
  basePrice: number;
  extraGraduatePrice: number;
}