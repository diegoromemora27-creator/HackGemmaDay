"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useStore } from "@/lib/store";

export function UrlGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { baseUrl } = useStore();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated) {
      const storedUrl = localStorage.getItem("scq_base_url");
      if (!storedUrl && !pathname.startsWith("/onboarding/1-conectar")) {
        router.push("/onboarding/1-conectar");
      }
    }
  }, [isHydrated, pathname, router]);

  if (!isHydrated) {
    return null; // Prevents hydration mismatch
  }

  return <>{children}</>;
}
