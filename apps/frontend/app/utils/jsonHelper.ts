// apps/frontend/app/utils/jsonHelper.ts

/**
 * Safely parses a Response as JSON, handling cases where the response
 * might be HTML (like error pages) instead of JSON.
 * @param response - The fetch Response object
 * @returns A Promise that resolves to the parsed JSON data
 * @throws Error if the response is not JSON or cannot be parsed
 */
export const safeJsonParse = async (response: Response): Promise<any> => {
  const contentType = response.headers.get('content-type');
  
  // Check if response is actually JSON
  if (!contentType || !contentType.includes('application/json')) {
    console.error('Expected JSON but received:', contentType || 'unknown', 'Status:', response.status);
    throw new Error(`Expected JSON but received ${contentType || 'unknown content type'} (Status: ${response.status})`);
  }
  
  try {
    return await response.json();
  } catch (error) {
    console.error('Failed to parse JSON response:', error);
    throw new Error('Failed to parse JSON response');
  }
};

/**
 * Fetches and safely parses JSON from a URL
 * @param url - The URL to fetch
 * @param options - Optional fetch options
 * @returns A Promise that resolves to the parsed JSON data
 * @throws Error if the request fails or response is not JSON
 */
export const fetchJson = async (url: string, options: RequestInit = {}): Promise<any> => {
  const response = await fetch(url, options);
  
  if (!response.ok) {
    // Try to get error message from response if it's JSON
    try {
      const errorData = await safeJsonParse(response);
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    } catch {
      throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
    }
  }
  
  return safeJsonParse(response);
};

