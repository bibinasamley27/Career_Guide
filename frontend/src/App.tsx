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
    return <div className="flex min-h-screen items-center justify-center bg-[#101b2d] text-sm text-slate-400">Loading your workspace...</div>;
  }

  if (user) {
    const skillGapMatch = path.match(/^\/skill-gap\/([^/]+)$/);
    const careerGuideMatch = path.match(/^\/career-guide\/([^/]+)$/);
    return (
      <AuthenticatedShell onNavigate={navigate}>
        {path === '/profile' ? <ProfilePage /> :
         path === '/assessment' ? <AssessmentPage /> :
         path === '/recommendations' ? <RecommendationsPage onNavigate={navigate} /> :
         path === '/saved' ? <SavedCareersPage onNavigate={navigate} /> :
         path === '/career-guide-ai' ? <AssistantPage /> :
         path === '/skill-gap' ? <SkillGapHubPage onNavigate={navigate} /> :
         path === '/roadmap' ? <CareerGuidePage onNavigate={navigate} /> :
         path === '/resources' ? <WorkspacePage type="resources" title="Resources" description="Keep useful learning material close while you build toward your next career move." /> :
         path === '/projects' ? <WorkspacePage type="projects" title="Projects" description="Turn your skills into practical work that gives your career direction and momentum." /> :
         skillGapMatch ? <SkillGapPage careerId={skillGapMatch[1]} onNavigate={navigate} /> :
         careerGuideMatch ? <CareerGuidePage careerId={careerGuideMatch[1]} onNavigate={navigate} /> :
         <StudentDashboardPage onNavigate={navigate} />}
      </AuthenticatedShell>
    );
  }

  return path === '/' ? <LandingPage onNavigate={navigate} /> : path === '/register' ? <RegisterPage onNavigate={navigate} /> : <LoginPage onNavigate={navigate} />;
}
