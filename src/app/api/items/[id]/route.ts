import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Hanya Admin yang dapat mengubah barang." }, { status: 403 });
    }

    const { id } = await params;
    const { code, name, category, stock } = await request.json();

    if (!code || !name || !category || stock === undefined || stock < 0) {
      return NextResponse.json({ error: "Semua kolom wajib diisi dengan benar." }, { status: 400 });
    }

    // Check code duplication with other items
    const existing = await prisma.item.findUnique({
      where: { code: code.trim().toUpperCase() },
    });
    if (existing && existing.id !== id) {
      return NextResponse.json({ error: `Kode barang ${code} sudah digunakan barang lain.` }, { status: 400 });
    }

    const item = await prisma.item.update({
      where: { id },
      data: {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        category: category.trim(),
        stock: Number(stock),
      },
    });

    return NextResponse.json({ item, message: "Data barang berhasil diperbarui." });
  } catch (error) {
    console.error("Update item error:", error);
    return NextResponse.json({ error: "Gagal memperbarui data barang." }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Hanya Admin yang dapat menghapus barang." }, { status: 403 });
    }

    const { id } = await params;

    // Check if item has active loans
    const activeLoans = await prisma.borrowTransaction.count({
      where: { itemId: id, status: "DIPINJAM" },
    });

    if (activeLoans > 0) {
      return NextResponse.json(
        { error: "Barang tidak dapat dihapus karena masih ada transaksi peminjaman aktif." },
        { status: 400 }
      );
    }

    // Delete transaction history for this item or item itself
    await prisma.$transaction([
      prisma.borrowTransaction.deleteMany({ where: { itemId: id } }),
      prisma.item.delete({ where: { id } }),
    ]);

    return NextResponse.json({ message: "Barang berhasil dihapus." });
  } catch (error) {
    console.error("Delete item error:", error);
    return NextResponse.json({ error: "Gagal menghapus barang." }, { status: 500 });
  }
}
