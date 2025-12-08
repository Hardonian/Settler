/**
 * Vercel Blob Storage Integration
 *
 * Provides utilities for file storage using @vercel/blob
 * Falls back gracefully if Blob storage is not configured
 *
 * Usage:
 *   import { blob } from '@/lib/vercel/blob';
 *   const url = await blob.put('filename.txt', file, { access: 'public' });
 *   await blob.del(url);
 */

import { del, head, list, put } from "@vercel/blob";

/**
 * Check if Vercel Blob is configured
 */
export function isBlobConfigured(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

/**
 * Vercel Blob client wrapper with error handling
 */
export const blob = {
  /**
   * Upload a file to Blob storage
   */
  async put(
    pathname: string,
    body: File | Blob | ArrayBuffer | Buffer | ReadableStream | string,
    options?: {
      access?: "public" | "private";
      contentType?: string;
      addRandomSuffix?: boolean;
      cacheControlMaxAge?: number;
    }
  ): Promise<{
    url: string;
    downloadUrl: string;
    pathname: string;
    contentType?: string;
    size?: number;
  }> {
    if (!isBlobConfigured()) {
      throw new Error(
        "Blob storage is not configured. Set BLOB_READ_WRITE_TOKEN environment variable."
      );
    }

    try {
      const result = await put(pathname, body, options);
      return {
        url: result.url,
        downloadUrl: result.downloadUrl ?? result.url,
        pathname: result.pathname,
        contentType: result.contentType,
        size: result.size,
      };
    } catch (error) {
      console.error(`[Blob] Error uploading file "${pathname}":`, error);
      throw error;
    }
  },

  /**
   * Delete a file from Blob storage
   */
  async del(url: string): Promise<void> {
    if (!isBlobConfigured()) {
      console.warn("[Blob] Blob storage not configured, skipping delete");
      return;
    }

    try {
      await del(url);
    } catch (error) {
      console.error(`[Blob] Error deleting file "${url}":`, error);
      throw error;
    }
  },

  /**
   * Get file metadata
   */
  async head(url: string): Promise<{
    url: string;
    pathname: string;
    size: number;
    uploadedAt: Date;
    contentType?: string;
    contentDisposition?: string;
    cacheControl?: string;
  } | null> {
    if (!isBlobConfigured()) {
      return null;
    }

    try {
      return await head(url);
    } catch (error) {
      console.error(`[Blob] Error getting file metadata for "${url}":`, error);
      return null;
    }
  },

  /**
   * List files in Blob storage
   */
  async list(options?: {
    prefix?: string;
    limit?: number;
    cursor?: string;
    sortBy?: "createdAt" | "updatedAt";
  }): Promise<{
    blobs: Array<{
      url: string;
      pathname: string;
      size: number;
      uploadedAt: Date;
      contentType?: string;
    }>;
    cursor?: string;
    hasMore: boolean;
  }> {
    if (!isBlobConfigured()) {
      return { blobs: [], hasMore: false };
    }

    try {
      return await list(options);
    } catch (error) {
      console.error(`[Blob] Error listing files:`, error);
      return { blobs: [], hasMore: false };
    }
  },
};

/**
 * Upload a file from a form
 */
export async function uploadFileFromForm(
  formData: FormData,
  fieldName = "file",
  options?: {
    access?: "public" | "private";
    addRandomSuffix?: boolean;
  }
): Promise<{ url: string; pathname: string; size?: number }> {
  const file = formData.get(fieldName) as File;
  if (!file) {
    throw new Error(`No file found in form data with field name "${fieldName}"`);
  }

  const result = await blob.put(file.name, file, {
    access: options?.access || "public",
    addRandomSuffix: options?.addRandomSuffix ?? true,
    contentType: file.type,
  });

  return {
    url: result.url,
    pathname: result.pathname,
    size: result.size,
  };
}

/**
 * Upload a file from a URL
 */
export async function uploadFileFromUrl(
  url: string,
  pathname: string,
  options?: {
    access?: "public" | "private";
    contentType?: string;
  }
): Promise<{ url: string; pathname: string; size?: number }> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch file from URL: ${response.statusText}`);
  }

  const blobData = await response.blob();
  const result = await blob.put(pathname, blobData, {
    access: options?.access || "public",
    contentType: options?.contentType || blobData.type,
  });

  return {
    url: result.url,
    pathname: result.pathname,
    size: result.size,
  };
}
