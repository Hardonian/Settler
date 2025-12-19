-- Migration: enterprise_cms_tables
-- Created: 2025-12-19 00:16:47 UTC
-- Description: CMS tables for admin content studio with versioning

BEGIN;

-- ============================================================================
-- CMS_PAGES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS cms_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, slug)
);

-- Indexes for cms_pages
CREATE INDEX IF NOT EXISTS idx_cms_pages_tenant_id ON cms_pages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cms_pages_slug ON cms_pages(slug);
CREATE INDEX IF NOT EXISTS idx_cms_pages_status ON cms_pages(status);
CREATE INDEX IF NOT EXISTS idx_cms_pages_tenant_slug ON cms_pages(tenant_id, slug);
CREATE INDEX IF NOT EXISTS idx_cms_pages_published ON cms_pages(tenant_id, status, published_at DESC) WHERE status = 'published';

-- ============================================================================
-- CMS_PAGE_VERSIONS TABLE
-- ============================================================================
-- Version history for CMS pages
CREATE TABLE IF NOT EXISTS cms_page_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES cms_pages(id) ON DELETE CASCADE,
  content_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes for cms_page_versions
CREATE INDEX IF NOT EXISTS idx_cms_page_versions_page_id ON cms_page_versions(page_id);
CREATE INDEX IF NOT EXISTS idx_cms_page_versions_created_at ON cms_page_versions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cms_page_versions_created_by ON cms_page_versions(created_by);

-- ============================================================================
-- CMS_MEDIA TABLE
-- ============================================================================
-- Media assets for CMS (images, videos, etc.)
CREATE TABLE IF NOT EXISTS cms_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('image', 'video', 'document', 'other')),
  meta JSONB DEFAULT '{}'::jsonb,
  alt TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes for cms_media
CREATE INDEX IF NOT EXISTS idx_cms_media_tenant_id ON cms_media(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cms_media_kind ON cms_media(kind);
CREATE INDEX IF NOT EXISTS idx_cms_media_path ON cms_media(path);
CREATE INDEX IF NOT EXISTS idx_cms_media_created_at ON cms_media(created_at DESC);

COMMIT;
