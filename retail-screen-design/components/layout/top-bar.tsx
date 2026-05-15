"use client";

import { useEffect, useState } from "react";
import { Clock, MapPin, User } from "lucide-react";

export function TopBar() {
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(
        new Intl.DateTimeFormat("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }).format(new Date())
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-card border-b border-border px-6 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>Chi nhánh: <span className="text-foreground font-medium">Quận 1</span></span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span className="font-mono text-foreground">{currentTime}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-foreground">Nguyễn Văn A</p>
          <p className="text-xs text-muted-foreground">Thu ngân</p>
        </div>
        <div className="bg-primary/10 rounded-full p-2">
          <User className="h-5 w-5 text-primary" />
        </div>
      </div>
    </header>
  );
}
