import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import MaterialsPage from './pages/MaterialsPage';
import MatchingPage from './pages/MatchingPage';
import ImportPage from './pages/ImportPage';
import ReviewQueuePage from './pages/ReviewQueuePage';
import CommonMaterialsPage from './pages/CommonMaterialsPage';
import PlaceholderPage from './pages/PlaceholderPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          {/* Executive Dashboard */}
          <Route index element={<Dashboard />} />

          {/* Materials Master Catalog */}
          <Route path="materials" element={<MaterialsPage />} />

          {/* Live CPSE Dataset Import */}
          <Route path="import" element={<ImportPage />} />

          {/* AI Material Matching Engine */}
          <Route path="matching" element={<MatchingPage />} />
          <Route path="review-queue" element={<ReviewQueuePage />} />
          <Route path="common-materials" element={<CommonMaterialsPage />} />
          <Route
            path="analytics"
            element={
              <PlaceholderPage
                title="Procurement Harmonization Analytics"
                description="Cross-CPSE procurement intelligence, vendor overlap, volume consolidation potential, and pricing disparity analytics."
                phase="Phase 10"
              />
            }
          />

          {/* Fallback to Dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
