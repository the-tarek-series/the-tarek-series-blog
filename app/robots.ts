import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin/', '/admin/posts/', '/admin/books/', '/admin/contacts/', '/admin/users/', '/admin/orders/'] }],
    sitemap: 'https://mindscapepsychology.com/sitemap.xml',
  };
}
