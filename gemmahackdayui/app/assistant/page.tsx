"use client";

import { useState, useRef, useEffect } from "react";
import { useStore, useAppMode } from "@/lib/store";
import { createAssistantMessage } from "@/lib/experience";
import { toast } from "sonner";
import { Send, Loader2, Bot, UserCircle2, Mic, HelpCircle, Volume2, PlusCircle } from "lucide-react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function AssistantPage() {
  const { profile } = useStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const appMode = useAppMode();
  const isElderly = appMode === "senior";
  const isChild = appMode === "child";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleSend = async (text: string = inputText) => {
    if (!text.trim() || isLoading) return;

    const userMsg = text.trim();
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setInputText("");
    setIsLoading(true);

    try {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      const result = await createAssistantMessage({ mensaje: userMsg }, signal);
      setMessages(prev => [...prev, { role: "assistant", content: result.respuesta }]);
    } catch (e: any) {
      if (e.message !== "Cancelado") {
        toast.error(e.message || "Error al comunicarse con el asistente");
        setMessages(prev => [...prev, { role: "assistant", content: "Lo siento, hubo un error al procesar tu solicitud." }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setInputText("");
  };

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

  // --- CHILD MODE UI ---
  if (isChild) {
    if (typeof window !== "undefined") {
      window.location.href = "/estudiar";
    }
    return <div className="p-8 text-center text-slate-500">Redirigiendo a tu espacio de estudio...</div>;
  }

  // --- REGULAR & ELDERLY MODE UI (Preserved) ---
  const primaryBg = isElderly ? "bg-teal-700 hover:bg-teal-800" : "bg-indigo-600 hover:bg-indigo-700";
  const primaryText = isElderly ? "text-teal-800" : "text-indigo-700";
  const primaryIcon = isElderly ? "text-teal-700" : "text-indigo-500";
  const userBubbleBg = isElderly ? "bg-teal-50 text-teal-950 border border-teal-200" : "bg-indigo-100 text-indigo-900";
  const botBubbleBg = "bg-white border border-slate-200 text-slate-800 shadow-sm";
  const appBg = isElderly ? "bg-stone-100" : "bg-slate-50/50";

  return (
    <div className={`flex flex-col h-[calc(100vh-2rem)] p-4 md:p-8 animate-in fade-in duration-500 ${isElderly ? 'scale-100 origin-top bg-stone-50' : ''}`}>
      <div className="flex justify-between items-start mb-6 shrink-0">
        <div>
          <h1 className={`font-extrabold mb-2 ${isElderly ? 'text-4xl text-stone-900' : 'text-3xl text-indigo-950'}`}>Asistente de Estudio</h1>
          <p className={`${isElderly ? 'text-xl text-stone-600 font-medium' : 'text-base text-slate-500'}`}>Pregúntame cualquier duda general.</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 bg-white border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden rounded-3xl">
        {/* Chat Messages */}
        <div className={`flex-1 overflow-y-auto p-6 md:p-10 space-y-6 ${appBg}`}>
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-slate-400">
              <Bot className={`w-16 h-16 ${primaryIcon} opacity-50 mb-2`} />
              <p className={`text-lg font-medium text-slate-500`}>Soy tu Asistente Inteligente</p>
              <p className={`max-w-sm text-sm`}>Escribe abajo tu pregunta y te ayudaré con respuestas claras y herramientas en vivo.</p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${msg.role === "user" ? userBubbleBg : "bg-slate-100 text-slate-500"}`}>
                {msg.role === "user" ? <UserCircle2 className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
              </div>
              <div className={`max-w-[80%] rounded-2xl p-4 whitespace-pre-wrap ${msg.role === "user" ? userBubbleBg : botBubbleBg} ${isElderly ? 'text-xl text-stone-800 font-medium' : 'text-base'}`}>
                {msg.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-4">
              <div className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 text-slate-500">
                <Bot className="w-6 h-6" />
              </div>
              <div className={`rounded-2xl p-4 flex items-center gap-3 ${botBubbleBg}`}>
                <Loader2 className={`w-5 h-5 animate-spin ${primaryIcon}`} />
                <span className={`text-sm ${primaryText} font-medium animate-pulse`}>Pensando...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className={`p-4 md:p-6 bg-white border-t border-slate-100 shrink-0 ${isElderly ? 'pb-8 bg-stone-100' : ''}`}>
          <div className="flex gap-3 items-end">
            <div className={`flex-1 bg-white border-2 border-slate-200 rounded-3xl overflow-hidden transition-all flex flex-col ${isElderly ? 'shadow-md border-teal-300 focus-within:ring-teal-500/50 focus-within:border-teal-500' : 'focus-within:ring-indigo-500/50 focus-within:border-indigo-500'}`}>
              <textarea
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={isElderly ? "Presiona aquí para escribir..." : "Escribe tu mensaje..."}
                className={`w-full bg-transparent px-4 py-4 text-slate-800 placeholder:text-slate-400 focus:outline-none resize-none ${isElderly ? 'text-xl min-h-[100px] font-medium' : 'text-base'}`}
                rows={isElderly ? 3 : 2}
              />
            </div>
            <button
              onClick={() => handleSend()}
              disabled={isLoading || !inputText.trim()}
              className={`shrink-0 flex items-center justify-center transition-all shadow-lg disabled:opacity-50 ${isElderly
                  ? 'w-20 h-20 rounded-3xl bg-teal-700 hover:bg-teal-800 text-white shadow-teal-700/30 font-bold'
                  : `w-14 h-14 rounded-2xl ${primaryBg} text-white shadow-indigo-600/20`
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
