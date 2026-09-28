import { NextResponse } from 'next/server';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import sharp from 'sharp';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_WIDTH = 800;
const WEBP_QUALITY = 80;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

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

    const webpBuffer = await sharp(Buffer.from(await file.arrayBuffer()))
      .rotate()
      .resize({
        width: MAX_WIDTH,
        withoutEnlargement: true,
      })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();

    const filename = `${Date.now()}-${randomUUID()}.webp`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), webpBuffer);

    return NextResponse.json({ success: true, url: `/uploads/${filename}` });
  } catch (error: any) {
    console.error('Upload POST error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Upload failed' }, { status: 500 });
  }
}
