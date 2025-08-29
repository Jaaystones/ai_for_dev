"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera } from "lucide-react";

// html5-qrcode does not depend on React version
interface QRScannerProps {
  onScan: (data: string | null) => void;
  onClose: () => void;
  className?: string;
}

export function QRScanner({ onScan, onClose, className }: QRScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (!scannerRef.current) return;
    const qrCode = new Html5Qrcode(scannerRef.current.id);
    html5QrCodeRef.current = qrCode;
    qrCode
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        (decodedText) => {
          if (typeof onScan === 'function') onScan(decodedText);
          qrCode.stop();
        },
        (err) => setError(err)
      )
      .catch((err) => setError(err?.message || "Camera error"));
    return () => {
      qrCode.stop().catch(() => {});
      qrCode.clear();
    };
  }, [onScan]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Scan QR Code
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div id="qr-scanner" ref={scannerRef} style={{ width: "100%", minHeight: 250 }} />
        {error && <div className="text-red-600 mt-2 text-sm">{error}</div>}
        <Button onClick={onClose} variant="ghost" className="mt-4 w-full">Close Scanner</Button>
      </CardContent>
    </Card>
  );
}
