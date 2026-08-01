"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useStore, AppMode } from "@/lib/store";
import { request } from "@/lib/api";
import { toast } from "sonner";
import { VoiceAssistantPlayer } from "@/components/VoiceAssistantPlayer";
import { 
  UserCircle2, 
  Mic, 
  Send, 
  Loader2, 
  Square,
  FileText,
  Sparkles,
  CheckCircle2,
  Brain
} from "lucide-react";

export default function PerfilOnboardingPage() {
  const router = useRouter();
  const { setProfile } = useStore();
  const [mode, setMode] = useState<"choose" | "edit_text" | "edit_audio">("choose");
  const [hasShownToast, setHasShownToast] = useState(false);

  useEffect(() => {
    if (!hasShownToast) {
      toast.success("¡Conectado exitosamente al modelo Gemma!");
      setHasShownToast(true);
    }
  }, [hasShownToast]);
  
  // Text mode state
  const [textInput, setTextInput] = useState("");
  
  // Audio mode state
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  
  // Submission & Transition state
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Profile Mirror state
  const [pendingProfile, setPendingProfile] = useState<any>(null);
  const [transcription, setTranscription] = useState<string | null>(null);

  const confirmProfile = () => {
    setProfile(pendingProfile);
    router.push("/onboarding/3-materiales");
  };

  const handleSubmitText = async () => {
    if (!textInput.trim()) return toast.error("Por favor, escribe algo sobre ti.");
    setIsSubmitting(true);
    try {
      const res = await request("/profile/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto: textInput }),
      });
      const data = await res.json();
      setIsSubmitting(false);
      setPendingProfile(data);
      setTranscription(textInput);
    } catch (e: any) {
      setIsSubmitting(false);
      toast.error(e.message || "Error al crear el perfil");
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.start();
      mediaRecorder.current = recorder;
      setIsRecording(true);
    } catch (e) {
      toast.error("No se pudo acceder al micrófono");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
    }
  };

  const handleSubmitAudio = async () => {
    if (!audioBlob) return toast.error("Graba un audio primero");
    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("audio", audioBlob, "perfil.webm");
      // Explicitly set false to save time, as we don't display the transcription
      fd.append("incluir_transcripcion", "false");

      const res = await request("/profile/audio", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      setIsSubmitting(false);
      setPendingProfile(data.perfil);
      setTranscription(data.transcripcion ?? null);
    } catch (e: any) {
      setIsSubmitting(false);
      toast.error(e.message || "Error procesando el audio");
    }
  };

  if (isSubmitting) {
    return (
      <div className="flex flex-col items-center justify-center pt-24 animate-in fade-in duration-500">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-indigo-200 rounded-full blur-xl animate-pulse"></div>
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center relative z-10 shadow-lg border border-indigo-100 text-indigo-500">
            <Sparkles className="w-10 h-10 animate-bounce" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-3">
          {mode === "edit_audio" ? "Analizando tu entrevista..." : "Conociéndote..."}
        </h2>
        <p className="text-slate-500 text-center max-w-md">
          {mode === "edit_audio" 
            ? "Gemma 4 está escuchando y procesando tu audio. Esto puede tardar unos momentos, ¡gracias por tu paciencia!" 
            : "Gemma está analizando lo que le contaste."}
        </p>
        
        <div className="w-64 h-2 bg-slate-200 rounded-full mt-8 overflow-hidden">
          <div className="h-full bg-indigo-500 rounded-full animate-[progress_2s_ease-in-out_infinite]" style={{ width: '40%' }}></div>
        </div>
      </div>
    );
  }

  // Profile Mirror (Interacción 4)
  if (pendingProfile) {
    const group = pendingProfile.grupo_etario?.toLowerCase() || '';
    const needs = pendingProfile.necesidades_especiales?.toLowerCase() || '';
    const isSenior = group.includes('adulto') || group.includes('adulto_mayor') || needs.includes('simple') || needs.includes('grandes');
    const isChild = group.includes('niño') || group.includes('nino') || group.includes('niña') || group.includes('infantil') || group.includes('primaria') || group.includes('pequeño') || group.includes('pequeno');
    
    const primaryBg = isSenior ? "bg-teal-700 hover:bg-teal-800" : isChild ? "bg-sky-500 hover:bg-sky-600" : "bg-indigo-600 hover:bg-indigo-700";
    const primaryLight = isSenior ? "bg-teal-100 text-teal-700" : isChild ? "bg-amber-100 text-amber-600" : "bg-indigo-100 text-indigo-600";
    const secondaryLight = isSenior ? "bg-stone-200 text-stone-700" : isChild ? "bg-sky-100 text-sky-600" : "bg-emerald-100 text-emerald-600";
    const shadowPrimary = isSenior ? "shadow-teal-700/30" : isChild ? "shadow-sky-500/40" : "shadow-indigo-600/20";
    
    return (
      <div className={`max-w-xl mx-auto pt-12 animate-in fade-in duration-500 ${isSenior ? 'scale-100' : ''}`}>
        <h2 className={`text-3xl font-extrabold mb-2 text-center ${isSenior ? 'text-stone-900' : isChild ? 'text-4xl text-sky-600 font-black tracking-tight' : 'text-slate-900'}`}>Entendí esto de ti</h2>
        <p className={`text-center mb-8 ${isSenior ? 'text-stone-600 text-xl font-medium' : isChild ? 'text-amber-600 font-bold text-lg' : 'text-slate-500'}`}>Verifica si Gemma capturó bien tu esencia.</p>
        
        <div className={`bg-white p-8 border shadow-xl mb-8 space-y-6 ${isSenior ? 'rounded-2xl border-stone-200 shadow-stone-200/50' : isChild ? 'rounded-[2.5rem] border-sky-100 border-4 shadow-sky-100/50' : 'rounded-3xl border-slate-200 shadow-slate-200/50'}`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${primaryLight}`}>
              <UserCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className={`text-sm font-medium uppercase tracking-wider ${isSenior ? 'text-stone-500' : isChild ? 'text-sky-500 font-bold' : 'text-slate-500'}`}>Nombre</p>
              <p className={`text-xl font-bold ${isSenior ? 'text-stone-800' : isChild ? 'text-sky-900' : 'text-slate-800'}`}>{pendingProfile.nombre || 'Estudiante'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${secondaryLight}`}>
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <p className={`text-sm font-medium uppercase tracking-wider ${isSenior ? 'text-stone-500' : isChild ? 'text-sky-500 font-bold' : 'text-slate-500'}`}>Meta principal</p>
              <p className={`text-lg font-medium ${isSenior ? 'text-stone-800' : isChild ? 'text-sky-900 font-bold' : 'text-slate-800'}`}>{pendingProfile.objetivo_principal || pendingProfile.objetivo || 'Aprender'}</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <button
            onClick={confirmProfile}
            className={`w-full py-4 text-white rounded-2xl font-bold transition-colors shadow-md text-lg flex justify-center items-center gap-2 ${primaryBg} ${shadowPrimary} ${isChild ? 'rounded-[2rem] text-xl py-5 hover:-translate-y-1' : ''}`}
          >
            <CheckCircle2 className={`${isChild ? 'w-7 h-7' : 'w-5 h-5'}`} /> ¡Sí, {isChild ? 'soy yo' : isSenior ? 'continuar' : 'soy yo! Continuar'}
          </button>
          <button
            onClick={() => {
              setPendingProfile(null);
              setTranscription(null);
              setAudioBlob(null);
              setMode("choose");
            }}
            className={`w-full py-4 bg-white border border-slate-200 text-slate-600 font-bold transition-colors text-lg ${isChild ? 'rounded-[2rem] hover:bg-slate-50' : 'rounded-2xl hover:bg-slate-50'}`}
          >
            No, volver a intentarlo
          </button>
        </div>
      </div>
    );
  }

  // Interacción 1 y 2
  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-8">
      
      {mode === "choose" ? (
        <>
          <div className="text-center mb-12">
            <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">¿Cómo quieres empezar?</h1>
            <p className="text-slate-500 text-lg">Cuéntale a Gemma un poco sobre ti, cómo te gustaría aprender, o si estás buscando ayuda para ti o para alguien más.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => setMode("edit_audio")}
              className="group flex flex-col items-center justify-center p-8 bg-white border border-slate-200 hover:border-indigo-300 rounded-3xl shadow-xl shadow-slate-200/50 transition-all hover:-translate-y-1"
            >
              <div className="w-20 h-20 bg-indigo-50 text-indigo-500 group-hover:bg-indigo-100 rounded-full flex items-center justify-center mb-4 transition-colors">
                <Mic className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Hablando</h3>
              <p className="text-slate-500 text-center">Usa tu voz para contarle a Gemma sobre ti de forma natural.</p>
            </button>

            <button
              onClick={() => setMode("edit_text")}
              className="group flex flex-col items-center justify-center p-8 bg-white border border-slate-200 hover:border-indigo-300 rounded-3xl shadow-xl shadow-slate-200/50 transition-all hover:-translate-y-1"
            >
              <div className="w-20 h-20 bg-emerald-50 text-emerald-500 group-hover:bg-emerald-100 rounded-full flex items-center justify-center mb-4 transition-colors">
                <FileText className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Escribiendo</h3>
              <p className="text-slate-500 text-center">Escribe un texto breve detallando lo que buscas.</p>
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Cuéntame sobre ti</h1>
            <p className="text-slate-500 text-lg">
              Ejemplo: "Soy José y soy abuelo y quiero ayudar a mi nieto", o "Soy María, estudiante universitaria y necesito repasar".
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl shadow-slate-200/50">
            {mode === "edit_text" ? (
              <div className="space-y-6">
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  className="w-full h-40 bg-slate-50 border border-slate-200 rounded-2xl p-5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none text-lg"
                  placeholder="Escribe aquí..."
                />
                <div className="flex gap-4">
                  <button
                    onClick={() => setMode("choose")}
                    className="py-4 px-6 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-bold transition-colors"
                  >
                    Volver
                  </button>
                  <button
                    onClick={handleSubmitText}
                    className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-colors flex justify-center items-center gap-2 shadow-md shadow-indigo-600/20 text-lg"
                  >
                    <Send className="w-5 h-5" /> Enviar a Gemma
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-8">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`w-32 h-32 rounded-full flex items-center justify-center transition-all ${isRecording ? "bg-rose-100 text-rose-500 shadow-[0_0_40px_rgba(244,63,94,0.3)] animate-pulse border-4 border-rose-200" : "bg-indigo-50 text-indigo-500 hover:bg-indigo-100 border border-indigo-100 shadow-sm"}`}
                >
                  {isRecording ? <Square className="w-10 h-10" /> : <Mic className="w-12 h-12 ml-1" />}
                </button>
                <div className="text-center">
                  <p className="text-lg font-semibold text-slate-700 mb-1">
                    {isRecording ? "Grabando..." : "Pulsa para grabar"}
                  </p>
                  <p className="text-sm text-slate-500">
                    {isRecording ? "Vuelve a pulsar para detener" : "Usa tu voz normal"}
                  </p>
                </div>

                {audioBlob && !isRecording && (
                  <div className="w-full space-y-6 animate-in fade-in zoom-in duration-300">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <VoiceAssistantPlayer src={URL.createObjectURL(audioBlob)} title="Tu grabación" className="w-full" />
                    </div>
                    <div className="flex gap-4">
                      <button
                        onClick={() => { setAudioBlob(null); setMode("choose"); }}
                        className="py-4 px-6 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-bold transition-colors"
                      >
                        Descartar
                      </button>
                      <button
                        onClick={handleSubmitAudio}
                        className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-colors flex justify-center items-center gap-2 shadow-md shadow-indigo-600/20 text-lg"
                      >
                        <Send className="w-5 h-5" /> Analizar Audio
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes progress {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}} />
    </div>
  );
}
