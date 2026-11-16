const API_BASE_URL = '/api';

interface RequestOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, string | number | boolean | undefined>;
  data?: any;
  body?: BodyInit | null;
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers, data: bodyData, body: directBody, ...rest } = options;

  let url = `${API_BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const token = localStorage.getItem('self_rest_token');

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  const resolvedBody = bodyData !== undefined ? JSON.stringify(bodyData) : directBody;

  const response = await fetch(url, {
    ...rest,
    body: resolvedBody,
    headers: requestHeaders,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMessage = data.error || data.message || `Lỗi yêu cầu (${response.status})`;
    if (response.status === 401 && !url.includes('/auth/login')) {
      localStorage.removeItem('self_rest_token');
      localStorage.removeItem('self_rest_user');
      window.dispatchEvent(new Event('auth-unauthorized'));
    }
    throw new Error(errorMessage);
  }

  return data.data !== undefined ? data.data : data;
}

export default apiClient;
