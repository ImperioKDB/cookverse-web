import { apiFetch } from './api-client';
import { createClient } from './supabase/client';

/**
 * Uploads a file to the recipe-media bucket via a signed URL and returns its
 * public URL. Reused by both the Media step (cover photo) and the Steps
 * step (per-step photos) rather than duplicating the upload dance twice —
 * same pattern as components/profile/AvatarUpload.tsx, just pointed at a
 * different endpoint/bucket (POST /v1/recipes/:id/media/upload-url,
 * bucket "recipe-media", per COOKVERSE-FRONTEND-AI-HANDOFF.md's contract
 * table).
 */
export async function uploadRecipeMedia(recipeId: string, file: File): Promise<string> {
  const { signedUrl, path } = await apiFetch<{ signedUrl: string; path: string }>(
    `/v1/recipes/${recipeId}/media/upload-url`,
    { method: 'POST', body: JSON.stringify({ filename: file.name }) }
  );

  const supabase = createClient();
  const { error } = await supabase.storage
    .from('recipe-media')
    .uploadToSignedUrl(path, new URL(signedUrl).searchParams.get('token') ?? '', file);
  if (error) throw error;

  const { data } = supabase.storage.from('recipe-media').getPublicUrl(path);
  return data.publicUrl;
}
