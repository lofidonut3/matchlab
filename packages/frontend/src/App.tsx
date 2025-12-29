import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './stores/auth.store'

// Layouts
import MainLayout from './layouts/MainLayout'
import AuthLayout from './layouts/AuthLayout'

// Pages
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import OnboardingPage from './pages/onboarding/OnboardingPage'
import RecommendPage from './pages/RecommendPage'
import ExplorePage from './pages/ExplorePage'
import ProfileDetailPage from './pages/ProfileDetailPage'
import InboxPage from './pages/InboxPage'
import TeamListPage from './pages/team/TeamListPage'
import TeamDetailPage from './pages/team/TeamDetailPage'
import CheckInPage from './pages/team/CheckInPage'
import MyProfilePage from './pages/profile/MyProfilePage'
import EditProfilePage from './pages/profile/EditProfilePage'
import NotificationsPage from './pages/NotificationsPage'

// Components
import ProtectedRoute from './components/common/ProtectedRoute'
import LoadingSpinner from './components/common/LoadingSpinner'

function App() {
  const { checkAuth, isLoading, isAuthenticated, user } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // 온보딩 미완료 사용자는 온보딩 페이지로 리다이렉트
  const needsOnboarding = isAuthenticated && user && !user.profileCompleted

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      
      {/* Auth routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={
          isAuthenticated ? <Navigate to={needsOnboarding ? "/onboarding" : "/recommend"} replace /> : <LoginPage />
        } />
        <Route path="/register" element={
          isAuthenticated ? <Navigate to={needsOnboarding ? "/onboarding" : "/recommend"} replace /> : <RegisterPage />
        } />
      </Route>

      {/* Onboarding */}
      <Route path="/onboarding" element={
        <ProtectedRoute>
          {user?.profileCompleted ? <Navigate to="/recommend" replace /> : <OnboardingPage />}
        </ProtectedRoute>
      } />

      {/* Protected routes with main layout */}
      <Route element={
        <ProtectedRoute>
          {needsOnboarding ? <Navigate to="/onboarding" replace /> : <MainLayout />}
        </ProtectedRoute>
      }>
        <Route path="/recommend" element={<RecommendPage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/profile/:userId" element={<ProfileDetailPage />} />
        <Route path="/inbox" element={<InboxPage />} />
        <Route path="/teams" element={<TeamListPage />} />
        <Route path="/teams/:teamId" element={<TeamDetailPage />} />
        <Route path="/teams/:teamId/checkin" element={<CheckInPage />} />
        <Route path="/my-profile" element={<MyProfilePage />} />
        <Route path="/my-profile/edit" element={<EditProfilePage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
