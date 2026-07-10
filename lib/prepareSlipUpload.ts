const MAX_SLIP_BYTES = 1_500_000;
const MAX_IMAGE_DIMENSION = 1800;

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new window.Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("ไม่สามารถอ่านไฟล์รูปนี้ได้"));
    };

    image.src = objectUrl;
  });
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }

        reject(new Error("ไม่สามารถย่อรูปสลิปได้"));
      },
      "image/jpeg",
      quality
    );
  });
}

function drawImage(
  source: CanvasImageSource,
  width: number,
  height: number
) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("อุปกรณ์นี้ไม่รองรับการย่อรูป");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(source, 0, 0, canvas.width, canvas.height);

  return canvas;
}

export async function prepareSlipUpload(file: File) {
  const canUploadWithoutCompression =
    file.size <= MAX_SLIP_BYTES &&
    ["image/jpeg", "image/png", "image/webp"].includes(file.type);

  if (canUploadWithoutCompression) {
    return file;
  }

  try {
    const image = await loadImage(file);
    const longestSide = Math.max(image.naturalWidth, image.naturalHeight);
    const scale = Math.min(1, MAX_IMAGE_DIMENSION / longestSide);

    let canvas = drawImage(
      image,
      image.naturalWidth * scale,
      image.naturalHeight * scale
    );
    let compressed = await canvasToJpeg(canvas, 0.82);

    for (const quality of [0.72, 0.62, 0.52, 0.42]) {
      if (compressed.size <= MAX_SLIP_BYTES) break;
      compressed = await canvasToJpeg(canvas, quality);
    }

    for (
      let attempt = 0;
      attempt < 3 && compressed.size > MAX_SLIP_BYTES;
      attempt += 1
    ) {
      canvas = drawImage(canvas, canvas.width * 0.8, canvas.height * 0.8);
      compressed = await canvasToJpeg(canvas, 0.72);
    }

    if (compressed.size > MAX_SLIP_BYTES) {
      throw new Error("รูปสลิปยังมีขนาดใหญ่เกินไป");
    }

    const baseName = file.name.replace(/\.[^.]+$/, "") || "payment-slip";

    return new File([compressed], `${baseName}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch (error) {
    console.error("Slip compression error:", error);
    throw new Error(
      "ไม่สามารถเตรียมรูปสลิปนี้ได้ กรุณาแคปหน้าจอสลิปแล้วเลือกรูปที่แคปใหม่"
    );
  }
}
