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
  slipUrl: "",

  status: "draft",
};

export function BookingProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [booking, setBooking] = useState<BookingData>(() => {
    if (typeof window === "undefined") {
      return initialBooking;
    }

    const saved = localStorage.getItem("booking");

    if (!saved) {
      return initialBooking;
    }

    const data = JSON.parse(saved);

    return {
      ...initialBooking,
      ...data,
      date: data.date ? new Date(data.date) : null,
      startTime: data.startTime ?? null,
      endTime: data.endTime ?? null,
    };
  });

  useEffect(() => {
    localStorage.setItem("booking", JSON.stringify(booking));
  }, [booking]);

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