import QRCode from "qrcode";
import { useMemo } from "react";

/** Código QR dibujado como un solo trazo SVG (sin HTML inyectado). */
export function QrCode({ text, size = 180, label }: { readonly text: string; readonly size?: number; readonly label: string }) {
  const { path, modules } = useMemo(() => {
    const code = QRCode.create(text, { errorCorrectionLevel: "M" });
    const n = code.modules.size;
    const parts: string[] = [];
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        if (code.modules.get(x, y)) parts.push(`M${x} ${y}h1v1h-1z`);
      }
    }
    return { path: parts.join(""), modules: n };
  }, [text]);

  return (
    <svg className="qr" viewBox={`-2 -2 ${modules + 4} ${modules + 4}`} width={size} height={size} role="img" aria-label={label}>
      <rect x={-2} y={-2} width={modules + 4} height={modules + 4} fill="#fff" />
      <path d={path} fill="#1f2430" />
    </svg>
  );
}
