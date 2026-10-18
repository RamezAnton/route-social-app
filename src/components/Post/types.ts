import type { PostPrivacy } from "../../utils/privacy";
import type { SharedPostRef } from "../../utils/apiShape";

export type { SharedPostRef };

export type PostComment = {
  id: string;
  authorName: string;
  username?: string;
  authorId?: string;
  content: string;
  avatarUrl?: string;
  imageUrl?: string;
  createdAt?: string;
  likesCount: number;
  likedByMe?: boolean;
};

export type Post = {
  id: string;
  author: {
    id?: string;
    name: string;
    username: string;
    avatarUrl?: string;
  };
  content: string;
  imageUrl?: string;
  createdAt: string;
  likes: number;
  commentsCount: number;
  /** @deprecated use commentsCount */
  comments?: number;
  topComment?: PostComment | null;
  likedByMe?: boolean;
  savedByMe?: boolean;
  privacy?: PostPrivacy;
  sharesCount?: number;
  sharedPost?: SharedPostRef | null;
};

export type PostCardProps = {
  post: Post;
  currentUserId?: string;
  currentUserName?: string;
  onLike?: (postId: string, liked: boolean) => void;
  onSave?: (postId: string, saved: boolean) => void;
  onCommentAdded?: (postId: string) => void;
  onAddComment?: (
    postId: string,
    content: string,
    image?: File | null,
  ) => Promise<void>;
  onDeleted?: (postId: string) => void;
  onUpdated?: (post: Post) => void;
  onShared?: (postId: string) => void;
  onJumpToComments?: () => void;
  hideInlineComments?: boolean;
};

export type CommentItemProps = {
  comment: PostComment;
  postId?: string;
  currentUserId?: string;
  currentUserName?: string;
  allowReply?: boolean;
  onEdited?: (commentId: string, content: string) => void;
  onRemoved?: (commentId: string) => void;
};
