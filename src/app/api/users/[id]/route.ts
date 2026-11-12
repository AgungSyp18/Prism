import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, hashPassword } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Akses ditolak. Khusus Admin." }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json({ error: "Pengguna tidak ditemukan." }, { status: 404 });
    }

    // Prevent Admin from deactivating own account
    if (user.id === id && body.isActive === false) {
      return NextResponse.json(
        { error: "Anda tidak dapat menonaktifkan akun Admin Anda sendiri." },
        { status: 400 }
      );
    }

    const dataToUpdate: any = {};
    if (typeof body.isActive === "boolean") {
      dataToUpdate.isActive = body.isActive;
    }
    if (body.name && body.name.trim()) {
      dataToUpdate.name = body.name.trim();
    }
    if (body.password && body.password.length >= 6) {
      dataToUpdate.password = await hashPassword(body.password);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      user: updated,
      message: `Status akun "${updated.username}" berhasil diperbarui.`,
    });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json({ error: "Gagal memperbarui status pengguna." }, { status: 500 });
  }
}
