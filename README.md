# 🧠 Gemma Study Companion: Arquitectura Multimodal y Tool Calling Dinámico

Bienvenido al repositorio técnico de **Gemma Study Companion**. Este proyecto fue desarrollado para explorar y explotar las fronteras de las capacidades del modelo **Gemma 4** de Google, combinando inferencia de texto, visión multimodal (VLM), y un orquestador nativo de **Tool Calling** que interactúa con el mundo exterior mediante **Firecrawl** y procesadores de voz.

El objetivo técnico central fue construir un orquestador inteligente en el backend capaz de procesar múltiples modalidades (texto, audio, PDFs, imágenes), estructurar conocimiento (JSON parsing resiliente), automatizar web scraping, y servirlo todo dinámicamente a un frontend (Next.js) que muta su Interfaz de Usuario dependiendo del perfil cognitivo inferido por el LLM.

---

## 🏗️ 1. Arquitectura Técnica y Entorno

Para sortear las limitaciones de hardware, el backend y el frontend están completamente desacoplados y estructurados de la siguiente manera:

1. **Inferencia Acelerada (Backend en Kaggle):** El backend, contenido en el notebook `BackendGemmHackDayF.ipynb`, utiliza el entorno de Kaggle (GPUs T4 x2) para cargar **Gemma 4** cuantizado a 4-bit (NF4 vía `BitsAndBytesConfig`) operando en precisión `bfloat16`. 
2. **Servidor Asíncrono (FastAPI + Ngrok):** Se implementó un servidor REST con **FastAPI**. Para exponer el servidor al exterior, se utiliza un túnel inverso persistente con **PyNgrok**. Como la generación del LLM es bloqueante, todos los endpoints pesados utilizan un manejador de trabajos asíncrono (Job Polling con `threading`) para devolver un `job_id` y mantener vivo el socket HTTP.
3. **Frontend Cliente (Next.js):** Arquitectura React moderna que consume el API consumiendo flujos de red (`polling`). Muta sus árboles de componentes (UI infantil vs Senior) leyendo el estado global estructurado por Gemma.

---

## ⚙️ 2. Deep Dive: Endpoints y Retos Técnicos con Gemma 4

El núcleo de la innovación reside en cómo estructuramos los flujos de inferencia dentro del backend. A continuación, el detalle de cada subsistema:

### A. Ciclo Completo de Tool Calling y Web Scraping (`/assistant` & Firecrawl)
Uno de los mayores retos técnicos fue habilitar a Gemma 4 para interactuar de forma determinista con Internet. Implementamos el ciclo oficial de 3 turnos de Tool Calling nativo de Gemma (Model's Turn ➔ Developer's Turn ➔ Final Response) a través del método `gemma_chat_with_tools()`.

- **Orquestación de Herramientas Dinámica:** En tiempo de ejecución, el backend decide qué herramientas inyectar en el contexto de Gemma basándose en el perfil del usuario. Las herramientas disponibles son funciones Python fuertemente tipadas:
  - `buscar_en_internet`: Llama al endpoint de búsqueda de **Firecrawl** (`/v1/search`) para obtener resúmenes de actualidad.
  - `leer_pagina_web`: Utiliza **Firecrawl Scrape** (`/v1/scrape`) para acceder a un sitio web, extraer su DOM, limpiarlo de ruido visual y parsearlo a un Markdown ultra limpio.
  - `calculadora`: Ejecución segura de AST para matemáticas estrictas.
- **Defensas de Prompting (Guardrails):** A nivel de prompt de sistema (`_assistant_system_for`), inyectamos restricciones severas. Cuando Gemma invoca a Firecrawl y nosotros le inyectamos los 8,000 caracteres de Markdown devueltos por la API web, el Guardrail fuerza al LLM a "no escupir código crudo", sino a procesar la vasta cantidad de información y redactar una síntesis pedagógica ajustada a la edad del usuario (por ejemplo, paso a paso y sin jerga para un adulto mayor).

