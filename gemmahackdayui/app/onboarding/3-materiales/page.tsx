"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore, useAppMode } from "@/lib/store";
import { request, constructMediaUrl } from "@/lib/api";
import { toast } from "sonner";
import { 
  FileText, 
  Camera, 
  ArrowRight,
  UploadCloud,
  Loader2,
  CheckCircle2,
  Image as ImageIcon
} from "lucide-react";

export default function MaterialesOnboardingPage() {
  const router = useRouter();
  const { profile, setTopics, setHasNotes } = useStore();
  const appMode = useAppMode();
  const isSenior = appMode === 'senior';
  
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  
  const [pdfDone, setPdfDone] = useState(false);
  const [imagesDone, setImagesDone] = useState(false);

  const handlePdfUpload = async () => {
    if (!pdfFile) return;
    setIsProcessingPdf(true);
    try {
      const fd = new FormData();
      fd.append("pdf", pdfFile);
      const res = await request("/curriculum/pdf", { method: "POST", body: fd });
      const data = await res.json();
      setTopics(data.topics);
      setPdfDone(true);
      toast.success("Temario procesado correctamente");
    } catch (e: any) {
      toast.error(e.message || "Error procesando el PDF");
    } finally {
      setIsProcessingPdf(false);
    }
  };

  const [notesAudioUrl, setNotesAudioUrl] = useState<string | null>(null);
  const [notesText, setNotesText] = useState<string | null>(null);

  const handleImageUpload = async () => {
    if (imageFiles.length === 0) return;
    setIsProcessingImages(true);
    try {
      const fd = new FormData();
      imageFiles.forEach(f => fd.append("imagenes", f));
      const res = await request("/notes/images", { method: "POST", body: fd });
      const data = await res.json();
      setHasNotes(true);
      setImagesDone(true);
      
      if (data.audio_confirmacion) {
        setNotesAudioUrl(data.audio_confirmacion);
      }
      if (data.respuesta_natural) {
        setNotesText(data.respuesta_natural);
      }
      
      toast.success("Apuntes analizados correctamente");
    } catch (e: any) {
      toast.error(e.message || "Error procesando las imágenes");
    } finally {
      setIsProcessingImages(false);
    }
  };

  const handleContinue = () => {
    router.push("/estudiar");
  };

  const userName = profile?.nombre || "amig@";

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-8">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Hola {userName}, personaliza con tus materiales</h1>
        <p className="text-slate-500 text-lg">¿Tienes algún documento o apuntes de clase? Dáselos a Gemma para enfocar las lecciones.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        
        {/* PDF Card */}
        {!isSenior && (
        <div className={`bg-white border ${pdfDone ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200'} rounded-3xl p-8 shadow-lg shadow-slate-200/40 transition-colors`}>
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${pdfDone ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
              {pdfDone ? <CheckCircle2 className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-slate-800 mb-2">Sube un temario (PDF)</h3>
              <p className="text-slate-500 mb-4">Gemma extraerá la estructura del curso automáticamente.</p>
              
              {!pdfDone ? (
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="pdf-upload"
                  />
                  <label
                    htmlFor="pdf-upload"
                    className="px-5 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl cursor-pointer font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <UploadCloud className="w-5 h-5" />
                    {pdfFile ? pdfFile.name : "Seleccionar PDF"}
                  </label>
                  
                  {pdfFile && (
                    <button
                      onClick={handlePdfUpload}
                      disabled={isProcessingPdf}
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isProcessingPdf ? <Loader2 className="w-5 h-5 animate-spin" /> : "Analizar"}
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-emerald-700 font-medium flex items-center gap-2">
                  Temario configurado y listo para estudiar.
                </div>
              )}
            </div>
          </div>
        </div>
        )}

        {/* Notes Card */}
        <div className={`bg-white border ${imagesDone ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200'} rounded-3xl p-8 shadow-lg shadow-slate-200/40 transition-colors`}>
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${imagesDone ? 'bg-emerald-100 text-emerald-600' : 'bg-coral-50 bg-rose-50 text-rose-500'}`}>
              {imagesDone ? <CheckCircle2 className="w-6 h-6" /> : <Camera className="w-6 h-6" />}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-slate-800 mb-2">Sube fotos {isSenior ? 'de la tarea o material' : 'de tus apuntes'}</h3>
              <p className="text-slate-500 mb-4">
                {isSenior 
                  ? "Sube fotos de la tarea, de los apuntes o del libro que vas a utilizar para ayudar a tu familiar, para poder entender mejor cómo ayudarle."
                  : "Gemma leerá tu letra y la cruzará con el temario."}
              </p>
              
              {!imagesDone ? (
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      if (e.target.files) setImageFiles(Array.from(e.target.files));
                    }}
                    className="hidden"
                    id="img-upload"
                  />
                  <div className="flex flex-col sm:flex-row gap-3">
                    <label
                      htmlFor="img-upload"
                      className="px-5 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl cursor-pointer font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <ImageIcon className="w-5 h-5" />
                      {imageFiles.length > 0 ? `${imageFiles.length} fotos listas` : "Seleccionar Fotos"}
                    </label>

                    {imageFiles.length > 0 && (
                      <button
                        onClick={handleImageUpload}
                        disabled={isProcessingImages}
                        className="px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isProcessingImages ? <Loader2 className="w-5 h-5 animate-spin" /> : "Analizar Notas"}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="text-emerald-700 font-medium flex items-center gap-2">
                    Apuntes guardados en tu perfil.
                  </div>
                  {notesText && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 italic">
                      "{notesText}"
                    </div>
                  )}
                  {notesAudioUrl && (
                    <div className="mt-2">
                      <audio src={constructMediaUrl(notesAudioUrl)} controls autoPlay={isSenior} className="w-full h-10" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      <div className="flex justify-between items-center pt-6 border-t border-slate-200">
        <p className="text-slate-400 text-sm">Puedes omitir esto por ahora y subir cosas más tarde.</p>
        <button
          onClick={handleContinue}
          className="px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-lg transition-all flex items-center gap-2 shadow-lg shadow-slate-900/20"
        >
          Ir a Estudiar <ArrowRight className="w-5 h-5" />
        </button>
      </div>

    </div>
  );
}
