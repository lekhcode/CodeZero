import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthLayout } from "@/layouts/AuthLayout";
import { AppLayout } from "@/layouts/AppLayout";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { GitHubCallbackPage } from "@/pages/auth/GitHubCallbackPage";
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { VerifyEmailPage } from "@/pages/auth/VerifyEmailPage";
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "@/pages/auth/ResetPasswordPage";
import { SettingsPage } from "@/pages/settings/SettingsPage";
import { DashboardPage } from "@/pages/dashboard/DashboardPage";
import { LabPage } from "@/pages/lab/LabPage";
import { TodayPage } from "@/pages/today/TodayPage";
import { SubmissionsPage } from "@/pages/submissions/SubmissionsPage";
import { TemplatesPage } from "@/pages/templates/TemplatesPage";
import { UserSchedulesPage } from "@/pages/schedules/UserSchedulesPage";
import { ProblemDetailPage } from "@/pages/problems/ProblemDetailPage";
import { BrainCachePage } from "@/pages/brainCache/BrainCachePage";
import { CommunityHubPage } from "@/pages/community/CommunityHubPage";
import { CommunityBrowsePage } from "@/pages/community/CommunityBrowsePage";
import { CommunityCreatePostPage } from "@/pages/community/CommunityCreatePostPage";
import { CommunityPostPage } from "@/pages/community/CommunityPostPage";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth/github/callback" element={<GitHubCallbackPage />} />
        <Route path="/auth/github/success" element={<GitHubCallbackPage />} />

        {/* Login uses its own full-viewport layout — must not sit inside AuthLayout (transform breaks position:fixed). */}
        <Route path="/login" element={<LoginPage />} />

        <Route element={<AuthLayout />}>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/lab" element={<LabPage />} />
            <Route path="/today" element={<TodayPage />} />
            <Route path="/submissions" element={<SubmissionsPage />} />
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/schedules" element={<UserSchedulesPage />} />
            <Route path="/brain-cache" element={<BrainCachePage />} />
            <Route path="/community" element={<CommunityHubPage />} />
            <Route path="/community/browse" element={<CommunityBrowsePage />} />
            <Route path="/community/new" element={<CommunityCreatePostPage />} />
            <Route path="/community/posts/:id" element={<CommunityPostPage />} />
            <Route path="/problems/:slug" element={<ProblemDetailPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/community" replace />} />
        <Route path="*" element={<Navigate to="/community" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
