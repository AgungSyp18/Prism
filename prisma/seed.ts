import { PrismaClient, Role, TransactionStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL || "" });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // 1. Seed Users (Admin & Staff from environment variables)
  const adminUsername = process.env.DEMO_ADMIN_USERNAME || "admin";
  const adminPasswordPlain = process.env.DEMO_ADMIN_PASSWORD || "admin123";
  const staffUsername = process.env.DEMO_STAFF_USERNAME || "staff";
  const staffPasswordPlain = process.env.DEMO_STAFF_PASSWORD || "staff123";

  const adminPassword = await bcrypt.hash(adminPasswordPlain, 10);
  const staffPassword = await bcrypt.hash(staffPasswordPlain, 10);

  const admin = await prisma.user.upsert({
    where: { username: adminUsername },
    update: { isActive: true, password: adminPassword },
    create: {
      username: adminUsername,
      password: adminPassword,
      name: "Administrator Lab",
      role: Role.ADMIN,
      isActive: true,
    },
  });

  const staff = await prisma.user.upsert({
    where: { username: staffUsername },
    update: { isActive: true, password: staffPassword },
    create: {
      username: staffUsername,
      password: staffPassword,
      name: "Staff Petugas Lab",
      role: Role.STAFF,
      isActive: true,
    },
  });

  console.log(`Users seeded: admin (${admin.id}), staff (${staff.id})`);

  // 2. Seed Initial Items (Required 5 + 3 extras)
  const initialItems = [
    { code: "BR001", name: "Laptop Lenovo", category: "Laptop", stock: 5 },
    { code: "BR002", name: "Mouse Logitech", category: "Aksesoris", stock: 10 },
    { code: "BR003", name: "Keyboard Mechanical", category: "Aksesoris", stock: 8 },
    { code: "BR004", name: "Proyektor Epson", category: "Multimedia", stock: 3 },
    { code: "BR005", name: "Monitor LG", category: "Display", stock: 6 },
    { code: "BR006", name: "Router MikroTik RB750", category: "Jaringan", stock: 4 },
    { code: "BR007", name: "Switch Cisco 24-Port", category: "Jaringan", stock: 2 },
    { code: "BR008", name: "Webcam Logitech C920", category: "Multimedia", stock: 7 },
  ];

  for (const item of initialItems) {
    await prisma.item.upsert({
      where: { code: item.code },
      update: {},
      create: item,
    });
  }

  console.log(`Seeded ${initialItems.length} initial items.`);

  // 3. Seed an initial sample active loan and completed loan if none exist
  const existingTx = await prisma.borrowTransaction.count();
  if (existingTx === 0) {
    const laptop = await prisma.item.findUnique({ where: { code: "BR001" } });
    const mouse = await prisma.item.findUnique({ where: { code: "BR002" } });

    if (laptop && mouse) {
      // Create a completed loan
      await prisma.borrowTransaction.create({
        data: {
          borrowerName: "Budi Santoso (Lab 1)",
          itemId: laptop.id,
          quantity: 1,
          borrowDate: new Date(Date.now() - 24 * 60 * 60 * 1000 * 2), // 2 days ago
          returnDate: new Date(Date.now() - 24 * 60 * 60 * 1000),     // 1 day ago
          status: TransactionStatus.DIKEMBALIKAN,
          userId: staff.id,
          notes: "Dipinjam untuk praktikum Basis Data",
        },
      });

      // Create an active loan (and decrement 1 from mouse stock)
      await prisma.borrowTransaction.create({
        data: {
          borrowerName: "Siti Rahma (Dosen)",
          itemId: mouse.id,
          quantity: 2,
          borrowDate: new Date(),
          status: TransactionStatus.DIPINJAM,
          userId: staff.id,
          notes: "Presentasi materi Jaringan Komputer",
        },
      });

      await prisma.item.update({
        where: { id: mouse.id },
        data: { stock: { decrement: 2 } },
      });

      console.log("Seeded initial demo transactions.");
    }
  }

  console.log("Database seed completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