### B. Extracción de Entidades Estrictas (JSON Parsing Resiliente)
La naturaleza probabilística de los LLMs dificulta la integración de software. Implementamos heurísticas de reparación (`json-repair` + Regex) en funciones como `extract_json_block()`.
- **Endpoint `/profile`:** Toma un flujo de texto informal del usuario y obliga a Gemma a inferir variables latentes para emitir un esquema estricto (ej. `{ "nombre": "...", "grupo_etario": "nino", "necesidades_especiales": "..." }`). Este JSON dicta el comportamiento del Frontend.
- **Endpoint `/curriculum`:** Extrae texto crudo desde documentos PDF vía **PyMuPDF**, lo inyecta en una ventana de contexto profunda y fuerza a Gemma a construir un mapa jerárquico serializable en unidades, temas y subtemas dependientes.

### C. Visión Multimodal (Image-to-Text) (`/notes`)
- Aprovechando el modelo base de Gemma, el sistema mapea matrices de píxeles (provenientes de imágenes cargadas en Base64 o Multipart form) combinadas con el prompt de texto. 
- Permite subir fotos de apuntes manuscritos o ejercicios matemáticos resueltos a mano, logrando que Gemma detecte errores, lea la caligrafía y devuelva el feedback estructurado como retroalimentación.

### D. Pipeline de Audio (Speech-to-Text) (`/assistant/audio` y `/experience/audio`)
- Dado que el Frontend permite interacciones naturales con el micrófono, el audio (`webm/mp3`) se envía crudo al servidor de FastAPI.
- El backend enruta este buffer a **Whisper** (OpenAI) para transcripción neuronal robusta.
- Una vez decodificado a texto, la secuencia se inyecta directamente al ciclo generativo o al ciclo de Tool Calling de Gemma 4, logrando una interfaz de voz-a-razonamiento con cero fricción.

### E. Motor Generador de Código e Iframes (`/experience`)
- En lugar de simplemente responder con "lecciones de texto", Gemma 4 actúa como un motor de desarrollo. Al solicitar jugar o explorar un tema abstracto, el LLM emite **código HTML, CSS interactivo y Javascript** que el servidor backend intercepta, formatea y expone estáticamente.
- El Frontend (Next.js) recibe la URL de estos "Artefactos" web y los inyecta en tiempo de ejecución de manera aislada dentro de componentes de React (`<ExperienceIframe />`). Además, Gemma sintetiza guiones dinámicos que se pasan por TTS para lecturas en voz alta, consolidando el aprendizaje multisensorial.

---

## 💻 3. Guía de Ejecución Local para Agentes y Evaluadores

Siga estos pasos para orquestar la comunicación entre Kaggle y Next.js:

### Desplegar el Backend (Inferencia API)
1. **Importar Entorno:** Suba el archivo `BackendGemmHackDayF.ipynb` a un entorno de Notebook en [Kaggle](https://www.kaggle.com/).
2. **Asignación de Recursos:** Habilite el Acelerador **GPU T4 x2** en las configuraciones del entorno.
3. **Secretos de API:** Vaya a "Add-ons" > "Secrets" y registre:
   - `HFTOKEN`: Su clave de Hugging Face con acceso validado al repositorio de Gemma.
   - `NGROK_TOKEN`: Su token de autenticación para desplegar túneles [Ngrok](https://dashboard.ngrok.com/).
   - `FIRECRAWL_API_KEY`: API Key para automatización y scraping web ([Firecrawl](https://www.firecrawl.dev/)).
4. Seleccione *Run All*. Al finalizar, el output de la última celda proveerá una URL pública encriptada (ej. `https://4a3b-21-x.ngrok-free.app`).

### Ejecutar la Arquitectura Frontend (Next.js)
1. Ubíquese en el directorio del cliente UI:
   ```bash
   cd gemmahackdayui
   ```
2. Instale dependencias:
   ```bash
   npm install
   ```
3. Registre el punto de enlace de la API de Kaggle. Cree un archivo `.env.local` y mapee su URL de ngrok:
   ```env
   NEXT_PUBLIC_API_URL=https://4a3b-21-x.ngrok-free.app
   ```
4. Lance el entorno de desarrollo:
   ```bash
   npm run dev
   ```
5. Navegue a `http://localhost:3000` y explore los diferentes estados de mutación de la UI al cargar perfiles diferentes, envíe audios e inserte enlaces a sitios web para presenciar la ejecución de Tool Calling en vivo.

---
*Gracias por revisar este desarrollo.*