// In-memory fallback data store for when local MongoDB daemon is not running

export interface IMockProduct {
  _id: string;
  name: string;
  sku: string;
  barcode: string;
  category: { _id: string; name: string; slug: string };
  currentStock: number;
  minStock: number;
  maxStock: number;
  sellingPrice: number;
  costPrice: number;
  unit: string;
  rackLocation: string;
  vendor?: { _id: string; name: string };
  imageUrl: string;
  description: string;
  isCustomPrinting?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const mockCategories = [
  { _id: 'cat-1', name: 'Paper Products', slug: 'paper-products', description: 'A4 copy paper, letterheads, chart papers & envelopes', productCount: 2 },
  { _id: 'cat-2', name: 'Writing Instruments', slug: 'writing-instruments', description: 'Ballpoint pens, HB pencils, highlighters, markers', productCount: 2 },
  { _id: 'cat-3', name: 'Notebooks', slug: 'notebooks', description: 'Single line, four line, graph & spiral notebooks', productCount: 1 },
  { _id: 'cat-4', name: 'Office Accessories', slug: 'office-accessories', description: 'Staplers, tape dispensers, paper clips, scissors', productCount: 1 },
];

export const mockVendors = [
  { _id: 'ven-1', name: 'Century Paper Mills Ltd', contactPerson: 'Rajesh Sharma', email: 'orders@centurypaper.com', phone: '+91 98200 12345', address: 'Industrial Area Phase II, Mumbai', status: 'Active' },
  { _id: 'ven-2', name: 'Camlin Stationery Supplies', contactPerson: 'Anita Patel', email: 'sales@camlin.co.in', phone: '+91 98922 67890', address: 'MIDC Andheri East, Mumbai', status: 'Active' },
];

export const mockProducts: IMockProduct[] = [
  {
    _id: 'prod-1',
    name: 'A4 Copy Paper - White (75 GSM)',
    sku: 'PPR-001',
    barcode: '890123456701',
    category: mockCategories[0],
    currentStock: 250,
    minStock: 50,
    maxStock: 500,
    sellingPrice: 450.0,
    costPrice: 380.0,
    unit: 'reams',
    rackLocation: 'A1-B1-S1',
    vendor: mockVendors[0],
    imageUrl: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500&auto=format&fit=crop',
    description: 'High brightness 75 GSM A4 copier paper ideal for laser & inkjet printing.',
  },
  {
    _id: 'prod-2',
    name: 'Ball Point Pen - Blue',
    sku: 'PEN-002',
    barcode: '890123456702',
    category: mockCategories[1],
    currentStock: 15,
    minStock: 25,
    maxStock: 300,
    sellingPrice: 12.5,
    costPrice: 8.0,
    unit: 'units',
    rackLocation: 'B2-C1-S2',
    vendor: mockVendors[1],
    imageUrl: 'https://images.unsplash.com/photo-1585336261026-875a60a1c92f?w=500&auto=format&fit=crop',
    description: 'Smooth flow 0.7mm blue gel ballpoint pen for everyday office use.',
  },
  {
    _id: 'prod-3',
    name: 'Pencil - HB Grade',
    sku: 'PCL-003',
    barcode: '890123456703',
    category: mockCategories[1],
    currentStock: 0,
    minStock: 50,
    maxStock: 400,
    sellingPrice: 8.0,
    costPrice: 4.5,
    unit: 'units',
    rackLocation: 'B2-C2-S3',
    vendor: mockVendors[1],
    imageUrl: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=500&auto=format&fit=crop',
    description: 'Break-resistant bonded lead HB graphite pencils.',
  },
  {
    _id: 'prod-4',
    name: 'Exercise Book - Single Line (172 Pgs)',
    sku: 'NB-004',
    barcode: '890123456704',
    category: mockCategories[2],
    currentStock: 85,
    minStock: 30,
    maxStock: 300,
    sellingPrice: 35.0,
    costPrice: 22.0,
    unit: 'units',
    rackLocation: 'C1-D1-S4',
    vendor: mockVendors[0],
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop',
    description: 'Soft cover long exercise book with ruling line pages.',
  },
  {
    _id: 'prod-5',
    name: 'Custom Letterhead (A4 Bond Paper)',
    sku: 'PRT-006',
    barcode: '890123456706',
    category: mockCategories[0],
    currentStock: 120,
    minStock: 20,
    maxStock: 500,
    sellingPrice: 750.0,
    costPrice: 400.0,
    unit: 'packs',
    rackLocation: 'P1-PRINT-01',
    vendor: mockVendors[0],
    imageUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=500&auto=format&fit=crop',
    description: 'Customized business letterhead on 100 GSM premium sunshine bond paper.',
    isCustomPrinting: true,
  },
];

export const mockInvoices = [
  {
    _id: 'inv-1',
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
        product: 'prod-1',
        productName: 'A4 Copy Paper - White (75 GSM)',
        sku: 'PPR-001',
        quantity: 2,
        unitPrice: 450,
        discountPercent: 5,
        lineTotal: 855,
      },
      {
        product: 'prod-2',
        productName: 'Ball Point Pen - Blue',
        sku: 'PEN-002',
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
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'inv-2',
    invoiceNumber: 'INV-2026-002',
    customer: {
      name: 'St. Xavier High School',
      phone: '+91 98202 33445',
      email: 'admin@stxaviers.edu.in',
      address: 'Fort Campus, Mumbai',
    },
    items: [
      {
        product: 'prod-4',
        productName: 'Exercise Book - Single Line (172 Pgs)',
        sku: 'NB-004',
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
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export const mockInventoryLogs = [
  {
    _id: 'log-1',
    productName: 'Ball Point Pen - Blue',
    sku: 'PEN-002',
    type: 'Stock Out',
    quantity: 5,
    reason: 'Sale #INV-2026-001',
    timestamp: new Date(Date.now() - 7200000).toLocaleString(),
  },
  {
    _id: 'log-2',
    productName: 'Pencil - HB Grade',
    sku: 'PCL-003',
    type: 'Stock Out',
    quantity: 7,
    reason: 'Sale #INV-2026-002',
    timestamp: new Date(Date.now() - 18000000).toLocaleString(),
  },
  {
    _id: 'log-3',
    productName: 'A4 Copy Paper - White (75 GSM)',
    sku: 'PPR-001',
    type: 'Stock In',
    quantity: 50,
    reason: 'Purchase Restock PO-991',
    timestamp: new Date(Date.now() - 86400000).toLocaleString(),
  },
];
