export type UserRole = "member" | "professional" | "admin";

export type ProfessionalCategory =
  | "nutritionist"
  | "dietitian"
  | "doctor"
  | "gynecologist"
  | "other";

export type TargetType = "post" | "reply";

export interface Profile {
  id: string;
  display_name: string;
  role: UserRole;
  professional_category: ProfessionalCategory | null;
  professional_category_other: string | null;
  display_name_changed: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  slug: string;
  label: string;
  sort_order: number;
  is_active: boolean;
}

export interface Post {
  id: string;
  author_id: string;
  display_name: string;
  body: string;
  category_slug: string | null;
  is_pinned: boolean;
  is_deleted: boolean;
  like_count: number;
  reply_count: number;
  created_at: string;
}

export interface Reply {
  id: string;
  post_id: string;
  author_id: string;
  display_name: string;
  body: string;
  author_role: UserRole;
  professional_category: ProfessionalCategory | null;
  professional_category_other: string | null;
  is_deleted: boolean;
  like_count: number;
  created_at: string;
}

export interface Flag {
  id: string;
  target_type: TargetType;
  target_id: string;
  flagged_by: string;
  reason: string | null;
  resolved: boolean;
  created_at: string;
}

/* What the feed actually renders: a post, whether the current viewer has liked
   it, and any replies worth showing inline. */
export interface FeedPost extends Post {
  liked_by_viewer: boolean;
  /* Populated when a search matched the text of a reply rather than the post,
     so the reason a post appears in the results is visible. */
  matching_replies?: FeedReply[];
}

export interface FeedReply extends Reply {
  liked_by_viewer: boolean;
}
