import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';
import prisma from '@/lib/prisma';
import { getScopeWhere } from '@/lib/dataScope';

async function assertInScope(
  scope: { isDemo: boolean },
  ids: { categoryId?: string | null; vendorId?: string | null }
) {
  if (ids.categoryId) {
    const found = await prisma.category.findFirst({ where: { id: ids.categoryId, ...scope }, select: { id: true } });
    if (!found) throw new Error('Category not found');
  }
  if (ids.vendorId) {
    const found = await prisma.vendor.findFirst({ where: { id: ids.vendorId, ...scope }, select: { id: true } });
    if (!found) throw new Error('Vendor not found');
  }
}

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

async function uploadImageToSupabase(file: File): Promise<string> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error('Unsupported image type. Use JPEG, PNG, GIF, or WebP.');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Image must be 5MB or smaller.');
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
  } catch (err) {
    uploadBuffer = Buffer.from(await file.arrayBuffer());
    contentType = file.type;
  }

  const extension = contentType === 'image/webp' ? 'webp' : file.name.split('.').pop() || 'png';
  const filename = `${Date.now()}-${randomUUID()}.${extension}`;
  const supabase = getSupabaseClient();

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filename, uploadBuffer, {
      contentType,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Failed to upload to Supabase Storage: ${uploadError.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filename);

  return publicUrlData.publicUrl;
}

export async function GET() {
  try {
    const scope = await getScopeWhere();
    const products = await prisma.product.findMany({
      where: scope,
      include: {
        category: true,
        vendor: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = products.map((p) => ({
      ...p,
      _id: p.id,
      category: p.category ? { ...p.category, _id: p.category.id } : null,
      vendor: p.vendor ? { ...p.vendor, _id: p.vendor.id } : null,
    }));

    return NextResponse.json({ success: true, products: mapped });
  } catch (error: any) {
    console.error('Products GET error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userRole = req.headers.get('x-user-role');
    if (userRole === 'STAFF' || userRole === 'Staff') {
      return NextResponse.json(
        { success: false, error: '403 Forbidden: Staff members cannot create products' },
        { status: 403 }
      );
    }

    const contentType = req.headers.get('content-type') || '';
    let productData: any = {};
    let imageUrl: string | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') || formData.get('image');

      if (file instanceof File && file.size > 0) {
        imageUrl = await uploadImageToSupabase(file);
      } else {
        const existingUrl = formData.get('imageUrl');
        if (typeof existingUrl === 'string' && existingUrl) {
          imageUrl = existingUrl;
        }
      }

      productData = {
        name: formData.get('name') as string,
        sku: formData.get('sku') as string,
        barcode: formData.get('barcode') as string,
        categoryId: (formData.get('categoryId') || formData.get('category')) as string,
        currentStock: Number(formData.get('currentStock')) || 0,
        minStock: Number(formData.get('minStock')) || 5,
        maxStock: Number(formData.get('maxStock')) || 500,
        sellingPrice: Number(formData.get('sellingPrice')) || 0,
        costPrice: Number(formData.get('costPrice')) || 0,
        unit: (formData.get('unit') as string) || 'units',
        rackLocation: (formData.get('rackLocation') as string) || 'A1-B1-S1',
        vendorId: (formData.get('vendorId') || formData.get('vendor')) as string || null,
        description: (formData.get('description') as string) || '',
        isCustomPrinting: formData.get('isCustomPrinting') === 'true',
      };
    } else {
      const body = await req.json();
      productData = {
        name: body.name,
        sku: body.sku,
        barcode: body.barcode,
        categoryId: body.categoryId || body.category,
        currentStock: Number(body.currentStock) || 0,
        minStock: Number(body.minStock) || 5,
        maxStock: Number(body.maxStock) || 500,
        sellingPrice: Number(body.sellingPrice) || 0,
        costPrice: Number(body.costPrice) || 0,
        unit: body.unit || 'units',
        rackLocation: body.rackLocation || 'A1-B1-S1',
        vendorId: body.vendorId || body.vendor || null,
        description: body.description || '',
        isCustomPrinting: Boolean(body.isCustomPrinting),
      };
      imageUrl = body.imageUrl || null;
    }

    if (!productData.name || !productData.sku || !productData.categoryId) {
      return NextResponse.json(
        { success: false, error: 'Product name, SKU, and category are required' },
        { status: 400 }
      );
    }

    const scope = await getScopeWhere();
    await assertInScope(scope, {
      categoryId: productData.categoryId,
      vendorId: productData.vendorId || null,
    });

    const generatedBarcode =
      productData.barcode || `890${Math.floor(100000000 + Math.random() * 900000000)}`;

    const finalImageUrl =
      imageUrl ||
      'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500&auto=format&fit=crop';

    // Save product to Prisma database with public Supabase image URL
    const newProduct = await prisma.product.create({
      data: {
        name: productData.name,
        sku: productData.sku,
        barcode: generatedBarcode,
        categoryId: productData.categoryId,
        currentStock: productData.currentStock,
        minStock: productData.minStock,
        maxStock: productData.maxStock,
        sellingPrice: productData.sellingPrice,
        costPrice: productData.costPrice,
        unit: productData.unit,
        rackLocation: productData.rackLocation,
        vendorId: productData.vendorId,
        imageUrl: finalImageUrl,
        description: productData.description,
        isCustomPrinting: productData.isCustomPrinting,
        isDemo: scope.isDemo,
      },
      include: {
        category: true,
        vendor: true,
      },
    });

    if (productData.categoryId) {
      await prisma.category
        .update({
          where: { id: productData.categoryId },
          data: { productCount: { increment: 1 } },
        })
        .catch(() => {});
    }

    if (newProduct.currentStock > 0) {
      await prisma.inventoryLog
        .create({
          data: {
            productId: newProduct.id,
            productName: newProduct.name,
            sku: newProduct.sku,
            type: 'Stock In',
            quantity: newProduct.currentStock,
            remaining: newProduct.currentStock,
            unitPrice: newProduct.costPrice,
            supplier: 'Initial Supplier',
            batch: `B${Date.now()}`,
            reason: 'Initial Product Intake',
            performedBy: 'Admin User',
            isDemo: scope.isDemo,
          },
        })
        .catch(() => {});
    }

    return NextResponse.json({
      success: true,
      product: {
        ...newProduct,
        _id: newProduct.id,
      },
    });
  } catch (error: any) {
    console.error('Product POST error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to create product' }, { status: 500 });
  }
}
