"use client";

import { useEffect, useRef, useState } from 'react';
import { useTheme } from './ThemeProvider';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Upload, Save, Palette, Image as ImageIcon, School, FileText } from 'lucide-react';
import { useBranding } from './BrandingProvider';

export default function SettingsPanel() {
  const { branding, refresh, setBrandingLocal } = useBranding();
  const { theme, setTheme } = useTheme();
  const [schoolName, setSchoolName] = useState(branding.school_name);
  const [shortName, setShortName] = useState(branding.short_name);
  const [landingDescription, setLandingDescription] = useState(branding.landing_description);
  const [footerText, setFooterText] = useState(branding.footer_text);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setSchoolName(branding.school_name);
    setShortName(branding.short_name);
    setLandingDescription(branding.landing_description);
    setFooterText(branding.footer_text);
  }, [branding.school_name, branding.short_name, branding.landing_description, branding.footer_text]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setLogoFile(null);
      setLogoPreview(null);
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran logo maksimal 2MB');
      return;
    }
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleThemeChange = async (value: string) => {
    await setTheme(value as 'light' | 'dark' | 'system');
    toast.success('Tema diperbarui', { description: `Mode: ${value}` });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolName.trim() || !shortName.trim()) {
      toast.error('Nama sekolah dan nama singkat wajib diisi');
      return;
    }
    setSaving(true);
    try {
      const form = new FormData();
      form.append('school_name', schoolName.trim());
      form.append('short_name', shortName.trim());
      form.append('landing_description', landingDescription.trim());
      form.append('footer_text', footerText.trim());
      if (theme) form.append('theme', theme);
      if (logoFile) form.append('logo', logoFile);

      const res = await fetch('/api/settings', { method: 'PUT', body: form });
      const data = await res.json();
      if (!res.ok) {
        toast.error('Gagal menyimpan', { description: data.error || 'Terjadi kesalahan' });
        return;
      }
      if (data.branding) setBrandingLocal(data.branding);
      await refresh();
      setLogoFile(null);
      setLogoPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      toast.success('Pengaturan berhasil disimpan');
    } catch {
      toast.error('Terjadi kesalahan saat menyimpan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-gray-900 dark:text-gray-100">Pengaturan Website</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Sesuaikan tampilan, branding sekolah, dan logo aplikasi.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Tema Tampilan
          </CardTitle>
          <CardDescription>Pilih mode gelap, terang, atau ikuti sistem.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-xs space-y-2">
            <Label htmlFor="theme-select">Mode</Label>
            <Select value={theme || 'system'} onValueChange={handleThemeChange}>
              <SelectTrigger id="theme-select">
                <SelectValue placeholder="Pilih tema" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Terang</SelectItem>
                <SelectItem value="dark">Gelap</SelectItem>
                <SelectItem value="system">Ikuti Sistem</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Perubahan tema berlaku langsung untuk perangkat ini. Preferensi juga disimpan sebagai default aplikasi.
            </p>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <School className="w-5 h-5" />
              Branding Sekolah
            </CardTitle>
            <CardDescription>Nama sekolah dan judul yang tampil pada navbar & dashboard.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="school-name">Nama Sekolah</Label>
                <Input
                  id="school-name"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="SMK Cendekia Wanasari"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="short-name">Judul / Nama Singkat</Label>
                <Input
                  id="short-name"
                  value={shortName}
                  onChange={(e) => setShortName(e.target.value)}
                  placeholder="Pemilihan OSIS 2026"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Teks Landing Page & Footer
            </CardTitle>
            <CardDescription>
              Deskripsi utama di halaman utama publik dan teks footer. Gunakan{' '}
              <code className="text-xs bg-gray-100 dark:bg-[#232220] px-1 rounded">{'{year}'}</code>{' '}
              di footer untuk tahun otomatis.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="landing-desc">Deskripsi Landing Page</Label>
              <Textarea
                id="landing-desc"
                value={landingDescription}
                onChange={(e) => setLandingDescription(e.target.value)}
                rows={4}
                placeholder="Saatnya menentukan pemimpin OSIS..."
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Tampil di halaman utama publik di bawah judul & nama sekolah.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="footer-text">Teks Footer</Label>
              <Input
                id="footer-text"
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
                placeholder="© {year} SMK Cendekia Wanasari — Sistem Pemilihan OSIS"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Tampil di footer semua halaman. <code className="text-xs bg-gray-100 dark:bg-[#232220] px-1 rounded">{'{year}'}</code> akan diganti tahun saat ini.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Logo Aplikasi
            </CardTitle>
            <CardDescription>Upload logo baru (PNG, JPG, SVG, WEBP, max 2MB).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="flex flex-col items-center gap-2">
                <div className="w-24 h-24 rounded-lg border border-dashed border-gray-300 dark:border-white/10 bg-white dark:bg-[#1a1917] flex items-center justify-center overflow-hidden">
                  <img
                    src={logoPreview || branding.logo_url || '/cendekia.svg'}
                    alt="Preview logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {logoPreview ? 'Preview' : 'Logo saat ini'}
                </span>
              </div>
              <div className="flex-1 space-y-2 w-full">
                <Label htmlFor="logo-file">Pilih File Logo</Label>
                <Input
                  ref={fileInputRef}
                  id="logo-file"
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
                  onChange={handleFileChange}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Disarankan rasio 1:1 (persegi) agar tampil optimal di navbar.
                </p>
                {logoFile && (
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                    <Upload className="w-3 h-3" />
                    {logoFile.name} ({(logoFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end">
          <Button
            type="submit"
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </div>
      </form>
    </div>
  );
}
