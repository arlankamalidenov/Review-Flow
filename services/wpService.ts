import { WPCredentials, WPComment, CommentStatus } from '../types';

const getAuthHeader = (creds: WPCredentials) => {
  return 'Basic ' + btoa(`${creds.username}:${creds.appPassword}`);
};

const cleanUrl = (url: string) => {
  let cleaned = url.trim();
  // Ensure protocol exists
  if (!/^https?:\/\//i.test(cleaned)) {
    cleaned = 'https://' + cleaned;
  }
  return cleaned.replace(/\/$/, ''); // Remove trailing slash
};

export const fetchComments = async (
  creds: WPCredentials, 
  status: CommentStatus | 'all' = 'all'
): Promise<WPComment[]> => {
  const baseUrl = cleanUrl(creds.url);
  const params = new URLSearchParams({
    per_page: '20',
    orderby: 'date_gmt',
    order: 'desc',
    // We fetch logic slightly differently depending on 'all' or specific status
    // WP API status param: 'approve', 'hold', 'spam', 'trash', 'all'
    status: status === 'all' ? 'any' : status 
  });

  try {
    const response = await fetch(`${baseUrl}/wp-json/wp/v2/comments?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': getAuthHeader(creds),
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      let errorMessage = `WordPress API Error: ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.message) errorMessage = errorData.message;
      } catch (e) {
        // Ignore JSON parse error, use fallback
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error: any) {
    console.error("Failed to fetch comments", error);
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        throw new Error(`Connection failed. Please check the URL '${baseUrl}' and ensure the site supports HTTPS and CORS.`);
    }
    throw error;
  }
};

export const updateCommentStatus = async (
  creds: WPCredentials,
  commentId: number,
  newStatus: CommentStatus
): Promise<WPComment> => {
  const baseUrl = cleanUrl(creds.url);
  
  // Note: WP REST API treats 'spam' and 'trash' strictly. 
  // To restore, we set status to 'approved' or 'hold'.
  
  const response = await fetch(`${baseUrl}/wp-json/wp/v2/comments/${commentId}`, {
    method: 'POST', // or PUT
    headers: {
      'Authorization': getAuthHeader(creds),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      status: newStatus
    })
  });

  if (!response.ok) {
    throw new Error('Failed to update comment status');
  }

  return await response.json();
};

export const deleteComment = async (
  creds: WPCredentials,
  commentId: number,
  force: boolean = false
) => {
    const baseUrl = cleanUrl(creds.url);
    const params = force ? '?force=true' : '';
    
    const response = await fetch(`${baseUrl}/wp-json/wp/v2/comments/${commentId}${params}`, {
        method: 'DELETE',
        headers: {
            'Authorization': getAuthHeader(creds),
            'Content-Type': 'application/json',
        }
    });

    if (!response.ok) {
        throw new Error('Failed to delete comment');
    }
    return await response.json();
}