"use client";

import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner';
import { UserCircle, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBranding } from './BrandingProvider';
import SiteFooter from './SiteFooter';
import AnimatedBackground from './AnimatedBackground';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const { branding } = useBranding();
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [registerData, setRegisterData] = useState({
    nis: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error('Login Gagal', { description: data.error || 'Username atau password salah' });
        return;
      }
      toast.success('Login Berhasil', { description: 'Selamat datang di Sistem Pemilihan OSIS' });
      onLoginSuccess();
    } catch (error) {
      toast.error('Terjadi kesalahan saat login');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (registerData.password !== registerData.confirmPassword) {
      toast.error('Password tidak cocok', { description: 'Pastikan konfirmasi password sama dengan password' });
      return;
    }
    if (registerData.password.length < 6) {
      toast.error('Password terlalu pendek', { description: 'Password minimal 6 karakter' });
      return;
    }
    setRegisterLoading(true);
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nis: registerData.nis,
          username: registerData.username,
          password: registerData.password,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error('Pendaftaran Gagal', { description: data.error || 'Terjadi kesalahan' });
        return;
      }
      toast.success('Pendaftaran Berhasil', { description: 'Anda otomatis login.' });
      onLoginSuccess();
    } catch (error) {
      toast.error('Terjadi kesalahan saat pendaftaran');
    } finally {
      setRegisterLoading(false);
    }
  };

  const tabVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 }
  };

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100 dark:from-[#111110] dark:via-[#1a1917] dark:to-[#111110]">
      <AnimatedBackground />
      <div className="relative z-10 flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src={branding.logo_url || '/cendekia.svg'}
            alt={`Logo ${branding.school_name}`}
            className="w-20 h-20 mx-auto object-contain mb-4 animate-float-slow drop-shadow-lg"
          />
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {branding.short_name}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">{branding.school_name}</p>
        </div>

        <Card className="backdrop-blur-md bg-white/80 dark:bg-[#1a1917]/70 border-white/40 dark:border-white/[0.06] shadow-xl">
          <CardHeader>
            <CardTitle>Masuk atau Daftar</CardTitle>
            <CardDescription>Gunakan akun untuk memilih atau kelola OSIS.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'register')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Daftar</TabsTrigger>
              </TabsList>

              <AnimatePresence mode="wait">
                <TabsContent value="login" key="login">
                  <motion.form
                    onSubmit={handleLogin}
                    variants={tabVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="space-y-4 mt-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="login-username">Username</Label>
                      <div className="relative">
                        <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="login-username"
                          className="pl-9"
                          value={loginData.username}
                          onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="login-password"
                          type="password"
                          className="pl-9"
                          value={loginData.password}
                          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={loginLoading}>
                      {loginLoading ? 'Memproses...' : 'Masuk'}
                    </Button>
                  </motion.form>
                </TabsContent>

                <TabsContent value="register" key="register">
                  <motion.form
                    onSubmit={handleRegister}
                    variants={tabVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="space-y-4 mt-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="reg-nis">NIS</Label>
                      <Input
                        id="reg-nis"
                        placeholder="Masukkan NIS Anda"
                        value={registerData.nis}
                        onChange={(e) => setRegisterData({ ...registerData, nis: e.target.value })}
                        required
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        NIS harus sudah didaftarkan admin. Nama & kelas akan otomatis terisi.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-username">Username</Label>
                      <Input
                        id="reg-username"
                        value={registerData.username}
                        onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-password">Password</Label>
                      <Input
                        id="reg-password"
                        type="password"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-confirm">Konfirmasi Password</Label>
                      <Input
                        id="reg-confirm"
                        type="password"
                        value={registerData.confirmPassword}
                        onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={registerLoading}>
                      {registerLoading ? 'Memproses...' : 'Daftar'}
                    </Button>
                  </motion.form>
                </TabsContent>
              </AnimatePresence>
            </Tabs>
          </CardContent>
        </Card>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
