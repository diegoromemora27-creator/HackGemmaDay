# 🧠 Gemma Study Companion: Arquitectura Multimodal y Tool Calling Dinámico

Bienvenido al repositorio técnico de **Gemma Study Companion**. Este proyecto fue desarrollado para explorar y explotar las fronteras de las capacidades del modelo **Gemma 4** de Google, combinando inferencia de texto, visión multimodal (VLM), y un orquestador nativo de **Tool Calling** que interactúa con el mundo exterior mediante **Firecrawl** y procesadores de voz.

---

## 🚀 1. El Backend y el Reto Técnico: Potenciando Gemma 4

El núcleo de este proyecto es su backend (`BackendGemmHackDayF.ipynb`), un orquestador inteligente diseñado para llevar a **Gemma 4** al límite de sus capacidades. El mayor reto técnico consistió en transformar un modelo de inferencia en un **agente autónomo y dinámico** capaz de interactuar con múltiples modalidades y herramientas externas, superando las limitaciones tradicionales de los LLMs.

A continuación, detallamos paso a paso cómo logramos esto:

### A. El Poder de Gemma 4 y su Cuantización
Implementar Gemma 4 requirió un manejo riguroso de recursos computacionales. Para ejecutar el modelo de forma eficiente en GPUs T4 (Kaggle), utilizamos **cuantización a 4-bit (NF4)** mediante `BitsAndBytesConfig`, operando en precisión `bfloat16`. Esto nos permitió mantener la alta capacidad de razonamiento de Gemma 4 reduciendo drásticamente el consumo de VRAM, habilitando inferencias rápidas y complejas.

### B. Tool Calling Nativo, Firecrawl y Calculadora Segura (Python AST)
Uno de los logros más significativos fue dotar a Gemma 4 de conexión a internet y capacidades de ejecución externa de forma determinista y estructurada. 
- **El Ciclo de 3 Turnos:** Implementamos el ciclo oficial de Tool Calling nativo de Gemma 4 (*Model's Turn ➔ Developer's Turn ➔ Final Response*). En lugar de solo responder preguntas, Gemma puede decidir *cuándo* necesita herramientas externas.
- **Integración con Firecrawl:** Le dimos a Gemma 4 herramientas tipadas en Python para invocar la API de **Firecrawl**. Con la función `buscar_en_internet` (`/v1/search`), obtiene resúmenes de actualidad. Con `leer_pagina_web` (`/v1/scrape`), accede al DOM de sitios web, extrae el contenido, lo limpia de ruido visual y lo parsea a un Markdown estructurado.
- **Calculadora (Matemáticas Estrictas):** Sabiendo que los LLMs pueden alucinar en matemáticas complejas, inyectamos una herramienta de `calculadora`. Esta permite la ejecución segura de árboles de sintaxis abstracta (AST) de Python, garantizando precisión absoluta en las operaciones matemáticas. Gemma la usa para resolver el problema internamente y luego explica el proceso lógico al estudiante.

### C. Ingeniería de Prompts (Prompt Care) y Guardrails Estrictos
Controlar un modelo tan potente y con acceso a internet requirió un cuidado extremo en los prompts. 
- Diseñamos **Guardrails (defensas de prompting)** muy severas a nivel de sistema (`_assistant_system_for`). 
- Cuando Gemma usa Firecrawl y procesa hasta 8,000 caracteres de Markdown devueltos por la web, las instrucciones le prohíben estrictamente "escupir código crudo" o devolver información sin procesar. 
- En su lugar, el sistema fuerza a Gemma a ingerir toda esa data y generar una **síntesis pedagógica** perfectamente adaptada a la edad y nivel del usuario (por ejemplo, explicando un concepto complejo paso a paso y sin jerga para un adulto mayor).

### D. Multimodalidad Avanzada (Texto, Visión y Audio)
Gemma 4 no solo lee texto, sino que ve y escucha. 
- **Visión (Image-to-Text):** Aprovechando la naturaleza multimodal del modelo base, el backend mapea matrices de píxeles combinadas con prompts de texto. Esto permite que un estudiante suba una foto de sus apuntes manuscritos o ejercicios de matemáticas resueltos a mano, y Gemma 4 es capaz de leer la caligrafía, detectar errores lógicos y devolver feedback estructurado.
- **Audio Nativo (Speech-to-Text):** Integramos **Whisper** para decodificar audios en tiempo real. La voz del usuario se transcribe a texto y se inyecta directamente en el ciclo generativo o de Tool Calling de Gemma, creando una interfaz conversacional fluida ("voz-a-razonamiento") con cero fricción.

