'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { Camera } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { createClient } from '@/lib/supabase/client';
import { ErrorMessage } from '@/components/ui/error-message';
import { cn } from '@/lib/utils';

interface AvatarUploadProps {
  initialAvatarUrl: string | null;
  /** Used for the placeholder initial and alt text when there's no photo yet. */
  displayName: string;
  /** Called after a successful upload with the new public URL, so a parent
      showing the same avatar elsewhere (e.g. TopBar) can update too. */
  onUploaded?: (url: string) => void;
  size?: 'md' | 'lg';
}

export function AvatarUpload({ initialAvatarUrl, displayName, onUploaded, size = 'lg' }: AvatarUploadProps) {
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const dimension = size === 'lg' ? 'h-20 w-20' : 'h-12 w-12';

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ''; // allow re-selecting the same file next time
    if (!file) return;

    setError(null);

    // Optimistic: show the picked file immediately via a local object URL,
    // don't wait on the network round-trip to react to the person's action.
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setIsUploading(true);

    try {
      const { signedUrl, path } = await apiFetch<{ signedUrl: string; path: string }>(
        '/v1/profiles/me/avatar/upload-url',
        { method: 'POST', body: JSON.stringify({ filename: file.name }) }
      );

      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from('profile-avatars')
        .uploadToSignedUrl(path, new URL(signedUrl).searchParams.get('token') ?? '', file);
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('profile-avatars').getPublicUrl(path);
      const publicUrl = publicUrlData.publicUrl;

      await apiFetch('/v1/profiles/me', {
        method: 'PATCH',
        body: JSON.stringify({ avatar_url: publicUrl }),
      });

      setAvatarUrl(publicUrl);
      onUploaded?.(publicUrl);
    } catch (err) {
      // Revert to whatever was actually saved before this attempt — the
      // local preview was a promise, not a fact, and it didn't pan out.
      setError(err instanceof Error ? err.message : 'Could not upload photo — try again');
    } finally {
      URL.revokeObjectURL(localPreview);
      setPreviewUrl(null);
      setIsUploading(false);
    }
  }

  const shownUrl = previewUrl ?? avatarUrl;

  return (
    <div>
      <div className={cn('relative shrink-0 overflow-hidden rounded-full bg-copper/10', dimension)}>
        {shownUrl ? (
          <Image src={shownUrl} alt={displayName} fill className="object-cover" unoptimized={Boolean(previewUrl)} />
        ) : (
          <div className="flex h-full items-center justify-center font-display text-2xl text-copper/50">
            {displayName.slice(0, 1).toUpperCase()}
          </div>
        )}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          aria-label="Change profile photo"
          aria-busy={isUploading}
          className="absolute inset-0 flex items-center justify-center bg-black/0 text-transparent transition-colors hover:bg-black/40 hover:text-flour focus-visible:bg-black/40 focus-visible:text-flour disabled:cursor-wait"
        >
          <Camera className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleFileChange}
          className="sr-only"
        />
      </div>
      <ErrorMessage className="mt-1 max-w-[10rem] text-xs">{error}</ErrorMessage>
    </div>
  );
}
