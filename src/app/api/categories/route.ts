import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });

    const mappedCategories = categories.map((c) => ({
      ...c,
      _id: c.id,
    }));

    return NextResponse.json({ success: true, categories: mappedCategories });
  } catch (error: any) {
    console.error('Category GET error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userRole = req.headers.get('x-user-role');
    if (userRole === 'STAFF' || userRole === 'Staff') {
      return NextResponse.json(
        { success: false, error: '403 Forbidden: Staff members cannot create categories' },
        { status: 403 }
      );
    }

    const body = await req.json();
    if (!body.name || body.name.trim() === '') {
      return NextResponse.json({ success: false, error: 'Category name is required' }, { status: 400 });
    }

    const slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const newCategory = await prisma.category.create({
      data: {
        name: body.name.trim(),
        slug,
        description: body.description || '',
      },
    });

    return NextResponse.json({
      success: true,
      category: { ...newCategory, _id: newCategory.id },
    });
  } catch (error: any) {
    console.error('Category POST error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
}
