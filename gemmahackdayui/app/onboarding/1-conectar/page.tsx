"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { request } from "@/lib/api";
import { toast } from "sonner";
import { Link2, CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function ConectarPage() {
  const router = useRouter();
  const { baseUrl, setBaseUrl } = useStore();
  const [inputUrl, setInputUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [healthData, setHealthData] = useState<any>(null);

  useEffect(() => {
    setInputUrl(baseUrl);
  }, [baseUrl]);

  const handleTestAndSave = async () => {
    let cleanUrl = inputUrl.trim();
    if (!cleanUrl) {
      toast.error("Por favor ingresa una URL válida");
      return;
    }
    
    if (cleanUrl.endsWith("/")) {
      cleanUrl = cleanUrl.slice(0, -1);
    }
    
    // Temporarily save to test
    setBaseUrl(cleanUrl);
    setStatus("testing");
    setHealthData(null);
    
    try {
      const res = await request("/health");
      const data = await res.json();
      
      if (data.status === "ok") {
        setStatus("success");
        setHealthData(data);
        toast.success("¡Conexión exitosa!");
        
        // Advance to step 2 after a short delay
        setTimeout(() => {
          router.push("/onboarding/2-perfil");
        }, 1500);
      } else {
        setStatus("error");
        toast.error("Respuesta inesperada del servidor");
      }
    } catch (error: any) {
      setStatus("error");
      toast.error(error.message || "No se pudo conectar al backend");
    }
  };

  return (
    <div className="max-w-xl mx-auto pt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-indigo-100">
          <Link2 className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">
          Conecta tu backend de Gemma
        </h1>
        <p className="text-slate-500 text-lg">
          Pega aquí tu URL pública de ngrok para enlazar la aplicación con Kaggle y comenzar.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl shadow-slate-200/50">
        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            URL Base
          </label>
          <div className="relative">
            <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="https://xxxx.ngrok-free.app"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-lg"
              onKeyDown={(e) => e.key === 'Enter' && handleTestAndSave()}
            />
          </div>
        </div>

        <button
          onClick={handleTestAndSave}
          disabled={status === "testing" || !inputUrl.trim()}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg transition-all flex justify-center items-center gap-2 disabled:opacity-50 shadow-md shadow-indigo-600/20"
        >
          {status === "testing" ? (
            <><Loader2 className="w-6 h-6 animate-spin" /> Verificando conexión...</>
          ) : status === "success" ? (
            <><CheckCircle2 className="w-6 h-6" /> ¡Conectado!</>
          ) : (
            "Conectar y Continuar"
          )}
        </button>

        {status === "error" && (
          <div className="mt-4 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3 text-rose-600 text-sm">
            <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>No pudimos conectar con la URL proporcionada. Asegúrate de que el backend de Kaggle esté corriendo y que la URL sea correcta (sin slash al final).</p>
          </div>
        )}
      </div>
    </div>
  );
}
