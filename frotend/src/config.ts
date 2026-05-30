export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const getImageUrl = (path: string | undefined | null) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_URL}${cleanPath}`;
};
