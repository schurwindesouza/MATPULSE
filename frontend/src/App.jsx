import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import MaterialsPage from './pages/MaterialsPage';
import MatchingPage from './pages/MatchingPage';
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

          {/* AI Material Matching Engine */}
          <Route path="matching" element={<MatchingPage />} />
          <Route
            path="review-queue"
            element={
              <PlaceholderPage
                title="Human Review & Harmonization Queue"
                description="Review pending AI recommendations, inspect technical discrepancies, approve matches with Common National Material Codes, or reject false candidates."
                phase="Phase 8"
              />
            }
          />
          <Route
            path="common-materials"
            element={
              <PlaceholderPage
                title="Common National Material Codes"
                description="Master catalog of standardized national material codes with linked CPSE catalog mappings and provenance tracking."
                phase="Phase 9"
              />
            }
          />
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