### E. Generación Estructurada (JSON Parsing Resiliente)
Para que el backend interactúe con el frontend (Next.js), forzamos a Gemma a estructurar su conocimiento emitiendo JSON estricto. Implementamos heurísticas de reparación (`json-repair` + Regex) porque la naturaleza probabilística de los LLMs suele romper el formato. Así logramos que Gemma infiera el perfil del usuario o estructure un temario jerárquico desde un PDF, dictando dinámicamente cómo debe comportarse y mutar la interfaz del frontend.

---

## 🏗️ 2. Arquitectura Técnica y Entorno

Para sortear las limitaciones de hardware, el backend y el frontend están completamente desacoplados y estructurados de la siguiente manera:

1. **Inferencia Acelerada (Backend en Kaggle):** El backend, contenido en el notebook `BackendGemmHackDayF.ipynb`, utiliza el entorno de Kaggle (GPUs T4 x2) para cargar **Gemma 4** cuantizado a 4-bit (NF4 vía `BitsAndBytesConfig`) operando en precisión `bfloat16`. 
2. **Servidor Asíncrono (FastAPI + Ngrok):** Se implementó un servidor REST con **FastAPI**. Para exponer el servidor al exterior, se utiliza un túnel inverso persistente con **PyNgrok**. Como la generación del LLM es bloqueante, todos los endpoints pesados utilizan un manejador de trabajos asíncrono (Job Polling con `threading`) para devolver un `job_id` y mantener vivo el socket HTTP.
3. **Frontend Cliente (Next.js):** Arquitectura React moderna que consume el API asíncronamente. Muta sus árboles de componentes leyendo el estado global estructurado por Gemma.

---

## 🎨 3. El Frontend: Experiencia de Usuario y Consumo de APIs (Next.js)

Para interactuar con el poder de Gemma 4, construimos un frontend moderno en **Next.js**. Su diseño no solo es estético, sino que está profundamente entrelazado con la arquitectura asíncrona del backend. A continuación, detallamos la experiencia paso a paso desde la interfaz de cliente:

### A. Consumo de APIs y Job Polling Asíncrono
Dado que la inferencia de un LLM local (especialmente en tareas complejas como Tool Calling o generación de código) puede tomar varios segundos, una petición HTTP tradicional causaría un *timeout* en el navegador. 
- **Solución implementada:** Cuando el frontend envía un prompt o un audio (por ejemplo, a `/experience`), el backend no bloquea la red, sino que responde instantáneamente con un `job_id`. 
- **Polling Inteligente:** En el cliente (`lib/experience.ts`), implementamos la función `pollJob`, la cual hace peticiones intermitentes (cada 2.5 segundos) a los endpoints de estado (ej. `/experience/status/{job_id}`). La interfaz muestra un indicador de carga animado hasta que el estado cambia a `"done"`, asegurando una UX fluida y previniendo errores de red.

### B. Renderizado de Artefactos (Iframes Seguros)
Gemma 4 no solo responde con texto, sino que **programa aplicaciones interactivas** en tiempo real (HTML, CSS y JS puro).
- **Componente `<ExperienceIframe />`:** Una vez que el polling termina, el backend devuelve una URL estática con el código generado. Nuestro componente de React intercepta esta URL y hace un `fetch` del HTML en crudo.
- **Inyección Aislada:** En lugar de renderizarlo directamente y arriesgarnos a un choque de estilos, el código se inyecta utilizando el atributo `srcDoc` de un `<iframe>`. Por seguridad y aislamiento, se utiliza `sandbox="allow-scripts allow-same-origin"`. Esto permite que el estudiante juegue e interactúe con el código generado por Gemma 4 en un entorno seguro y contenido.

### C. Inputs Multimodales y Experiencia de Voz
El frontend está diseñado para sentirse como una conversación natural, permitiendo inputs multimodales.
- Capturamos la voz del estudiante a través del micrófono del dispositivo. Utilizando `FormData`, empaquetamos el buffer de audio (junto con cualquier contexto extra) y golpeamos los endpoints `/assistant/audio` o `/experience/audio`. 
- El backend procesa el audio, lo transcribe, y lo inyecta a Gemma 4. El usuario experimenta una transición sin fricción desde el habla hasta la generación de componentes web y respuestas de texto, logrando una interfaz verdaderamente inmersiva.

---

## ⚙️ 4. Deep Dive: Endpoints y el Motor Generador de Código

