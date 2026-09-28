import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userRole = req.headers.get('x-user-role');
    if (userRole === 'STAFF' || userRole === 'Staff') {
      return NextResponse.json(
        { success: false, error: '403 Forbidden: Staff members cannot edit vendors' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();

    const updated = await prisma.vendor.update({
      where: { id },
      data: {
        name: body.name,
        contactPerson: body.contactPerson,
        email: body.email,
        phone: body.phone,
        address: body.address,
        status: body.status,
      },
    });

    return NextResponse.json({
      success: true,
      vendor: { ...updated, _id: updated.id },
    });
  } catch (error: any) {
    console.error('Vendor PUT error:', error);
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userRole = req.headers.get('x-user-role');
    if (userRole === 'STAFF' || userRole === 'Staff') {
      return NextResponse.json(
        { success: false, error: '403 Forbidden: Staff members cannot delete vendors' },
        { status: 403 }
      );
    }

    const { id } = await params;
    await prisma.vendor.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Vendor DELETE error:', error);
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
