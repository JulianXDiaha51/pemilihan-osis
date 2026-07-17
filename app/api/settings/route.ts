import { NextResponse } from 'next/server';
import {
  AuthError,
  requireAdmin,
} from '../../../src/lib/auth';
import {
  getBranding,
  getTheme,
  saveLogo,
  setTheme,
  updateBrandingText,
} from '../../../src/lib/settings';

export async function GET() {
  return NextResponse.json({
    branding: getBranding(),
    theme: getTheme(),
  });
}

export async function PUT(req: Request) {
  try {
    await requireAdmin();

    const ct = req.headers.get('content-type') || '';
    if (ct.includes('multipart/form-data')) {
      const form = await req.formData();
      const school_name = form.get('school_name');
      const short_name = form.get('short_name');
      const landing_description = form.get('landing_description');
      const footer_text = form.get('footer_text');
      const theme = form.get('theme');
      const logo = form.get('logo');

      updateBrandingText({
        school_name: typeof school_name === 'string' ? school_name : undefined,
        short_name: typeof short_name === 'string' ? short_name : undefined,
        landing_description:
          typeof landing_description === 'string' ? landing_description : undefined,
        footer_text: typeof footer_text === 'string' ? footer_text : undefined,
      });

      if (typeof theme === 'string' && ['light', 'dark', 'system'].includes(theme)) {
        setTheme(theme as 'light' | 'dark' | 'system');
      }

      if (logo instanceof File && logo.size > 0) {
        await saveLogo(logo);
      }
    } else {
      const body = await req.json();
      updateBrandingText({
        school_name: body.school_name,
        short_name: body.short_name,
        landing_description: body.landing_description,
        footer_text: body.footer_text,
      });
      if (body.theme && ['light', 'dark', 'system'].includes(body.theme)) {
        setTheme(body.theme);
      }
    }

    return NextResponse.json({
      branding: getBranding(),
      theme: getTheme(),
    });
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: err.message || 'Gagal update settings' }, { status: 500 });
  }
}
