import { WPCredentials, UnifiedReview, ReviewStatus, ProjectConfig } from '../types';

/**
 * Helper to get value from nested object by string path
 * Example: getValueByPath(obj, 'acf.student_name')
 */
const getValueByPath = (obj: any, path: string) => {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

const getAuthHeader = (creds: WPCredentials) => {
  const auth = btoa(`${creds.username}:${creds.appPassword}`);
  return `Basic ${auth}`;
};

const getProxyPrefix = (url: string) => {
  if (url.includes('bfisherman.no')) return '/wp-json/bf';
  if (url.includes('rbesolov.com')) return '/wp-json/rb';
  return null;
};

const cleanUrl = (url: string) => {
  let cleaned = url.trim();
  const proxyPrefix = getProxyPrefix(cleaned);
  if (proxyPrefix) return proxyPrefix;

  if (!/^https?:\/\//i.test(cleaned)) {
    cleaned = 'https://' + cleaned;
  }
  return cleaned.replace(/\/$/, '');
};

const mediaCache: Record<string, string> = {};

export interface PaginationMeta {
  total: number;
  totalPages: number;
  currentPage: number;
}

export interface FetchReviewsResult {
  reviews: UnifiedReview[];
  pagination: PaginationMeta;
}

export const fetchReviews = async (
  project: ProjectConfig,
  creds: WPCredentials,
  status: ReviewStatus | 'all' = 'all',
  page: number = 1,
  search: string = ''
): Promise<FetchReviewsResult> => {
  const baseUrl = cleanUrl(creds.url);
  const endpoint = baseUrl.startsWith('/wp-json/')
    ? project.endpoint.replace('/wp-json', '')
    : project.endpoint;

  const params = new URLSearchParams({
    per_page: '100', // Fetch more items for client-side filtering
    orderby: 'date',
    order: 'desc',
  });

  // Only add status if it's not 'all', or if it's 'all' and we know the project supports 'any'
  // Or if we have project-specific creds (implies we want to manage it)
  if (status !== 'all') {
    params.append('status', status);
  } else {
    // For RBesolov, only use 'any' if we are not using the generic initial creds 
    // or if the user explicitly wants to see everything.
    // Actually, we should try 'any' for everything if we want to moderate.
    params.append('status', 'any');
  }

  const requestUrl = `${baseUrl}${endpoint}?${params.toString()}`;
  console.log(`📡 [${project.id}] Fetching reviews (${status}, page ${page}, search: "${search}"):`, requestUrl);

  try {
    const response = await fetch(requestUrl, {
      method: 'GET',
      headers: {
        'Authorization': getAuthHeader(creds),
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    // Map data to UnifiedReview
    let reviews = data.map((item: any) => ({
      id: item.id,
      date: item.date,
      status: item.status as ReviewStatus,
      author: getValueByPath(item, project.mapping.author) || item.title?.rendered || 'Unknown',
      email: getValueByPath(item, project.mapping.email) || '',
      text: getValueByPath(item, project.mapping.text) || '',
      rating: Number(getValueByPath(item, project.mapping.rating)) || 0,
      photo: getValueByPath(item, project.mapping.photo) || null,
      meta: getValueByPath(item, project.mapping.meta) || '',
      country_iso: project.mapping.country_iso ? getValueByPath(item, project.mapping.country_iso) : undefined,
      originalData: item
    }));

    // Client-side filtering by email and author name
    if (search.trim()) {
      const query = search.toLowerCase();
      reviews = reviews.filter((review: UnifiedReview) =>
        review.email.toLowerCase().includes(query) ||
        review.author.toLowerCase().includes(query)
      );
    }

    // Client-side pagination
    const total = reviews.length;
    const totalPages = Math.ceil(total / 20);
    const startIndex = (page - 1) * 20;
    const endIndex = startIndex + 20;
    const paginatedReviews = reviews.slice(startIndex, endIndex);

    return {
      reviews: paginatedReviews,
      pagination: {
        total,
        totalPages,
        currentPage: page
      }
    };
  } catch (error: any) {
    console.error('Fetch failed:');
    console.dir(error);
    throw error;
  }
};

/**
 * Fetch total count of reviews for a specific status without loading the actual data.
 * Uses HEAD request for efficiency.
 */
export const fetchReviewCount = async (
  project: ProjectConfig,
  creds: WPCredentials,
  status: ReviewStatus | 'all' = 'all'
): Promise<number> => {
  const baseUrl = cleanUrl(creds.url);
  const endpoint = baseUrl.startsWith('/wp-json/')
    ? project.endpoint.replace('/wp-json', '')
    : project.endpoint;

  const params = new URLSearchParams({
    per_page: '1',
  });

  if (status !== 'all') {
    params.append('status', status);
  } else {
    params.append('status', 'any');
  }

  const requestUrl = `${baseUrl}${endpoint}?${params.toString()}`;

  try {
    const response = await fetch(requestUrl, {
      method: 'HEAD',
      headers: {
        'Authorization': getAuthHeader(creds),
      }
    });

    if (!response.ok) {
      return 0;
    }

    const total = parseInt(response.headers.get('X-WP-Total') || '0', 10);
    return total;
  } catch (error) {
    console.error('Failed to fetch review count:', error);
    return 0;
  }
};


export const updateReviewStatus = async (
  project: ProjectConfig,
  creds: WPCredentials,
  reviewId: number,
  newStatus: ReviewStatus
): Promise<any> => {
  const baseUrl = cleanUrl(creds.url);
  const endpoint = baseUrl.startsWith('/wp-json/')
    ? project.endpoint.replace('/wp-json', '')
    : project.endpoint;
  const requestUrl = `${baseUrl}${endpoint}/${reviewId}`;

  const response = await fetch(requestUrl, {
    method: 'POST',
    headers: {
      'Authorization': getAuthHeader(creds),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status: newStatus })
  });

  if (!response.ok) {
    throw new Error(`Status Update Error ${response.status}`);
  }

  return await response.json();
};

export const deleteReview = async (
  project: ProjectConfig,
  creds: WPCredentials,
  reviewId: number,
  force: boolean = false
) => {
  const baseUrl = cleanUrl(creds.url);
  const endpoint = baseUrl.startsWith('/wp-json/')
    ? project.endpoint.replace('/wp-json', '')
    : project.endpoint;
  const params = force ? '?force=true' : '';
  const requestUrl = `${baseUrl}${endpoint}/${reviewId}${params}`;

  const response = await fetch(requestUrl, {
    method: 'DELETE',
    headers: {
      'Authorization': getAuthHeader(creds),
      'Content-Type': 'application/json'
    }
  });

  if (![200, 204].includes(response.status) && !response.ok) {
    throw new Error(`Delete Error ${response.status}`);
  }

  return await response.json();
};

export const updateReview = async (
  project: ProjectConfig,
  creds: WPCredentials,
  reviewId: number,
  data: any // This should be raw data for WP API
): Promise<any> => {
  const baseUrl = cleanUrl(creds.url);
  const endpoint = baseUrl.startsWith('/wp-json/')
    ? project.endpoint.replace('/wp-json', '')
    : project.endpoint;
  const requestUrl = `${baseUrl}${endpoint}/${reviewId}`;

  const response = await fetch(requestUrl, {
    method: 'POST',
    headers: {
      'Authorization': getAuthHeader(creds),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error(`Update Error ${response.status}`);
  }

  return await response.json();
};

export const createReview = async (
  project: ProjectConfig,
  creds: WPCredentials,
  data: any
): Promise<any> => {
  const baseUrl = cleanUrl(creds.url);
  const endpoint = baseUrl.startsWith('/wp-json/')
    ? project.endpoint.replace('/wp-json', '')
    : project.endpoint;
  const requestUrl = `${baseUrl}${endpoint}`;

  const response = await fetch(requestUrl, {
    method: 'POST',
    headers: {
      'Authorization': getAuthHeader(creds),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error(`Create Error ${response.status}`);
  }

  return await response.json();
};

export const fetchMediaUrl = async (
  creds: WPCredentials,
  mediaId: number
): Promise<string> => {
  const cacheKey = `${creds.url}-${mediaId}`;
  if (mediaCache[cacheKey]) return mediaCache[cacheKey];

  const baseUrl = cleanUrl(creds.url);
  const requestUrl = `${baseUrl}/wp/v2/media/${mediaId}`;

  const response = await fetch(requestUrl, {
    method: 'GET',
    headers: {
      'Authorization': getAuthHeader(creds),
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) throw new Error(`Media Fetch Error ${response.status}`);

  const data = await response.json();
  const sourceUrl = data.source_url;

  if (sourceUrl) mediaCache[cacheKey] = sourceUrl;

  return sourceUrl;
};

/**
 * Downloads an image from a URL and uploads it to WordPress media library.
 * Returns the media ID of the uploaded file.
 */
export const fetchAndUploadImage = async (
  creds: WPCredentials,
  imageUrl: string,
  fileName: string = 'review_image.jpg'
): Promise<number | null> => {
  try {
    console.log('🖼️ Sideloading image:', imageUrl);

    // 1. Fetch the image (use proxy for Tilda to avoid CORS)
    let fetchUrl = imageUrl;
    if (imageUrl.includes('tupwidget.com')) {
      fetchUrl = imageUrl.replace('https://tupwidget.com', '/tilda-images');
    }

    const imageResp = await fetch(fetchUrl);
    if (!imageResp.ok) throw new Error(`Failed to fetch image: ${imageResp.status}`);
    const blob = await imageResp.blob();

    // 2. Upload to WordPress
    const baseUrl = cleanUrl(creds.url);
    const uploadUrl = `${baseUrl}/wp/v2/media`;

    const formData = new FormData();
    formData.append('file', blob, fileName);

    const uploadResp = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(creds),
        // Don't set Content-Type, browser will set it with boundary
      },
      body: formData
    });

    if (!uploadResp.ok) {
      const errText = await uploadResp.text();
      throw new Error(`WP Media Upload Error ${uploadResp.status}: ${errText}`);
    }

    const mediaData = await uploadResp.json();
    console.log('✅ Image uploaded successfully, Media ID:', mediaData.id);
    return mediaData.id;
  } catch (error) {
    console.error('❌ Sideload failed:', error);
    return null;
  }
};