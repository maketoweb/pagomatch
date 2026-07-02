import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import TenantsTable from './pages/TenantsTable'
import TenantDetail from './pages/TenantDetail'
import UsersManagement from './pages/UsersManagement'
import Subscriptions from './pages/Subscriptions'
import AppDownloads from './pages/AppDownloads'
import Messages from './pages/Messages'
import ApiDocs from './pages/ApiDocs'
import Instructions from './pages/Instructions'
import LogsView from './pages/LogsView'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/dashboard/master"
            element={
              <ProtectedRoute requiredRole="master">
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="tenants" element={<TenantsTable />} />
            <Route path="tenants/:id" element={<TenantDetail />} />
            <Route path="users" element={<UsersManagement />} />
            <Route path="subscriptions" element={<Subscriptions />} />
            <Route path="messages" element={<Messages />} />
            <Route path="downloads" element={<AppDownloads />} />
            <Route path="api-docs" element={<ApiDocs />} />
            <Route path="instructions" element={<Instructions />} />
            <Route path="logs" element={<LogsView />} />
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
