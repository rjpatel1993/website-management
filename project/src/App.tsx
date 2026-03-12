import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/Auth/LoginForm';
import { DashboardLayout } from './components/Layout/DashboardLayout';
import { DashboardView } from './components/Dashboard/DashboardView';
import { ProjectsList } from './components/Projects/ProjectsList';
import { ProjectDetail } from './components/Projects/ProjectDetail';
import { SettingsView } from './components/Settings/SettingsView';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  const handleNavigate = (view: string) => {
    setCurrentView(view);
    setSelectedProjectId(null);
  };

  const handleSelectProject = (id: string) => {
    setSelectedProjectId(id);
  };

  const handleBackToProjects = () => {
    setSelectedProjectId(null);
  };

  return (
    <DashboardLayout currentView={currentView} onNavigate={handleNavigate}>
      {currentView === 'dashboard' && !selectedProjectId && (
        <DashboardView onProjectClick={handleSelectProject} />
      )}
      {currentView === 'dashboard' && selectedProjectId && (
        <ProjectDetail projectId={selectedProjectId} onBack={handleBackToProjects} />
      )}
      {currentView === 'projects' && !selectedProjectId && (
        <ProjectsList onSelectProject={handleSelectProject} />
      )}
      {currentView === 'projects' && selectedProjectId && (
        <ProjectDetail projectId={selectedProjectId} onBack={handleBackToProjects} />
      )}
      {currentView === 'team' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Team</h1>
            <p className="text-slate-600">Manage your team members</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <p className="text-slate-500">Team management coming soon</p>
          </div>
        </div>
      )}
      {currentView === 'settings' && <SettingsView />}
    </DashboardLayout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
