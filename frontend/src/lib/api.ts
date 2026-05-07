import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 120000, // 2 minute timeout for image generation
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Extract error message from response
    const errorMessage = err.response?.data?.detail || err.response?.data?.error || err.message;
    err.message = errorMessage;
    console.error('API Error:', errorMessage);
    return Promise.reject(err);
  }
);

// --- Templates ---
export const getTemplates = (category?: string) =>
  api.get('/templates', { params: category ? { category } : undefined }).then(r => r.data);

export const getTemplate = (id: string) =>
  api.get(`/templates/${id}`).then(r => r.data);

export const validateTemplate = (config: object) =>
  api.post('/templates/validate', config).then(r => r.data);

export const importTemplate = (file: File) => {
  const form = new FormData();
  form.append('file', file);
  return api.post('/templates/import', form).then(r => r.data);
};

// --- Projects ---
export const getProjects = (params?: { status?: string; limit?: number; offset?: number }) =>
  api.get('/projects', { params }).then(r => r.data);

export const createProject = (data: object) =>
  api.post('/projects', data).then(r => r.data);

export const getProject = (id: string) =>
  api.get(`/projects/${id}`).then(r => r.data);

export const updateProject = (id: string, data: object) =>
  api.patch(`/projects/${id}`, data).then(r => r.data);

export const deleteProject = (id: string) =>
  api.delete(`/projects/${id}`).then(r => r.data);

// --- Scenes ---
export const getScenes = (projectId: string) =>
  api.get(`/projects/${projectId}/scenes`).then(r => r.data);

export const createScene = (projectId: string, data: object) =>
  api.post(`/projects/${projectId}/scenes`, data).then(r => r.data);

export const updateScene = (projectId: string, sceneId: string, data: object) =>
  api.put(`/projects/${projectId}/scenes/${sceneId}`, data).then(r => r.data);

export const deleteScene = (projectId: string, sceneId: string) =>
  api.delete(`/projects/${projectId}/scenes/${sceneId}`).then(r => r.data);

// --- Avatars ---
export const getAvatars = (params?: { limit?: number; offset?: number }) =>
  api.get('/avatars', { params }).then(r => r.data);

export const createAvatar = (data: object) =>
  api.post('/avatars', data).then(r => r.data);

export const getAvatar = (id: string) =>
  api.get(`/avatars/${id}`).then(r => r.data);

export const deleteAvatar = (id: string) =>
  api.delete(`/avatars/${id}`).then(r => r.data);

export const generateReferenceImages = (avatarId: string, n = 4, promptOverride?: string, aspectRatio = "9:16") =>
  api.post(`/avatars/${avatarId}/generate-reference`, { 
    n, 
    prompt_override: promptOverride, 
    aspect_ratio: aspectRatio 
  }).then(r => r.data);

export const generateVariations = (avatarId: string, n = 4, promptOverride?: string, aspectRatio = "9:16") =>
  api.post(`/avatars/${avatarId}/generate-variations`, { n, prompt_override: promptOverride, aspect_ratio: aspectRatio }).then(r => r.data);

export const generateMultiAngle = (avatarId: string, angles: string[]) =>
  api.post(`/avatars/${avatarId}/generate-angles`, { angles }).then(r => r.data);

export const generateMultiOutfit = (avatarId: string, outfits: string[]) =>
  api.post(`/avatars/${avatarId}/generate-outfits`, { outfits }).then(r => r.data);

// --- Spaces ---
export const getSpaces = (params?: { limit?: number; offset?: number }) =>
  api.get('/spaces', { params }).then(r => r.data);

export const getSpace = (id: string) =>
  api.get(`/spaces/${id}`).then(r => r.data);

export const createSpace = (data: object) =>
  api.post('/spaces', data).then(r => r.data);

export const deleteSpace = (id: string) =>
  api.delete(`/spaces/${id}`).then(r => r.data);

export const generateSpace = (data: object) =>
  api.post('/spaces/generate', data).then(r => r.data);

// --- Generation ---
export const generateImage = (data: object) =>
  api.post('/generate/image', data).then(r => r.data);

export const generateVideo = (data: object) =>
  api.post('/generate/video', data).then(r => r.data);

export const getJobStatus = (jobId: string) =>
  api.get(`/generate/status/${jobId}`).then(r => r.data);

// --- Jobs ---
export const getJobs = (params?: { status?: string; job_type?: string; project_id?: string }) =>
  api.get('/jobs', { params }).then(r => r.data);

export const getJob = (id: string) =>
  api.get(`/jobs/${id}`).then(r => r.data);

export const cancelJob = (id: string) =>
  api.post(`/jobs/${id}/cancel`).then(r => r.data);

// --- API Keys ---
export const getAPIKeys = () =>
  api.get('/keys').then(r => r.data);

export const createAPIKey = (data: object) =>
  api.post('/keys', data).then(r => r.data);

export const updateAPIKey = (id: string, data: object) =>
  api.patch(`/keys/${id}`, data).then(r => r.data);

export const deleteAPIKey = (id: string) =>
  api.delete(`/keys/${id}`).then(r => r.data);

// --- Prompt ---
export const enhancePrompt = (data: object) =>
  api.post('/prompt/enhance', data).then(r => r.data);

export const synthesizeAvatarPattern = (biometrics: object) =>
  api.post('/prompt/synthesize-avatar', { biometrics }).then(r => r.data);

// --- Stitch ---
export const createStitchJob = (data: object) =>
  api.post('/stitch', data).then(r => r.data);

export const getStitchStatus = (jobId: string) =>
  api.get(`/stitch/${jobId}`).then(r => r.data);

// --- Providers ---
export const getProviders = () =>
  api.get('/providers').then(r => r.data);

export default api;
