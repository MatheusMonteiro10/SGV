import { Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage } from '../pages/auth/LoginPage'
import { RegistroPage } from '../pages/auth/RegistroPage'
import { VerificarEmailPage } from '../pages/auth/VerificarEmailPage'
import { EsqueciSenhaPage } from '../pages/auth/EsqueciSenhaPage'
import { RedefinirSenhaPage } from '../pages/auth/RedefinirSenhaPage'
import { CalendarioPage } from '../pages/CalendarioPage'
import { HistoricoPage } from '../pages/HistoricoPage'
import { DashboardPage } from '../pages/DashboardPage'
import { AppLayout } from '../components/layout/AppLayout'
import { ProtectedRoute } from './ProtectedRoute'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cadastro" element={<RegistroPage />} />
      <Route path="/verificar-email" element={<VerificarEmailPage />} />
      <Route path="/esqueci-senha" element={<EsqueciSenhaPage />} />
      <Route path="/redefinir-senha" element={<RedefinirSenhaPage />} />

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
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppLayout>
              <DashboardPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}