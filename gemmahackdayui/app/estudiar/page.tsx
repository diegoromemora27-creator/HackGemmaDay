"use client";

import { useState, useRef, useEffect } from "react";
import { useStore, useAppMode } from "@/lib/store";
import { constructMediaUrl } from "@/lib/api";
import { VoiceAssistantPlayer } from "@/components/VoiceAssistantPlayer";
import { ExperienceIframe } from "@/components/ExperienceIframe";
import { createExperience, createExperienceAudio, createAssistantMessage, createAssistantMessageAudio } from "@/lib/experience";
import { toast } from "sonner";
import {
  Send,
  Loader2,
  Sparkles,
  BookOpen,
  Mic,
  Square,
  PlusCircle,
  HelpCircle,
  Volume2
} from "lucide-react";

type ChatBubble = {
  role: "user" | "assistant";
  content?: string;
  audioUrl?: string;
  experience?: any;
};

export default function EstudiarPage() {
  const { profile, topics } = useStore();
  const [promptText, setPromptText] = useState("");
  const [contextText, setContextText] = useState("");

  const [isGenerating, setIsGenerating] = useState(false);
  const [experienceData, setExperienceData] = useState<any>(null);
  const [iframeHtml, setIframeHtml] = useState<string | null>(null);

  // Chat State (Shared by Child and Senior Mode)
  const [chatMessages, setChatMessages] = useState<ChatBubble[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Audio state
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const appMode = useAppMode();
  const isElderly = appMode === "senior";
  const isChild = appMode === "child";

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isGenerating]);

  // Regular Experience Iframe Fetcher
  useEffect(() => {
    if (experienceData?.url_html && !isChild && !isElderly) {
      const fetchHtml = async () => {
        try {
          const url = constructMediaUrl(experienceData.url_html);
          const res = await fetch(url, {
            headers: { 'ngrok-skip-browser-warning': 'true' }
          });
          const html = await res.text();
          setIframeHtml(html);
        } catch (e) {
          console.error("Error fetching iframe html", e);
        }
      };
      fetchHtml();
    } else {
      setIframeHtml(null);
    }
  }, [experienceData?.url_html, isChild, isElderly]);

  const userName = profile?.nombre || "amig@";

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      window.speechSynthesis.speak(utterance);
    } else {
      toast.error("Tu navegador no soporta lectura en voz alta.");
    }
  };

  const handleAskText = async (forcePrompt?: string) => {
    const textToUse = forcePrompt || promptText;
    if (!textToUse.trim()) return;

    if (isChild || isElderly) {
      setChatMessages(prev => [...prev, { role: "user", content: textToUse }]);
      setPromptText("");
    }

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

      if (topics.length > 0) {
        payload.subtema = topics[0].subtema;
      }

      let data: any;
      const experienceKeywords = ["aprender", "jugar", "lección", "quiz"];
      const forceExperience = experienceKeywords.some(kw => textToUse.toLowerCase().includes(kw));

      if ((isChild || isElderly) && !forceExperience) {
        const result = await createAssistantMessage({ mensaje: textToUse }, signal);
        data = {
          titulo: "Respuesta",
          contenido_texto: result.respuesta
        };
      } else {
        data = await createExperience(payload, signal);
      }
      
      if (isChild || isElderly) {
        setChatMessages(prev => [...prev, { role: "assistant", experience: data }]);
      } else {
        setExperienceData(data);
      }
    } catch (e: any) {
      if (e.message !== "Cancelado") {
        toast.error(e.message || "Error al generar experiencia");
      }
    } finally {
      setIsGenerating(false);
      if (!isChild && !isElderly) setPromptText("");
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
    if (isChild || isElderly) {
      const audioUrl = URL.createObjectURL(blobToSubmit);
      setChatMessages(prev => [...prev, { role: "user", audioUrl }]);
    }

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

      let data: any;
      if (isChild || isElderly) {
        const result = await createAssistantMessageAudio(fd, signal);
        data = {
          titulo: "Respuesta",
          contenido_texto: result.respuesta,
          transcripcion: result.transcripcion
        };
      } else {
        data = await createExperienceAudio(fd, signal);
      }
      
      if (isChild || isElderly) {
        setChatMessages(prev => [...prev, { role: "assistant", experience: data }]);
      } else {
        setExperienceData(data);
      }
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

  // --- SENIOR MODE UI ---
  if (isElderly) {
    const handleNewChat = () => {
      setChatMessages([]);
      setPromptText("");
    };

    const handleBack = () => {
      if (isRecording) {
        stopRecording();
      } else {
        handleNewChat(); // En este caso, ir atrás limpia la vista principal por seguridad cognitiva
      }
    };

    const suggestionButtons = [
      "Hacer una pregunta",
      "Escuchar información",
      "Pedir ayuda"
    ];

    return (
      <div className="flex flex-col h-[calc(100vh-2rem)] bg-white animate-in fade-in duration-500 overflow-hidden">
        {/* Zona 1: Encabezado */}
        <div className="flex items-center justify-between p-4 md:p-6 bg-slate-50 border-b-4 border-slate-200 shrink-0 z-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">Asistente</h1>
          </div>
          <div className="flex gap-4">
             <button 
               onClick={handleNewChat} 
               className="flex items-center gap-2 px-6 py-4 rounded-xl text-white bg-blue-900 hover:bg-blue-800 transition-colors shadow-sm"
             >
               <span className="text-xl md:text-2xl font-bold">🏠 Inicio</span>
             </button>
             <button 
               onClick={handleBack} 
               className="flex items-center gap-2 px-6 py-4 rounded-xl text-slate-900 bg-white border-4 border-slate-300 hover:bg-slate-100 transition-colors shadow-sm"
             >
               <span className="text-xl md:text-2xl font-bold">⬅️ Atrás</span>
             </button>
             <button 
               onClick={() => toast.success("Puedes escribir o usar el botón 'Hablar' para recibir ayuda.")}
               className="hidden md:flex items-center gap-2 px-6 py-4 rounded-xl text-white bg-blue-900 hover:bg-blue-800 transition-colors shadow-sm"
             >
               <span className="text-xl font-bold">❓ Ayuda</span>
             </button>
          </div>
        </div>

        {/* Zona 2: Área de Conversación */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 bg-white">
          {chatMessages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-8 max-w-4xl mx-auto py-10">
              <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 leading-tight">
                Hola, estoy aquí para ayudarte. Puedes escribir, hablar o elegir una opción.
              </h2>
            </div>
          )}

          {chatMessages.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
              {msg.role === "user" ? (
                <div className="bg-slate-100 text-slate-900 border-4 border-slate-300 rounded-2xl p-6 text-2xl md:text-3xl font-bold max-w-[90%] md:max-w-[75%] shadow-sm">
                  {msg.content && <span>{msg.content}</span>}
                  {msg.audioUrl && (
                    <audio src={msg.audioUrl} controls className="h-16 mt-4 w-full max-w-md" />
                  )}
                </div>
              ) : (
                <div className="w-full max-w-4xl bg-white text-slate-900 border-4 border-blue-900 shadow-md rounded-2xl p-6 md:p-8 space-y-6">
                  <div className="flex items-center gap-4">
                    <h2 className="text-3xl font-extrabold text-blue-900">{msg.experience?.titulo || "Respuesta"}</h2>
                  </div>

                  <p className="text-2xl md:text-3xl font-medium leading-relaxed">{msg.experience?.contenido_texto}</p>

                  <button 
                    onClick={() => speakText(msg.experience?.contenido_texto || "Contenido no disponible para leer.")}
                    className="mt-6 flex items-center justify-center gap-4 w-full bg-blue-50 hover:bg-blue-100 text-blue-900 px-6 py-6 rounded-xl shadow-sm font-bold border-4 border-blue-200 transition-colors"
                  >
                    <Volume2 className="w-10 h-10" />
                    <span className="text-2xl font-extrabold">🔊 Escuchar respuesta</span>
                  </button>

                  {msg.experience?.url_audio && (
                    <div className="mt-8 p-4 bg-slate-50 border-4 border-slate-200 rounded-xl">
                      <p className="text-2xl font-bold mb-4 text-slate-700">Audio generado:</p>
                      <VoiceAssistantPlayer 
                        src={constructMediaUrl(msg.experience.url_audio)} 
                        autoPlay={true} 
                        title={msg.experience.tipo_experiencia}
                      />
                    </div>
                  )}

                  {msg.experience?.url_html && (
                    <div className="mt-8 border-4 border-blue-900 rounded-xl overflow-hidden">
                      <ExperienceIframe urlHtml={msg.experience.url_html} />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {isGenerating && (
            <div className="flex items-start">
              <div className="bg-white border-4 border-blue-900 shadow-md rounded-2xl p-6 flex items-center gap-6">
                <Loader2 className="w-12 h-12 animate-spin text-blue-900" />
                <span className="text-2xl font-bold text-slate-700">Procesando información...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Zona 3: Sugerencias */}
        {chatMessages.length === 0 && !isGenerating && (
          <div className="p-6 shrink-0 bg-slate-50 border-t-4 border-slate-200">
             <div className="flex flex-col gap-4 max-w-4xl mx-auto">
               {suggestionButtons.map((btn, i) => (
                 <button
                   key={i}
                   onClick={() => handleAskText(btn)}
                   className="w-full px-8 py-6 bg-white hover:bg-slate-100 text-slate-900 text-3xl font-extrabold rounded-2xl shadow-sm border-4 border-slate-300 text-center transition-colors"
                 >
                   {btn}
                 </button>
               ))}
             </div>
          </div>
        )}

        {/* Zona 4: Caja de Entrada */}
        <div className="p-6 shrink-0 bg-white border-t-4 border-slate-200 z-10 relative shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
          <div className="flex flex-col lg:flex-row gap-4 max-w-5xl mx-auto">
            <textarea
              value={promptText}
              onChange={e => setPromptText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAskText();
                }
              }}
              placeholder={isRecording ? "Grabando voz..." : "Escriba aquí..."}
              disabled={isRecording}
              className={`flex-1 bg-slate-50 border-4 rounded-2xl px-6 py-6 text-slate-900 placeholder:text-slate-500 focus:outline-none resize-none text-2xl font-bold min-h-[100px] transition-colors ${isRecording ? 'border-rose-600 bg-rose-50' : 'border-slate-300 focus:border-blue-900 focus:bg-white'}`}
              rows={2}
            />
            
            <div className="flex flex-col sm:flex-row gap-4 shrink-0">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isGenerating && !isRecording}
                className={`flex-1 flex items-center justify-center gap-3 px-10 py-6 rounded-2xl text-white font-extrabold text-2xl transition-all shadow-md
                  ${isRecording 
                    ? "bg-rose-600 hover:bg-rose-700 animate-pulse border-4 border-rose-800" 
                    : "bg-slate-800 hover:bg-slate-900 border-4 border-slate-900"}`
                }
              >
                {isRecording ? (
                  <>
                    <Square className="w-8 h-8" />
                    <span>Detener</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-8 h-8" />
                    <span>Hablar</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleAskText()}
                disabled={isGenerating || isRecording || !promptText.trim()}
                className="flex-1 flex items-center justify-center gap-3 px-10 py-6 rounded-2xl bg-blue-900 hover:bg-blue-800 text-white shadow-md border-4 border-blue-900 disabled:opacity-50 transition-colors font-extrabold text-2xl"
              >
                <span>Enviar</span>
                <Send className="w-8 h-8" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- CHILD MODE UI ---
  if (isChild) {
    const isAstronaut = profile?.nombre?.toLowerCase().includes("astro") || false;
    const Mascot = () => <span className="text-4xl md:text-5xl">{isAstronaut ? "🧑‍🚀" : "🤖"}</span>;
    
    const suggestionChips = [
      "Quiero aprender",
      "Quiero jugar",
      "Quiero preguntar"
    ];

    const handleNewChat = () => {
      setChatMessages([]);
      setPromptText("");
    };

    return (
      <div className="flex flex-col h-[calc(100vh-2rem)] bg-[#F5F7FB] animate-in fade-in duration-500 overflow-hidden">
        {/* Zona 1: Encabezado */}
        <div className="flex items-center justify-between p-4 md:p-6 bg-white shadow-sm shrink-0 rounded-b-[2rem] z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#F5F7FB] rounded-full flex items-center justify-center shadow-inner border-2 border-[#6EC6E4]">
              <Mascot />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Gemma Bot</h1>
              <p className="text-sm font-bold text-[#4DA8E1]">¡Tu compañera de estudio!</p>
            </div>
          </div>
          <div className="flex gap-2 md:gap-4">
             <button 
               onClick={handleNewChat} 
               className="flex flex-col items-center justify-center p-2 rounded-2xl text-[#4DA8E1] hover:bg-[#F5F7FB] transition-colors"
             >
               <PlusCircle className="w-8 h-8 mb-1" />
               <span className="text-xs font-bold hidden md:inline">Nuevo</span>
             </button>
             <button 
               onClick={() => toast.success("¡Escribe o usa el micrófono para hablar con Gemma!")}
               className="flex flex-col items-center justify-center p-2 rounded-2xl text-[#FF8C42] hover:bg-orange-50 transition-colors"
             >
               <HelpCircle className="w-8 h-8 mb-1" />
               <span className="text-xs font-bold hidden md:inline">Ayuda</span>
             </button>
          </div>
        </div>

        {/* Zona 2: Área de Conversación */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8">
          {chatMessages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
              <div className="animate-bounce">
                <Mascot />
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-[#4DA8E1]">¡Hola {userName}!</h2>
              <p className="text-2xl font-bold text-slate-600">¿Qué quieres hacer hoy?</p>
            </div>
          )}

          {chatMessages.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
              {msg.role === "user" ? (
                <div className="bg-[#4DA8E1] text-white rounded-3xl rounded-tr-sm p-5 md:p-6 text-xl md:text-2xl font-bold shadow-sm max-w-[90%] md:max-w-[75%]">
                  {msg.content && <span>{msg.content}</span>}
                  {msg.audioUrl && (
                    <audio src={msg.audioUrl} controls className="h-10 mt-2 rounded-full" />
                  )}
                </div>
              ) : (
                <div className="w-full max-w-4xl bg-white text-slate-700 border-4 border-white shadow-[0_4px_15px_rgba(0,0,0,0.05)] rounded-3xl rounded-tl-sm p-5 md:p-8 space-y-4">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-8 h-8 text-[#4DA8E1]" />
                    <h2 className="text-2xl font-black text-slate-800">{msg.experience?.titulo || "Respuesta"}</h2>
                  </div>
                  
                  {msg.experience?.transcripcion && (
                    <div className="text-sm font-bold text-[#FF8C42] bg-orange-50 p-3 rounded-xl italic">
                      " {msg.experience.transcripcion} "
                    </div>
                  )}

                  <p className="text-xl font-medium leading-relaxed">{msg.experience?.contenido_texto}</p>
                  
                  <button 
                    onClick={() => speakText(msg.experience?.contenido_texto || "")}
                    className="mt-4 flex items-center justify-center gap-2 w-full max-w-[200px] text-[#FF8C42] bg-orange-50 hover:bg-orange-100 px-4 py-3 rounded-full shadow-sm font-bold border-2 border-orange-200 transition-colors"
                  >
                    <Volume2 className="w-5 h-5" />
                    <span>Escuchar</span>
                  </button>

                  {msg.experience?.url_audio && (
                    <div className="mt-4">
                      <VoiceAssistantPlayer 
                        src={constructMediaUrl(msg.experience.url_audio)} 
                        autoPlay={true} 
                        title={msg.experience.tipo_experiencia}
                      />
                    </div>
                  )}

                  {msg.experience?.url_html && (
                    <ExperienceIframe urlHtml={msg.experience.url_html} />
                  )}
                </div>
              )}
            </div>
          ))}

          {isGenerating && (
            <div className="flex items-start">
              <div className="bg-white border-4 border-white shadow-[0_4px_15px_rgba(0,0,0,0.05)] rounded-3xl rounded-tl-sm p-6 flex items-center gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-[#4DA8E1]" />
                <span className="text-xl font-bold text-slate-500 animate-pulse">Gemma está creando una experiencia para ti...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Zona 3: Sugerencias */}
        {chatMessages.length === 0 && !isGenerating && (
          <div className="px-4 py-2 shrink-0">
             <div className="flex flex-wrap justify-center gap-3 md:gap-4 max-w-2xl mx-auto">
               {suggestionChips.map((chip, i) => (
                 <button
                   key={i}
                   onClick={() => handleAskText(chip)}
                   className="px-6 py-4 bg-[#F9D74C] hover:bg-[#FFEB3B] text-slate-800 text-lg md:text-xl font-extrabold rounded-full shadow-sm transition-transform hover:scale-105 border-b-4 border-yellow-500 active:translate-y-1 active:border-b-0"
                 >
                   {chip}
                 </button>
               ))}
             </div>
          </div>
        )}

        {/* Zona 4: Caja de Entrada */}
        <div className="p-4 md:p-6 shrink-0 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-10 relative">
          <div className="flex items-end gap-3 md:gap-4 max-w-4xl mx-auto">
            <div className={`flex-1 bg-[#F5F7FB] border-4 border-slate-100 focus-within:border-[#4DA8E1] focus-within:bg-white rounded-[2rem] overflow-hidden transition-all flex flex-col shadow-inner ${isRecording ? 'border-[#FF4F4F] shadow-red-100' : ''}`}>
              <textarea
                value={promptText}
                onChange={e => setPromptText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAskText();
                  }
                }}
                placeholder={isRecording ? "Grabando voz..." : "Escribe o toca el micrófono..."}
                disabled={isRecording}
                className="w-full bg-transparent px-6 py-5 text-slate-800 placeholder:text-slate-400 focus:outline-none resize-none text-xl md:text-2xl font-bold min-h-[80px]"
                rows={1}
              />
            </div>
            
            <button
              onClick={() => handleAskText()}
              disabled={isGenerating || isRecording || !promptText.trim()}
              className="shrink-0 flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#4DA8E1] hover:bg-[#3b93cc] text-white shadow-lg shadow-blue-200 disabled:opacity-50 transition-transform active:scale-95"
            >
              <Send className="w-8 h-8 md:w-10 md:h-10 ml-1" />
            </button>
            
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isGenerating && !isRecording}
              className={`shrink-0 flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full text-white shadow-lg transition-transform active:scale-95 disabled:opacity-50
                ${isRecording ? "bg-rose-600 animate-pulse border-4 border-rose-300" : "bg-[#FF4F4F] hover:bg-[#e64646] shadow-red-200"}`
              }
            >
              {isRecording ? <Square className="w-8 h-8 md:w-10 md:h-10" /> : <Mic className="w-8 h-8 md:w-10 md:h-10" />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- REGULAR MODE UI (Preserved) ---
  const chips = [
    "Explícamelo fácil",
    "Ponme ejemplos",
    "Crea una lección detallada",
    "Hazme un quiz",
  ];

  return (
    <div className={`flex flex-col h-[calc(100vh-2rem)] p-4 md:p-8 animate-in fade-in duration-500`}>

      {/* Header */}
      <div className="flex justify-between items-start mb-8 shrink-0">
        <div>
          <h1 className="font-extrabold text-indigo-950 mb-2 text-3xl">Hola {userName}, ¿qué quieres aprender hoy?</h1>
          <p className="text-slate-500 text-base">Pídele a Gemma cómo quieres estudiar en este momento.</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-h-0 bg-white border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden rounded-3xl`}>

        {/* Output Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-slate-50/50">
          {!experienceData && !isGenerating ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-slate-400">
              <Sparkles className="w-16 h-16 text-indigo-500 opacity-50 mb-2" />
              <p className="text-lg text-slate-500 font-medium">Gemma está lista para ayudarte</p>
              <p className="text-sm max-w-sm">Dime exactamente cómo quieres estudiar hoy (ej. "Escríbeme un cuento sobre la mitosis" o "Ponme ejemplos de integrales").</p>
            </div>
          ) : isGenerating ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
              <p className="text-indigo-700 font-bold text-lg animate-pulse">Gemma está elaborando tu experiencia...</p>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4">

              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="w-8 h-8 text-indigo-500" />
                <h2 className="text-2xl font-bold text-slate-800">{experienceData.titulo || "Tu Experiencia"}</h2>
              </div>
              <div className="text-sm text-slate-500 flex items-center gap-2 mb-6">
                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full font-medium capitalize">
                  {experienceData.tipo_experiencia || "Lección"}
                </span>
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
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-inner bg-white h-[600px] w-full relative">
                  {!iframeHtml && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
                      <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                    </div>
                  )}
                  {iframeHtml && (
                    <iframe
                      srcDoc={iframeHtml}
                      className="w-full h-full border-none relative z-10"
                      title="Experiencia de Estudio"
                      sandbox="allow-scripts allow-same-origin"
                    />
                  )}
                </div>
              ) : (
                <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {experienceData.contenido_texto}
                </div>
              )}

            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-white border-t border-slate-100 shrink-0">
          <div className="flex gap-2 overflow-x-auto pb-4 hide-scrollbar">
            {chips.map((chip, i) => (
              <button
                key={i}
                onClick={() => {
                  setPromptText(chip);
                  handleAskText(chip);
                }}
                className="whitespace-nowrap px-4 py-2 border font-medium transition-colors text-sm bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600 rounded-full"
              >
                {chip}
              </button>
            ))}
          </div>

          <div className="flex gap-3 items-end">
            <div className="flex-1 bg-white border-2 border-slate-200 rounded-3xl overflow-hidden transition-all flex flex-col focus-within:ring-indigo-500/50 focus-within:border-indigo-500">
              <input
                type="text"
                placeholder="Contexto opcional (ej: para un examen de mañana, o nivel niño)"
                value={contextText}
                onChange={e => setContextText(e.target.value)}
                className="w-full bg-transparent px-4 py-2 text-slate-500 border-b border-slate-200/50 focus:outline-none text-sm"
              />
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
                  placeholder="Escribe tu instrucción o haz tu pregunta aquí..."
                  className="flex-1 bg-transparent px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none resize-none text-base"
                  rows={2}
                />
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`mb-2 mr-2 shrink-0 flex items-center justify-center transition-colors w-10 h-10 rounded-xl bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 ${isRecording ? "bg-rose-100 text-rose-500 animate-pulse border-2 border-rose-200" : ""}`}
                >
                  {isRecording ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <button
              onClick={() => handleAskText()}
              disabled={isGenerating || (!promptText.trim() && !isRecording)}
              className="shrink-0 flex items-center justify-center transition-all shadow-lg disabled:opacity-50 w-14 h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20"
            >
              <Send className="w-6 h-6 ml-1" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
