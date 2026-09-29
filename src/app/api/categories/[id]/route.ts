import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getScopeWhere } from '@/lib/dataScope';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userRole = req.headers.get('x-user-role');
    if (userRole === 'STAFF' || userRole === 'Staff') {
      return NextResponse.json(
        { success: false, error: '403 Forbidden: Staff members cannot edit categories' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const scope = await getScopeWhere();

    const existing = await prisma.category.findFirst({ where: { id, ...scope }, select: { id: true } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 });
    }

    const slug = body.name ? body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : undefined;

    const updated = await prisma.category.update({
      where: { id },
      data: {
        name: body.name,
        slug,
        description: body.description,
      },
    });

    return NextResponse.json({
      success: true,
      category: { ...updated, _id: updated.id },
    });
  } catch (error: any) {
    console.error('Category PUT error:', error);
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userRole = req.headers.get('x-user-role');
    if (userRole === 'STAFF' || userRole === 'Staff') {
      return NextResponse.json(
        { success: false, error: '403 Forbidden: Staff members cannot delete categories' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const scope = await getScopeWhere();
    const { count } = await prisma.category.deleteMany({
      where: { id, ...scope },
    });
    if (count === 0) {
      return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Category DELETE error:', error);
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
