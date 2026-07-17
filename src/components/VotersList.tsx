"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Users, UserCheck, Trash2 } from 'lucide-react';
import { Button } from './ui/button';

interface VotersListProps {
  refreshKey: number;
}

export default function VotersList({ refreshKey }: VotersListProps) {
  const [voters, setVoters] = useState<any[]>([]);
  const [nonVoters, setNonVoters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteUser = async (id: string, nama: string) => {
    if (!id) {
      toast.error('ID user tidak tersedia');
      return;
    }
    if (!confirm(`Hapus akun "${nama}"?\n\nAkun beserta suaranya akan dihapus permanen.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(id)}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        toast.error('Gagal hapus akun', { description: data.error || '' });
        return;
      }
      toast.success('Akun dihapus', { description: nama });
      fetchVoters();
    } catch {
      toast.error('Terjadi kesalahan');
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    fetchVoters();
  }, [refreshKey]);

  const fetchVoters = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/voters', { cache: 'no-store' });

      if (response.ok) {
        const data = await response.json();
        setVoters(data.voters);
        setNonVoters(data.non_voters);
      } else {
        toast.error('Gagal memuat daftar pemilih');
      }
    } catch (error) {
      console.error('Error fetching voters:', error);
      toast.error('Terjadi kesalahan saat memuat daftar pemilih');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="pt-6">
          <div className="h-64 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Sudah Memilih</p>
                <p className="text-2xl text-gray-900 dark:text-gray-100">{voters.length}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {voters.length + nonVoters.length > 0 
                    ? `${((voters.length / (voters.length + nonVoters.length)) * 100).toFixed(1)}% dari total pemilih`
                    : '0% dari total pemilih'
                  }
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Belum Memilih</p>
                <p className="text-2xl text-gray-900 dark:text-gray-100">{nonVoters.length}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {voters.length + nonVoters.length > 0 
                    ? `${((nonVoters.length / (voters.length + nonVoters.length)) * 100).toFixed(1)}% dari total pemilih`
                    : '0% dari total pemilih'
                  }
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <XCircle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Voters Tables */}
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="voted">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="voted" className="flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                Sudah Vote ({voters.length})
              </TabsTrigger>
              <TabsTrigger value="not-voted" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Belum Vote ({nonVoters.length})
              </TabsTrigger>
            </TabsList>

            {/* Voted Tab */}
            <TabsContent value="voted">
              {voters.length === 0 ? (
                <div className="text-center py-12">
                  <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">Belum ada siswa yang voting</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50 dark:bg-[#232220] text-left">
                        <th className="px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300">No</th>
                        <th className="px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300">Nama Lengkap</th>
                        <th className="px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300">Kelas</th>
                        <th className="px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300">Username</th>
                        <th className="px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300">Waktu Vote</th>
                        <th className="px-4 py-3 text-center text-sm text-gray-700 dark:text-gray-300">Status</th>
                        <th className="px-4 py-3 text-center text-sm text-gray-700 dark:text-gray-300">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {voters.map((voter, index) => (
                        <tr key={voter.username} className="border-b hover:bg-gray-50 dark:hover:bg-[#232220]">
                          <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{index + 1}</td>
                          <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{voter.nama_lengkap}</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{voter.kelas}</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{voter.username}</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-sm">
                            {formatDate(voter.voted_at)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge className="bg-green-500 text-white border-0">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Sudah Vote
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={deletingId === voter.id}
                              onClick={() => handleDeleteUser(voter.id, voter.nama_lengkap)}
                              className="flex items-center gap-1 mx-auto"
                            >
                              <Trash2 className="w-3 h-3" />
                              Hapus
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            {/* Not Voted Tab */}
            <TabsContent value="not-voted">
              {nonVoters.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-gray-700 dark:text-gray-300 mb-1">Semua siswa sudah voting!</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Partisipasi 100% tercapai 🎉</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50 dark:bg-[#232220]">
                        <th className="px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300">No</th>
                        <th className="px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300">Nama Lengkap</th>
                        <th className="px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300">Kelas</th>
                        <th className="px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300">Username</th>
                        <th className="px-4 py-3 text-center text-sm text-gray-700 dark:text-gray-300">Status</th>
                        <th className="px-4 py-3 text-center text-sm text-gray-700 dark:text-gray-300">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nonVoters.map((voter, index) => (
                        <tr key={voter.username} className="border-b hover:bg-gray-50 dark:hover:bg-[#232220]">
                          <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{index + 1}</td>
                          <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{voter.nama_lengkap}</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{voter.kelas}</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{voter.username}</td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-0">
                              <XCircle className="w-3 h-3 mr-1" />
                              Belum Vote
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={deletingId === voter.id}
                              onClick={() => handleDeleteUser(voter.id, voter.nama_lengkap)}
                              className="flex items-center gap-1 mx-auto"
                            >
                              <Trash2 className="w-3 h-3" />
                              Hapus
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
