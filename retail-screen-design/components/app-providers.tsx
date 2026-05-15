"use client";

import { Toaster } from "@/components/ui/sonner";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster richColors position="top-center" />
      <div
        id="printHost"
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", top: 0, width: "72mm" }}
      />
    </>
  );
}
