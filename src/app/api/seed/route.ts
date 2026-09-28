import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

import { Role } from '@prisma/client';

export async function GET(req: Request) {
  const userRole = req.headers.get('x-user-role');
  if (userRole !== 'ADMIN' && userRole !== 'Admin') {
    return NextResponse.json(
      { success: false, error: '403 Forbidden: Only administrators can seed the database.' },
      { status: 403 }
    );
  }

  try {
    // 1. Clean existing data (for seed refresh)
    await prisma.invoiceItem.deleteMany({});
    await prisma.inventoryLog.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.vendor.deleteMany({});
    await prisma.invoice.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.printingRequest.deleteMany({});

    // 2. Create Users
    const adminUser = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@siddhistationery.com',
        role: Role.ADMIN,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop',
      },
    });

    // 3. Create Categories
    const paperCat = await prisma.category.create({
      data: {
        name: 'Paper Products',
        slug: 'paper-products',
        description: 'A4 copy paper, letterheads, chart papers & envelopes',
        productCount: 2,
      },
    });

    const writingCat = await prisma.category.create({
      data: {
        name: 'Writing Instruments',
        slug: 'writing-instruments',
        description: 'Ballpoint pens, HB pencils, highlighters, markers',
        productCount: 2,
      },
    });

    const notebookCat = await prisma.category.create({
      data: {
        name: 'Notebooks',
        slug: 'notebooks',
        description: 'Single line, four line, graph & spiral notebooks',
        productCount: 2,
      },
    });

    const accessoriesCat = await prisma.category.create({
      data: {
        name: 'Office Accessories',
        slug: 'office-accessories',
        description: 'Staplers, tape dispensers, paper clips, scissors',
        productCount: 2,
      },
    });

    // 4. Create Vendors
    const vendor1 = await prisma.vendor.create({
      data: {
        name: 'Century Paper Mills Ltd',
        contactPerson: 'Rajesh Sharma',
        email: 'orders@centurypaper.com',
        phone: '+91 98200 12345',
        address: 'Industrial Area Phase II, Mumbai',
        status: 'Active',
      },
    });

    const vendor2 = await prisma.vendor.create({
      data: {
        name: 'Camlin Stationery Supplies',
        contactPerson: 'Anita Patel',
        email: 'sales@camlin.co.in',
        phone: '+91 98922 67890',
        address: 'MIDC Andheri East, Mumbai',
        status: 'Active',
      },
    });

    // 5. Create Products matching Lovable prototype
    const prod1 = await prisma.product.create({
      data: {
        name: 'A4 Copy Paper - White (75 GSM)',
        sku: 'PPR-001',
        barcode: '890123456701',
        categoryId: paperCat.id,
        currentStock: 250,
        minStock: 50,
        maxStock: 500,
        sellingPrice: 450.0,
        costPrice: 380.0,
        unit: 'reams',
        rackLocation: 'A1-B1-S1',
        vendorId: vendor1.id,
        imageUrl: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500&auto=format&fit=crop',
        description: 'High brightness 75 GSM A4 copier paper ideal for laser & inkjet printing.',
      },
    });

    const prod2 = await prisma.product.create({
      data: {
        name: 'Ball Point Pen - Blue',
        sku: 'PEN-002',
        barcode: '890123456702',
        categoryId: writingCat.id,
        currentStock: 15,
        minStock: 25,
        maxStock: 300,
        sellingPrice: 12.5,
        costPrice: 8.0,
        unit: 'units',
        rackLocation: 'B2-C1-S2',
        vendorId: vendor2.id,
        imageUrl: 'https://images.unsplash.com/photo-1585336261026-875a60a1c92f?w=500&auto=format&fit=crop',
        description: 'Smooth flow 0.7mm blue gel ballpoint pen for everyday office use.',
      },
    });

    const prod3 = await prisma.product.create({
      data: {
        name: 'Pencil - HB Grade',
        sku: 'PCL-003',
        barcode: '890123456703',
        categoryId: writingCat.id,
        currentStock: 0,
        minStock: 50,
        maxStock: 400,
        sellingPrice: 8.0,
        costPrice: 4.5,
        unit: 'units',
        rackLocation: 'B2-C2-S3',
        vendorId: vendor2.id,
        imageUrl: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=500&auto=format&fit=crop',
        description: 'Break-resistant bonded lead HB graphite pencils.',
      },
    });

    const prod4 = await prisma.product.create({
      data: {
        name: 'Exercise Book - Single Line (172 Pgs)',
        sku: 'NB-004',
        barcode: '890123456704',
        categoryId: notebookCat.id,
        currentStock: 85,
        minStock: 30,
        maxStock: 300,
        sellingPrice: 35.0,
        costPrice: 22.0,
        unit: 'units',
        rackLocation: 'C1-D1-S4',
        vendorId: vendor1.id,
        imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop',
        description: 'Soft cover long exercise book with ruling line pages.',
      },
    });

    const prod5 = await prisma.product.create({
      data: {
        name: 'Heavy Duty Stapler (24/6)',
        sku: 'ACC-005',
        barcode: '890123456705',
        categoryId: accessoriesCat.id,
        currentStock: 42,
        minStock: 10,
        maxStock: 100,
        sellingPrice: 195.0,
        costPrice: 130.0,
        unit: 'units',
        rackLocation: 'D1-E1-S2',
        vendorId: vendor2.id,
        imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop',
        description: 'Metal body desktop stapler with 30-sheet capacity.',
      },
    });

    const prod6 = await prisma.product.create({
      data: {
        name: 'Custom Letterhead (A4 Bond Paper)',
        sku: 'PRT-006',
        barcode: '890123456706',
        categoryId: paperCat.id,
        currentStock: 120,
        minStock: 20,
        maxStock: 500,
        sellingPrice: 750.0,
        costPrice: 400.0,
        unit: 'packs',
        rackLocation: 'P1-PRINT-01',
        vendorId: vendor1.id,
        imageUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=500&auto=format&fit=crop',
        description: 'Customized business letterhead on 100 GSM premium sunshine bond paper.',
        isCustomPrinting: true,
        paperGsmOptions: JSON.stringify([90, 100, 120]),
        printSides: JSON.stringify(['Single-Sided', 'Double-Sided']),
        finishTypes: JSON.stringify(['Matte', 'Textured Sunshine Bond']),
      },
    });

    // 6. Create Inventory Activity Logs
    await prisma.inventoryLog.createMany({
      data: [
        {
          productId: prod2.id,
          productName: prod2.name,
          sku: prod2.sku,
          type: 'Stock Out',
          quantity: 5,
          reason: 'Sale #INV-2026-001',
          performedBy: adminUser.name,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
        },
        {
          productId: prod3.id,
          productName: prod3.name,
          sku: prod3.sku,
          type: 'Stock Out',
          quantity: 7,
          reason: 'Sale #INV-2026-002',
          performedBy: adminUser.name,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
        },
        {
          productId: prod1.id,
          productName: prod1.name,
          sku: prod1.sku,
          type: 'Stock In',
          quantity: 50,
          reason: 'Purchase Restock PO-991',
          performedBy: adminUser.name,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
        },
      ],
    });

    // 7. Create Invoices with items
    await prisma.invoice.create({
      data: {
        invoiceNumber: 'INV-2026-001',
        customerName: 'Apex Infotech Pvt Ltd',
        customerPhone: '+91 98201 11223',
        customerEmail: 'accounts@apexinfotech.in',
        customerAddress: 'Powai Business Park, Mumbai',
        customerGstin: '27AAAAA0000A1Z5',
        subtotal: 980,
        gstAmount: 176.4,
        discountTotal: 45,
        grandTotal: 1111.4,
        paymentStatus: 'Paid',
        paymentMethod: 'UPI',
        items: {
          create: [
            {
              productId: prod1.id,
              productName: prod1.name,
              sku: prod1.sku,
              quantity: 2,
              unitPrice: 450,
              discountPercent: 5,
              lineTotal: 855,
            },
            {
              productId: prod2.id,
              productName: prod2.name,
              sku: prod2.sku,
              quantity: 10,
              unitPrice: 12.5,
              discountPercent: 0,
              lineTotal: 125,
            },
          ],
        },
      },
    });

    await prisma.invoice.create({
      data: {
        invoiceNumber: 'INV-2026-002',
        customerName: 'St. Xavier High School',
        customerPhone: '+91 98202 33445',
        customerEmail: 'admin@stxaviers.edu.in',
        customerAddress: 'Fort Campus, Mumbai',
        subtotal: 1750,
        gstAmount: 210,
        discountTotal: 175,
        grandTotal: 1610,
        paymentStatus: 'Pending',
        paymentMethod: 'Credit',
        items: {
          create: [
            {
              productId: prod4.id,
              productName: prod4.name,
              sku: prod4.sku,
              quantity: 50,
              unitPrice: 35,
              discountPercent: 10,
              lineTotal: 1575,
            },
          ],
        },
      },
    });

    // 8. Create Printing Requests
    await prisma.printingRequest.create({
      data: {
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
    });

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully with Siddhi Stationery demo records in Supabase PostgreSQL!',
    });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to seed database' },
      { status: 500 }
    );
  }
}
