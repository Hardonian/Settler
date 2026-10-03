-- Fix the fail-open tenant guard on the 7-argument cms_upsert_page overload.
--
-- Discovery (2026-10-03, post-apply assertion of harden_function_permissions):
-- cms_upsert_page has two overloads. The 6-arg overload was hardened in
-- 20261003005108; the 7-arg overload (p_change_summary) kept the original
-- `IF p_tenant_id <> get_user_tenant()` guard, which evaluates to NULL — and
-- therefore never raises — when get_user_tenant() is NULL, letting an
-- unauthenticated caller pass the check. Same created_by spoofing weakness.

CREATE OR REPLACE FUNCTION public.cms_upsert_page(
  p_tenant_id uuid, p_slug text, p_title text, p_status text,
  p_content jsonb, p_created_by uuid, p_change_summary text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, app_private AS $$
DECLARE
  v_page_id uuid;
  v_status text;
BEGIN
  IF p_tenant_id IS DISTINCT FROM get_user_tenant() THEN
    RAISE EXCEPTION 'tenant mismatch';
  END IF;

  v_status := COALESCE(p_status, 'draft');

  INSERT INTO cms_pages (tenant_id, slug, title, status)
  VALUES (p_tenant_id, p_slug, p_title, v_status)
  ON CONFLICT (tenant_id, slug)
  DO UPDATE SET title = EXCLUDED.title,
                status = EXCLUDED.status,
                updated_at = NOW()
  RETURNING id INTO v_page_id;

  INSERT INTO cms_page_versions (page_id, content_json, created_by)
  VALUES (v_page_id, p_content,
          CASE WHEN auth.uid() IS NOT NULL THEN auth.uid() ELSE p_created_by END);

  IF v_status = 'published' THEN
    UPDATE cms_pages SET published_at = NOW() WHERE id = v_page_id;
  END IF;

  RETURN v_page_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.cms_upsert_page(uuid, text, text, text, jsonb, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cms_upsert_page(uuid, text, text, text, jsonb, uuid, text) TO authenticated, service_role;
