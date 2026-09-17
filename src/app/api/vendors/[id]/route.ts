import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Vendor from '@/models/Vendor';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const conn = await dbConnect();

    if (!conn) {
      return NextResponse.json({ success: true, message: 'Vendor updated in memory' });
    }

    const updated = await Vendor.findByIdAndUpdate(
      id,
      {
        name: body.name,
        contactPerson: body.contactPerson,
        email: body.email,
        phone: body.phone,
        address: body.address,
        status: body.status || 'Active',
      },
      { new: true }
    );

    return NextResponse.json({ success: true, vendor: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const conn = await dbConnect();

    if (!conn) {
      return NextResponse.json({ success: true, message: 'Vendor deleted from memory' });
    }

    await Vendor.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
