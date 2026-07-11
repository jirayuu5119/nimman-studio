"use client";

import { QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Props = {
  bookingUrl: string;
};

export default function BookingQrDialog({ bookingUrl }: Props) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-full border border-stone-300 bg-white px-6 py-4 text-sm font-semibold tracking-[0.12em] text-stone-700 transition hover:border-stone-900 hover:bg-stone-50"
          />
        }
      >
        <QrCode size={18} />
        แสดง QR Code
      </DialogTrigger>

      <DialogContent className="max-w-[22rem] gap-5 rounded-2xl border border-stone-200 bg-[#f8f5f0] p-6 shadow-2xl">
        <DialogHeader className="pr-8 text-center">
          <DialogTitle className="text-lg font-semibold text-stone-900">
            QR Code สำหรับจองคิว
          </DialogTitle>
          <DialogDescription className="leading-6 text-stone-500">
            ให้ลูกค้าคนอื่นสแกนเพื่อเปิดหน้าเริ่มจองคิว
          </DialogDescription>
        </DialogHeader>

        <div className="mx-auto rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <QRCodeSVG
            value={bookingUrl}
            size={220}
            level="H"
            marginSize={2}
            title="QR Code หน้าเริ่มจองคิว Nimman Foto"
          />
        </div>

        <p className="break-all text-center text-xs leading-5 text-stone-500">
          {bookingUrl}
        </p>
      </DialogContent>
    </Dialog>
  );
}
