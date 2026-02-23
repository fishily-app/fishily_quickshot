export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        resolve(result);
        return;
      }
      reject(new Error("Expected a data URL string from FileReader."));
    };

    reader.onerror = () =>
      reject(reader.error ?? new Error("Failed to read file"));

    reader.readAsDataURL(file);
  });
}

export async function exportSvgToPng(
  svgEl: SVGSVGElement,
  fileName = "export.png",
  options?: { scale?: number },
): Promise<void> {
  const scale = options?.scale ?? 1;

  const svgText = new XMLSerializer().serializeToString(svgEl);

  const svgBlob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  try {
    const img = await loadImage(url);

    const vb = svgEl.viewBox?.baseVal;
    const width = vb?.width
      ? Math.round(vb.width)
      : Math.round(svgEl.clientWidth);
    const height = vb?.height
      ? Math.round(vb.height)
      : Math.round(svgEl.clientHeight);

    if (!width || !height) {
      throw new Error("Could not determine SVG export size. Add a viewBox.");
    }

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No 2D canvas context");

    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.imageSmoothingEnabled = true;

    ctx.drawImage(img, 0, 0, width, height);

    const pngBlob = await canvasToBlob(canvas, "image/png");

    downloadBlob(pngBlob, fileName);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image for export"));
    img.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Export failed"))),
      type,
    );
  });
}

function downloadBlob(blob: Blob, fileName: string): void {
  const a = document.createElement("a");
  const href = URL.createObjectURL(blob);
  a.href = href;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(href);
}
