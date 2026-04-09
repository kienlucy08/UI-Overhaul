import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import QADashboardPage from './pages/QADashboardPage'
import SiteDetailPage from './pages/SiteDetailPage'
import SiteVisitPage from './pages/SiteVisitPage'
import QCEditorPage from './pages/QCEditorPage'
import GuyFacilitiesQCPage from './pages/GuyFacilitiesQCPage'
import PlumbTwistQCPage from './pages/PlumbTwistQCPage'
import ServiceCOPQCPage from './pages/ServiceCOPQCPage'
import StructureClimbQCPage from './pages/StructureClimbQCPage'
import SitesListPage from './pages/SitesListPage'
import ComponentLibraryPage from './pages/ComponentLibraryPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<QADashboardPage />} />
          <Route path="sites" element={<SitesListPage />} />
          <Route path="sites/:siteId" element={<SiteDetailPage />} />
          <Route path="sites/:siteId/summary" element={<Navigate to="../" relative="path" replace />} />
          <Route path="sites/:siteId/visits/:visitId" element={<SiteVisitPage />} />
          <Route path="surveys/survey_guy/qc" element={<GuyFacilitiesQCPage />} />
          <Route path="surveys/survey_pt/qc" element={<PlumbTwistQCPage />} />
          <Route path="surveys/survey_cop/qc" element={<ServiceCOPQCPage />} />
          <Route path="surveys/survey_climb/qc" element={<StructureClimbQCPage />} />
          <Route path="surveys/:surveyId/qc" element={<QCEditorPage />} />
          <Route path="components" element={<ComponentLibraryPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
