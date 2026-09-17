import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Category from '@/models/Category';
import Vendor from '@/models/Vendor';
import Product from '@/models/Product';
import Invoice from '@/models/Invoice';
import InventoryLog from '@/models/InventoryLog';
import User from '@/models/User';
import PrintingRequest from '@/models/PrintingRequest';

export async function GET() {
  try {
    await dbConnect();

    // 1. Clean existing data (for seed refresh)
    await Category.deleteMany({});
    await Vendor.deleteMany({});
    await Product.deleteMany({});
    await Invoice.deleteMany({});
    await InventoryLog.deleteMany({});
    await User.deleteMany({});
    await PrintingRequest.deleteMany({});

    // 2. Create Users
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@siddhistationery.com',
      role: 'admin',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop',
    });

    // 3. Create Categories
    const paperCat = await Category.create({
      name: 'Paper Products',
      slug: 'paper-products',
      description: 'A4 copy paper, letterheads, chart papers & envelopes',
      productCount: 2,
    });

    const writingCat = await Category.create({
      name: 'Writing Instruments',
      slug: 'writing-instruments',
      description: 'Ballpoint pens, HB pencils, highlighters, markers',
      productCount: 2,
    });

    const notebookCat = await Category.create({
      name: 'Notebooks',
      slug: 'notebooks',
      description: 'Single line, four line, graph & spiral notebooks',
      productCount: 2,
    });

    const accessoriesCat = await Category.create({
      name: 'Office Accessories',
      slug: 'office-accessories',
      description: 'Staplers, tape dispensers, paper clips, scissors',
      productCount: 2,
    });

    // 4. Create Vendors
    const vendor1 = await Vendor.create({
      name: 'Century Paper Mills Ltd',
      contactPerson: 'Rajesh Sharma',
      email: 'orders@centurypaper.com',
      phone: '+91 98200 12345',
      address: 'Industrial Area Phase II, Mumbai',
      status: 'Active',
    });

    const vendor2 = await Vendor.create({
      name: 'Camlin Stationery Supplies',
      contactPerson: 'Anita Patel',
      email: 'sales@camlin.co.in',
      phone: '+91 98922 67890',
      address: 'MIDC Andheri East, Mumbai',
      status: 'Active',
    });

    // 5. Create Products matching Lovable prototype
    const prod1 = await Product.create({
      name: 'A4 Copy Paper - White (75 GSM)',
      sku: 'PPR-001',
      barcode: '890123456701',
      category: paperCat._id,
      currentStock: 250,
      minStock: 50,
      maxStock: 500,
      sellingPrice: 450.0,
      costPrice: 380.0,
      unit: 'reams',
      rackLocation: 'A1-B1-S1',
      vendor: vendor1._id,
      imageUrl: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500&auto=format&fit=crop',
      description: 'High brightness 75 GSM A4 copier paper ideal for laser & inkjet printing.',
    });

    const prod2 = await Product.create({
      name: 'Ball Point Pen - Blue',
      sku: 'PEN-002',
      barcode: '890123456702',
      category: writingCat._id,
      currentStock: 15,
      minStock: 25,
      maxStock: 300,
      sellingPrice: 12.5,
      costPrice: 8.0,
      unit: 'units',
      rackLocation: 'B2-C1-S2',
      vendor: vendor2._id,
      imageUrl: 'https://images.unsplash.com/photo-1585336261026-875a60a1c92f?w=500&auto=format&fit=crop',
      description: 'Smooth flow 0.7mm blue gel ballpoint pen for everyday office use.',
    });

    const prod3 = await Product.create({
      name: 'Pencil - HB Grade',
      sku: 'PCL-003',
      barcode: '890123456703',
      category: writingCat._id,
      currentStock: 0,
      minStock: 50,
      maxStock: 400,
      sellingPrice: 8.0,
      costPrice: 4.5,
      unit: 'units',
      rackLocation: 'B2-C2-S3',
      vendor: vendor2._id,
      imageUrl: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=500&auto=format&fit=crop',
      description: 'Break-resistant bonded lead HB graphite pencils.',
    });

    const prod4 = await Product.create({
      name: 'Exercise Book - Single Line (172 Pgs)',
      sku: 'NB-004',
      barcode: '890123456704',
      category: notebookCat._id,
      currentStock: 85,
      minStock: 30,
      maxStock: 300,
      sellingPrice: 35.0,
      costPrice: 22.0,
      unit: 'units',
      rackLocation: 'C1-D1-S4',
      vendor: vendor1._id,
      imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop',
      description: 'Soft cover long exercise book with ruling line pages.',
    });

    const prod5 = await Product.create({
      name: 'Heavy Duty Stapler (24/6)',
      sku: 'ACC-005',
      barcode: '890123456705',
      category: accessoriesCat._id,
      currentStock: 42,
      minStock: 10,
      maxStock: 100,
      sellingPrice: 195.0,
      costPrice: 130.0,
      unit: 'units',
      rackLocation: 'D1-E1-S2',
      vendor: vendor2._id,
      imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop',
      description: 'Metal body desktop stapler with 30-sheet capacity.',
    });

    const prod6 = await Product.create({
      name: 'Custom Letterhead (A4 Bond Paper)',
      sku: 'PRT-006',
      barcode: '890123456706',
      category: paperCat._id,
      currentStock: 120,
      minStock: 20,
      maxStock: 500,
      sellingPrice: 750.0,
      costPrice: 400.0,
      unit: 'packs',
      rackLocation: 'P1-PRINT-01',
      vendor: vendor1._id,
      imageUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=500&auto=format&fit=crop',
      description: 'Customized business letterhead on 100 GSM premium sunshine bond paper.',
      isCustomPrinting: true,
      printingOptions: {
        paperGsmOptions: [90, 100, 120],
        printSides: ['Single-Sided', 'Double-Sided'],
        finishTypes: ['Matte', 'Textured Sunshine Bond'],
      },
    });

    // 6. Create Inventory Activity Logs
    await InventoryLog.create([
      {
        product: prod2._id,
        productName: prod2.name,
        sku: prod2.sku,
        type: 'Stock Out',
        quantity: 5,
        reason: 'Sale #INV-2026-001',
        performedBy: adminUser.name,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      },
      {
        product: prod3._id,
        productName: prod3.name,
        sku: prod3.sku,
        type: 'Stock Out',
        quantity: 7,
        reason: 'Sale #INV-2026-002',
        performedBy: adminUser.name,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
      },
      {
        product: prod1._id,
        productName: prod1.name,
        sku: prod1.sku,
        type: 'Stock In',
        quantity: 50,
        reason: 'Purchase Restock PO-991',
        performedBy: adminUser.name,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
      },
    ]);

    // 7. Create Invoices
    await Invoice.create([
      {
        invoiceNumber: 'INV-2026-001',
        customer: {
          name: 'Apex Infotech Pvt Ltd',
          phone: '+91 98201 11223',
          email: 'accounts@apexinfotech.in',
          address: 'Powai Business Park, Mumbai',
          gstin: '27AAAAA0000A1Z5',
        },
        items: [
          {
            product: prod1._id,
            productName: prod1.name,
            sku: prod1.sku,
            quantity: 2,
            unitPrice: 450,
            discountPercent: 5,
            lineTotal: 855,
          },
          {
            product: prod2._id,
            productName: prod2.name,
            sku: prod2.sku,
            quantity: 10,
            unitPrice: 12.5,
            discountPercent: 0,
            lineTotal: 125,
          },
        ],
        subtotal: 980,
        gstAmount: 176.4,
        discountTotal: 45,
        grandTotal: 1111.4,
        paymentStatus: 'Paid',
        paymentMethod: 'UPI',
      },
      {
        invoiceNumber: 'INV-2026-002',
        customer: {
          name: 'St. Xavier High School',
          phone: '+91 98202 33445',
          email: 'admin@stxaviers.edu.in',
          address: 'Fort Campus, Mumbai',
        },
        items: [
          {
            product: prod4._id,
            productName: prod4.name,
            sku: prod4.sku,
            quantity: 50,
            unitPrice: 35,
            discountPercent: 10,
            lineTotal: 1575,
          },
        ],
        subtotal: 1750,
        gstAmount: 210,
        discountTotal: 175,
        grandTotal: 1610,
        paymentStatus: 'Pending',
        paymentMethod: 'Credit',
      },
    ]);

    // 8. Create Printing Requests
    await PrintingRequest.create([
      {
        customerName: 'Karan Malhotra',
        customerContact: '+91 98700 99887',
        serviceType: 'Business Cards',
        quantity: 500,
        paperGsm: '350 GSM Velvet Matte',
        printSides: 'Double-Sided',
        finishType: 'Spot UV',
        estimatedCost: 1250,
        status: 'In Production',
        notes: 'Golden foil logo on front side.',
      },
    ]);

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully with Siddhi Stationery demo records!',
    });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to seed database' },
      { status: 500 }
    );
  }
}
