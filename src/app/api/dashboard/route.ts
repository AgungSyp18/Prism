import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
    }

    const [totalItemTypes, items, activeLoans, totalTransactions, recentTransactions] =
      await Promise.all([
        prisma.item.count(),
        prisma.item.findMany({ select: { stock: true } }),
        prisma.borrowTransaction.findMany({
          where: { status: "DIPINJAM" },
          select: { quantity: true },
        }),
        prisma.borrowTransaction.count(),
        prisma.borrowTransaction.findMany({
          take: 10,
          orderBy: { createdAt: "desc" },
          include: {
            item: { select: { code: true, name: true } },
            recordedBy: { select: { username: true, name: true, role: true } },
          },
        }),
      ]);

    const availableStock = items.reduce((acc, curr) => acc + curr.stock, 0);
    const borrowedStock = activeLoans.reduce((acc, curr) => acc + curr.quantity, 0);

    return NextResponse.json({
      stats: {
        totalItemTypes,
        availableStock,
        borrowedStock,
        totalTransactions,
      },
      recentActivities: recentTransactions,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: "Gagal memuat ringkasan dashboard." }, { status: 500 });
  }
}
