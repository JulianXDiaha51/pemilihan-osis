"use client";

import { useRouter } from 'next/navigation';
import LoginPage from '../../src/components/LoginPage';

export default function LoginPageClient() {
  const router = useRouter();
  return <LoginPage onLoginSuccess={() => router.push('/dashboard')} />;
}
