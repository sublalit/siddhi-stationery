import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_WIDTH = 800;
const WEBP_QUALITY = 80;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const BUCKET_NAME = 'product-images';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials are not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }

  return createClient(supabaseUrl, supabaseKey);
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: 'No image file uploaded' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Unsupported image type. Use JPEG, PNG, GIF, or WebP.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: 'Image must be 5MB or smaller' }, { status: 400 });
    }

    let uploadBuffer: Buffer;
    let contentType = 'image/webp';

    try {
      uploadBuffer = await sharp(Buffer.from(await file.arrayBuffer()))
        .rotate()
        .resize({
          width: MAX_WIDTH,
          withoutEnlargement: true,
        })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer();
    } catch (sharpError) {
      console.warn('Sharp optimization skipped, using original buffer:', sharpError);
      uploadBuffer = Buffer.from(await file.arrayBuffer());
      contentType = file.type;
    }

    const extension = contentType === 'image/webp' ? 'webp' : file.name.split('.').pop() || 'png';
    const filename = `${Date.now()}-${randomUUID()}.${extension}`;

    const supabase = getSupabaseClient();

    // Upload directly to Supabase Storage bucket 'product-images'
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filename, uploadBuffer, {
        contentType,
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError);
      return NextResponse.json(
        { success: false, error: `Failed to upload image to Supabase Storage: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Retrieve public URL from Supabase Storage
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filename);

    const publicUrl = publicUrlData.publicUrl;

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error: any) {
    console.error('Upload POST error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Upload failed' }, { status: 500 });
  }
}
