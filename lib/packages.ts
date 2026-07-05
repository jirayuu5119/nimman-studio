import type { BookingPackage } from "@/types/booking";

export const PACKAGES: Record<
  3 | 4,
  {
    title: string;
    hours: 3 | 4;
    basePrice: number;
    extraGraduatePrice: number;
  }
> = {
  3: {
    title: "3 ชั่วโมง",
    hours: 3,
    basePrice: 4000,
    extraGraduatePrice: 1000,
  },

  4: {
    title: "4 ชั่วโมง",
    hours: 4,
    basePrice: 4500,
    extraGraduatePrice: 1000,
  },
};