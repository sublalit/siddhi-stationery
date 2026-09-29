import prisma from '@/lib/prisma';

const DEMO = { isDemo: true } as const;

/**
 * Creates the demo dataset only if it does not exist yet.
 */
export async function ensureDemoDataset() {
  const existing = await prisma.product.count({ where: DEMO });
  if (existing > 0) return { seeded: false };
  await resetDemoDataset();
  return { seeded: true };
}

/**
 * Wipes and recreates rows where isDemo = true. Live rows and users are never touched.
 */
export async function resetDemoDataset() {
  await prisma.$transaction([
    prisma.invoiceItem.deleteMany({ where: { invoice: DEMO } }),
    prisma.inventoryLog.deleteMany({ where: DEMO }),
    prisma.invoice.deleteMany({ where: DEMO }),
    prisma.product.deleteMany({ where: DEMO }),
    prisma.category.deleteMany({ where: DEMO }),
    prisma.vendor.deleteMany({ where: DEMO }),
    prisma.printingRequest.deleteMany({ where: DEMO }),
    prisma.transaction.deleteMany({ where: DEMO }),
    prisma.expense.deleteMany({ where: DEMO }),
    prisma.dailyLedger.deleteMany({ where: DEMO }),
  ]);

  const performedBy = 'Demo Admin';

  const [paperCat, writingCat, notebookCat, accessoriesCat] = await Promise.all([
    prisma.category.create({
      data: { ...DEMO, name: 'Paper Products', slug: 'paper-products', description: 'A4 copy paper, letterheads, chart papers & envelopes', productCount: 2 },
    }),
    prisma.category.create({
      data: { ...DEMO, name: 'Writing Instruments', slug: 'writing-instruments', description: 'Ballpoint pens, HB pencils, highlighters, markers', productCount: 2 },
    }),
    prisma.category.create({
      data: { ...DEMO, name: 'Notebooks', slug: 'notebooks', description: 'Single line, four line, graph & spiral notebooks', productCount: 1 },
    }),
    prisma.category.create({
      data: { ...DEMO, name: 'Office Accessories', slug: 'office-accessories', description: 'Staplers, tape dispensers, paper clips, scissors', productCount: 1 },
    }),
  ]);

  const [vendor1, vendor2] = await Promise.all([
    prisma.vendor.create({
      data: { ...DEMO, name: 'Century Paper Mills Ltd', contactPerson: 'Rajesh Sharma', email: 'orders@centurypaper.example.com', phone: '+91 98200 12345', address: 'Industrial Area Phase II, Mumbai', status: 'Active' },
    }),
    prisma.vendor.create({
      data: { ...DEMO, name: 'Camlin Stationery Supplies', contactPerson: 'Anita Patel', email: 'sales@camlin.example.com', phone: '+91 98922 67890', address: 'MIDC Andheri East, Mumbai', status: 'Active' },
    }),
  ]);

  const productSeeds = [
    { name: 'A4 Copy Paper - White (75 GSM)', sku: 'PPR-001', barcode: '890123456701', categoryId: paperCat.id, currentStock: 250, minStock: 50, maxStock: 500, sellingPrice: 450, costPrice: 380, unit: 'reams', rackLocation: 'A1-B1-S1', vendorId: vendor1.id, imageUrl: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500&auto=format&fit=crop', description: 'High brightness 75 GSM A4 copier paper ideal for laser & inkjet printing.' },
    { name: 'Ball Point Pen - Blue', sku: 'PEN-002', barcode: '890123456702', categoryId: writingCat.id, currentStock: 15, minStock: 25, maxStock: 300, sellingPrice: 12.5, costPrice: 8, unit: 'units', rackLocation: 'B2-C1-S2', vendorId: vendor2.id, imageUrl: 'https://images.unsplash.com/photo-1585336261026-875a60a1c92f?w=500&auto=format&fit=crop', description: 'Smooth flow 0.7mm blue gel ballpoint pen for everyday office use.' },
    { name: 'Pencil - HB Grade', sku: 'PCL-003', barcode: '890123456703', categoryId: writingCat.id, currentStock: 0, minStock: 50, maxStock: 400, sellingPrice: 8, costPrice: 4.5, unit: 'units', rackLocation: 'B2-C2-S3', vendorId: vendor2.id, imageUrl: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=500&auto=format&fit=crop', description: 'Break-resistant bonded lead HB graphite pencils.' },
    { name: 'Exercise Book - Single Line (172 Pgs)', sku: 'NB-004', barcode: '890123456704', categoryId: notebookCat.id, currentStock: 85, minStock: 30, maxStock: 300, sellingPrice: 35, costPrice: 22, unit: 'units', rackLocation: 'C1-D1-S4', vendorId: vendor1.id, imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop', description: 'Soft cover long exercise book with ruling line pages.' },
    { name: 'Heavy Duty Stapler (24/6)', sku: 'ACC-005', barcode: '890123456705', categoryId: accessoriesCat.id, currentStock: 42, minStock: 10, maxStock: 100, sellingPrice: 195, costPrice: 130, unit: 'units', rackLocation: 'D1-E1-S2', vendorId: vendor2.id, imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop', description: 'Metal body desktop stapler with 30-sheet capacity.' },
    { name: 'Custom Letterhead (A4 Bond Paper)', sku: 'PRT-006', barcode: '890123456706', categoryId: paperCat.id, currentStock: 120, minStock: 20, maxStock: 500, sellingPrice: 750, costPrice: 400, unit: 'packs', rackLocation: 'P1-PRINT-01', vendorId: vendor1.id, imageUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=500&auto=format&fit=crop', description: 'Customized business letterhead on 100 GSM premium sunshine bond paper.', isCustomPrinting: true, paperGsmOptions: JSON.stringify([90, 100, 120]), printSides: JSON.stringify(['Single-Sided', 'Double-Sided']), finishTypes: JSON.stringify(['Matte', 'Textured Sunshine Bond']) },
  ];

  const [prod1, prod2, prod3, prod4] = await Promise.all(
    productSeeds.map((p) => prisma.product.create({ data: { ...DEMO, ...p } }))
  );

  const hoursAgo = (h: number) => new Date(Date.now() - 1000 * 60 * 60 * h);

  await prisma.inventoryLog.createMany({
    data: [
      { ...DEMO, productId: prod2.id, productName: prod2.name, sku: prod2.sku, type: 'Stock Out', quantity: 5, reason: 'Sale #INV-2026-001', performedBy, timestamp: hoursAgo(2) },
      { ...DEMO, productId: prod3.id, productName: prod3.name, sku: prod3.sku, type: 'Stock Out', quantity: 7, reason: 'Sale #INV-2026-002', performedBy, timestamp: hoursAgo(5) },
      { ...DEMO, productId: prod1.id, productName: prod1.name, sku: prod1.sku, type: 'Stock In', quantity: 50, unitPrice: 380, reason: 'Purchase Restock PO-991', performedBy, timestamp: hoursAgo(24) },
    ],
  });

  await prisma.invoice.create({
    data: {
      ...DEMO,
      invoiceNumber: 'INV-2026-001',
      customerName: 'Apex Infotech Pvt Ltd',
      customerPhone: '+91 98201 11223',
      customerEmail: 'accounts@apexinfotech.example.com',
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
          { productId: prod1.id, productName: prod1.name, sku: prod1.sku, quantity: 2, unitPrice: 450, discountPercent: 5, lineTotal: 855 },
          { productId: prod2.id, productName: prod2.name, sku: prod2.sku, quantity: 10, unitPrice: 12.5, discountPercent: 0, lineTotal: 125 },
        ],
      },
    },
  });

  await prisma.invoice.create({
    data: {
      ...DEMO,
      invoiceNumber: 'INV-2026-002',
      customerName: 'St. Xavier High School',
      customerPhone: '+91 98202 33445',
      customerEmail: 'admin@stxaviers.example.com',
      customerAddress: 'Fort Campus, Mumbai',
      subtotal: 1750,
      gstAmount: 210,
      discountTotal: 175,
      grandTotal: 1610,
      paymentStatus: 'Pending',
      paymentMethod: 'Credit',
      items: {
        create: [
          { productId: prod4.id, productName: prod4.name, sku: prod4.sku, quantity: 50, unitPrice: 35, discountPercent: 10, lineTotal: 1575 },
        ],
      },
    },
  });

  await prisma.printingRequest.create({
    data: {
      ...DEMO,
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

  await prisma.transaction.createMany({
    data: [
      { ...DEMO, amount: 120, paymentMode: 'CASH', note: 'Photocopy / Xerox', createdAt: hoursAgo(1) },
      { ...DEMO, amount: 450, paymentMode: 'UPI', note: 'Notebooks', createdAt: hoursAgo(2) },
      { ...DEMO, amount: 60, paymentMode: 'CASH', note: 'Pens / Stationery', createdAt: hoursAgo(3) },
    ],
  });
}
