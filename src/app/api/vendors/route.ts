import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const vendors = await prisma.vendor.findMany({
      orderBy: { name: 'asc' },
    });

    const mappedVendors = vendors.map((v) => ({
      ...v,
      _id: v.id,
    }));

    return NextResponse.json({ success: true, vendors: mappedVendors });
  } catch (error: any) {
    console.error('Vendor GET error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.name || body.name.trim() === '') {
      return NextResponse.json({ success: false, error: 'Vendor name is required' }, { status: 400 });
    }

    const newVendor = await prisma.vendor.create({
      data: {
        name: body.name.trim(),
        contactPerson: body.contactPerson || '',
        email: body.email || '',
        phone: body.phone || '',
        address: body.address || '',
        status: body.status || 'Active',
      },
    });

    return NextResponse.json({
      success: true,
      vendor: { ...newVendor, _id: newVendor.id },
    });
  } catch (error: any) {
    console.error('Vendor POST error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
}
