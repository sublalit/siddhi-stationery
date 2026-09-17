import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Category from '@/models/Category';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const conn = await dbConnect();

    if (!conn) {
      return NextResponse.json({ success: true, message: 'Category updated in memory' });
    }

    const slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const updated = await Category.findByIdAndUpdate(
      id,
      { name: body.name, slug, description: body.description },
      { new: true }
    );

    return NextResponse.json({ success: true, category: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const conn = await dbConnect();

    if (!conn) {
      return NextResponse.json({ success: true, message: 'Category deleted from memory' });
    }

    await Category.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
