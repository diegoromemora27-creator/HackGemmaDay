"use client";

import { useState, useRef, useEffect } from "react";
import { useStore } from "@/lib/store";
import { request, constructMediaUrl } from "@/lib/api";
import { VoiceAssistantPlayer } from "@/components/VoiceAssistantPlayer";
import { createExperience, createExperienceAudio } from "@/lib/experience";
import { toast } from "sonner";
import {
  Send,
  Loader2,
  UserCircle2,
  Settings2,
  Sparkles,
  BookOpen,
  Headphones,
  Mic,
  Square
} from "lucide-react";

export default function EstudiarPage() {
  const { profile, topics } = useStore();
  const [promptText, setPromptText] = useState("");
  const [contextText, setContextText] = useState("");

  const [isGenerating, setIsGenerating] = useState(false);
  const [experienceData, setExperienceData] = useState<any>(null);

  // Audio state
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const chips = [
    "Explícamelo fácil",
    "Ponme ejemplos",
    "Crea una lección detallada",
    "Hazme un quiz",
  ];

  const userName = profile?.nombre || "amig@";

  const handleAskText = async (forcePrompt?: string) => {
    const textToUse = forcePrompt || promptText;
    if (!textToUse.trim()) return;

    setIsGenerating(true);
    setExperienceData(null);
    setAudioBlob(null);

    try {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      const payload: any = {
        instruccion: textToUse,
        contexto_extra: contextText
      };

      // Send a subtema if topics exist to use it as context
      if (topics.length > 0) {
        payload.subtema = topics[0].subtema;
      }

      const data = await createExperience(payload, signal);
      setExperienceData(data);
    } catch (e: any) {
      if (e.message !== "Cancelado") {
        toast.error(e.message || "Error al generar experiencia");
      }
    } finally {
      setIsGenerating(false);
      setPromptText("");
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
        // Automatically submit the audio once stopped
        submitAudioExperience(blob);
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

  const submitAudioExperience = async (blobToSubmit: Blob) => {
    setIsGenerating(true);
    setExperienceData(null);
    try {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      const fd = new FormData();
      fd.append("audio", blobToSubmit, "pregunta.webm");
      if (contextText) {
        fd.append("contexto_extra", contextText);
      }
      if (topics.length > 0) {
        fd.append("subtema", topics[0].subtema);
      }

      const data = await createExperienceAudio(fd, signal);
      setExperienceData(data);
      toast.success("Experiencia generada desde tu voz");
    } catch (e: any) {
      if (e.message !== "Cancelado") {
        toast.error(e.message || "Error procesando el audio");
      }
    } finally {
      setIsGenerating(false);
      setAudioBlob(null);
    }
  };

  const isElderly = profile?.grupo_etario === "adulto_mayor";
  const baseTextClass = isElderly ? "text-lg" : "text-sm";
  const composerTextClass = isElderly ? "text-lg" : "text-base";

  // Dynamic color palette
  const primaryColor = isElderly ? "teal" : "indigo";
  const primaryDark = isElderly ? "text-teal-950" : "text-indigo-950";
  const primaryText = isElderly ? "text-teal-700" : "text-indigo-700";
  const primaryIcon = isElderly ? "text-teal-600" : "text-indigo-500";
  const primaryBg = isElderly ? "bg-teal-600 hover:bg-teal-700" : "bg-indigo-600 hover:bg-indigo-700";
  const primaryLightBg = isElderly ? "bg-teal-50" : "bg-indigo-50";
  const primaryLightBorder = isElderly ? "border-teal-100" : "border-indigo-100";
  const focusRing = isElderly ? "focus-within:ring-teal-500/50 focus-within:border-teal-500" : "focus-within:ring-indigo-500/50 focus-within:border-indigo-500";
  const shadowPrimary = isElderly ? "shadow-teal-600/20" : "shadow-indigo-600/20";
  const badgeBg = isElderly ? "bg-teal-100" : "bg-indigo-100";

  return (
    <div className={`flex flex-col h-[calc(100vh-2rem)] p-4 md:p-8 animate-in fade-in duration-500 ${isElderly ? 'scale-100 origin-top bg-[#f4f7f6]' : ''}`}>

      {/* Header & Profile Dock */}
      <div className="flex justify-between items-start mb-8 shrink-0">
        <div>
          <h1 className={`font-extrabold ${primaryDark} mb-2 ${isElderly ? 'text-4xl' : 'text-3xl'}`}>Hola {userName}, ¿qué quieres aprender hoy?</h1>
          <p className={`text-slate-500 ${isElderly ? 'text-xl' : 'text-base'}`}>Pídele a Gemma cómo quieres estudiar en este momento.</p>
        </div>

        {/* Profile Summary Dock removed as requested */}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 bg-white border border-slate-200 rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden">

        {/* Output Area */}
        <div className={`flex-1 overflow-y-auto p-6 md:p-10 ${isElderly ? 'bg-stone-50' : 'bg-slate-50/50'}`}>
          {!experienceData && !isGenerating ? (
            isElderly ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-8 text-stone-600">
                <Sparkles className={`w-20 h-20 text-teal-500 opacity-50 mb-4`} />
                <h2 className="text-3xl font-bold text-teal-800">¡Gemma está lista para ayudarte!</h2>

                <div className="bg-white p-8 rounded-3xl shadow-lg border border-teal-100 max-w-xl w-full text-left space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="bg-teal-100 text-teal-700 w-12 h-12 rounded-full flex items-center justify-center font-bold text-2xl shrink-0">1</div>
                    <p className="text-xl font-medium text-stone-700">Toca un botón de abajo o escribe tu pregunta.</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="bg-teal-100 text-teal-700 w-12 h-12 rounded-full flex items-center justify-center font-bold text-2xl shrink-0">2</div>
                    <p className="text-xl font-medium text-stone-700">Presiona el botón azul grande para enviar.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-slate-400">
                <Sparkles className={`w-16 h-16 ${primaryIcon} opacity-50 mb-2`} />
                <p className="text-lg text-slate-500 font-medium">Gemma está lista para ayudarte</p>
                <p className="text-sm max-w-sm">Dime exactamente cómo quieres estudiar hoy (ej. "Escríbeme un cuento sobre la mitosis" o "Ponme ejemplos de integrales").</p>
              </div>
            )
          ) : isGenerating ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
              <Loader2 className={`w-12 h-12 animate-spin ${primaryIcon}`} />
              <p className={`${primaryText} font-bold text-lg animate-pulse`}>Gemma está elaborando tu experiencia...</p>
              <p className="text-slate-500 text-sm text-center max-w-md">
                Kaggle está procesando todo. Esto puede tomar varios minutos si el tema es complejo. Por favor, no cierres esta ventana.
              </p>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4">

              <div className="flex items-center gap-3 mb-2">
                <BookOpen className={`w-8 h-8 ${primaryIcon}`} />
                <h2 className="text-2xl font-bold text-slate-800">{experienceData.titulo || "Tu Experiencia"}</h2>
              </div>
              <div className="text-sm text-slate-500 flex items-center gap-2 mb-6">
                <span className={`px-3 py-1 ${badgeBg} ${primaryText} rounded-full font-medium capitalize`}>
                  {experienceData.tipo_experiencia || "Lección"}
                </span>
                {experienceData.transcripcion && (
                  <span className="italic">" {experienceData.transcripcion} "</span>
                )}
              </div>

              {experienceData.url_audio && (
                <div className="mb-6">
                  <VoiceAssistantPlayer 
                    src={constructMediaUrl(experienceData.url_audio)} 
                    autoPlay={true} 
                    title={experienceData.tipo_experiencia}
                  />
                </div>
              )}

              {experienceData.url_html ? (
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-inner bg-white h-[600px] w-full">
                  <iframe
                    src={constructMediaUrl(experienceData.url_html)}
                    className="w-full h-full border-none"
                    title="Experiencia de Estudio"
                    sandbox="allow-scripts allow-same-origin"
                  />
                </div>
              ) : (
                <div className={`p-6 bg-white border border-slate-200 rounded-2xl shadow-sm text-slate-700 leading-relaxed whitespace-pre-wrap ${isElderly ? 'text-xl' : ''}`}>
                  {experienceData.contenido_texto}
                </div>
              )}

            </div>
          )}
        </div>

        {/* Input Area (Composer) */}
        <div className={`p-4 md:p-6 bg-white border-t border-slate-100 shrink-0 ${isElderly ? 'pb-8 bg-stone-50' : ''}`}>

          {isElderly ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {chips.map((chip, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setPromptText(chip);
                    handleAskText(chip);
                  }}
                  className="px-6 py-4 bg-white hover:bg-teal-50 border-2 border-teal-200 text-teal-800 text-xl font-medium rounded-2xl shadow-sm transition-all text-left flex items-center gap-3"
                >
                  <Sparkles className="w-6 h-6 text-teal-500 opacity-60 shrink-0" />
                  {chip}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-4 hide-scrollbar">
              {chips.map((chip, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setPromptText(chip);
                    handleAskText(chip);
                  }}
                  className="whitespace-nowrap px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-medium rounded-full transition-colors text-sm"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-3 items-end">
            <div className={`flex-1 bg-white border-2 border-slate-200 rounded-3xl overflow-hidden transition-all flex flex-col ${focusRing} ${isElderly ? 'shadow-md border-teal-200' : ''}`}>
              {!isElderly && (
                <input
                  type="text"
                  placeholder="Contexto opcional (ej: para un examen de mañana, o nivel niño)"
                  value={contextText}
                  onChange={e => setContextText(e.target.value)}
                  className="w-full bg-transparent px-4 py-2 text-slate-500 border-b border-slate-200/50 focus:outline-none text-sm"
                />
              )}
              <div className="flex items-end p-1">
                <textarea
                  value={promptText}
                  onChange={e => setPromptText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAskText();
                    }
                  }}
                  placeholder={isElderly ? "Escribe aquí lo que necesitas..." : "Escribe tu instrucción o haz tu pregunta aquí..."}
                  className={`flex-1 bg-transparent px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none resize-none ${composerTextClass} ${isElderly ? 'min-h-[80px]' : ''}`}
                  rows={isElderly ? 3 : 2}
                />
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`mb-2 mr-2 shrink-0 flex items-center justify-center transition-colors ${isElderly ? 'w-14 h-14 rounded-2xl bg-teal-100 text-teal-700 hover:bg-teal-200' : 'w-10 h-10 rounded-xl bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'
                    } ${isRecording
                      ? "bg-rose-100 text-rose-500 animate-pulse border-2 border-rose-200"
                      : ""
                    }`}
                  title="Hablar instrucción"
                >
                  {isRecording ? <Square className={isElderly ? 'w-8 h-8' : 'w-5 h-5'} /> : <Mic className={isElderly ? 'w-8 h-8' : 'w-5 h-5'} />}
                </button>
              </div>
            </div>
            <button
              onClick={() => handleAskText()}
              disabled={isGenerating || (!promptText.trim() && !isRecording)}
              className={`shrink-0 flex items-center justify-center transition-all shadow-lg disabled:opacity-50 ${isElderly
                  ? 'w-20 h-20 rounded-3xl bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/30'
                  : `w-14 h-14 rounded-2xl ${primaryBg} text-white ${shadowPrimary}`
                }`}
            >
              <Send className={`${isElderly ? 'w-10 h-10' : 'w-6 h-6'} ml-1`} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
