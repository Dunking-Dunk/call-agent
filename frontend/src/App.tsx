import { Route, Routes } from 'react-router'
import { MainLayout } from './components/global/main-layout'
import Landing from './app/landing/page'
import Login from './app/auth/login/login'
import Signup from './app/auth/register/signup'
import PageNotFound from './app/page-not-found/page'
import Dashboard from './app/main/page'
import AuthLayout from './app/auth/layout'
import VerifyEmail from './app/auth/verify/page'
import VerifyRequired from './app/auth/verify-required/page'
import { ProtectedRoute, PublicOnlyRoute } from './components/auth/protected-route'
import DashboardLayout from './app/main/layout'

function App() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/landing" element={<Landing />} />
        
        <Route path="/auth" element={<AuthLayout />}>
          <Route path="login" element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          } />
          <Route path="signup" element={
            <PublicOnlyRoute>
              <Signup />
            </PublicOnlyRoute>
          } />
          <Route path="verify" element={<VerifyEmail />} />
          <Route path="verify-required" element={<VerifyRequired />} />
        </Route>
        
        {/* Protected routes (require authentication) */}
        <Route element={<DashboardLayout/>}>
        <Route path="/*" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        </Route>
      
        
        {/* 404 route */}
        <Route path="*" element={<PageNotFound/>} />
      </Routes>
    </MainLayout>
  )
}

export default App
 
 