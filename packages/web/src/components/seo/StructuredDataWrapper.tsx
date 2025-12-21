/**
 * Structured Data Wrapper Component
 * Wraps structured data schemas for SEO
 */

import { StructuredData as StructuredDataComponent } from '@/components/StructuredData';
import {
  generateProductSchema,
  generateBreadcrumbSchema,
  generateArticleSchema,
  generateHowToSchema,
  generateVideoSchema,
  generateReviewSchema,
  generateServiceSchema,
} from '@/lib/seo/structured-data';

interface StructuredDataWrapperProps {
  type: 'product' | 'breadcrumb' | 'article' | 'howto' | 'video' | 'review' | 'service';
  data: any;
}

export function StructuredDataWrapper({ type, data }: StructuredDataWrapperProps) {
  let schema;

  switch (type) {
    case 'product':
      schema = generateProductSchema();
      break;
    case 'breadcrumb':
      schema = generateBreadcrumbSchema(data.items);
      break;
    case 'article':
      schema = generateArticleSchema(data);
      break;
    case 'howto':
      schema = generateHowToSchema(data);
      break;
    case 'video':
      schema = generateVideoSchema(data);
      break;
    case 'review':
      schema = generateReviewSchema(data);
      break;
    case 'service':
      schema = generateServiceSchema(data);
      break;
    default:
      return null;
  }

  return <StructuredDataComponent data={schema} />;
}
