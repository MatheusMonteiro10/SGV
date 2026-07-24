import { Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage } from '../pages/auth/LoginPage'
import { RegistroPage } from '../pages/auth/RegistroPage'
import { VerificarEmailPage } from '../pages/auth/VerificarEmailPage'
import { DashboardPage } from '../pages/DashboardPage'
import { ProtectedRoute } from './ProtectedRoute'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cadastro" element={<RegistroPage />} />
      <Route path="/verificar-email" element={<VerificarEmailPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}