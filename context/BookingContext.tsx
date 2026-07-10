"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

import type { BookingData } from "@/types/booking";

type BookingContextType = {
  booking: BookingData;
  setBooking: React.Dispatch<React.SetStateAction<BookingData>>;
};

type StoredBookingData = Omit<Partial<BookingData>, "date"> & {
  date?: string | null;
};

const BookingContext = createContext<BookingContextType | null>(null);

const initialBooking: BookingData = {
  date: null,
  period: null,

  startTime: null,
  endTime: null,

  hours: 3,
  graduates: 1,

  fullname: "",
  phone: "",
  line: "",
  facebook: "",

  university: "",
  faculty: "",
  note: "",

  totalPrice: 0,

  depositAmount: 1000,
  remainingAmount: 0,

  slipUrl: "",

  status: "draft",
};

export function BookingProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [booking, setBooking] = useState<BookingData>(initialBooking);
  const [hasLoadedSavedBooking, setHasLoadedSavedBooking] = useState(false);

  useEffect(() => {
    const loadSavedBooking = window.setTimeout(() => {
      const saved = localStorage.getItem("booking");

      if (saved) {
        try {
          const data = JSON.parse(saved) as StoredBookingData;
          const totalPrice = data.totalPrice ?? 0;
          const depositAmount = data.depositAmount ?? 1000;
          const remainingAmount =
            data.remainingAmount ?? Math.max(totalPrice - depositAmount, 0);

          setBooking({
            ...initialBooking,
            ...data,
            date: data.date ? new Date(data.date) : null,
            startTime: data.startTime ?? null,
            endTime: data.endTime ?? null,
            depositAmount,
            remainingAmount,
          });
        } catch (error) {
          console.error("Invalid saved booking data:", error);
          localStorage.removeItem("booking");
        }
      }

      setHasLoadedSavedBooking(true);
    }, 0);

    return () => window.clearTimeout(loadSavedBooking);
  }, []);

  useEffect(() => {
    if (!hasLoadedSavedBooking) return;
    localStorage.setItem("booking", JSON.stringify(booking));
  }, [booking, hasLoadedSavedBooking]);

  return (
    <BookingContext.Provider value={{ booking, setBooking }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);

  if (!context) {
    throw new Error("useBooking must be used inside BookingProvider");
  }

  return context;
}
