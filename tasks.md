# Siddhi Stationery — Master Implementation Plan (tasks.md)

## 1. Executive Summary & Research Findings

Based on the deep UI/UX analysis of the Lovable prototype ([siddhistationery.lovable.app](https://siddhistationery.lovable.app/)), Siddhi Stationery is a hybrid **Inventory Management, E-Commerce & Business Operations Platform** built for stationery retail, wholesale, and custom printing services.

### Core Design System & Aesthetic Specifications
- **Header Gradient / Brand Bar:** Vivid Sky Cyan (`#00aeef` / `#0099e0`) header with white logo typography and dark/light role switcher.
- **Primary Buttons & Highlights:** Sky Cyan (`#00aeef` / `#0284c7`), Slate Navy for navigation active states (`#0f172a` / `#1e293b`).
- **Status Color Tokens:**
  - 🟢 **In Stock / Active / Paid:** Emerald Green (`#22c55e`)
  - 🟡 **Low Stock / Pending:** Amber (`#f59e0b`)
  - 🔴 **Out of Stock / Destructive:** Crimson Red (`#ef4444`)
- **Background & Elevation:** Light Slate workspace background (`#f8fafc`) with crisp white card surfaces (`#ffffff`), subtle borders (`#e2e8f0`), and soft shadows.
- **Typography:** Inter / System UI, bold metric values, clean metadata labels.
- **Layout:** Persistent Top Navigation Header + Left Sidebar Navigation + Dynamic Main Workspace with Breadcrumb trail.

---

## 2. Architecture & Tech Stack

- **Framework:** Next.js (App Router, Server Components & Server Actions)
- **Styling:** Tailwind CSS + Lucide Icons + Radix/Shadcn-inspired UI components
- **Database:** MongoDB (via Mongoose ORM)
- **Deployment Target:** Vercel (Edge-compatible database connections, optimized bundles, env variable management)

---

## 3. Database Schema Design (MongoDB / Mongoose)

### 3.1 `Product` Schema
```ts
{
  name: { type: String, required: true, index: true },
  sku: { type: String, required: true, unique: true, index: true },
  barcode: { type: String, index: true },
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  currentStock: { type: Number, default: 0 },
  minStock: { type: Number, default: 5 },
  maxStock: { type: Number, default: 500 },
  sellingPrice: { type: Number, required: true },
  costPrice: { type: Number, required: true },
  unit: { type: String, default: 'units' }, // e.g. units, reams, packs, boxes
  rackLocation: { type: String }, // e.g. A1-B1-S1
  vendor: { type: Schema.Types.ObjectId, ref: 'Vendor' },
  imageUrl: { type: String },
  description: { type: String },
  isCustomPrinting: { type: Boolean, default: false },
  printingOptions: {
    paperGsmOptions: [Number],
    printSides: [String], // Single-Sided, Double-Sided
    finishTypes: [String] // Matte, Glossy, Laminated
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 3.2 `Category` Schema
```ts
{
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  description: String,
  productCount: { type: Number, default: 0 },
  createdAt: Date
}
```

### 3.3 `Vendor` Schema
```ts
{
  name: { type: String, required: true },
  contactPerson: String,
  email: String,
  phone: String,
  address: String,
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  createdAt: Date
}
```

### 3.4 `Invoice` Schema
```ts
{
  invoiceNumber: { type: String, required: true, unique: true },
  customer: {
    name: { type: String, required: true },
    phone: String,
    email: String,
    address: String,
    gstin: String
  },
  items: [{
    product: { type: Schema.Types.ObjectId, ref: 'Product' },
    productName: String,
    sku: String,
    quantity: Number,
    unitPrice: Number,
    discountPercent: { type: Number, default: 0 },
    lineTotal: Number
  }],
  subtotal: Number,
  gstAmount: Number,
  discountTotal: Number,
  grandTotal: Number,
  paymentStatus: { type: String, enum: ['Draft', 'Pending', 'Paid', 'Cancelled'], default: 'Pending' },
  paymentMethod: { type: String, enum: ['Cash', 'UPI', 'Card', 'Credit'], default: 'Cash' },
  createdAt: Date
}
```

### 3.5 `InventoryLog` Schema
```ts
{
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  type: { type: String, enum: ['Stock In', 'Stock Out', 'Adjustment'], required: true },
  quantity: { type: Number, required: true },
  reason: String, // e.g. Sale, Restock, Damage
  referenceId: String,
  performedBy: String,
  timestamp: { type: Date, default: Date.now }
}
```

### 3.6 `User` Schema
```ts
{
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['admin', 'manager', 'staff'], default: 'admin' },
  avatarUrl: String,
  createdAt: Date
}
```

### 3.7 `PrintingRequest` Schema
```ts
{
  customerName: String,
  customerContact: String,
  serviceType: { type: String, enum: ['Business Cards', 'Letterheads', 'Custom Stamps', 'Brochures', 'Banners'] },
  quantity: Number,
  paperGsm: String,
  printSides: String,
  estimatedCost: Number,
  status: { type: String, enum: ['Pending', 'In Production', 'Ready', 'Delivered'], default: 'Pending' },
  notes: String,
  createdAt: Date
}
```

---

## 4. Frontend Route & Component Blueprint

```
app/
├── layout.tsx                # Root layout with Tailwind, Inter font, Navigation Context
├── page.tsx                  # 📊 Dashboard Route (KPI cards, Low stock alert list, Activity timeline)
├── products/
│   └── page.tsx              # 📦 Products Grid/Table View, Filters, Search, Modals
├── categories/
│   └── page.tsx              # 🏷️ Category Management, Add/Edit/Delete with reassignment
├── vendors/
│   └── page.tsx              # 🏬 Vendor Directory & Contact Cards
├── invoices/
│   └── page.tsx              # 📄 Invoice List, Filter by status, POS Invoice Creator Modal
├── scanner/
│   └── page.tsx              # 🔍 Barcode / SKU Scanner with Live Lookup & Demo Shortcuts
├── custom-printing/
│   └── page.tsx              # 🖨️ Custom Stationery Printing Service Configurator & Quote Calculator
├── settings/
│   └── page.tsx              # ⚙️ Business Settings, Logo Uploader & Invoice GST Details
components/
├── navigation/
│   ├── TopHeader.tsx         # Brand header with Sky Cyan styling & Role Switcher
│   └── Sidebar.tsx           # Collapsible left navigation menu
├── dashboard/
│   ├── MetricCard.tsx        # Reusable metric card with weekly delta badge
│   ├── LowStockWidget.tsx    # Table/List of low-stock stationery items
│   └── ActivityLog.tsx       # Timeline of Stock In / Stock Out events
├── products/
│   ├── ProductCard.tsx       # Grid product display card with badge and storage rack
│   ├── ProductTable.tsx      # Tabular view of products
│   ├── AddProductModal.tsx   # Dialog form for creating/editing stationery items
│   └── RecordPurchaseModal.tsx # Dialog form for stock intake
├── invoices/
│   └── CreateInvoiceModal.tsx # Billing line-item calculator & PDF printer
├── scanner/
│   └── CameraScanner.tsx     # Webcam scanner simulator & code matcher
└── custom-printing/
    └── PrintingConfigurator.tsx # Interactive price calculator for custom stationery
```

---

## 5. Phase 3 Step-by-Step Execution & Git Commit Plan

1. **Step 1: Project Setup & Config**
   - Initialize Next.js App Router app in root directory.
   - Configure Tailwind CSS with custom cyan color system tokens and font stack.
   - Commit: `feat: initialize Next.js App Router project with Tailwind CSS & custom design tokens`

2. **Step 2: MongoDB Mongoose Database Layer**
   - Implement `lib/db.ts` connection utility for Mongoose with cached connection handling for serverless/Vercel environments.
   - Create schemas: `Product`, `Category`, `Vendor`, `Invoice`, `InventoryLog`, `User`, `PrintingRequest`.
   - Seed database script with realistic Siddhi Stationery products (A4 Paper, HB Pencils, Gel Pens, Notebooks, Custom Letterheads).
   - Commit: `feat: setup Mongoose database connection and core domain schemas`

3. **Step 3: Navigation & Shell Layout**
   - Build `TopHeader` (with brand name, subtitle, role dropdown) and `Sidebar` navigation.
   - Add responsive container and breadcrumbs.
   - Commit: `feat: implement responsive layout shell with sticky sky-cyan header and sidebar`

4. **Step 4: Dashboard Module (`/`)**
   - Connect live statistics: Total Products, Inventory Value, Low Stock Count, Out of Stock Count.
   - Render Low Stock Items card and Recent Stock Activity timeline.
   - Commit: `feat: build Dashboard page with real-time KPI metrics and stock activity log`

5. **Step 5: Products Module (`/products`)**
   - Grid View vs. Table View switcher.
   - Live Search bar, Category filter dropdown, Stock status filter dropdown.
   - "Add Product" and "Record Purchase" modals with full server action handling.
   - Commit: `feat: implement Products page with search, filters, grid/table toggle and CRUD modals`

6. **Step 6: Categories & Vendors Modules (`/categories`, `/vendors`)**
   - Category creation, deletion with automatic product reassignment to default category.
   - Vendor directory with contact cards and status badges.
   - Commit: `feat: implement Category and Vendor management with item reassignment logic`

7. **Step 7: Invoices & POS Billing Module (`/invoices`)**
   - Invoice list with draft/pending/paid filter tabs.
   - "Create Invoice" modal with customer form, dynamic line items selector, discount %, automatic GST computation, and stock deduction.
   - Printable Invoice view / popup.
   - Commit: `feat: implement POS Invoice Generator, itemized billing, and automatic inventory deduction`

8. **Step 8: Barcode & SKU Scanner Module (`/scanner`)**
   - Quick input scan lookup.
   - Demo barcode shortcut buttons (e.g., Demo Paper, Demo Pen).
   - Instant item detail card popup with rack location & stock status.
   - Commit: `feat: implement Barcode and SKU scanner interface with instant stock lookup`

9. **Step 9: Custom Stationery Printing Configurator (`/custom-printing`)**
   - Dedicated service module for Siddhi Stationery custom services (Letterheads, Business Cards, Custom Stamps).
   - Real-time price estimator based on paper GSM, single/double sided printing, quantity, and finish.
   - Quote request submission modal.
   - Commit: `feat: implement Custom Stationery Printing service configurator and quote estimator`

10. **Step 10: Settings Page, Vercel Optimization & Seed Execution**
    - Business information form & company logo manager in `/settings`.
    - Database seed script to automatically populate sample stationery items, vendors, categories, and invoices.
    - Production build verification (`npm run build`).
    - Commit: `chore: optimize build for Vercel deployment and seed initial stationery dataset`

---

## 6. Verification & Quality Assurance Checklist

- [ ] All pages (`/`, `/products`, `/categories`, `/vendors`, `/invoices`, `/scanner`, `/custom-printing`, `/settings`) render error-free.
- [ ] Responsive UI closely matching the Lovable prototype's color palette, typography, and card layouts.
- [ ] MongoDB CRUD operations work seamlessly via Next.js Server Actions.
- [ ] Stock quantities automatically decrease upon invoice creation and increase upon purchase recording.
- [ ] Build passes cleanly without TypeScript or Next.js build errors.
