import { getBaseUrl, request } from "./api";

export type ExperienceResult = {
  id: string; 
  tipo_experiencia: string; 
  titulo: string; 
  subtema: string;
  contenido_texto: string; 
  url_html: string; 
  url_audio: string | null;
  grupo_etario_usado: string; 
  timestamp: string;
  transcripcion?: string;
};

export type JobStatus<T = ExperienceResult> = {
  status: "pending" | "processing" | "done" | "error";
  result: T | null;
  error: string | null;
};

export type AssistantResult = {
  respuesta: string;
  transcripcion?: string;
};

export async function pollJob<T = ExperienceResult>(statusPath: string, jobId: string, signal?: AbortSignal, {
  intervalMs = 2500, timeoutMs = 5 * 60 * 1000
} = {}): Promise<T> {
  const started = Date.now();
  while (true) {
    if (signal?.aborted) throw new Error("Cancelado");
    
    let job: JobStatus<T>;
    try {
      const res = await request(`${statusPath}/${jobId}`, { signal });
      job = await res.json();
    } catch (e: any) {
      if (e.name === "AbortError" || e.message === "Cancelado") throw new Error("Cancelado");
      throw new Error("El job expiró o hubo un error al consultarlo.");
    }
    
    if (job.status === "done") return job.result!;
    if (job.status === "error") throw new Error(job.error ?? "Error generando la experiencia");
    if (Date.now() - started > timeoutMs) throw new Error("Tiempo de espera agotado");
    await new Promise(r => setTimeout(r, intervalMs));
  }
}

export async function createExperience(body: {
  instruccion: string; contexto_extra?: string; subtema?: string;
}, signal?: AbortSignal) {
  const res = await request("/experience", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal
  });
  const data = await res.json();
  return pollJob<ExperienceResult>("/experience/status", data.job_id, signal);
}

export async function createExperienceAudio(fd: FormData, signal?: AbortSignal) {
  const res = await request("/experience/audio", {
    method: "POST",
    body: fd,
    signal
  });
  const data = await res.json();
  const result = await pollJob<ExperienceResult>("/experience/status", data.job_id, signal);
  if (data.transcripcion && result) {
    result.transcripcion = data.transcripcion;
  }
  return result;
}

export async function createAssistantMessage(body: { mensaje: string }, signal?: AbortSignal) {
  const res = await request("/assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal
  });
  const data = await res.json();
  return pollJob<AssistantResult>("/assistant/status", data.job_id, signal);
}

export async function createAssistantMessageAudio(fd: FormData, signal?: AbortSignal) {
  const res = await request("/assistant/audio", {
    method: "POST",
    body: fd,
    signal
  });
  const data = await res.json();
  const result = await pollJob<AssistantResult>("/assistant/status", data.job_id, signal);
  if (data.transcripcion && result) {
    result.transcripcion = data.transcripcion;
  }
  return result;
}
