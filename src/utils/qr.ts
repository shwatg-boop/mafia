// Simple SVG QR code generator for room invite links using standard public QR API or pure SVG render
export function getQRCodeUrl(text: string, size = 200): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
    text
  )}&bgcolor=15161c&color=e0e2ec&margin=1`;
}
