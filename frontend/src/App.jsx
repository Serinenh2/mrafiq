import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Companies from './pages/Companies'
import CompanyDetail from './pages/CompanyDetail'
import ResponsableTraitements from './pages/ResponsableTraitements'
import DPO from './pages/DPO'
import ProcessingSheet from './pages/ProcessingSheet'
import Registre from './pages/Registre'
import Actions from './pages/Actions'
import Diagnostics from './pages/Diagnostics'
import Questionnaire from './pages/Questionnaire'
import Missions from './pages/Missions'
import MissionDetail from './pages/MissionDetail'
import Cartographie from './pages/Cartographie'
import Reports from './pages/Reports'
import DocumentsValides from './pages/DocumentsValides'
import Assistant from './pages/Assistant'
import { Spinner } from './components/ui'

function Protected({ children }) {
  const { user, ready } = useAuth()
  const loc = useLocation()
  if (!ready) return <Spinner />
  if (!user) return <Navigate to="/login" state={{ from: loc }} replace />
  return children
}

function Home() {
  const { user } = useAuth()
  // Le rôle "Utilisateur organisation" n'a accès qu'au questionnaire (§33).
  return user?.role === 'org_user' ? <Navigate to="/diagnostics" replace /> : <Dashboard />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Protected><Layout /></Protected>}>
        <Route path="/" element={<Home />} />
        <Route path="/companies" element={<Companies />} />
        <Route path="/companies/:id" element={<CompanyDetail />} />
        <Route path="/companies/:id/processings/:pid" element={<ProcessingSheet />} />
        <Route path="/responsable-traitements" element={<ResponsableTraitements />} />
        <Route path="/dpo" element={<DPO />} />
        <Route path="/missions" element={<Missions />} />
        <Route path="/missions/:id" element={<MissionDetail />} />
        <Route path="/diagnostics" element={<Diagnostics />} />
        <Route path="/questionnaire" element={<Questionnaire />} />
        <Route path="/registre" element={<Registre />} />
        <Route path="/cartographie" element={<Cartographie />} />
        <Route path="/actions" element={<Actions />} />
        <Route path="/documents-valides" element={<DocumentsValides />} />
        <Route path="/assistant" element={<Assistant />} />
        <Route path="/rapports" element={<Reports />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
