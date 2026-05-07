import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/shared/Layout';
import Home from './pages/Home';
import TemplateGallery from './pages/TemplateGallery';
import AvatarCreator from './pages/AvatarCreator';
import AvatarLibrary from './pages/AvatarLibrary';
import FlowRunner from './pages/FlowRunner';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import History from './pages/History';
import Settings from './pages/Settings';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/templates" element={<TemplateGallery />} />
        <Route path="/template/:templateId" element={<FlowRunner />} />
        <Route path="/project/:projectId" element={<FlowRunner />} />
        <Route path="/avatar/create" element={<AvatarCreator />} />
        <Route path="/avatar/library" element={<AvatarLibrary />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/history" element={<History />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
