import AuthForm from '../components/AuthForm';

interface LoginPageProps {
  onNavigate: (path: string) => void;
}

export default function LoginPage({ onNavigate }: LoginPageProps) {
  return <AuthForm mode="login" onNavigate={onNavigate} />;
}
