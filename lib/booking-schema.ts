import { z } from "zod";
import { isBookableDate, isSupportedTimeSlot } from "@/lib/booking-rules";
import { normalizePhone } from "@/lib/phone";

const noUnsafeControls = /^[^\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]*$/;

function requiredText(label: string, max: number) {
  return z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} is too long`)
    .regex(noUnsafeControls, `${label} contains invalid characters`)
    .transform((value) => value.replace(/\s+/g, " "));
}

function optionalText(max: number) {
  return z
    .string()
    .trim()
    .max(max)
    .regex(noUnsafeControls)
    .transform((value) => value.replace(/\s+/g, " ") || null);
}

export const bookingInputSchema = z
  .object({
    bookingDate: z.string().refine((value) => isBookableDate(value)),
    period: z.enum(["morning", "afternoon"]),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
    hours: z.coerce.number().int().pipe(z.union([z.literal(3), z.literal(4)])),
    graduates: z.coerce.number().int().min(1).max(5),
    fullname: requiredText("fullname", 120),
    phone: requiredText("phone", 30)
      .transform(normalizePhone)
      .pipe(z.string().regex(/^0\d{9}$/)),
    line: optionalText(100),
    facebook: optionalText(200),
    university: optionalText(200),
    faculty: optionalText(200),
    note: optionalText(1000),
  })
  .superRefine((value, context) => {
    if (
      !isSupportedTimeSlot(
        value.period,
        value.hours,
        value.startTime,
        value.endTime
      )
    ) {
      context.addIssue({
        code: "custom",
        path: ["startTime"],
        message: "Unsupported time slot",
      });
    }
  });

export type BookingInput = z.infer<typeof bookingInputSchema>;

export function bookingInputFromFormData(formData: FormData) {
  const read = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" ? value : "";
  };

  return bookingInputSchema.safeParse({
    bookingDate: read("bookingDate"),
    period: read("period"),
    startTime: read("startTime"),
    endTime: read("endTime"),
    hours: read("hours"),
    graduates: read("graduates"),
    fullname: read("fullname"),
    phone: read("phone"),
    line: read("line"),
    facebook: read("facebook"),
    university: read("university"),
    faculty: read("faculty"),
    note: read("note"),
  });
}
