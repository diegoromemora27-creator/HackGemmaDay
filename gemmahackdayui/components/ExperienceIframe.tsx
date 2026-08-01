"use client";

import { useEffect, useState } from "react";
import { constructMediaUrl } from "@/lib/api";
import { Loader2 } from "lucide-react";

export function ExperienceIframe({ urlHtml }: { urlHtml: string }) {
  const [iframeHtml, setIframeHtml] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchHtml = async () => {
      try {
        const url = constructMediaUrl(urlHtml);
        const res = await fetch(url, {
          headers: { 'ngrok-skip-browser-warning': 'true' }
        });
        if (!res.ok) throw new Error("Failed to fetch");
        const html = await res.text();
        if (active) setIframeHtml(html);
      } catch (e) {
        console.error("Error fetching iframe html", e);
        if (active) setError(true);
      }
    };
    fetchHtml();
    return () => { active = false; };
  }, [urlHtml]);

  if (error) {
    return <div className="p-4 text-rose-500 bg-rose-50 rounded-xl">No se pudo cargar la experiencia interactiva.</div>;
  }

  return (
    <div className="relative w-full h-[500px] border-4 border-white shadow-sm bg-white rounded-3xl overflow-hidden mt-4">
      {!iframeHtml && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#F5F7FB]">
          <Loader2 className="w-10 h-10 animate-spin text-[#4DA8E1]" />
        </div>
      )}
      {iframeHtml && (
        <iframe
          srcDoc={iframeHtml}
          className="w-full h-full border-none relative z-10 bg-white"
          title="Experiencia de Estudio"
          sandbox="allow-scripts allow-same-origin"
        />
      )}
    </div>
  );
}
