"use client";

import { useState, type RefObject } from "react";
import { Download, Loader2, Share2 } from "lucide-react";
import { toBlob } from "html-to-image";
import type { BookingStatus } from "@/types/booking";

type Props = {
  bookingNo: string;
  status: BookingStatus;
  cardRef: RefObject<HTMLDivElement | null>;
};

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function canShareFile(file: File) {
  if (
    typeof navigator.share !== "function" ||
    typeof navigator.canShare !== "function"
  ) {
    return false;
  }

  try {
    return navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
}

function isMobileDevice() {
  const userAgent = navigator.userAgent;
  const isMobileUserAgent = /Android|iPhone|iPad|iPod/i.test(userAgent);
  const isIPadDesktopMode =
    navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;

  return isMobileUserAgent || isIPadDesktopMode;
}

export default function DownloadBookingConfirmationButton({
  bookingNo,
  status,
  cardRef,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  if (status !== "confirmed") {
    return null;
  }

  const createConfirmation = async () => {
    if (!cardRef.current || loading) return;

    setLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const blob = await toBlob(cardRef.current, {
        width: 1080,
        height: 1350,
        canvasWidth: 1080,
        canvasHeight: 1350,
        pixelRatio: 1,
        skipFonts: true,
        backgroundColor: "#F6F1E8",
      });

      if (!blob) {
        throw new Error("BOOKING_CONFIRMATION_IMAGE_FAILED");
      }

      const filename = `nimman-foto-booking-${bookingNo}.png`;
      const file = new File([blob], filename, { type: "image/png" });

      if (isMobileDevice() && canShareFile(file)) {
        try {
          await navigator.share({
            files: [file],
            title: `ใบยืนยันการจอง ${bookingNo}`,
          });
          setMessage("สร้างใบยืนยันเรียบร้อยแล้ว");
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            setMessage("");
            return;
          }
        }
      }

      downloadBlob(blob, filename);
      setMessage("ดาวน์โหลดใบยืนยันเรียบร้อยแล้ว");
    } catch (error) {
      console.error("Booking confirmation image failed", error);
      setIsError(true);
      setMessage("สร้างใบยืนยันไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-5">
      <button
        type="button"
        disabled={loading}
        onClick={createConfirmation}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-stone-900 bg-stone-900 px-6 py-4 text-sm font-semibold text-white transition hover:bg-white hover:text-stone-900 disabled:cursor-wait disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            กำลังสร้างใบยืนยัน...
          </>
        ) : (
          <>
            <Download size={18} />
            ดาวน์โหลดใบยืนยันการจอง
          </>
        )}
      </button>

      <p className="mt-3 flex items-center justify-center gap-2 text-center text-xs leading-5 text-stone-500">
        <Share2 size={14} />
        บน iPhone สามารถเลือก “บันทึกรูปภาพ” จากเมนูแชร์ได้
      </p>

      {message && (
        <p
          role="status"
          className={`mt-3 text-center text-sm ${
            isError ? "text-rose-600" : "text-emerald-700"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
