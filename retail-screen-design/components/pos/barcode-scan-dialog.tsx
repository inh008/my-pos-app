"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ScanLine } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export type ScanMode = "cart" | "product" | "invoice";

interface BarcodeScanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: ScanMode;
  onModeChange: (mode: ScanMode) => void;
  onScan: (code: string) => void;
}

function cameraErrorVi(e: unknown): string {
  const err = e as { name?: string; message?: string };
  const name = err?.name || "";
  const msg = err?.message || "";
  if (name === "NotAllowedError" || /Permission/i.test(msg))
    return "Chưa cấp quyền camera.";
  if (name === "NotFoundError") return "Không thấy camera.";
  if (name === "NotReadableError") return "Camera đang bận.";
  if (name === "SecurityError") return "Cần HTTPS hoặc localhost.";
  return msg || "Không mở được camera.";
}

export function BarcodeScanDialog({
  open,
  onOpenChange,
  mode,
  onModeChange,
  onScan,
}: BarcodeScanDialogProps) {
  const readerId = useId().replace(/:/g, "");
  const scannerRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);
  const [scanning, setScanning] = useState(false);
  const lastScan = useRef("");
  const lastAt = useRef(0);

  const stopCamera = async () => {
    const s = scannerRef.current;
    if (!s) return;
    try {
      if (scanning) await s.stop();
      await s.clear();
    } catch {
      /* ignore */
    }
    scannerRef.current = null;
    setScanning(false);
  };

  const startCamera = async () => {
    if (scanning) return;
    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import(
        "html5-qrcode"
      );
      const formats =
        mode === "invoice"
          ? [Html5QrcodeSupportedFormats.QR_CODE]
          : [
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.EAN_8,
              Html5QrcodeSupportedFormats.UPC_A,
              Html5QrcodeSupportedFormats.UPC_E,
              Html5QrcodeSupportedFormats.CODE_128,
              Html5QrcodeSupportedFormats.CODE_39,
              Html5QrcodeSupportedFormats.ITF,
              ...(mode === "cart" ? [Html5QrcodeSupportedFormats.QR_CODE] : []),
            ];

      const scanner = new Html5Qrcode(readerId);
      scannerRef.current = scanner;
      const config = {
        fps: 10,
        qrbox: { width: 280, height: 200 },
        formatsToSupport: formats,
      };

      const onDecoded = (text: string) => {
        const now = Date.now();
        if (text === lastScan.current && now - lastAt.current < 700) return;
        lastScan.current = text;
        lastAt.current = now;
        onScan(text);
      };

      try {
        await scanner.start(
          { facingMode: "environment" },
          config,
          onDecoded,
          () => {}
        );
      } catch {
        await scanner.start({ facingMode: "user" }, config, onDecoded, () => {});
      }
      setScanning(true);
      toast.success("Camera đang bật");
    } catch (e) {
      toast.error(cameraErrorVi(e));
    }
  };

  useEffect(() => {
    if (!open) stopCamera();
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) stopCamera();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanLine className="h-5 w-5 text-primary" />
            Quét mã vạch / QR
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Select value={mode} onValueChange={(v) => onModeChange(v as ScanMode)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cart">Giỏ hàng — thêm sản phẩm</SelectItem>
              <SelectItem value="product">Tra cứu sản phẩm</SelectItem>
              <SelectItem value="invoice">Hóa đơn nhập kho (QR)</SelectItem>
            </SelectContent>
          </Select>
          <div
            id={readerId}
            className="min-h-[200px] overflow-hidden rounded-xl bg-muted"
          />
          <div className="flex gap-2">
            <Button className="flex-1" onClick={startCamera} disabled={scanning}>
              Bật camera
            </Button>
            <Button variant="outline" onClick={stopCamera} disabled={!scanning}>
              Tắt
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Đổi chế độ trước khi bật camera. Cần localhost hoặc HTTPS.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
