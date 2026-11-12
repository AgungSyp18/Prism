import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() || "";

    const items = await prisma.item.findMany({
      where: query
        ? {
            OR: [
              { code: { contains: query, mode: "insensitive" } },
              { name: { contains: query, mode: "insensitive" } },
              { category: { contains: query, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: { code: "asc" },
      include: {
        _count: {
          select: {
            transactions: {
              where: { status: "DIPINJAM" },
            },
          },
        },
      },
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Fetch items error:", error);
    return NextResponse.json({ error: "Gagal memuat data barang." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Hanya Admin yang dapat menambah barang." }, { status: 403 });
    }

    const { code, name, category, stock } = await request.json();

    if (!code || !name || !category || stock === undefined || stock < 0) {
      return NextResponse.json({ error: "Kode, nama, kategori, dan stok (>=0) wajib diisi." }, { status: 400 });
    }

    const existing = await prisma.item.findUnique({
      where: { code: code.trim().toUpperCase() },
    });
    if (existing) {
      return NextResponse.json({ error: `Kode barang ${code} sudah terdaftar.` }, { status: 400 });
    }

    const item = await prisma.item.create({
      data: {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        category: category.trim(),
        stock: Number(stock),
      },
    });

    return NextResponse.json({ item, message: "Barang berhasil ditambahkan." }, { status: 201 });
  } catch (error) {
    console.error("Create item error:", error);
    return NextResponse.json({ error: "Gagal menambahkan barang." }, { status: 500 });
  }
}
