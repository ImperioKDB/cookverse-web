import Link from 'next/link';
import Image from 'next/image';
import { DifficultyDial } from '@/components/ui/doneness-dial';
import type { RecipeCardData } from '@/lib/types';

export function RecipeCard({ recipe }: { recipe: RecipeCardData }) {
  return (
    <Link
      href={`/recipes/${recipe.slug}`}
      className="block overflow-hidden rounded-sm border border-copper/20 transition-transform active:scale-[0.98]"
    >
      <div className="relative aspect-[4/5] w-full bg-copper/10">
        {recipe.cover_image_url ? (
          <Image
            src={recipe.cover_image_url}
            alt={recipe.title}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-display text-2xl text-copper/50">
            {recipe.title.slice(0, 1)}
          </div>
        )}
      </div>
      <div className="space-y-1 p-3">
        <h3 className="line-clamp-2 font-display text-base leading-tight">{recipe.title}</h3>
        <div className="flex items-center gap-2">
          <DifficultyDial difficulty={recipe.difficulty} size={28} />
          <span className="font-mono text-xs text-[#241E1A]/70 dark:text-flour/70">
            {recipe.total_time_minutes > 0 ? `${recipe.total_time_minutes} min` : '—'}
          </span>
        </div>
        {recipe.author && (
          <p className="truncate text-xs text-[#241E1A]/60 dark:text-flour/60">
            @{recipe.author.username}
          </p>
        )}
      </div>
    </Link>
  );
}
