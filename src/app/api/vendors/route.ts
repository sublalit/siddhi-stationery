import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Vendor from '@/models/Vendor';
import { mockVendors } from '@/lib/mockStore';

let memoryVendors = [...mockVendors];

export async function GET() {
  try {
    const conn = await dbConnect();
    if (!conn) {
      return NextResponse.json({ success: true, vendors: memoryVendors });
    }
    const vendors = await Vendor.find({}).sort({ name: 1 }).lean();
    return NextResponse.json({ success: true, vendors });
  } catch (error: any) {
    return NextResponse.json({ success: true, vendors: memoryVendors });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.name || body.name.trim() === '') {
      return NextResponse.json({ success: false, error: 'Vendor name is required' }, { status: 400 });
    }

    const conn = await dbConnect();

    if (!conn) {
      const newV = {
        _id: `ven-${Date.now()}`,
        name: body.name.trim(),
        contactPerson: body.contactPerson || '',
        email: body.email || '',
        phone: body.phone || '',
        address: body.address || '',
        status: body.status || 'Active',
      };
      memoryVendors.unshift(newV);
      return NextResponse.json({ success: true, vendor: newV });
    }

    const newVendor = await Vendor.create({
      name: body.name.trim(),
      contactPerson: body.contactPerson || '',
      email: body.email || '',
      phone: body.phone || '',
      address: body.address || '',
      status: body.status || 'Active',
    });
    return NextResponse.json({ success: true, vendor: newVendor });
  } catch (error: any) {
    console.error('Vendor POST error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
}
