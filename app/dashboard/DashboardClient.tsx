"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminDashboard from '../../src/components/AdminDashboard';
import UserDashboard from '../../src/components/UserDashboard';

export default function DashboardClient() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (!res.ok) {
          if (mounted) router.replace('/login');
          return;
        }
        const data = await res.json();
        if (mounted) setUserProfile(data.user);
      } catch {
        if (mounted) router.replace('/login');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUserProfile(null);
    router.replace('/');
  };

  if (loading || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto" />
          <p className="mt-4 text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  return userProfile.role === 'admin' ? (
    <AdminDashboard userProfile={userProfile} onLogout={handleLogout} />
  ) : (
    <UserDashboard userProfile={userProfile} onLogout={handleLogout} />
  );
}
