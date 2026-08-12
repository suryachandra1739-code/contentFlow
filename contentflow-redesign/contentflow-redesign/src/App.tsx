import { Routes, Route, Navigate } from 'react-router'
import { ThemeProvider } from '@/lib/theme'
import AppLayout from '@/components/AppLayout'
import ClientLayout from '@/components/ClientLayout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Clients from '@/pages/Clients'
import NewPost from '@/pages/NewPost'
import PostDetail from '@/pages/PostDetail'
import Analytics from '@/pages/Analytics'
import DesignSystem from '@/pages/DesignSystem'
import { ClientOverview, ClientHistory, ClientActivity, ClientReview } from '@/pages/ClientPortal'

const withApp = (el: React.ReactNode) => <AppLayout>{el}</AppLayout>
const withClient = (el: React.ReactNode) => <ClientLayout>{el}</ClientLayout>

export default function App() {
  return (
    <ThemeProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Agency app */}
        <Route path="/" element={withApp(<Dashboard />)} />
        <Route path="/clients" element={withApp(<Clients />)} />
        <Route path="/posts/new" element={withApp(<NewPost />)} />
        <Route path="/posts/:id" element={withApp(<PostDetail />)} />
        <Route path="/analytics" element={withApp(<Analytics />)} />
        <Route path="/design-system" element={withApp(<DesignSystem />)} />

        {/* Client portal (separate shell, role=client) */}
        <Route path="/client-portal" element={withClient(<ClientOverview />)} />
        <Route path="/client-portal/history" element={withClient(<ClientHistory />)} />
        <Route path="/client-portal/activity" element={withClient(<ClientActivity />)} />
        <Route path="/client-portal/review/:id" element={withClient(<ClientReview />)} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ThemeProvider>
  )
}
