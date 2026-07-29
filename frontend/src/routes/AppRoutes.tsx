import { Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage } from '../pages/auth/LoginPage'
import { RegistroPage } from '../pages/auth/RegistroPage'
import { VerificarEmailPage } from '../pages/auth/VerificarEmailPage'
import { CalendarioPage } from '../pages/CalendarioPage'
import { HistoricoPage } from '../pages/HistoricoPage'
import { FinanceiroPage } from '../pages/FinanceiroPage'
import { AppLayout } from '../components/layout/AppLayout'
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
            <AppLayout>
              <CalendarioPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/historico"
        element={
          <ProtectedRoute>
            <AppLayout>
              <HistoricoPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/financeiro"
        element={
          <ProtectedRoute>
            <AppLayout>
              <FinanceiroPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}