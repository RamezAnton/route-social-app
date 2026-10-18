import axios from "axios";
import type {
  LoginInterface,
  RegistrationInterface,
} from "../interface/auth.interface";
import type { PostPrivacy } from "../utils/privacy";


export const BASEURL = "https://route-posts.routemisr.com";
const TOKEN_KEY = "route_token";

export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export const api = axios.create({
  baseURL: BASEURL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

type ApiErrorBody = {
  message?: string;
  error?: string;
  errors?: string | Record<string, string | string[]>;
};

export function getServerMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as ApiErrorBody | undefined;
    if (typeof data?.errors === "string") return data.errors;
    if (data?.errors && typeof data.errors === "object") {
      const first = Object.values(data.errors).flat()[0];
      if (typeof first === "string") return first;
    }
    return data?.message ?? data?.error ?? err.message ?? fallback;
  }
  return fallback;
}

function getErrorMessage(err: unknown, fallback: string): string {
  return getServerMessage(err, fallback);
}

function extractToken(data: unknown): string | undefined {
  if (typeof data !== "object" || data === null) return undefined;
  const d = data as { data?: { token?: string }; token?: string };
  return d.data?.token ?? d.token;
}

// ---------- System ----------

export async function healthCheck() {
  const { data } = await api.get("/");
  return data;
}

// ---------- Users & Auth ----------
// POST /users/signup { name, username, email, dateOfBirth: "2000-01-01", gender: "male", password, rePassword }
export async function signup(payload: RegistrationInterface) {
  try {
    const { data } = await api.post("/users/signup", payload);
    return data;
  } catch (err) {
    throw new Error(getErrorMessage(err, "Unable to create account."), {
      cause: err,
    });
  }
}

// POST /users/signin { email | username | login, password } -> { data: { token, ... } }
export async function signin(payload: LoginInterface) {
  try {
    const { data } = await api.post("/users/signin", payload);
    const token = extractToken(data);
    if (token) saveToken(token);
    return data;
  } catch (err) {
    throw new Error(getErrorMessage(err, "Unable to sign in."), {
      cause: err,
    });
  }
}

// PATCH /users/change-password { password, newPassword } -> refreshed token
export async function changePassword(password: string, newPassword: string) {
  const { data } = await api.patch("/users/change-password", {
    password,
    newPassword,
  });
  const token = extractToken(data);
  if (token) saveToken(token);
  return data;
}

