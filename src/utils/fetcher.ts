
export async function fetchData(url: string): Promise<any> {
  try {
    // Add https:// prefix if missing
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }
    
    const response = await fetch(url);
    
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
