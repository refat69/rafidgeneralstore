import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  if (!getSessionUserId()) {
    return NextResponse.json({ error: 'অনুমতি নেই' }, { status: 401 });
  }

  try {
    const { image, cloudName, uploadPreset } = await req.json();

    if (!image) {
      return NextResponse.json({ error: 'ছবি প্রয়োজন' }, { status: 400 });
    }

    // Default or user configured Cloudinary cloud name & preset
    const cName = process.env.CLOUDINARY_CLOUD_NAME || cloudName || 'demo';
    const cPreset = process.env.CLOUDINARY_UPLOAD_PRESET || uploadPreset || 'unsigned_preset';

    // If using Cloudinary REST API unsigned upload
    const formData = new URLSearchParams();
    formData.append('file', image);
    formData.append('upload_preset', cPreset);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();

    if (data.secure_url) {
      return NextResponse.json({ url: data.secure_url });
    } else {
      // Fallback: If demo cloud fails or preset not set, return image directly if it's already a URL/base64
      return NextResponse.json({ url: image, warning: data.error?.message || 'Direct Cloudinary URL assigned' });
    }
  } catch (err) {
    return NextResponse.json({ error: 'আপলোড করতে সমস্যা হয়েছে: ' + err.message }, { status: 500 });
  }
}
