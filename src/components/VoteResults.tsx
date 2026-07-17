"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Trophy, TrendingUp } from 'lucide-react';

interface VoteResultsProps {
  refreshKey: number;
}

const COLORS = ['#4F46E5', '#7C3AED', '#EC4899', '#F59E0B', '#10B981', '#3B82F6'];

export default function VoteResults({ refreshKey }: VoteResultsProps) {
  const [results, setResults] = useState<any[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, [refreshKey]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/votes/results', { cache: 'no-store' });

      if (response.ok) {
        const data = await response.json();
        setResults(data.results);
        setTotalVotes(data.total_votes);
      } else {
        toast.error('Gagal memuat hasil voting');
      }
    } catch (error) {
      console.error('Error fetching vote results:', error);
      toast.error('Terjadi kesalahan saat memuat hasil voting');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse">
          <CardContent className="pt-6">
            <div className="h-64 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">Belum ada data voting</p>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for charts
  const chartData = results.map(r => ({
    name: `${r.nama_ketua} & ${r.nama_wakil}`,
    shortName: r.nama_ketua,
    suara: r.vote_count,
    persentase: parseFloat(r.percentage)
  }));

  // Find winner
  const winner = results.reduce((max, r) => r.vote_count > max.vote_count ? r : max, results[0]);

  return (
    <div className="space-y-6">
      {/* Winner Card */}
      {totalVotes > 0 && (
        <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center">
                <Trophy className="w-8 h-8 text-yellow-900" />
              </div>
              <div>
                <p className="text-sm text-yellow-800 mb-1">Posisi Teratas Sementara</p>
                <h3 className="text-yellow-900">{winner.nama_ketua} & {winner.nama_wakil}</h3>
                <div className="flex items-center gap-3 mt-2">
                  <Badge className="bg-yellow-500 text-white border-0">
                    {winner.vote_count} Suara
                  </Badge>
                  <Badge className="bg-orange-500 text-white border-0">
                    {winner.percentage}%
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              Grafik Batang
            </CardTitle>
            <CardDescription>Perbandingan jumlah suara per kandidat</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="shortName" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="suara" fill="#4F46E5" name="Jumlah Suara" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              Grafik Lingkaran
            </CardTitle>
            <CardDescription>Persentase suara per kandidat</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ shortName, persentase }) => `${shortName}: ${persentase.toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="suara"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tabel Hasil Voting</CardTitle>
          <CardDescription>Detail perolehan suara setiap kandidat</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50 dark:bg-[#232220]/70">
                  <th className="px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300">Peringkat</th>
                  <th className="px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300">Nama Ketua</th>
                  <th className="px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300">Nama Wakil</th>
                  <th className="px-4 py-3 text-center text-sm text-gray-700 dark:text-gray-300">Jumlah Suara</th>
                  <th className="px-4 py-3 text-center text-sm text-gray-700 dark:text-gray-300">Persentase</th>
                </tr>
              </thead>
              <tbody>
                {results
                  .sort((a, b) => b.vote_count - a.vote_count)
                  .map((result, index) => (
                    <tr key={result.id} className="border-b hover:bg-gray-50 dark:hover:bg-[#232220]/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {index === 0 && totalVotes > 0 && (
                            <Trophy className="w-4 h-4 text-yellow-500" />
                          )}
                          <span className="text-gray-900 dark:text-gray-100">#{index + 1}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{result.nama_ketua}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{result.nama_wakil}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="secondary">{result.vote_count}</Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="flex-1 max-w-32 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-indigo-600 h-2 rounded-full transition-all"
                              style={{ width: `${result.percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-700 dark:text-gray-300 min-w-12">
                            {result.percentage}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 dark:bg-[#2a2724]/70">
                  <td colSpan={3} className="px-4 py-3 text-gray-900 dark:text-gray-100">
                    Total
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge className="bg-indigo-600 text-white">{totalVotes}</Badge>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-900 dark:text-gray-100">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
