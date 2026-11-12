import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Navbar from "@/components/Navbar";
import {
  Boxes,
  CheckCircle2,
  Clock,
  ArrowRightLeft,
  HandHelping,
  RotateCcw,
  PlusCircle,
  Users,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  // Fetch summary stats & recent transactions
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
        take: 6,
        orderBy: { createdAt: "desc" },
        include: {
          item: true,
          recordedBy: { select: { name: true, username: true, role: true } },
        },
      }),
    ]);

  const availableStock = items.reduce((acc, curr) => acc + curr.stock, 0);
  const borrowedStock = activeLoans.reduce((acc, curr) => acc + curr.quantity, 0);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={user} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Banner */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                Selamat Datang, {user.name}
              </h1>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                  user.role === "ADMIN"
                    ? "bg-purple-100 text-purple-700 border border-purple-200"
                    : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                }`}
              >
                {user.role}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {user.role === "ADMIN"
                ? "Ringkasan operasional laboratorium, inventaris peralatan, dan riwayat peminjaman."
                : "Kelola pencatatan peminjaman dan pengembalian barang laboratorium."}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href="/borrow"
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium shadow-sm transition"
            >
              <HandHelping className="w-4 h-4" />
              <span>Peminjaman Baru</span>
            </a>
            <a
              href="/returns"
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium shadow-sm transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Pengembalian</span>
            </a>
            {user.role === "ADMIN" && (
              <a
                href="/items"
                className="inline-flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-medium shadow-sm transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Tambah Barang</span>
              </a>
            )}
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {/* 1. Total Jenis Barang */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Jenis Barang
              </p>
              <p className="text-2xl font-bold text-slate-800 mt-0.5">
                {totalItemTypes}
              </p>
            </div>
          </div>

          {/* 2. Jumlah Barang Tersedia */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Barang Tersedia
              </p>
              <p className="text-2xl font-bold text-emerald-600 mt-0.5">
                {availableStock} <span className="text-xs font-normal text-slate-500">unit</span>
              </p>
            </div>
          </div>

          {/* 3. Jumlah Barang Dipinjam */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Sedang Dipinjam
              </p>
              <p className="text-2xl font-bold text-amber-600 mt-0.5">
                {borrowedStock} <span className="text-xs font-normal text-slate-500">unit</span>
              </p>
            </div>
          </div>

          {/* 4. Total Transaksi Peminjaman */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
              <ArrowRightLeft className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Transaksi
              </p>
              <p className="text-2xl font-bold text-purple-600 mt-0.5">
                {totalTransactions}
              </p>
            </div>
          </div>
        </div>

        {/* Recent Activities Section */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Ringkasan Aktivitas Terbaru
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Daftar transaksi peminjaman dan pengembalian barang terbaru
              </p>
            </div>
            <a
              href="/transactions"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Lihat Semua &rarr;
            </a>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              Belum ada transaksi peminjaman yang tercatat.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Peminjam</th>
                    <th className="px-6 py-3 font-semibold">Barang</th>
                    <th className="px-6 py-3 font-semibold text-center">Jumlah</th>
                    <th className="px-6 py-3 font-semibold">Tanggal Pinjam</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold">Petugas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-6 py-4 font-medium text-slate-800">
                        {tx.borrowerName}
                        {tx.notes && (
                          <span className="block text-xs font-normal text-slate-400 mt-0.5">
                            {tx.notes}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-800">
                          {tx.item.name}
                        </span>
                        <span className="block text-xs font-mono text-slate-500">
                          {tx.item.code}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-slate-700">
                        {tx.quantity}
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-xs">
                        {new Date(tx.borrowDate).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4">
                        {tx.status === "DIPINJAM" ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            Sedang Dipinjam
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Selesai Dikembalikan
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {tx.recordedBy.name}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
