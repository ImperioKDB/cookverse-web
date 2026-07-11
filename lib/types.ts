export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';
export type Visibility = 'public' | 'followers' | 'private';

export interface RecipeCardData {
  id: string;
  title: string;
  slug: string;
  cover_image_url: string | null;
  difficulty: Difficulty;
  total_time_minutes: number;
  servings: number;
  like_count: number;
  save_count: number;
  rating_avg: number;
  published_at: string | null;
  author: { username: string; avatar_url: string | null } | null;
  cuisine: { name: string; slug: string } | null;
}

export interface RecipeIngredient {
  id?: string;
  ingredient_group?: string | null;
  name: string;
  quantity?: number | null;
  unit?: string | null;
  notes?: string | null;
  is_optional?: boolean;
}

export interface RecipeStep {
  id?: string;
  instruction: string;
  image_url?: string | null;
  timer_seconds?: number | null;
}

export interface RecipeNutrition {
  calories?: number | null;
  protein_g?: number | null;
  carbs_g?: number | null;
  fat_g?: number | null;
  fiber_g?: number | null;
  sugar_g?: number | null;
  sodium_mg?: number | null;
}

export interface RecipeDetail extends RecipeCardData {
  author_id: string;
  description: string | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  status: 'draft' | 'published' | 'archived' | 'removed';
  visibility: Visibility;
  recipe_ingredients: RecipeIngredient[];
  recipe_steps: RecipeStep[];
  recipe_nutrition: RecipeNutrition | null;
  tags: { id: string; name: string; slug: string }[];
}
