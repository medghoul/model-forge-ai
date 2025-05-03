
export interface RequestOptions {
  headers?: Record<string, string>;
  authToken?: string;
}

export async function fetchData(url: string, options?: RequestOptions): Promise<any> {
  try {
    // Add https:// prefix if missing
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }
    
    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options?.headers || {})
    };
    
    // Add authorization if provided
    if (options?.authToken) {
      headers['Authorization'] = `Bearer ${options?.authToken}`;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}
