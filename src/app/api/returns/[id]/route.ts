import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const returnDate = body?.returnDate ? new Date(body.returnDate) : new Date();

    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.borrowTransaction.findUnique({
        where: { id },
        include: { item: true },
      });

      if (!transaction) {
        throw new Error("TRANSACTION_NOT_FOUND");
      }

      if (transaction.status === "DIKEMBALIKAN") {
        throw new Error("ALREADY_RETURNED");
      }

      // Restore item stock
      const updatedItem = await tx.item.update({
        where: { id: transaction.itemId },
        data: { stock: { increment: transaction.quantity } },
      });

      // Mark transaction completed
      const updatedTransaction = await tx.borrowTransaction.update({
        where: { id },
        data: {
          status: "DIKEMBALIKAN",
          returnDate,
        },
        include: { item: true },
      });

      return { updatedTransaction, updatedItem };
    });

    return NextResponse.json({
      transaction: result.updatedTransaction,
      message: `Pengembalian ${result.updatedTransaction.item.name} berhasil diproses. Stok dikembalikan.`,
    });
  } catch (error: any) {
    if (error.message === "TRANSACTION_NOT_FOUND") {
      return NextResponse.json({ error: "Transaksi tidak ditemukan." }, { status: 404 });
    }
    if (error.message === "ALREADY_RETURNED") {
      return NextResponse.json({ error: "Barang ini sudah dikembalikan sebelumnya." }, { status: 400 });
    }
    console.error("Process return error:", error);
    return NextResponse.json({ error: "Gagal memproses pengembalian barang." }, { status: 500 });
  }
}
