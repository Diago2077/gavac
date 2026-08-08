// Recorta una imagen en 4 cuadrantes (arriba-izq, arriba-der, abajo-izq,
// abajo-der) y devuelve cada uno como data URL JPEG. Se usa para mandarle a
// la IA menos garrapatas por imagen a la vez, lo que mejora la precisión del
// conteo respecto a mandar la foto completa de una sola vez.
export async function splitIntoQuadrants(file: File): Promise<string[]> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    const halfW = Math.round(img.naturalWidth / 2);
    const halfH = Math.round(img.naturalHeight / 2);

    const offsets: [number, number][] = [
      [0, 0],
      [halfW, 0],
      [0, halfH],
      [halfW, halfH],
    ];

    return offsets.map(([sx, sy]) => {
      const canvas = document.createElement("canvas");
      canvas.width = halfW;
      canvas.height = halfH;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("No se pudo procesar la imagen.");
      ctx.drawImage(img, sx, sy, halfW, halfH, 0, 0, halfW, halfH);
      return canvas.toDataURL("image/jpeg", 0.85);
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No se pudo cargar la imagen."));
    img.src = src;
  });
}
