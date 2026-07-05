import type { BookingPackage } from "@/types/booking";

export const PACKAGES: Record<3 | 4, BookingPackage> = {
  3: {
    id: "half-day",
    name: "Half Day",
    title: "3 ชั่วโมง",
    hours: 3,
    graduates: 1,
    price: 4000,
    basePrice: 4000,
    extraGraduatePrice: 1000,
  },

  4: {
    id: "half-day-plus",
    name: "Half Day Plus",
    title: "4 ชั่วโมง",
    hours: 4,
    graduates: 1,
    price: 4500,
    basePrice: 4500,
    extraGraduatePrice: 1000,
  },
};