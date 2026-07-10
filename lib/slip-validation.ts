import { fileTypeFromBuffer } from "file-type";

const ALLOWED_SLIP_TYPES = new Map([
  ["jpg", "image/jpeg"],
  ["png", "image/png"],
  ["heic", "image/heic"],
  ["heif", "image/heif"],
]);

export type ValidSlipType = {
  ext: "jpg" | "png" | "heic" | "heif";
  mime: "image/jpeg" | "image/png" | "image/heic" | "image/heif";
};

export async function detectValidSlipType(buffer: Uint8Array) {
  const detected = await fileTypeFromBuffer(buffer);
  const expectedMime = detected ? ALLOWED_SLIP_TYPES.get(detected.ext) : null;
  if (!detected || !expectedMime || detected.mime !== expectedMime) return null;
  return detected as ValidSlipType;
}
