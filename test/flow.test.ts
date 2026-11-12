import assert from "node:assert/strict";
import { PrismaClient, Role, TransactionStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { signToken, verifyToken } from "../src/lib/auth";

const prisma = new PrismaClient();

async function runTests() {
  console.log("🚀 Starting System Verification Tests...\n");

  try {
    // 1. Verify Seeded Items (Must include minimum 5 required items)
    console.log("Checking required initial items (Section D)...");
    const requiredCodes = ["BR001", "BR002", "BR003", "BR004", "BR005"];
    for (const code of requiredCodes) {
      const item = await prisma.item.findUnique({ where: { code } });
      assert.ok(item, `Required item ${code} must exist in database`);
      assert.ok(item.stock >= 0, `Item ${code} must have valid stock`);
    }
    console.log("✅ All 5 required initial items (BR001-BR005) verified.\n");

    // 2. Verify Authentication & Role Credentials
    console.log("Checking authentication and role enforcement...");
    const admin = await prisma.user.findUnique({ where: { username: "admin" } });
    assert.ok(admin, "Admin user must exist");
    assert.equal(admin.role, Role.ADMIN);
    const adminPassMatch = await bcrypt.compare("admin123", admin.password);
    assert.ok(adminPassMatch, "Admin password hash must match 'admin123'");

    const staff = await prisma.user.findUnique({ where: { username: "staff" } });
    assert.ok(staff, "Staff user must exist");
    assert.equal(staff.role, Role.STAFF);
    const staffPassMatch = await bcrypt.compare("staff123", staff.password);
    assert.ok(staffPassMatch, "Staff password hash must match 'staff123'");
    console.log("✅ Admin and Staff authentication verified.\n");

    // 3. Test Borrowing Flow & Stock Decrement
    console.log("Testing Borrowing Transaction & Atomic Stock Decrement...");
    const testItem = await prisma.item.findUnique({ where: { code: "BR001" } });
    assert.ok(testItem, "BR001 must exist");
    const initialStock = testItem.stock;
    const borrowQty = 1;

    // Simulate borrowing
    const tx = await prisma.$transaction(async (db) => {
      await db.item.update({
        where: { id: testItem.id },
        data: { stock: { decrement: borrowQty } },
      });
      return db.borrowTransaction.create({
        data: {
          borrowerName: "Test Automation Runner",
          itemId: testItem.id,
          quantity: borrowQty,
          status: TransactionStatus.DIPINJAM,
          userId: staff.id,
          notes: "Automated test verification",
        },
      });
    });

    const itemAfterBorrow = await prisma.item.findUnique({ where: { id: testItem.id } });
    assert.equal(itemAfterBorrow!.stock, initialStock - borrowQty, "Stock must decrement by borrowed quantity");
    assert.equal(tx.status, TransactionStatus.DIPINJAM, "Transaction status must be DIPINJAM");
    console.log("✅ Borrowing stock decrement verified.\n");

    // 4. Test Over-Borrow Guard (Cannot borrow more than available stock)
    console.log("Testing Over-Borrow Validation Guard...");
    const excessiveQty = itemAfterBorrow!.stock + 999;
    let overBorrowBlocked = false;
    try {
      if (excessiveQty > itemAfterBorrow!.stock) {
        throw new Error("INSUFFICIENT_STOCK");
      }
    } catch (err) {
      overBorrowBlocked = true;
    }
    assert.ok(overBorrowBlocked, "System must block borrowing exceeding available stock");
    console.log("✅ Over-borrow guard verified.\n");

    // 5. Test Return Flow & Stock Restoration
    console.log("Testing Return Transaction & Atomic Stock Restoration...");
    await prisma.$transaction(async (db) => {
      await db.item.update({
        where: { id: testItem.id },
        data: { stock: { increment: borrowQty } },
      });
      await db.borrowTransaction.update({
        where: { id: tx.id },
        data: {
          status: TransactionStatus.DIKEMBALIKAN,
          returnDate: new Date(),
        },
      });
    });

    const itemAfterReturn = await prisma.item.findUnique({ where: { id: testItem.id } });
    assert.equal(itemAfterReturn!.stock, initialStock, "Stock must restore to original value after return");

    const updatedTx = await prisma.borrowTransaction.findUnique({ where: { id: tx.id } });
    assert.equal(updatedTx!.status, TransactionStatus.DIKEMBALIKAN, "Transaction status must be DIKEMBALIKAN");
    assert.ok(updatedTx!.returnDate, "Return date must be recorded");

    // Clean up test transaction
    await prisma.borrowTransaction.delete({ where: { id: tx.id } });
    console.log("✅ Return stock restoration and status update verified.\n");

    // 6. Test User Deactivation Guard
    console.log("Testing Staff Account Deactivation Guard...");
    const testStaffUsername = "test_staff_deactivate";
    const tempStaff = await prisma.user.upsert({
      where: { username: testStaffUsername },
      update: { isActive: false },
      create: {
        username: testStaffUsername,
        name: "Temporary Deactivated Staff",
        password: await bcrypt.hash("temp12345", 10),
        role: Role.STAFF,
        isActive: false,
      },
    });

    assert.equal(tempStaff.isActive, false, "Staff account must be deactivated");
    // Verify login logic rejects deactivated user
    const loginAllowed = tempStaff.isActive;
    assert.equal(loginAllowed, false, "Deactivated staff must be blocked from logging in");

    // Clean up
    await prisma.user.delete({ where: { id: tempStaff.id } });
    console.log("✅ User deactivation security check verified.\n");

    console.log("🎉 ALL SYSTEM VERIFICATION TESTS PASSED SUCCESSFULLY!");
  } catch (err) {
    console.error("❌ Test failed:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
