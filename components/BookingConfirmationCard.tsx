"use client";

import { forwardRef } from "react";
import type { BookingConfirmationData } from "@/types/booking";

type Props = {
  booking: BookingConfirmationData;
};

const DEPOSIT_AMOUNT = 1000;
const numberFormatter = new Intl.NumberFormat("th-TH");

function formatThaiDate(value: string) {
  return new Intl.DateTimeFormat("th-TH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function formatIssuedAt(value: string) {
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Bangkok",
  }).format(new Date(value));
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "190px 1fr",
        gap: 20,
        alignItems: "start",
        padding: "10px 0",
        borderBottom: "1px solid #E8DED0",
      }}
    >
      <span style={{ color: "#746F67", fontSize: 20 }}>{label}</span>
      <span
        style={{
          color: "#22211F",
          fontSize: 21,
          fontWeight: 600,
          textAlign: "right",
          lineHeight: 1.35,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function PaymentItem({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div
      style={{
        borderRadius: 16,
        background: emphasized ? "#EEE8DD" : "#FFFCF7",
        padding: "17px 20px",
      }}
    >
      <div style={{ color: "#746F67", fontSize: 16 }}>{label}</div>
      <div
        style={{
          marginTop: 7,
          color: "#22211F",
          fontSize: emphasized ? 27 : 23,
          fontWeight: 700,
        }}
      >
        {value}
      </div>
    </div>
  );
}

const BookingConfirmationCard = forwardRef<HTMLDivElement, Props>(
  function BookingConfirmationCard({ booking }, ref) {
    const remainingAmount = Math.max(
      Number(booking.total_price) - DEPOSIT_AMOUNT,
      0
    );
    const issuedAt = booking.updated_at ?? booking.created_at;
    const shootingTime = [booking.start_time, booking.end_time]
      .filter(Boolean)
      .join(" – ");

    return (
      <div
        ref={ref}
        style={{
          width: 1080,
          height: 1350,
          boxSizing: "border-box",
          overflow: "hidden",
          background: "#F6F1E8",
          color: "#22211F",
          padding: "58px 68px 48px",
          fontFamily:
            "Tahoma, system-ui, -apple-system, 'Leelawadee UI', sans-serif",
        }}
      >
        <header style={{ textAlign: "center" }}>
          <div
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: 50,
              letterSpacing: 4,
              fontWeight: 600,
            }}
          >
            NIMMAN FOTO
          </div>
          <div
            style={{
              marginTop: 9,
              color: "#746F67",
              fontSize: 17,
              letterSpacing: 5,
            }}
          >
            PHOTOGRAPHY BOOKING
          </div>
          <div
            style={{
              width: 110,
              height: 2,
              margin: "25px auto 0",
              background: "#B3915F",
            }}
          />
        </header>

        <section style={{ marginTop: 28, textAlign: "center" }}>
          <span
            style={{
              display: "inline-block",
              border: "1px solid #A8B4A9",
              borderRadius: 999,
              background: "#E7EEE7",
              color: "#506655",
              padding: "10px 28px",
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            ยืนยันการจองแล้ว
          </span>
          <p style={{ margin: "13px 0 0", color: "#746F67", fontSize: 19 }}>
            คิวถ่ายภาพของคุณได้รับการยืนยันเรียบร้อยแล้ว
          </p>
        </section>

        <section
          style={{
            marginTop: 25,
            border: "1px solid #D9CCB9",
            borderRadius: 20,
            background: "#FFFCF7",
            padding: "19px 28px",
            textAlign: "center",
          }}
        >
          <div style={{ color: "#746F67", fontSize: 17 }}>เลขที่การจอง</div>
          <div
            style={{
              marginTop: 5,
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: 34,
              letterSpacing: 2,
              fontWeight: 700,
            }}
          >
            {booking.booking_no}
          </div>
        </section>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 28,
            marginTop: 27,
          }}
        >
          <section>
            <h2 style={{ margin: "0 0 8px", fontSize: 23 }}>ข้อมูลผู้จอง</h2>
            {booking.fullname && (
              <DetailRow label="ชื่อผู้จอง" value={booking.fullname} />
            )}
            {booking.phone && (
              <DetailRow label="เบอร์โทรศัพท์" value={booking.phone} />
            )}
            {booking.university && (
              <DetailRow
                label="มหาวิทยาลัย / สถาบัน"
                value={booking.university}
              />
            )}
            {booking.faculty && (
              <DetailRow label="คณะ" value={booking.faculty} />
            )}
          </section>

          <section>
            <h2 style={{ margin: "0 0 8px", fontSize: 23 }}>
              รายละเอียดการถ่ายภาพ
            </h2>
            <DetailRow
              label="วันที่ถ่ายภาพ"
              value={formatThaiDate(booking.booking_date)}
            />
            {shootingTime && (
              <DetailRow label="ช่วงเวลา" value={`${shootingTime} น.`} />
            )}
            <DetailRow
              label="แพ็กเกจ"
              value={`แพ็กเกจถ่ายภาพ ${booking.hours} ชั่วโมง`}
            />
            <DetailRow
              label="จำนวนบัณฑิต"
              value={`${booking.graduates} คน`}
            />
          </section>
        </div>

        <section
          style={{
            marginTop: 27,
            borderTop: "1px solid #D9CCB9",
            borderBottom: "1px solid #D9CCB9",
            padding: "21px 0",
          }}
        >
          <h2 style={{ margin: "0 0 14px", fontSize: 23 }}>
            รายละเอียดการชำระเงิน
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 18,
            }}
          >
            <PaymentItem
              label="ราคาแพ็กเกจทั้งหมด"
              value={`${numberFormatter.format(booking.total_price)} บาท`}
            />
            <PaymentItem
              label="ชำระมัดจำแล้ว"
              value={`${numberFormatter.format(DEPOSIT_AMOUNT)} บาท`}
            />
            <PaymentItem
              label="ยอดคงเหลือ"
              value={`${numberFormatter.format(remainingAmount)} บาท`}
              emphasized
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 24,
              marginTop: 16,
              color: "#746F67",
              fontSize: 16,
            }}
          >
            <span>กรุณาชำระยอดคงเหลือภายใน 24 ชั่วโมงหลังจบงาน</span>
            <span>โปรดเก็บใบยืนยันนี้ไว้เพื่อใช้เป็นหลักฐาน</span>
          </div>
        </section>

        <section
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 30,
            marginTop: 24,
          }}
        >
          <div>
            <div style={{ fontSize: 18, color: "#746F67" }}>ติดต่อช่างภาพ</div>
            <div style={{ marginTop: 5, fontSize: 25, fontWeight: 700 }}>
              เบอร์ติดต่อ : 092-9455119
            </div>
          </div>
          <p
            style={{
              maxWidth: 430,
              margin: 0,
              color: "#746F67",
              fontSize: 16,
              lineHeight: 1.55,
              textAlign: "right",
            }}
          >
            หากต้องการแก้ไขข้อมูลหรือสอบถามรายละเอียด กรุณาติดต่อช่างภาพโดยตรง
          </p>
        </section>

        <footer
          style={{
            marginTop: 25,
            paddingTop: 19,
            borderTop: "1px solid #D9CCB9",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: 20,
              color: "#B3915F",
            }}
          >
            Thank you for choosing Nimman Foto
          </div>
          <div style={{ marginTop: 7, color: "#746F67", fontSize: 14 }}>
            ใบยืนยันนี้สร้างจากระบบ Nimman Foto Booking · ออกใบยืนยันเมื่อ {formatIssuedAt(issuedAt)} น.
          </div>
        </footer>
      </div>
    );
  }
);

BookingConfirmationCard.displayName = "BookingConfirmationCard";

export default BookingConfirmationCard;