// PUT /users/upload-photo form-data { photo: File }
export async function uploadProfilePhoto(photo: File) {
  const formData = new FormData();
  formData.append("photo", photo);
  const { data } = await api.put("/users/upload-photo", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

// PUT /users/upload-cover form-data { cover: File }
export async function uploadCover(photo: File) {
  const formData = new FormData();
  formData.append("cover", photo);
  const { data } = await api.put("/users/upload-cover", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

// DELETE /users/cover
export async function deleteCover() {
  const { data } = await api.delete("/users/cover");
  return data;
}

// GET /users/profile-data
export async function getProfile() {
  const { data } = await api.get("/users/profile-data");
  return data;
}

// GET /users/search?q=&page=&limit= → { data: { users: [...] } }
export async function searchUsers(q: string, page = 1, limit = 20) {
  const { data } = await api.get("/users/search", {
    params: { q, page, limit },
  });
  return data;
}

// GET /users/bookmarks
export async function getBookmarks() {
  const { data } = await api.get("/users/bookmarks");
  return data;
}

// GET /users/suggestions?limit=10 (also supports page)
export async function getFollowSuggestions(page = 1, limit = 10) {
  const { data } = await api.get("/users/suggestions", {
    params: { page, limit },
  });
  return data;
}

// GET /users/:userId/profile
export async function getUserProfile(userId: string) {
  const { data } = await api.get(`/users/${userId}/profile`);
  return data;
}

// PUT /users/:userId/follow (toggle)
export async function toggleFollow(userId: string) {
  const { data } = await api.put(`/users/${userId}/follow`);
  return data;
}

// GET /users/:userId/posts
export async function getUserPosts(userId: string) {
  const { data } = await api.get(`/users/${userId}/posts`);
  return data;
}

// ---------- Posts ----------

// GET /posts
export async function getAllPosts() {
  const { data } = await api.get("/posts");
  return data;
}

// GET /posts/feed?only=following&limit=10 (supports only, hasImage, page/limit, cursor/limit)
export async function getFeed(
  page = 1,
  limit = 20,
  only?: "following" | "me" | "all",
) {
  const { data } = await api.get("/posts/feed", {
    params: { page, limit, ...(only ? { only } : {}) },
  });
  return data;
}

// POST /posts — always form-data { body?, image?, privacy? }
export async function createPostRequest(
  body: string,
  image?: File | null,
  privacy?: PostPrivacy,
) {
  const formData = new FormData();
  if (body) formData.append("body", body);
  if (image) formData.append("image", image);
  if (privacy) formData.append("privacy", privacy);
  const { data } = await api.post("/posts", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

// GET /posts/:postId
export async function getSinglePost(postId: string) {
  const { data } = await api.get(`/posts/${postId}`);
  return data;
}

// PUT /posts/:postId — JSON { body?, privacy? } normally,
// form-data when an image is attached (mirrors the reference app).
export async function updatePost(
  postId: string,
  input: { body?: string; image?: File | null; privacy?: PostPrivacy },
) {
  const { body, image, privacy } = input;
  if (image) {
    const formData = new FormData();
    if (body !== undefined) formData.append("body", body);
    formData.append("image", image);
    if (privacy !== undefined) formData.append("privacy", privacy);
    const { data } = await api.put(`/posts/${postId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  }
  const { data } = await api.put(`/posts/${postId}`, {
    ...(body !== undefined ? { body } : {}),
    ...(privacy !== undefined ? { privacy } : {}),
  });
  return data;
}

// DELETE /posts/:postId
export async function deletePost(postId: string) {
  const { data } = await api.delete(`/posts/${postId}`);
  return data;
}

// PUT /posts/:postId/like (toggle)
export async function toggleLike(postId: string) {
  const { data } = await api.put(`/posts/${postId}/like`);
  return data;
}

// GET /posts/:postId/likes?page=1&limit=20
export async function getPostLikes(postId: string, page = 1, limit = 20) {
  const { data } = await api.get(`/posts/${postId}/likes`, {
    params: { page, limit },
  });
  return data;
}

// PUT /posts/:postId/bookmark (toggle)
export async function toggleBookmark(postId: string) {
  const { data } = await api.put(`/posts/${postId}/bookmark`);
  return data;
}

// POST /posts/:postId/share — omit the payload entirely when there is no
// text (the server rejects an empty `body` string with
// `"body" is not allowed to be empty`).
export async function sharePost(postId: string, body?: string) {
  const text = body?.trim();
  const { data } = await api.post(
    `/posts/${postId}/share`,
    text ? { body: text } : undefined,
  );
  return data;
}

// ---------- Comments & Replies ----------

// GET /posts/:postId/comments?page=1&limit=10
export async function getPostComments(postId: string, page = 1, limit = 10) {
  const { data } = await api.get(`/posts/${postId}/comments`, {
    params: { page, limit },
  });
  return data;
}

// POST /posts/:postId/comments — JSON { content } normally,
// form-data { content, image } when an image is attached.
export async function createComment(
  postId: string,
  content: string,
  image?: File | null,
) {
  if (image) {
    const formData = new FormData();
    if (content) formData.append("content", content);
    formData.append("image", image);
    const { data } = await api.post(`/posts/${postId}/comments`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  }
  const { data } = await api.post(`/posts/${postId}/comments`, { content });
  return data;
}

// GET /posts/:postId/comments/:commentId/replies?page=1&limit=10
export async function getCommentReplies(
  postId: string,
  commentId: string,
  page = 1,
  limit = 10,
) {
  const { data } = await api.get(
    `/posts/${postId}/comments/${commentId}/replies`,
    { params: { page, limit } },
  );
  return data;
}

// POST /posts/:postId/comments/:commentId/replies — JSON normally, form-data with image.
export async function createReply(
  postId: string,
  commentId: string,
  content: string,
  image?: File | null,
) {
  if (image) {
    const formData = new FormData();
    if (content) formData.append("content", content);
    formData.append("image", image);
    const { data } = await api.post(
      `/posts/${postId}/comments/${commentId}/replies`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data;
  }
  const { data } = await api.post(
    `/posts/${postId}/comments/${commentId}/replies`,
    { content },
  );
  return data;
}

// PUT /posts/:postId/comments/:commentId — JSON normally, form-data with image.
export async function updateComment(
  postId: string,
  commentId: string,
  content: string,
  image?: File | null,
) {
  if (image) {
    const formData = new FormData();
    if (content) formData.append("content", content);
    formData.append("image", image);
    const { data } = await api.put(
      `/posts/${postId}/comments/${commentId}`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data;
  }
  const { data } = await api.put(`/posts/${postId}/comments/${commentId}`, {
    content,
  });
  return data;
}

// DELETE /posts/:postId/comments/:commentId
export async function deleteComment(postId: string, commentId: string) {
  const { data } = await api.delete(`/posts/${postId}/comments/${commentId}`);
  return data;
}

// PUT /posts/:postId/comments/:commentId/like (toggle)
export async function toggleCommentLike(postId: string, commentId: string) {
  const { data } = await api.put(
    `/posts/${postId}/comments/${commentId}/like`,
  );
  return data;
}

// ---------- Notifications ----------

// GET /notifications?page=&limit= (omit `unread` unless filtering — the
export async function getNotifications(
  page = 1,
  limit = 10,
  unread = false,
) {
  const { data } = await api.get("/notifications", {
    params: { page, limit, ...(unread ? { unread: true } : {}) },
  });
  return data;
}

// GET /notifications/unread-count
export async function getUnreadCount() {
  const { data } = await api.get("/notifications/unread-count");
  return data;
}

// PATCH /notifications/:notificationId/read
export async function markNotificationRead(notificationId: string) {
  const { data } = await api.patch(`/notifications/${notificationId}/read`);
  return data;
}

// PATCH /notifications/read-all
export async function markAllNotificationsRead() {
  const { data } = await api.patch("/notifications/read-all");
  return data;
}

export function logout() {
  clearToken();
}
