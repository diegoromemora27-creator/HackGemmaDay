"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { Loader2 } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { baseUrl, profile, topics, hasNotes } = useStore();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    // Redirection logic for onboarding
    const storedUrl = localStorage.getItem("scq_base_url");
    
    if (!storedUrl) {
      router.push("/onboarding/1-conectar");
    } else if (!profile) {
      router.push("/onboarding/2-perfil");
    } else if (topics.length === 0 && !hasNotes) {
      // If they haven't uploaded PDF topics AND haven't uploaded notes, they need materials
      router.push("/onboarding/3-materiales");
    } else {
      // Everything is set, go to main study area
      router.push("/estudiar");
    }
  }, [isClient, profile, topics, hasNotes, router]);

  return (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
    </div>
  );
}
