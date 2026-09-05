import AuthForm from '../components/AuthForm';

interface RegisterPageProps {
  onNavigate: (path: string) => void;
}

export default function RegisterPage({ onNavigate }: RegisterPageProps) {
  return <AuthForm mode="register" onNavigate={onNavigate} />;
}