### Generador de Código e Iframes (`/experience`)
- En lugar de simplemente responder con "lecciones de texto", Gemma 4 actúa como un **motor de desarrollo front-end**. Al solicitar explorar un tema, el LLM emite **código HTML, CSS interactivo y Javascript** que el servidor backend intercepta, formatea y expone estáticamente.
- El Frontend recibe la URL de estos "Artefactos" web y los inyecta en tiempo de ejecución de manera aislada dentro de componentes de React (`<ExperienceIframe />`). Además, Gemma sintetiza guiones dinámicos que se pasan por TTS para lecturas en voz alta, consolidando el aprendizaje multisensorial.

---

## 💻 5. Integración y Guía de Ejecución Paso a Paso

Para comprender cómo cobra vida este ecosistema, aquí te explicamos cómo se integran todas las piezas en tiempo de ejecución, seguido de las instrucciones para que lo despliegues tú mismo.

### El Flujo de Integración (Paso a Paso)
1. **Captura del Input (Frontend):** El usuario interactúa con la UI (Next.js) escribiendo texto, subiendo un PDF, enviando una foto (apuntes) o hablando al micrófono.
2. **Envío y Polling (Red):** El frontend empaqueta estos datos y los envía al servidor Kaggle/FastAPI. Inmediatamente recibe un `job_id` y comienza a sondear (`polling`) el estado de la tarea para no congelar la pantalla.
3. **Procesamiento Base (Backend):** Si el input es audio, Whisper entra en acción y lo transcribe. Si es imagen, el modelo VLM extrae los pixeles y los combina con el texto.
4. **Tool Calling y Razonamiento (Gemma 4):** Gemma recibe el prompt. Si detecta que necesita información actual, pausa la generación, invoca a Firecrawl, lee la web, y reanuda su respuesta. Si requiere cálculos, invoca la Calculadora AST.
5. **Generación de Artefactos (JSON/HTML):** Gemma emite su veredicto. Si es un análisis de perfil, devuelve un JSON estricto. Si es una experiencia de aprendizaje interactiva, genera el código fuente HTML/CSS/JS.
6. **Mutación y Renderizado (Frontend):** El frontend recibe el estado `"done"`. Si recibe un JSON, la UI muta (cambiando colores y textos según la edad del usuario). Si recibe HTML, el componente `<ExperienceIframe />` lo inyecta de forma segura permitiendo interacción inmediata.

---

### Guía de Ejecución Local para Evaluadores

Sigue estos pasos para orquestar la comunicación entre Kaggle y Next.js y probar el sistema tú mismo:

#### Paso 1: Desplegar el Backend (Inferencia API)
1. **Importar Entorno:** Sube el archivo `BackendGemmHackDayF.ipynb` a un entorno de Notebook en [Kaggle](https://www.kaggle.com/).
2. **Asignación de Recursos:** Ve a *Settings > Accelerator* y habilita **GPU T4 x2**. Esto es crucial para cargar el modelo en 4-bit.
3. **Secretos de API:** Ve a "Add-ons" > "Secrets" y registra las siguientes credenciales:
   - `HFTOKEN`: Tu clave de Hugging Face con acceso validado a los modelos de Gemma.
   - `NGROK_TOKEN`: Tu token de autenticación para desplegar túneles [Ngrok](https://dashboard.ngrok.com/) (necesario para exponer la API).
   - `FIRECRAWL_API_KEY`: API Key para automatización y scraping web ([Firecrawl](https://www.firecrawl.dev/)).
4. **Ejecución:** Selecciona *Run All* en el notebook. Al finalizar, la última celda te proveerá una URL pública encriptada (ej. `https://4a3b-21-x.ngrok-free.app`). Mantén esta pestaña abierta para que el servidor siga corriendo.

#### Paso 2: Ejecutar la Arquitectura Frontend (Next.js)
1. **Ubicación:** En tu terminal local, entra al directorio del cliente UI:
   ```bash
   cd gemmahackdayui
   ```
2. **Instalación:** Instala las dependencias de Node:
   ```bash
   npm install
   ```
3. **Conexión al Backend:** Crea un archivo llamado `.env.local` en la raíz del frontend (`gemmahackdayui`) y pega la URL de ngrok que obtuviste en Kaggle:
   ```env
   NEXT_PUBLIC_API_URL=https://4a3b-21-x.ngrok-free.app
   ```
4. **Despliegue Local:** Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```
5. **Prueba Completa:** Navega a `http://localhost:3000`. Prueba grabar un audio, subir una foto de un problema de matemáticas, o pedirle que busque algo en internet, y observa cómo todo el flujo descrito cobra vida en tiempo real.

---
*Gracias por revisar este desarrollo.*