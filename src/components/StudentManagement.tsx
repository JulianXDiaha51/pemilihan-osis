"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner';
import { Upload, PlusCircle, Trash2, RefreshCw, FileUp, Users } from 'lucide-react';

interface Student {
  nis: string;
  nama_lengkap: string;
  kelas: string;
  registered: boolean;
  user_id: string | null;
  username: string | null;
}

interface StudentManagementProps {
  refreshKey: number;
  onChanged: () => void;
}

export default function StudentManagement({ refreshKey, onChanged }: StudentManagementProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterKelas, setFilterKelas] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'registered' | 'not_registered'>('all');

  const [bulkText, setBulkText] = useState('');
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkResult, setBulkResult] = useState<any>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [addData, setAddData] = useState({ nis: '', nama_lengkap: '', kelas: '' });
  const [addSubmitting, setAddSubmitting] = useState(false);

  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetchStudents();
  }, [refreshKey]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/students', { cache: 'no-store' });
      if (!res.ok) {
        toast.error('Gagal memuat daftar siswa');
        return;
      }
      const data = await res.json();
      setStudents(data.students || []);
    } catch {
      toast.error('Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const kelasOptions = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => set.add(s.kelas));
    return Array.from(set).sort();
  }, [students]);

  const filtered = useMemo(() => {
    return students.filter((s) => {
      if (filterKelas !== 'all' && s.kelas !== filterKelas) return false;
      if (filterStatus === 'registered' && !s.registered) return false;
      if (filterStatus === 'not_registered' && s.registered) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          s.nis.toLowerCase().includes(q) ||
          s.nama_lengkap.toLowerCase().includes(q) ||
          s.kelas.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [students, search, filterKelas, filterStatus]);

  const handleBulkSubmit = async () => {
    if (!bulkText.trim()) {
      toast.error('Data kosong');
      return;
    }
    setBulkSubmitting(true);
    setBulkResult(null);
    try {
      const res = await fetch('/api/students/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: bulkText }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error('Gagal import', { description: data.error || 'Terjadi kesalahan' });
        return;
      }
      setBulkResult(data);
      toast.success('Import selesai', {
        description: `${data.inserted} ditambahkan, ${data.updated} diperbarui, ${data.errors.length} gagal`,
      });
      onChanged();
      fetchStudents();
    } catch {
      toast.error('Terjadi kesalahan');
    } finally {
      setBulkSubmitting(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setBulkText(text);
    e.target.value = '';
  };

  const handleAddOne = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddSubmitting(true);
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addData),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error('Gagal', { description: data.error || 'Terjadi kesalahan' });
        return;
      }
      toast.success('NIS ditambahkan');
      setAddData({ nis: '', nama_lengkap: '', kelas: '' });
      setAddOpen(false);
      onChanged();
      fetchStudents();
    } catch {
      toast.error('Terjadi kesalahan');
    } finally {
      setAddSubmitting(false);
    }
  };

  const handleDelete = async (nis: string, nama: string) => {
    if (!confirm(`Hapus NIS ${nis} (${nama})?`)) return;
    try {
      const res = await fetch(`/api/students/${encodeURIComponent(nis)}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        toast.error('Gagal hapus', { description: data.error || '' });
        return;
      }
      toast.success('NIS dihapus');
      onChanged();
      fetchStudents();
    } catch {
      toast.error('Terjadi kesalahan');
    }
  };

  const handleDeleteAccount = async (userId: string, username: string, nama: string) => {
    if (
      !confirm(
        `Hapus akun voter?\n\nNama: ${nama}\nUsername: ${username}\n\nAkun dan suaranya akan dihapus permanen. NIS-nya jadi bebas dipakai untuk daftar ulang.`
      )
    )
      return;
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(userId)}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        toast.error('Gagal hapus akun', { description: data.error || '' });
        return;
      }
      toast.success('Akun dihapus', { description: `${nama} (${username})` });
      onChanged();
      fetchStudents();
    } catch {
      toast.error('Terjadi kesalahan');
    }
  };

  const total = students.length;
  const registered = students.filter((s) => s.registered).length;
  const notRegistered = total - registered;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total NIS Terdaftar</p>
            <p className="text-2xl text-gray-900 dark:text-gray-100">{total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Sudah Buat Akun</p>
            <p className="text-2xl text-green-600">{registered}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Belum Buat Akun</p>
            <p className="text-2xl text-orange-600">{notRegistered}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Bulk Import
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Bulk Import Daftar Siswa</DialogTitle>
              <DialogDescription>
                Paste dari Excel/Sheets atau upload file CSV. Format tiap baris:{' '}
                <code>NIS,Nama Lengkap,Kelas</code>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.txt,.tsv"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Button variant="outline" onClick={() => fileRef.current?.click()} className="flex items-center gap-2">
                  <FileUp className="w-4 h-4" />
                  Upload file CSV
                </Button>
                <span className="text-xs text-gray-500 dark:text-gray-400">atau paste manual di bawah</span>
              </div>

              <Textarea
                rows={10}
                placeholder={`NIS,Nama,Kelas\n1234,Ahmad Fauzi,XII RPL 1\n1235,Siti Nurhaliza,XII RPL 1`}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                className="font-mono text-sm"
              />

              {bulkResult && (
                <div className="rounded border bg-gray-50 dark:bg-[#232220]/60 p-3 text-sm space-y-1">
                  <p>Total baris: {bulkResult.total_lines}</p>
                  <p className="text-green-700">Ditambahkan: {bulkResult.inserted}</p>
                  <p className="text-blue-700">Diperbarui: {bulkResult.updated}</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Dilewati (sudah punya akun): {bulkResult.skipped_already_registered}
                  </p>
                  {bulkResult.errors?.length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-red-700">
                        {bulkResult.errors.length} baris gagal — klik untuk lihat
                      </summary>
                      <ul className="mt-2 space-y-1 text-xs text-red-700">
                        {bulkResult.errors.map((e: any, i: number) => (
                          <li key={i}>
                            Baris {e.line}: {e.error} — <code>{e.raw}</code>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setBulkOpen(false)}>
                  Tutup
                </Button>
                <Button
                  onClick={handleBulkSubmit}
                  disabled={bulkSubmitting}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {bulkSubmitting ? 'Mengimpor...' : 'Impor'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <PlusCircle className="w-4 h-4" />
              Tambah 1 NIS
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah NIS Baru</DialogTitle>
              <DialogDescription>Tambah satu siswa secara manual.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddOne} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="add-nis">NIS</Label>
                <Input
                  id="add-nis"
                  value={addData.nis}
                  onChange={(e) => setAddData({ ...addData, nis: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-nama">Nama Lengkap</Label>
                <Input
                  id="add-nama"
                  value={addData.nama_lengkap}
                  onChange={(e) => setAddData({ ...addData, nama_lengkap: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-kelas">Kelas</Label>
                <Input
                  id="add-kelas"
                  placeholder="Contoh: XII RPL 1"
                  value={addData.kelas}
                  onChange={(e) => setAddData({ ...addData, kelas: e.target.value })}
                  required
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={addSubmitting} className="bg-indigo-600 hover:bg-indigo-700">
                  {addSubmitting ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Button variant="outline" onClick={fetchStudents} className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Daftar Siswa
          </CardTitle>
          <CardDescription>Semua NIS yang boleh membuat akun voter.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <Input
              placeholder="Cari NIS, nama, atau kelas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="border rounded-md px-3 py-2 text-sm"
              value={filterKelas}
              onChange={(e) => setFilterKelas(e.target.value)}
            >
              <option value="all">Semua Kelas</option>
              {kelasOptions.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
            <select
              className="border rounded-md px-3 py-2 text-sm"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
            >
              <option value="all">Semua Status</option>
              <option value="registered">Sudah Buat Akun</option>
              <option value="not_registered">Belum Buat Akun</option>
            </select>
          </div>

          {loading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">Memuat...</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Tidak ada siswa yang cocok.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 dark:bg-[#232220]/60 text-left">
                    <th className="px-3 py-2">NIS</th>
                    <th className="px-3 py-2">Nama Lengkap</th>
                    <th className="px-3 py-2">Kelas</th>
                    <th className="px-3 py-2 text-center">Status</th>
                    <th className="px-3 py-2">Username</th>
                    <th className="px-3 py-2 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s.nis} className="border-b hover:bg-gray-50 dark:hover:bg-[#232220]/40">
                      <td className="px-3 py-2 font-mono text-xs">{s.nis}</td>
                      <td className="px-3 py-2">{s.nama_lengkap}</td>
                      <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{s.kelas}</td>
                      <td className="px-3 py-2 text-center">
                        {s.registered ? (
                          <Badge className="bg-green-500 text-white border-0">Terdaftar</Badge>
                        ) : (
                          <Badge variant="outline">Belum</Badge>
                        )}
                      </td>
                      <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{s.username || '-'}</td>
                      <td className="px-3 py-2 text-right">
                        {s.registered && s.user_id ? (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              handleDeleteAccount(s.user_id!, s.username || '-', s.nama_lengkap)
                            }
                            className="flex items-center gap-1 ml-auto"
                            title="Hapus akun voter (username & password)"
                          >
                            <Trash2 className="w-3 h-3" />
                            Hapus Akun
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(s.nis, s.nama_lengkap)}
                            className="text-red-600 hover:text-red-700"
                            title="Hapus NIS dari whitelist"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
