type BookingPackage = {
  id: string;
  name: string;
  title: string;
  hours: 3 | 4;
  basePrice: number;
  extraGraduatePrice: number;
};

export const PACKAGES: Record<3 | 4, BookingPackage> = {
  3: {
    id: "half-day-3h",
    name: "Half Day 3 Hours",
    title: "Half Day 3 Hours",
    hours: 3,
    basePrice: 4000,
    extraGraduatePrice: 1000,
  },

  4: {
    id: "half-day-4h",
    name: "Half Day 4 Hours",
    title: "Half Day 4 Hours",
    hours: 4,
    basePrice: 4500,
    extraGraduatePrice: 1000,
  },
};