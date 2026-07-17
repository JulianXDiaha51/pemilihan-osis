"use client";

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { PlusCircle, Edit, Trash2, Image as ImageIcon, Users } from 'lucide-react';
import { ImageWithFallback } from './with/ImageWithFallback';

interface CandidateManagementProps {
  onUpdate: () => void;
}

export default function CandidateManagement({ onUpdate }: CandidateManagementProps) {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<any>(null);
  const [formData, setFormData] = useState({
    nama_ketua: '',
    nama_wakil: '',
    visi: '',
    misi: '',
    foto: null as File | null,
  });
  const [submitting, setSubmitting] = useState(false);

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
      console.error('Error fetching candidates:', error);
      toast.error('Terjadi kesalahan saat memuat kandidat');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('nama_ketua', formData.nama_ketua);
      formDataToSend.append('nama_wakil', formData.nama_wakil);
      formDataToSend.append('visi', formData.visi);
      formDataToSend.append('misi', formData.misi);
      if (formData.foto) {
        formDataToSend.append('foto', formData.foto);
      }

      const response = await fetch('/api/candidates', {
        method: 'POST',
        body: formDataToSend,
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error('Gagal Menambah Kandidat', {
          description: data.error || 'Terjadi kesalahan'
        });
        return;
      }

      toast.success('Kandidat Berhasil Ditambahkan', {
        description: `${formData.nama_ketua} & ${formData.nama_wakil}`
      });

      setIsAddDialogOpen(false);
      resetForm();
      fetchCandidates();
      onUpdate();
    } catch (error) {
      console.error('Error adding candidate:', error);
      toast.error('Terjadi kesalahan saat menambah kandidat');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('nama_ketua', formData.nama_ketua);
      formDataToSend.append('nama_wakil', formData.nama_wakil);
      formDataToSend.append('visi', formData.visi);
      formDataToSend.append('misi', formData.misi);
      if (formData.foto) {
        formDataToSend.append('foto', formData.foto);
      }

      const response = await fetch(`/api/candidates/${editingCandidate.id}`, {
        method: 'PUT',
        body: formDataToSend,
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error('Gagal Update Kandidat', {
          description: data.error || 'Terjadi kesalahan'
        });
        return;
      }

      toast.success('Kandidat Berhasil Diupdate', {
        description: `${formData.nama_ketua} & ${formData.nama_wakil}`
      });

      setIsEditDialogOpen(false);
      setEditingCandidate(null);
      resetForm();
      fetchCandidates();
      onUpdate();
    } catch (error) {
      console.error('Error updating candidate:', error);
      toast.error('Terjadi kesalahan saat update kandidat');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (candidate: any) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus kandidat:\n${candidate.nama_ketua} & ${candidate.nama_wakil}?\n\nTindakan ini tidak dapat dibatalkan.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/candidates/${candidate.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error('Gagal Hapus Kandidat', {
          description: data.error || 'Terjadi kesalahan'
        });
        return;
      }

      toast.success('Kandidat Berhasil Dihapus', {
        description: `${candidate.nama_ketua} & ${candidate.nama_wakil}`
      });

      fetchCandidates();
      onUpdate();
    } catch (error) {
      console.error('Error deleting candidate:', error);
      toast.error('Terjadi kesalahan saat hapus kandidat');
    }
  };

  const openEditDialog = (candidate: any) => {
    setEditingCandidate(candidate);
    setFormData({
      nama_ketua: candidate.nama_ketua,
      nama_wakil: candidate.nama_wakil,
      visi: candidate.visi,
      misi: candidate.misi,
      foto: null,
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      nama_ketua: '',
      nama_wakil: '',
      visi: '',
      misi: '',
      foto: null,
    });
  };

  return (
    <div className="space-y-6">
      {/* Add Candidate Button */}
      <div className="flex justify-end">
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2">
              <PlusCircle className="w-4 h-4" />
              Tambah Kandidat Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tambah Kandidat Baru</DialogTitle>
              <DialogDescription>
                Isi semua informasi kandidat dengan lengkap
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="add-nama-ketua">Nama Calon Ketua *</Label>
                  <Input
                    id="add-nama-ketua"
                    value={formData.nama_ketua}
                    onChange={(e) => setFormData({ ...formData, nama_ketua: e.target.value })}
                    placeholder="Contoh: Ahmad Rizki"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-nama-wakil">Nama Calon Wakil *</Label>
                  <Input
                    id="add-nama-wakil"
                    value={formData.nama_wakil}
                    onChange={(e) => setFormData({ ...formData, nama_wakil: e.target.value })}
                    placeholder="Contoh: Siti Nurhaliza"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-visi">Visi *</Label>
                <Textarea
                  id="add-visi"
                  value={formData.visi}
                  onChange={(e) => setFormData({ ...formData, visi: e.target.value })}
                  placeholder="Tuliskan visi kandidat..."
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-misi">Misi *</Label>
                <Textarea
                  id="add-misi"
                  value={formData.misi}
                  onChange={(e) => setFormData({ ...formData, misi: e.target.value })}
                  placeholder="Tuliskan misi kandidat..."
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-foto">Foto Kandidat</Label>
                <Input
                  id="add-foto"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({ ...formData, foto: e.target.files?.[0] || null })}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">Format: JPG, PNG (Maks. 5MB)</p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    resetForm();
                  }}
                  className="flex-1"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Kandidat'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Candidates List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-48 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : candidates.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 mb-2">Belum ada kandidat terdaftar</p>
            <p className="text-sm text-gray-400">Klik tombol "Tambah Kandidat Baru" untuk menambah kandidat pertama</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {candidates.map((candidate) => (
            <Card key={candidate.id} className="hover:shadow-lg transition-shadow">
              <div className="relative h-48 bg-gradient-to-br from-indigo-100 to-purple-100">
                {candidate.foto_url ? (
                  <ImageWithFallback
                    src={candidate.foto_url}
                    alt={`${candidate.nama_ketua} & ${candidate.nama_wakil}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-16 h-16 text-gray-400" />
                  </div>
                )}
              </div>
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-gray-100">{candidate.nama_ketua}</CardTitle>
                <CardDescription>& {candidate.nama_wakil}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Visi:</p>
                  <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-2">{candidate.visi}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Misi:</p>
                  <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-2">{candidate.misi}</p>
                </div>
                {candidate.vote_count !== undefined && (
                  <div>
                    <Badge variant="secondary">
                      {candidate.vote_count} Suara
                    </Badge>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => openEditDialog(candidate)}
                    variant="outline"
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </Button>
                  <Button
                    onClick={() => handleDelete(candidate)}
                    variant="destructive"
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Hapus
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Kandidat</DialogTitle>
            <DialogDescription>
              Update informasi kandidat
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-nama-ketua">Nama Calon Ketua *</Label>
                <Input
                  id="edit-nama-ketua"
                  value={formData.nama_ketua}
                  onChange={(e) => setFormData({ ...formData, nama_ketua: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-nama-wakil">Nama Calon Wakil *</Label>
                <Input
                  id="edit-nama-wakil"
                  value={formData.nama_wakil}
                  onChange={(e) => setFormData({ ...formData, nama_wakil: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-visi">Visi *</Label>
              <Textarea
                id="edit-visi"
                value={formData.visi}
                onChange={(e) => setFormData({ ...formData, visi: e.target.value })}
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-misi">Misi *</Label>
              <Textarea
                id="edit-misi"
                value={formData.misi}
                onChange={(e) => setFormData({ ...formData, misi: e.target.value })}
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-foto">Foto Kandidat (Opsional - Kosongkan jika tidak ingin mengubah)</Label>
              <Input
                id="edit-foto"
                type="file"
                accept="image/*"
                onChange={(e) => setFormData({ ...formData, foto: e.target.files?.[0] || null })}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">Format: JPG, PNG (Maks. 5MB)</p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingCandidate(null);
                  resetForm();
                }}
                className="flex-1"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              >
                {submitting ? 'Menyimpan...' : 'Update Kandidat'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
