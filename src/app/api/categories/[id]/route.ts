import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

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
    const { id } = await params;
    await prisma.category.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Category DELETE error:', error);
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
