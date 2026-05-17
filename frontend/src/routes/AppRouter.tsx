import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthLayout } from "@/layouts/AuthLayout";
import { AppLayout } from "@/layouts/AppLayout";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { DashboardPage } from "@/pages/dashboard/DashboardPage";
import { TodayPage } from "@/pages/today/TodayPage";
import { SubmissionsPage } from "@/pages/submissions/SubmissionsPage";
import { TemplatesPage } from "@/pages/templates/TemplatesPage";
import { UserSchedulesPage } from "@/pages/schedules/UserSchedulesPage";
import { ProblemDetailPage } from "@/pages/problems/ProblemDetailPage";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/today" element={<TodayPage />} />
            <Route path="/submissions" element={<SubmissionsPage />} />
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/schedules" element={<UserSchedulesPage />} />
            <Route path="/problems/:slug" element={<ProblemDetailPage />} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
