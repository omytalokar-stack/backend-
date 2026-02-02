/**
 * Centralized API configuration and utilities
 * Ensures all API calls use the correct backend URL from environment
 */

// Get API base URL from environment variable
// CRITICAL: This must use VITE_API_URL from .env
export const getAPIBase = (): string => {
  const envURL = import.meta.env.VITE_API_URL || '';
  if (!envURL) {
    console.warn('⚠️ VITE_API_URL not set in environment; using relative paths for API calls');
  } else {
    console.log('✅ Using API URL:', envURL);
  }
  return envURL;
};

export const API_BASE = getAPIBase();

/**
 * Helper to make authenticated API calls with proper headers and credentials
 */
export interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

export const apiCall = async (
  endpoint: string,
  options: FetchOptions = {}
): Promise<Response> => {
  const token = localStorage.getItem('token');
  const url = `${API_BASE}${endpoint}`;

  const finalOptions: RequestInit = {
    ...options,
    headers: {
      ...options.headers,
      ...(token && { Authorization: `Bearer ${token}` })
    },
    credentials: 'include' // Enable cookies/credentials
  };

  console.log(`[API] ${options.method || 'GET'} ${url}`);
  try {
    const response = await fetch(url, finalOptions);
    if (!response.ok) {
      console.error(`❌ API Error: ${response.status} ${response.statusText}`);
      if (response.status === 401) {
        console.warn('⚠️ Unauthorized - token may be expired');
      }
    }
    return response;
  } catch (err) {
    console.error('❌ Network/API fetch failed:', err);
    throw err;
  }
};

/**
 * Helper specifically for file uploads
 */
export const uploadFile = async (file: File): Promise<string> => {
  const token = localStorage.getItem('token');
  const fd = new FormData();
  fd.append('file', file);

  console.log(`📤 Uploading file: ${file.name} (${file.size} bytes) to ${API_BASE}/api/admin/upload`);
  try {
    const response = await fetch(`${API_BASE}/api/admin/upload`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: fd,
      credentials: 'include'
    });

    const text = await response.text();
    if (!response.ok) {
      console.error(`❌ Upload failed: ${response.status} - ${text}`);
      throw new Error(`Upload failed: ${response.status} - ${text}`);
    }

    try {
      const data = JSON.parse(text);
      console.log(`✅ Upload successful: ${data.url}`);
      return data.url as string;
    } catch (parseErr) {
      console.error('Failed to parse upload response:', parseErr);
      throw new Error('Invalid response format from server');
    }
  } catch (err) {
    console.error('❌ Upload network error:', err);
    throw err;
  }
};

/**
 * Upload with progress callback. Uses XHR so we can report upload progress to UI.
 * onProgress receives numbers 0-100
 */
export const uploadFileWithProgress = (file: File, onProgress?: (p: number) => void): Promise<string> => {
  const token = localStorage.getItem('token');
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const url = `${API_BASE}/api/admin/upload`;
    xhr.open('POST', url, true);
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.withCredentials = true;
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable && typeof onProgress === 'function') {
        const p = Math.round((ev.loaded / ev.total) * 100);
        try { onProgress(p); } catch {}
      }
    };
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve(data.url);
          } catch (e) {
            reject(new Error('Invalid upload response'));
          }
        } else {
          reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
        }
      }
    };
    const fd = new FormData();
    fd.append('file', file);
    try { xhr.send(fd); } catch (e) { reject(e); }
  });
};
