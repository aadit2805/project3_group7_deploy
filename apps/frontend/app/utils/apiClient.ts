// apps/frontend/app/utils/apiClient.ts

/**
 * A wrapper around the native fetch API.
 * It automatically adds the Authorization header for authenticated requests
 * and handles 401 Unauthorized errors by redirecting to the login page.
 * @param url The URL to fetch.
 * @param options The options for the fetch request.
 * @returns A Promise that resolves to the Response object.
 */
const apiClient = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const customerToken = typeof window !== 'undefined' ? localStorage.getItem('customerToken') : null;

  const headers = {
    ...options.headers,
    'Content-Type': 'application/json',
  };

  if (customerToken) {
    (headers as any)['Authorization'] = `Bearer ${customerToken}`;
  }

  const response = await fetch(url, { ...options, headers });

  // If the response is a 401 Unauthorized, the token is invalid or expired.
  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      // Clear the user's session from local storage
      localStorage.removeItem('customerToken');
      localStorage.removeItem('customerId');
      localStorage.removeItem('customerEmail');
      localStorage.removeItem('customerPhone');

      // Redirect to the login page
      window.location.href = '/rewards-login';
    }
    
    // Throw an error to stop further processing in the calling function
    throw new Error('Unauthorized');
  }

  return response;
};

export default apiClient;
