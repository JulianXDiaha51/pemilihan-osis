import type { Metadata } from 'next';
import LoginPageClient from './LoginPageClient';

export const metadata: Metadata = {
  title: 'Login',
  description:
    'Masuk ke Sistem Pemilihan OSIS 2026 SMK Cendekia Wanasari untuk memberikan suara.',
  alternates: { canonical: '/login' },
};

export default function LoginRoute() {
  return <LoginPageClient />;
}
