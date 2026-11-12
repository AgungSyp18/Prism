import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const transactions = await prisma.borrowTransaction.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        item: true,
        recordedBy: {
          select: { id: true, username: true, name: true, role: true },
        },
      },
    });

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error("Fetch borrow transactions error:", error);
    return NextResponse.json({ error: "Gagal memuat riwayat transaksi." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
    }

    const { borrowerName, itemId, quantity, borrowDate, notes } = await request.json();

    if (!borrowerName || !itemId || !quantity || Number(quantity) <= 0) {
      return NextResponse.json(
        { error: "Nama peminjam, barang, dan jumlah peminjaman (>0) wajib diisi." },
        { status: 400 }
      );
    }

    const qty = Number(quantity);

    // Atomic transaction to ensure stock consistency
    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.item.findUnique({
        where: { id: itemId },
      });

      if (!item) {
        throw new Error("ITEM_NOT_FOUND");
      }

      if (item.stock < qty) {
        throw new Error(`INSUFFICIENT_STOCK: Stok ${item.name} hanya tersisa ${item.stock} unit.`);
      }

      // Decrement available stock
      const updatedItem = await tx.item.update({
        where: { id: itemId },
        data: { stock: { decrement: qty } },
      });

      // Create borrowing record
      const transaction = await tx.borrowTransaction.create({
        data: {
          borrowerName: borrowerName.trim(),
          itemId,
          quantity: qty,
          borrowDate: borrowDate ? new Date(borrowDate) : new Date(),
          status: "DIPINJAM",
          userId: user.id,
          notes: notes?.trim() || null,
        },
        include: { item: true },
      });

      return { transaction, updatedItem };
    });

    return NextResponse.json(
      {
        transaction: result.transaction,
        message: `Peminjaman ${result.transaction.item.name} (${qty} unit) berhasil dicatat.`,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message === "ITEM_NOT_FOUND") {
      return NextResponse.json({ error: "Barang tidak ditemukan." }, { status: 404 });
    }
    if (error.message?.startsWith("INSUFFICIENT_STOCK")) {
      return NextResponse.json({ error: error.message.replace("INSUFFICIENT_STOCK: ", "") }, { status: 400 });
    }
    console.error("Create borrowing error:", error);
    return NextResponse.json({ error: "Gagal memproses peminjaman barang." }, { status: 500 });
  }
}
