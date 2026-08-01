export function getBaseUrl() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('scq_base_url') || '';
  }
  return '';
}

export async function request(path: string, options: RequestInit = {}) {
  const base = getBaseUrl();
  if (!base) {
    throw new Error('Configura la URL del backend primero.');
  }
  
  // Ensure we don't end up with double slashes
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  // Añadir cabecera para saltar la advertencia de ngrok
  const finalOptions: RequestInit = {
    ...options,
    headers: {
      ...options.headers,
      'ngrok-skip-browser-warning': 'true',
    }
  };

  let res: Response;
  try {
    res = await fetch(`${base}${cleanPath}`, finalOptions);
  } catch (error: any) {
    if (error.name === 'TypeError' || error.message.includes('Failed to fetch')) {
      throw new Error('Sin conexión al backend o el túnel de ngrok expiró. Por favor, recarga y verifica la URL.');
    }
    throw error;
  }
  
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    const errorMessage = detail.detail || detail.message || `Error ${res.status}`;
    throw new Error(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
  }
  
  return res;
}

export function constructMediaUrl(pathFromBackend: string) {
  const base = getBaseUrl();
  if (!base || !pathFromBackend) return '';
  
  // If the backend already returns a relative URL like /files/html/...
  if (pathFromBackend.startsWith('/files/')) {
    return `${base}${pathFromBackend}`;
  }
  
  // Legacy workaround for Kaggle absolute filesystem paths
  // Extract just the filename from the path
  const filename = pathFromBackend.split('/').pop() || pathFromBackend.split('\\').pop();
  if (!filename) return '';
  
  return `${base}/files/media/${filename}`;
}
