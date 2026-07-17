"use client";

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner';
import {
  LogOut,
  BarChart3,
  Users,
  Trash2,
  RefreshCw,
  Shield,
  UserPlus,
  GraduationCap,
  Settings as SettingsIcon,
  Menu,
} from 'lucide-react';
import CandidateManagement from './CandidateManagement';
import VoteResults from './VoteResults';
import VotersList from './VotersList';
import StudentManagement from './StudentManagement';
import SettingsPanel from './SettingsPanel';
import { useBranding } from './BrandingProvider';
import SiteFooter from './SiteFooter';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_ITEMS = [
  { value: 'overview', label: 'Hasil Voting', icon: BarChart3 },
  { value: 'candidates', label: 'Kandidat', icon: Users },
  { value: 'students', label: 'Kelola Siswa', icon: GraduationCap },
  { value: 'voters', label: 'Daftar Pemilih', icon: Users },
  { value: 'admins', label: 'Admin', icon: Shield },
  { value: 'settings', label: 'Pengaturan', icon: SettingsIcon },
] as const;

interface AdminDashboardProps {
  userProfile: any;
  onLogout: () => void;
}

export default function AdminDashboard({ userProfile, onLogout }: AdminDashboardProps) {
  const { branding } = useBranding();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalCandidates: 0,
    totalVotes: 0,
    totalVoters: 0,
    totalNonVoters: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [adminData, setAdminData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    nama_lengkap: '',
  });
  const [adminLoading, setAdminLoading] = useState(false);
  const [admins, setAdmins] = useState<Array<{ id: string; username: string; nama_lengkap: string; created_at: string }>>([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [deletingAdminId, setDeletingAdminId] = useState<string | null>(null);

  const fetchAdmins = async () => {
    setAdminsLoading(true);
    try {
      const res = await fetch('/api/users/admin', { cache: 'no-store' });
      if (!res.ok) {
        toast.error('Gagal memuat daftar admin');
        return;
      }
      const data = await res.json();
      setAdmins(data.admins || []);
    } catch {
      toast.error('Terjadi kesalahan saat memuat admin');
    } finally {
      setAdminsLoading(false);
    }
  };

  const handleDeleteAdmin = async (id: string, nama: string) => {
    if (id === userProfile.id) {
      toast.error('Tidak dapat menghapus akun sendiri');
      return;
    }
    if (!confirm(`Hapus admin "${nama}"?\n\nAkun akan dihapus permanen.`)) return;
    setDeletingAdminId(id);
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(id)}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        toast.error('Gagal hapus admin', { description: data.error || '' });
        return;
      }
      toast.success('Admin dihapus', { description: nama });
      fetchAdmins();
    } catch {
      toast.error('Terjadi kesalahan');
    } finally {
      setDeletingAdminId(null);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [refreshKey]);

  useEffect(() => {
    if (activeTab === 'admins') fetchAdmins();
  }, [activeTab, refreshKey]);

  const fetchStats = async () => {
    try {
      const [candidatesRes, votesRes, votersRes] = await Promise.all([
        fetch('/api/candidates', { cache: 'no-store' }),
        fetch('/api/votes/results', { cache: 'no-store' }),
        fetch('/api/voters', { cache: 'no-store' }),
      ]);

      if (candidatesRes.ok && votesRes.ok && votersRes.ok) {
        const candidatesData = await candidatesRes.json();
        const votesData = await votesRes.json();
        const votersData = await votersRes.json();

        setStats({
          totalCandidates: candidatesData.candidates.length,
          totalVotes: votesData.total_votes,
          totalVoters: votersData.total_voters,
          totalNonVoters: votersData.total_non_voters,
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetVotes = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus SEMUA data voting?\n\nTindakan ini TIDAK DAPAT DIBATALKAN.')) {
      return;
    }
    if (!confirm('Konfirmasi sekali lagi: hapus SEMUA data voting?')) {
      return;
    }

    try {
      const response = await fetch('/api/votes/reset', { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) {
        toast.error('Gagal Reset Voting', { description: data.error || 'Terjadi kesalahan' });
        return;
      }
      toast.success('Reset Berhasil', { description: 'Semua data voting telah dihapus' });
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      toast.error('Terjadi kesalahan saat reset voting');
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (adminData.password !== adminData.confirmPassword) {
      toast.error('Password tidak cocok');
      return;
    }
    if (adminData.password.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }

    setAdminLoading(true);
    try {
      const response = await fetch('/api/users/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: adminData.username,
          password: adminData.password,
          nama_lengkap: adminData.nama_lengkap,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        toast.error('Gagal Membuat Admin', { description: data.error || 'Terjadi kesalahan' });
        return;
      }

      toast.success('Admin Berhasil Dibuat', {
        description: `Admin ${adminData.nama_lengkap} berhasil didaftarkan`,
      });
      setAdminData({ username: '', password: '', confirmPassword: '', nama_lengkap: '' });
      fetchAdmins();
    } catch (error) {
      toast.error('Terjadi kesalahan saat membuat admin');
    } finally {
      setAdminLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#111110] dark:to-[#1a1917]">
      <header className="bg-white/90 dark:bg-[#1a1917]/85 backdrop-blur shadow-sm border-b dark:border-white/[0.06] sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="md:hidden shrink-0"
                    aria-label="Buka menu"
                  >
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0 flex flex-col">
                  <SheetHeader className="border-b border-black/[0.08] dark:border-white/[0.06]">
                    <div className="flex items-center gap-3">
                      <img
                        src={branding.logo_url || '/cendekia.svg'}
                        alt={`Logo ${branding.school_name}`}
                        className="w-10 h-10 object-contain"
                      />
                      <div className="min-w-0">
                        <SheetTitle className="truncate text-left">Admin Dashboard</SheetTitle>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {branding.short_name}
                        </p>
                      </div>
                    </div>
                  </SheetHeader>

                  <nav className="flex-1 overflow-y-auto p-2">
                    {NAV_ITEMS.map((item) => {
                      const Icon = item.icon;
                      const active = activeTab === item.value;
                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => {
                            setActiveTab(item.value);
                            setMobileNavOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                            active
                              ? 'bg-indigo-600 text-white'
                              : 'text-gray-700 dark:text-[#f0ede8] hover:bg-gray-100 dark:hover:bg-[#232220]'
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </nav>

                  <div className="border-t dark:border-white/10 p-3 space-y-2">
                    <div className="px-1">
                      <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
                        {userProfile.nama_lengkap}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Administrator</p>
                    </div>
                    <Button
                      onClick={onLogout}
                      variant="outline"
                      className="w-full flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>

              <img
                src={branding.logo_url || '/cendekia.svg'}
                alt={`Logo ${branding.school_name}`}
                className="w-10 h-10 md:w-12 md:h-12 object-contain shrink-0"
              />
              <div className="min-w-0">
                <h1 className="text-gray-900 dark:text-gray-100 text-base md:text-lg truncate">
                  Admin Dashboard
                </h1>
                <p className="hidden sm:block text-sm text-gray-500 dark:text-gray-400 truncate">
                  {branding.short_name} — {branding.school_name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:block text-right mr-1">
                <p className="text-sm text-gray-900 dark:text-gray-100">{userProfile.nama_lengkap}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Administrator</p>
              </div>
              <Button
                onClick={onLogout}
                variant="outline"
                size="icon"
                className="md:hidden"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
              </Button>
              <Button
                onClick={onLogout}
                variant="outline"
                className="hidden md:flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {loading ? (
          <div
            className={`${
              activeTab === 'overview' ? 'grid' : 'hidden md:grid'
            } grid-cols-1 md:grid-cols-4 gap-6 mb-8`}
          >
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="pt-6">
                  <div className="h-20 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div
            className={`${
              activeTab === 'overview' ? 'grid' : 'hidden md:grid'
            } grid-cols-1 md:grid-cols-4 gap-6 mb-8`}
          >
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Kandidat</p>
                    <p className="text-2xl text-gray-900 dark:text-gray-100">{stats.totalCandidates}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Suara Masuk</p>
                    <p className="text-2xl text-gray-900 dark:text-gray-100">{stats.totalVotes}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-indigo-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Sudah Vote</p>
                    <p className="text-2xl text-gray-900 dark:text-gray-100">{stats.totalVoters}</p>
                  </div>
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-indigo-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Belum Vote</p>
                    <p className="text-2xl text-gray-900 dark:text-gray-100">{stats.totalNonVoters}</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="shadow-lg">
          <CardContent className="pt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="md:hidden mb-4 flex items-center gap-2 rounded-md border border-indigo-100 dark:border-[#c4a882]/30 bg-indigo-50/60 dark:bg-[#232220] px-3 py-2">
                {(() => {
                  const current = NAV_ITEMS.find((n) => n.value === activeTab);
                  const Icon = current?.icon || BarChart3;
                  return (
                    <>
                      <Icon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-sm font-medium text-indigo-900 dark:text-indigo-200">
                        {current?.label}
                      </span>
                    </>
                  );
                })()}
              </div>
              <TabsList className="hidden md:grid w-full grid-cols-6 mb-6">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <TabsTrigger key={item.value} value={item.value} className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
              >
              <TabsContent value="overview">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-gray-900 dark:text-gray-100">Hasil Voting Real-time</h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Grafik dan statistik hasil voting</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setRefreshKey((prev) => prev + 1)}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                      </Button>
                      <Button
                        onClick={handleResetVotes}
                        variant="destructive"
                        className="flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Reset Semua Vote
                      </Button>
                    </div>
                  </div>
                  <VoteResults refreshKey={refreshKey} />
                </div>
              </TabsContent>

              <TabsContent value="candidates">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-gray-900 dark:text-gray-100 mb-1">Kelola Kandidat</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Tambah, edit, atau hapus kandidat OSIS</p>
                  </div>
                  <CandidateManagement onUpdate={() => setRefreshKey((prev) => prev + 1)} />
                </div>
              </TabsContent>

              <TabsContent value="students">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-gray-900 dark:text-gray-100 mb-1">Kelola Siswa (NIS Whitelist)</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Import daftar NIS siswa. Hanya NIS yang ada di sini yang bisa dipakai untuk daftar akun.
                    </p>
                  </div>
                  <StudentManagement
                    refreshKey={refreshKey}
                    onChanged={() => setRefreshKey((prev) => prev + 1)}
                  />
                </div>
              </TabsContent>

              <TabsContent value="voters">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-gray-900 dark:text-gray-100">Daftar Pemilih</h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Siswa yang sudah dan belum melakukan voting</p>
                    </div>
                    <Button
                      onClick={() => setRefreshKey((prev) => prev + 1)}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Refresh
                    </Button>
                  </div>
                  <VotersList refreshKey={refreshKey} />
                </div>
              </TabsContent>

              <TabsContent value="admins">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-gray-900 dark:text-gray-100 mb-1">Kelola Admin</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Tambah admin baru untuk sistem pemilihan OSIS</p>
                  </div>

                  <Card className="border-2 border-indigo-100 dark:border-indigo-900/50">
                    <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-[#232220] dark:to-[#2a2724]">
                      <CardTitle className="flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-indigo-600" />
                        Tambah Admin Baru
                      </CardTitle>
                      <CardDescription>Buat akun admin baru untuk mengelola sistem voting</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <form onSubmit={handleCreateAdmin} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="admin-nama">Nama Lengkap</Label>
                            <Input
                              id="admin-nama"
                              value={adminData.nama_lengkap}
                              onChange={(e) => setAdminData({ ...adminData, nama_lengkap: e.target.value })}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="admin-username">Username</Label>
                            <Input
                              id="admin-username"
                              value={adminData.username}
                              onChange={(e) => setAdminData({ ...adminData, username: e.target.value })}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="admin-password">Password</Label>
                            <Input
                              id="admin-password"
                              type="password"
                              value={adminData.password}
                              onChange={(e) => setAdminData({ ...adminData, password: e.target.value })}
                              placeholder="Minimal 6 karakter"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="admin-confirm-password">Konfirmasi Password</Label>
                            <Input
                              id="admin-confirm-password"
                              type="password"
                              value={adminData.confirmPassword}
                              onChange={(e) => setAdminData({ ...adminData, confirmPassword: e.target.value })}
                              required
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-4 border-t">
                          <Button
                            type="submit"
                            className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
                            disabled={adminLoading}
                          >
                            <UserPlus className="w-4 h-4" />
                            {adminLoading ? 'Memproses...' : 'Tambah Admin Baru'}
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-indigo-600" />
                        Daftar Admin ({admins.length})
                      </CardTitle>
                      <CardDescription>
                        Semua akun administrator yang terdaftar. Admin tidak dapat menghapus akun sendiri, dan admin terakhir tidak dapat dihapus.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {adminsLoading ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">Memuat...</p>
                      ) : admins.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">Belum ada admin terdaftar.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b bg-gray-50 dark:bg-[#232220] text-left">
                                <th className="px-3 py-2">No</th>
                                <th className="px-3 py-2">Nama Lengkap</th>
                                <th className="px-3 py-2">Username</th>
                                <th className="px-3 py-2">Dibuat</th>
                                <th className="px-3 py-2 text-center">Aksi</th>
                              </tr>
                            </thead>
                            <tbody>
                              {admins.map((a, i) => {
                                const isSelf = a.id === userProfile.id;
                                const isLast = admins.length <= 1;
                                return (
                                  <tr key={a.id} className="border-b hover:bg-gray-50 dark:hover:bg-[#232220]/60">
                                    <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{i + 1}</td>
                                    <td className="px-3 py-2 text-gray-900 dark:text-gray-100">
                                      {a.nama_lengkap}
                                      {isSelf && (
                                        <span className="ml-2 text-xs text-indigo-600">(Anda)</span>
                                      )}
                                    </td>
                                    <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{a.username}</td>
                                    <td className="px-3 py-2 text-gray-600 dark:text-gray-400 text-xs">
                                      {new Date(a.created_at).toLocaleString('id-ID')}
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        disabled={isSelf || isLast || deletingAdminId === a.id}
                                        onClick={() => handleDeleteAdmin(a.id, a.nama_lengkap)}
                                        className="flex items-center gap-1 mx-auto"
                                        title={
                                          isSelf
                                            ? 'Tidak dapat menghapus akun sendiri'
                                            : isLast
                                            ? 'Admin terakhir tidak dapat dihapus'
                                            : 'Hapus admin'
                                        }
                                      >
                                        <Trash2 className="w-3 h-3" />
                                        Hapus
                                      </Button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="settings">
                <SettingsPanel />
              </TabsContent>
              </motion.div>
              </AnimatePresence>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      <SiteFooter className="mt-10" />
    </div>
  );
}
