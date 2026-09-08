import { useEffect, useState } from 'react';
import AuthenticatedShell from './components/AuthenticatedShell';
import LoginPage from './pages/LoginPage';
import AssessmentPage from './pages/AssessmentPage';
import RecommendationsPage from './pages/RecommendationsPage';
import SkillGapPage from './pages/SkillGapPage';
import SkillGapHubPage from './pages/SkillGapHubPage';
import CareerGuidePage from './pages/CareerGuidePage';
import ProfilePage from './pages/ProfilePage';
import RegisterPage from './pages/RegisterPage';
import StudentDashboardPage from './pages/StudentDashboardPage';
import SavedCareersPage from './pages/SavedCareersPage';
import LandingPage from './pages/LandingPage';
import AssistantPage from './pages/AssistantPage';
import WorkspacePage from './pages/WorkspacePage';
import ResumeAnalyzerPage from './pages/ResumeAnalyzerPage';
import { useAuthStore } from './state/auth';

export default function App() {
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const initialized = useAuthStore((state) => state.initialized);
  const initialize = useAuthStore((state) => state.initialize);
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  const navigate = (nextPath: string) => {
    window.history.pushState({}, '', nextPath);
    setPath(nextPath);
  };

  if (!initialized || isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#0d0d0c] text-sm text-[#b8b3a8]">Loading your workspace...</div>;
  }

  if (user) {
    const skillGapMatch = path.match(/^\/skill-gap\/([^/]+)$/);
    const careerGuideMatch = path.match(/^\/career-guide\/([^/]+)$/);
    const resourcesMatch = path.match(/^\/resources\/([^/]+)$/);
    const projectsMatch = path.match(/^\/projects\/([^/]+)$/);
    return (
      <AuthenticatedShell onNavigate={navigate}>
        {path === '/profile' ? <ProfilePage /> :
         path === '/assessment' ? <AssessmentPage /> :
         path === '/recommendations' ? <RecommendationsPage onNavigate={navigate} /> :
         path === '/saved' ? <SavedCareersPage onNavigate={navigate} /> :
         path === '/resume-analyzer' ? <ResumeAnalyzerPage onNavigate={navigate} /> :
         path === '/career-guide-ai' ? <AssistantPage /> :
         path === '/skill-gap' ? <SkillGapHubPage onNavigate={navigate} /> :
         path === '/roadmap' ? <CareerGuidePage onNavigate={navigate} /> :
         path === '/resources' ? <WorkspacePage type="resources" title="Resources" description="Learning material selected for your current career direction." /> :
         path === '/projects' ? <WorkspacePage type="projects" title="Projects" description="Build practical projects that strengthen the skills required for your target career." /> :
         skillGapMatch ? <SkillGapPage careerId={skillGapMatch[1]} onNavigate={navigate} /> :
         careerGuideMatch ? <CareerGuidePage careerId={careerGuideMatch[1]} onNavigate={navigate} /> :
         resourcesMatch ? <WorkspacePage careerId={resourcesMatch[1]} type="resources" title="Resources" description="Learning material selected for your current career direction." /> :
         projectsMatch ? <WorkspacePage careerId={projectsMatch[1]} type="projects" title="Projects" description="Build practical projects that strengthen the skills required for your target career." /> :
         <StudentDashboardPage onNavigate={navigate} />}
      </AuthenticatedShell>
    );
  }

  return path === '/' ? <LandingPage onNavigate={navigate} /> : path === '/register' ? <RegisterPage onNavigate={navigate} /> : <LoginPage onNavigate={navigate} />;
}
