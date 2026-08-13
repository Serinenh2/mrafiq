import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Companies from './pages/Companies'
import CompanyDetail from './pages/CompanyDetail'
import ProcessingSheet from './pages/ProcessingSheet'
import Registre from './pages/Registre'
import Actions from './pages/Actions'
import Diagnostics from './pages/Diagnostics'
import Missions from './pages/Missions'
import MissionDetail from './pages/MissionDetail'
import Cartographie from './pages/Cartographie'
import Reports from './pages/Reports'
import { Spinner } from './components/ui'

function Protected({ children }) {
  const { user, ready } = useAuth()
  const loc = useLocation()
  if (!ready) return <Spinner />
  if (!user) return <Navigate to="/login" state={{ from: loc }} replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Protected><Layout /></Protected>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/companies" element={<Companies />} />
        <Route path="/companies/:id" element={<CompanyDetail />} />
        <Route path="/companies/:id/processings/:pid" element={<ProcessingSheet />} />
        <Route path="/missions" element={<Missions />} />
        <Route path="/missions/:id" element={<MissionDetail />} />
        <Route path="/diagnostics" element={<Diagnostics />} />
        <Route path="/registre" element={<Registre />} />
        <Route path="/cartographie" element={<Cartographie />} />
        <Route path="/actions" element={<Actions />} />
        <Route path="/rapports" element={<Reports />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
