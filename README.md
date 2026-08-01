# 🧠 Lazos: Plataforma Educativa Adaptativa y Multimodal

Bienvenido al repositorio oficial de **Gemma Study Companion**. Este proyecto es una plataforma educativa inteligente, adaptativa y multimodal, diseñada para democratizar el aprendizaje y reducir la brecha digital mediante la personalización extrema de la interfaz y el contenido. 

Este documento está estructurado para que un agente evaluador o desarrollador comprenda **exactamente qué hace la plataforma, cómo funciona su arquitectura, cómo explota las capacidades de Gemma 4, y cómo ejecutar el proyecto paso a paso**.

---

## 🏗️ 1. Arquitectura del Proyecto

El proyecto se divide en dos componentes principales fuertemente desacoplados, comunicados a través de un túnel seguro:

1. **Backend (API Multimodal en Kaggle):** Servidor HTTP construido con **FastAPI**. Se ejecuta dentro de un entorno de Kaggle (para aprovechar la GPU gratuita T4 x2 o P100) y mantiene el modelo **Gemma 4 (4-bit cuantizado)** cargado permanentemente en VRAM. 
2. **Frontend (Next.js & Tailwind CSS):** Una aplicación React altamente reactiva que altera su UI/UX drásticamente dependiendo del perfil cognitivo del usuario (Niño, Adulto Mayor, o Estándar).
3. **Comunicación (Ngrok):** Dado que Kaggle no expone puertos públicos, el backend utiliza **ngrok** para crear un túnel HTTPS persistente. El frontend realiza peticiones HTTP/REST a esta URL pública.

---

## 🤖 2. ¿Qué hacemos con Gemma 4? (Funcionalidades Principales)

El proyecto exprime al máximo las capacidades multimodales y de razonamiento de **Gemma 4**, operando bajo 5 endpoints principales:

### A. Perfilado de Usuario Cognitivo (`/profile`)
- **Flujo:** El usuario describe verbalmente o por texto quién es. Si es audio, **Whisper** lo transcribe.
- **Inferencia de Gemma:** Extrae datos estructurados (JSON) inferiendo `nombre`, `grupo_etario` (niño, adulto, adulto_mayor) y `necesidades_especiales` a partir de lenguaje natural informal.
- **Impacto Frontend:** Este JSON dicta el comportamiento y renderizado de toda la aplicación (colores, tamaño de fuente, avatares, y simplificación de menús).

### B. Análisis de Apuntes por Visión (`/notes`)
- **Flujo:** El usuario sube una fotografía de su libreta o un ejercicio mal resuelto.
- **Inferencia de Gemma (Multimodal):** Gemma 4 procesa los píxeles directamente junto con el texto. Lee manuscritos, detecta errores conceptuales y devuelve un resumen de qué temas necesita reforzar el estudiante.

### C. Procesamiento de Temarios PDF (`/curriculum`)
- **Inferencia de Gemma:** Extrae texto de PDFs y lo estructura en un JSON jerárquico de `temas`, `subtemas` y mapas de dependencias. 

### D. Experiencias Generativas e Interactivas (`/experience`)
- **Flujo:** El usuario pide jugar o aprender algo nuevo.
- **Inferencia de Gemma:** Gemma 4 no solo genera texto, sino que **redacta código HTML/CSS interactivo** (minijuegos, cuestionarios) y guiones para síntesis de voz (TTS). 
- **Impacto Frontend:** El frontend renderiza este código de forma segura en un componente `<ExperienceIframe />`, integrando la experiencia inmersiva directamente en el chat.

### E. Tool Calling Nativo y Búsqueda Web (`/assistant`)
- **Flujo:** Gemma 4 actúa como un tutor conversacional con **Tool Calling**.
- **Integración con Firecrawl:** Si el usuario hace una pregunta de actualidad o envía una URL (ej. Wikipedia), Gemma decide autónomamente usar la herramienta `leer_pagina_web` o `buscar_en_internet` (API de Firecrawl).
- **Adaptabilidad Prompting:** El sistema obliga a Gemma a **digerir y explicar** la página web escrapeada en lugar de solo copiarla, ajustando el tono de la explicación a la edad del usuario (ej. paso a paso para un adulto mayor).

