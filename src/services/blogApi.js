import api from './api';

/**
 * Helper to build FormData from object
 */
function buildBlogFormData(data) {
  if (data instanceof FormData) return data;
  const formData = new FormData();

  // Core fields
  if (data.blog_title !== undefined && data.blog_title !== null) {
    const title = String(data.blog_title).trim();
    formData.append('blog_title', title);
    formData.append('title', title);
    formData.append('blog_meta_title', title);
  }

  if (data.blog_slug !== undefined && data.blog_slug !== null) {
    const slug = String(data.blog_slug).trim();
    formData.append('blog_slug', slug);
    formData.append('slug', slug);
    formData.append('url_slug', slug);
  }

  if (data.blog_short_description !== undefined && data.blog_short_description !== null) {
    const shortDesc = String(data.blog_short_description).trim();
    formData.append('blog_short_description', shortDesc);
    formData.append('short_description', shortDesc);
    formData.append('blog_meta_description', shortDesc);
  }

  if (data.blog_description !== undefined && data.blog_description !== null) {
    const desc = String(data.blog_description);
    formData.append('blog_description', desc);
    formData.append('description', desc);
    formData.append('content', desc);
  }

  if (data.blog_categories_ids !== undefined && data.blog_categories_ids !== null && data.blog_categories_ids !== '') {
    const catId = String(data.blog_categories_ids).trim();
    formData.append('blog_categories_ids', catId);
    formData.append('category_id', catId);
    formData.append('categories_id', catId);
  }

  if (data.blog_banner_image_alt !== undefined && data.blog_banner_image_alt !== null) {
    const alt = String(data.blog_banner_image_alt).trim();
    formData.append('blog_banner_image_alt', alt);
    formData.append('banner_image_alt', alt);
    formData.append('alt_text', alt);
  }

  if (data.blog_meta_keywords !== undefined && data.blog_meta_keywords !== null) {
    const keywords = String(data.blog_meta_keywords).trim();
    formData.append('blog_meta_keywords', keywords);
    formData.append('meta_keywords', keywords);
  }

  if (data.blog_status !== undefined && data.blog_status !== null) {
    const status = String(data.blog_status).trim();
    formData.append('blog_status', status);
    formData.append('status', status);
  }

  if (data.blog_index !== undefined && data.blog_index !== null) {
    formData.append('blog_index', String(data.blog_index));
    formData.append('index', String(data.blog_index));
  }

  if (data.blog_front !== undefined && data.blog_front !== null) {
    const isFrontTrue = data.blog_front === true || String(data.blog_front) === '1' || String(data.blog_front).toLowerCase() === 'yes' || data.blog_front === 'Active';
    const frontVal = isFrontTrue ? '1' : '0';
    formData.append('blog_front', frontVal);
    formData.append('front', frontVal);
    formData.append('is_home', frontVal);
  } else if (data.front !== undefined && data.front !== null) {
    const isFrontTrue = data.front === true || String(data.front) === '1' || String(data.front).toLowerCase() === 'yes' || data.front === 'Active';
    const frontVal = isFrontTrue ? '1' : '0';
    formData.append('blog_front', frontVal);
    formData.append('front', frontVal);
    formData.append('is_home', frontVal);
  }

  if (data.blog_featured !== undefined && data.blog_featured !== null) {
    const isFeaturedTrue = data.blog_featured === true || String(data.blog_featured) === '1' || String(data.blog_featured).toLowerCase() === 'yes' || data.blog_featured === 'Active';
    const featuredVal = isFeaturedTrue ? '1' : '0';
    formData.append('blog_featured', featuredVal);
    formData.append('featured', featuredVal);
    formData.append('is_featured', featuredVal);
  } else if (data.featured !== undefined && data.featured !== null) {
    const isFeaturedTrue = data.featured === true || String(data.featured) === '1' || String(data.featured).toLowerCase() === 'yes' || data.featured === 'Active';
    const featuredVal = isFeaturedTrue ? '1' : '0';
    formData.append('blog_featured', featuredVal);
    formData.append('featured', featuredVal);
    formData.append('is_featured', featuredVal);
  }

  // Handle image file upload (check all possible file keys)
  const imageFile = 
    (data.blog_banner_image instanceof File || data.blog_banner_image instanceof Blob ? data.blog_banner_image : null) ||
    (data.banner_image instanceof File || data.banner_image instanceof Blob ? data.banner_image : null) ||
    (data.image instanceof File || data.image instanceof Blob ? data.image : null) ||
    (data.blog_image instanceof File || data.blog_image instanceof Blob ? data.blog_image : null);

  if (imageFile) {
    formData.append('blog_banner_image', imageFile);
    formData.append('banner_image', imageFile);
    formData.append('image', imageFile);
    formData.append('blog_image', imageFile);
    formData.append('blogs_image', imageFile);
    formData.append('blogs_banner_image', imageFile);
    formData.append('banner', imageFile);
    formData.append('file', imageFile);
  }

  return formData;
}

/**
 * 1. GET /blog
 * Fetch blog list with pagination, search, status filters
 */
export const getBlogs = async (params = {}) => {
  const queryParams = typeof params === 'number' ? { page: params } : params;
  const response = await api.get('/blog', { params: queryParams });
  return response.data;
};

/**
 * 2. POST /blog
 * Create new blog
 */
export const createBlog = async (payload) => {
  const formData = buildBlogFormData(payload);
  const response = await api.post('/blog', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

function extractBlogList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.blogs?.data)) return response.blogs.data;
  if (Array.isArray(response?.blogs)) return response.blogs;
  if (Array.isArray(response?.blog)) return response.blog;
  return [];
}

/**
 * 3. GET /blog/{id}
 * Fetch single blog by ID with robust fallback
 */
export const getBlogById = async (id) => {
  try {
    const response = await api.get(`/blog/${id}`);
    return response.data;
  } catch (err) {
    try {
      const fallbackList = await api.get('/blog');
      const list = extractBlogList(fallbackList.data);
      const found = list.find((b) => String(b.id) === String(id));
      if (found) {
        return { data: found, image_url: fallbackList.data?.image_url };
      }
    } catch (fallbackErr) {
      // ignore
    }
    throw err;
  }
};

/**
 * 4. PUT /blog/{id}
 * Update blog by ID (Using POST with _method='PUT' for Laravel multipart support)
 */
export const updateBlog = async (id, payload) => {
  const formData = buildBlogFormData(payload);
  if (!formData.has('_method')) {
    formData.append('_method', 'PUT');
  }

  try {
    const response = await api.post(`/blog/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (err) {
    try {
      const response = await api.post(`/blogs/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (err2) {
      try {
        const response = await api.put(`/blog/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
      } catch (err3) {
        throw err;
      }
    }
  }
};

/**
 * 5. PATCH /blogs/{id}/status
 * Toggle or update blog status (Active / Inactive)
 */
export const updateBlogStatus = async (id, blog_status) => {
  const statusVal = String(blog_status || 'Active').trim();
  const formData = new FormData();
  formData.append('blog_status', statusVal);

  try {
    const response = await api.patch(`/blogs/${id}/status`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (err) {
    const response = await api.patch(`/blogs/${id}/status`, {
      blog_status: statusVal,
    });
    return response.data;
  }
};

/**
 * 6. DELETE /blog/{id}
 * Delete blog by ID
 */
export const deleteBlog = async (id) => {
  const response = await api.delete(`/blog/${id}`);
  return response.data;
};

export default {
  getBlogs,
  createBlog,
  getBlogById,
  updateBlog,
  updateBlogStatus,
  deleteBlog,
};
