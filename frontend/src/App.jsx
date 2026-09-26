import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import MaterialsPage from './pages/MaterialsPage';
import MatchingPage from './pages/MatchingPage';
import ImportPage from './pages/ImportPage';
import ReviewQueuePage from './pages/ReviewQueuePage';
import CommonMaterialsPage from './pages/CommonMaterialsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Showcase Landing & Legal Pages */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />

        {/* Enterprise CPSE Platform Layout */}
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/materials" element={<MaterialsPage />} />
          <Route path="/import" element={<ImportPage />} />
          <Route path="/matching" element={<MatchingPage />} />
          <Route path="/review-queue" element={<ReviewQueuePage />} />
          <Route path="/common-materials" element={<CommonMaterialsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* Fallback to Public Landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
