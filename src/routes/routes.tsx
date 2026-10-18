import { createBrowserRouter, Navigate, type RouteObject } from "react-router-dom";
import NotFound from "../pages/NotFound/NotFound";
import Feed from "../pages/Feed/Feed";
import Profile from "../pages/Profile/Profile";
import UserProfile from "../pages/UserProfile/UserProfile";
import PostDetails from "../pages/PostDetails/PostDetails";
import Notifications from "../pages/Notifications/Notifications";
import Suggestions from "../pages/Suggestions/Suggestions";
import Saved from "../pages/Saved/Saved";
import MyPosts from "../pages/MyPosts/MyPosts";
import Community from "../pages/Community/Community";
import Settings from "../pages/Settings/Settings";
import AuthLayout from "../layout/AuthLayout/AuthLayout";
import Login from "../pages/Authentication/Login/Login";
import Register from "../pages/Authentication/Register/Register";
import { MainLayout } from "../layout/MainLayout/MainLayout";
import { RequireAuth } from "./RequireAuth";

const mainChildren: RouteObject[] = [
  { index: true, element: <Feed /> },
  { path: "feed", element: <Feed /> },
  { path: "profile", element: <Profile /> },
  { path: "users/:userId", element: <UserProfile /> },
  { path: "posts/:postId", element: <PostDetails /> },
  { path: "notifications", element: <Notifications /> },
  { path: "suggestions", element: <Suggestions /> },
  { path: "saved", element: <Saved /> },
  { path: "my-posts", element: <MyPosts /> },
  { path: "community", element: <Community /> },
  { path: "settings", element: <Settings /> },
  { path: "*", element: <NotFound /> },
];

export const router = createBrowserRouter([
  {
    path: "",
    element: <RequireAuth />,
    children: [
      {
        path: "",
        element: <MainLayout />,
        children: mainChildren,
      },
    ],
  },
  {
    path: "auth",
    element: <AuthLayout />,
    children: [
      { index: true, element: <Navigate to="login" replace /> },
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },
      { path: "*", element: <NotFound /> },
    ],
  },
  { path: "*", element: <NotFound /> },
]);
