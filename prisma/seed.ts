/**
 * Seed script for StorePilot Browser Security & Access Hub.
 * Creates a demo workspace with stores, tool links, reply templates,
 * devices and an example browser safety check.
 *
 * Run with: npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding demo data...");

  // --- Demo owner user -----------------------------------------------------
  const passwordHash = await bcrypt.hash("DemoPassword123!", 12);
  const owner = await prisma.user.upsert({
    where: { email: "owner@demo-retail.example.com" },
    update: {},
    create: {
      name: "Demo Owner",
      email: "owner@demo-retail.example.com",
      passwordHash,
    },
  });

  // --- Workspace -----------------------------------------------------------
  let workspace = await prisma.workspace.findFirst({
    where: { name: "Demo Retail Group", ownerId: owner.id },
  });
  if (!workspace) {
    workspace = await prisma.workspace.create({
      data: {
        name: "Demo Retail Group",
        ownerId: owner.id,
        subscriptionStatus: "TRIALING",
        plan: "BUSINESS",
        members: {
          create: { userId: owner.id, role: "OWNER" },
        },
      },
    });
  }

  // --- Stores ----------------------------------------------------------------
  const storeData = [
    { name: "Style Home Furniture", color: "#2563eb", website: "https://stylehomefurniture.example.com", phone: "555-0101", address: "120 Main St, Springfield" },
    { name: "Academy Fence", color: "#16a34a", website: "https://academyfence.example.com", phone: "555-0102", address: "45 Industrial Rd, Springfield" },
    { name: "Home Decor Outlet", color: "#ea580c", website: "https://homedecoroutlet.example.com", phone: "555-0103", address: "88 Retail Plaza, Springfield" },
  ];

  const stores = [];
  for (const s of storeData) {
    let store = await prisma.store.findFirst({
      where: { workspaceId: workspace.id, name: s.name },
    });
    if (!store) {
      store = await prisma.store.create({
        data: { ...s, workspaceId: workspace.id },
      });
    }
    stores.push(store);
  }
  const [styleHome] = stores;

  // --- Tool links ------------------------------------------------------------
  const linkData: Array<{
    title: string;
    url: string;
    category: string;
    description?: string;
    isSensitive?: boolean;
  }> = [
    { title: "Facebook Page", url: "https://www.facebook.com/", category: "SOCIAL_MEDIA", description: "Store Facebook page" },
    { title: "Instagram", url: "https://www.instagram.com/", category: "SOCIAL_MEDIA", description: "Store Instagram account" },
    { title: "Meta Business Suite", url: "https://business.facebook.com/", category: "SOCIAL_MEDIA", description: "Manage Facebook & Instagram", isSensitive: true },
    { title: "Google Business Profile", url: "https://business.google.com/", category: "GOOGLE", description: "Google Maps / reviews" },
    { title: "Website Admin", url: "https://stylehomefurniture.example.com/wp-admin", category: "WEBSITE", description: "WordPress admin login page", isSensitive: true },
    { title: "WooCommerce Orders", url: "https://stylehomefurniture.example.com/wp-admin/edit.php?post_type=shop_order", category: "WEBSITE", description: "Order management", isSensitive: true },
    { title: "Canva Folder", url: "https://www.canva.com/folder/", category: "CANVA", description: "Marketing design assets" },
    { title: "Google Drive", url: "https://drive.google.com/", category: "GOOGLE", description: "Shared business files" },
    { title: "Vendor Portal", url: "https://vendor-portal.example.com/", category: "VENDOR", description: "Order stock from vendor", isSensitive: true },
    { title: "Shipping Portal", url: "https://shipping.example.com/", category: "SHIPPING", description: "Create shipping labels" },
    { title: "Bitwarden Vault", url: "https://vault.bitwarden.com/", category: "PASSWORD_MANAGER", description: "Approved password manager - store all passwords here" },
    { title: "1Password Vault", url: "https://my.1password.com/", category: "PASSWORD_MANAGER", description: "Approved password manager - store all passwords here" },
  ];

  for (const l of linkData) {
    const existing = await prisma.toolLink.findFirst({
      where: { workspaceId: workspace.id, title: l.title },
    });
    if (!existing) {
      await prisma.toolLink.create({
        data: { ...l, workspaceId: workspace.id, storeId: styleHome.id },
      });
    }
  }

  // --- Reply templates -------------------------------------------------------
  const templateData = [
    {
      title: "Store hours reply",
      category: "General",
      body: "Hi! Thanks for reaching out. Our store hours are Monday-Saturday 9 AM - 7 PM and Sunday 11 AM - 5 PM. We look forward to seeing you!",
    },
    {
      title: "Address reply",
      category: "General",
      body: "Hi! You can find us at 120 Main St, Springfield. There is free parking right in front of the store. See you soon!",
    },
    {
      title: "Delivery question reply",
      category: "Delivery",
      body: "Thanks for asking! We offer local delivery within 30 miles. Delivery fees start at $49 depending on distance and item size. Would you like a delivery quote for your order?",
    },
    {
      title: "Order status reply",
      category: "Orders",
      body: "Thanks for checking in! Could you share your order number or the name/phone number used for the purchase? We'll look it up and get you an update right away.",
    },
    {
      title: "Price request reply",
      category: "Sales",
      body: "Thanks for your interest! Could you tell us which item you're asking about (a photo or link helps)? We'll get you the current price and availability right away.",
    },
    {
      title: "Thank you reply",
      category: "General",
      body: "Thank you so much for shopping with us! We truly appreciate your business. If you need anything else, just send us a message anytime.",
    },
    {
      title: "Review request reply",
      category: "Reviews",
      body: "We're so glad you had a great experience! If you have a moment, we'd really appreciate a quick Google review - it helps our small business a lot. Thank you!",
    },
  ];

  for (const t of templateData) {
    const existing = await prisma.replyTemplate.findFirst({
      where: { workspaceId: workspace.id, title: t.title },
    });
    if (!existing) {
      await prisma.replyTemplate.create({
        data: { ...t, workspaceId: workspace.id },
      });
    }
  }

  // --- Demo device -----------------------------------------------------------
  const device = await prisma.device.upsert({
    where: { extensionInstallId: "demo-install-0001" },
    update: {},
    create: {
      workspaceId: workspace.id,
      storeId: styleHome.id,
      name: "Front Counter PC",
      extensionInstallId: "demo-install-0001",
      lastSeenAt: new Date(),
    },
  });

  // --- Example browser safety check -------------------------------------------
  const existingCheck = await prisma.browserSafetyCheck.findFirst({
    where: { workspaceId: workspace.id, deviceId: device.id },
  });
  if (!existingCheck) {
    await prisma.browserSafetyCheck.create({
      data: {
        workspaceId: workspace.id,
        deviceId: device.id,
        storeId: styleHome.id,
        checkedById: owner.id,
        chromeUpdated: true,
        suspiciousExtensionsRemoved: true,
        savedPasswordRiskReviewed: true,
        twoFactorReviewed: true,
        recoveryInfoReviewed: true,
        notes: "Monthly check completed. All items reviewed. Reminded team to keep passwords in Bitwarden only.",
      },
    });
  }

  console.log("Seed complete.");
  console.log("Demo login: owner@demo-retail.example.com / DemoPassword123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
