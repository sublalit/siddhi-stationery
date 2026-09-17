import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Category from '@/models/Category';
import { mockCategories } from '@/lib/mockStore';

let memoryCategories = [...mockCategories];

export async function GET() {
  try {
    const conn = await dbConnect();
    if (!conn) {
      return NextResponse.json({ success: true, categories: memoryCategories });
    }
    const categories = await Category.find({}).sort({ name: 1 }).lean();
    return NextResponse.json({ success: true, categories });
  } catch (error: any) {
    return NextResponse.json({ success: true, categories: memoryCategories });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.name || body.name.trim() === '') {
      return NextResponse.json({ success: false, error: 'Category name is required' }, { status: 400 });
    }

    const slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const conn = await dbConnect();

    if (!conn) {
      const newCat = {
        _id: `cat-${Date.now()}`,
        name: body.name.trim(),
        slug,
        description: body.description || '',
        productCount: 0,
      };
      memoryCategories.unshift(newCat);
      return NextResponse.json({ success: true, category: newCat });
    }

    const newCategory = await Category.create({
      name: body.name.trim(),
      slug,
      description: body.description || '',
    });

    return NextResponse.json({ success: true, category: newCategory });
  } catch (error: any) {
    console.error('Category POST error:', error);
    try {
      const body = await req.json().catch(() => ({}));
      const newCat = {
        _id: `cat-${Date.now()}`,
        name: body.name || 'New Category',
        slug: (body.name || 'New Category').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: body.description || '',
        productCount: 0,
      };
      memoryCategories.unshift(newCat);
      return NextResponse.json({ success: true, category: newCat });
    } catch (e) {
      return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
    }
  }
}