---

## 🖥️ 3. Interfaces Dinámicas del Frontend (UI/UX)

El frontend en **Next.js** lee el estado global (`grupo_etario`) y muta la vista de `/estudiar`:
- **👶 Modo Infantil (`isChild`):** Temática de "Gemma Bot" (mascotas 🤖/🧑‍🚀). Elimina menús complejos, usa botones enormes, paletas de alto contraste naranja/azul, y lee automáticamente las respuestas en voz alta. Las peticiones se rutean para generar minijuegos visuales.
- **👴 Modo Senior (`isElderly`):** Diseño austero para reducir fricción y carga cognitiva. Textos gigantes (text-3xl+), alto contraste estricto (Blanco/Azul Marino), navegación explícita con textos en vez de íconos ("⬅️ Atrás"), y un micrófono con indicación visual absoluta ("⏹ Detener") para dar seguridad.
- **🧑‍🎓 Modo Estándar:** Vista moderna de asistente IA, ideal para estudiantes universitarios, enfocada en productividad, carga de archivos y gráficos.

Además, el frontend incluye un **Enrutador Inteligente**: si el usuario simplemente hace una pregunta, rutea la petición a `/assistant` (para disparar Tool Calling). Si el usuario presiona "Quiero jugar", la rutea a `/experience` (para generar HTML dinámico).

---

## ⚙️ 4. Guía de Ejecución Paso a Paso (Para Agentes y Jueces)

Para levantar el entorno completo y probar la plataforma, sigue exactamente estos pasos:

### Paso 1: Levantar el Backend (API en Kaggle)
1. Entra a [Kaggle](https://www.kaggle.com/) y crea un nuevo Notebook, o sube el archivo **`BackendGemmHackDayF.ipynb`**.
2. En la configuración del Notebook (panel derecho), asegúrate de que el **Acelerador (GPU)** esté activado (ej. T4 x2).
3. Ve a **Add-ons -> Secrets** y configura las siguientes 3 variables de entorno:
   - `HFTOKEN`: Tu token de Hugging Face (con permisos aceptados para Gemma 4).
   - `NGROK_TOKEN`: Tu authtoken gratuito de [Ngrok](https://dashboard.ngrok.com/).
   - `FIRECRAWL_API_KEY`: Tu API key de [Firecrawl](https://www.firecrawl.dev/) (plan gratuito).
4. Ejecuta el Notebook celda por celda.
5. La última celda inicializará FastAPI e imprimirá una URL pública (ej. `https://1234-abcd.ngrok-free.app`). **Copia esta URL.**

### Paso 2: Levantar el Frontend (Localmente)
1. Abre tu terminal de comandos en la carpeta raíz del frontend:
   ```bash
   cd gemmahackdayui
   ```
2. Instala las dependencias de Node:
   ```bash
   npm install
   ```
3. Crea un archivo `.env.local` en la raíz de la carpeta `gemmahackdayui` y pega la URL de ngrok del Paso 1:
   ```env
   NEXT_PUBLIC_API_URL=https://1234-abcd.ngrok-free.app
   ```
4. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```
5. Abre `http://localhost:3000` en tu navegador.

### Paso 3: Probar la Plataforma
1. En el **Onboarding**, usa tu micrófono y di: *"Hola, tengo 70 años y me cuesta ver las letras pequeñas."* o *"Hola, soy Juanito y tengo 7 años"*.
2. Observa cómo Gemma infiere tu perfil cognitivo y transforma radicalmente la interfaz de la aplicación de forma automática.
3. En el chat, pégale un link de Wikipedia o pídele que busque información actualizada para presenciar el **Tool Calling con Firecrawl** en acción.

---

*Proyecto desarrollado para el Hackathon. Gracias por evaluar nuestro trabajo.*