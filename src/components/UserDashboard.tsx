"use client";

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { LogOut, CheckCircle, UserCheck, Users } from 'lucide-react';
import CandidateCard from './CandidateCard';
import { useBranding } from './BrandingProvider';
import SiteFooter from './SiteFooter';

interface UserDashboardProps {
  userProfile: any;
  onLogout: () => void;
}

export default function UserDashboard({ userProfile, onLogout }: UserDashboardProps) {
  const { branding } = useBranding();
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(userProfile.sudah_vote);

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      const response = await fetch('/api/candidates', { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        setCandidates(data.candidates);
      } else {
        toast.error('Gagal memuat kandidat');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat memuat kandidat');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (candidateId: string) => {
    if (hasVoted) {
      toast.warning('Anda sudah melakukan voting sebelumnya');
      return;
    }

    const candidate = candidates.find((c) => c.id === candidateId);
    const candidateName = `${candidate?.nama_ketua} & ${candidate?.nama_wakil}`;

    if (!confirm(`Yakin memilih pasangan:\n${candidateName}?\n\nSetelah memilih, pilihan tidak bisa diubah.`)) {
      return;
    }

    setVoting(true);
    try {
      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidate_id: candidateId }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error('Voting Gagal', { description: data.error || 'Terjadi kesalahan' });
        return;
      }
      toast.success('Voting Berhasil', { description: `Terima kasih telah memilih ${candidateName}` });
      setHasVoted(true);
    } catch (error) {
      toast.error('Terjadi kesalahan saat voting');
    } finally {
      setVoting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-[#111110] dark:via-[#111110] dark:to-[#1a1917]">
      <header className="bg-white/90 dark:bg-[#1a1917]/80 backdrop-blur shadow-sm border-b dark:border-white/[0.06] sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={branding.logo_url || '/cendekia.svg'}
                alt={`Logo ${branding.school_name}`}
                className="w-12 h-12 object-contain"
              />
              <div>
                <h1 className="text-gray-900 dark:text-gray-100">{branding.short_name}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">{branding.school_name}</p>
              </div>
            </div>
            <Button onClick={onLogout} variant="outline" className="flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <UserCheck className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-white mb-1">{userProfile.nama_lengkap}</h2>
                  <p className="text-indigo-100">{userProfile.kelas}</p>
                  <p className="text-sm text-indigo-200 mt-1">Username: {userProfile.username}</p>
                </div>
              </div>
              <div className="text-right">
                {hasVoted ? (
                  <Badge className="bg-green-500 text-white border-0 text-sm px-4 py-2">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Sudah Vote
                  </Badge>
                ) : (
                  <Badge className="bg-yellow-500 text-white border-0 text-sm px-4 py-2">
                    Belum Vote
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {!hasVoted && (
          <div className="mt-6 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-blue-900 dark:text-blue-100 mb-2">Panduan Voting</h3>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>Pilih salah satu pasangan calon Ketua dan Wakil OSIS</li>
                  <li>Baca visi dan misi setiap kandidat dengan teliti</li>
                  <li>Klik tombol "Vote Sekarang" pada kandidat pilihan Anda</li>
                  <li>Setelah voting, pilihan tidak dapat diubah</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8">
          <div className="mb-6">
            <h2 className="text-gray-900 dark:text-gray-100 mb-2">Daftar Kandidat</h2>
            <p className="text-gray-600 dark:text-gray-400">
              {hasVoted
                ? 'Terima kasih telah menggunakan hak suara Anda'
                : 'Pilih salah satu pasangan calon di bawah ini'}
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-64 bg-gray-200 rounded-t-lg"></div>
                  <CardContent className="pt-6">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : candidates.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">Belum ada kandidat yang tersedia.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {candidates.map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  onVote={handleVote}
                  hasVoted={hasVoted}
                  voting={voting}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <SiteFooter className="mt-10" />
    </div>
  );
}
