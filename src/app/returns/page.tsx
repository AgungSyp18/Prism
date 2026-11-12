"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import {
  RotateCcw,
  Search,
  CheckCircle2,
  AlertCircle,
  Calendar,
  X,
  Loader2,
  Clock,
  ArrowRight,
} from "lucide-react";

interface BorrowTx {
  id: string;
  borrowerName: string;
  quantity: number;
  borrowDate: string;
  notes: string | null;
  status: "DIPINJAM" | "DIKEMBALIKAN";
  item: {
    id: string;
    code: string;
    name: string;
    category: string;
    stock: number;
  };
  recordedBy: {
    name: string;
    username: string;
  };
}

export default function ReturnsPage() {
  const [user, setUser] = useState<{ id: string; username: string; name: string; role: "ADMIN" | "STAFF" } | null>(null);
  const [transactions, setTransactions] = useState<BorrowTx[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<BorrowTx | null>(null);
  const [returnDate, setReturnDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [uRes, tRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/borrow"),
      ]);

      if (uRes.ok) {
        const u = await uRes.json();
        setUser(u.user);
      }
      if (tRes.ok) {
        const t = await tRes.json();
        // filter only active loans (DIPINJAM)
        const active = (t.transactions || []).filter(
          (tx: BorrowTx) => tx.status === "DIPINJAM"
        );
        setTransactions(active);
      }
    } catch (e) {
      console.error(e);
      setError("Gagal memuat daftar peminjaman aktif.");
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTx) return;

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/returns/${selectedTx.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnDate }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal memproses pengembalian.");
        setSubmitting(false);
        return;
      }

      setSuccess(data.message || "Pengembalian barang berhasil diselesaikan!");
      setSelectedTx(null);
      await loadData();
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = transactions.filter((tx) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      tx.borrowerName.toLowerCase().includes(q) ||
      tx.item.name.toLowerCase().includes(q) ||
      tx.item.code.toLowerCase().includes(q) ||
      (tx.notes && tx.notes.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {user && <Navbar user={user} />}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center space-x-2.5">
              <RotateCcw className="w-7 h-7 text-emerald-600" />
              <span>Pengembalian Barang Laboratorium</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Daftar peralatan yang saat ini sedang dipinjam. Proses pengembalian akan mengembalikan stok inventaris secara otomatis.
            </p>
          </div>
          <a
            href="/borrow"
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition"
          >
            <span>+ Peminjaman Baru</span>
          </a>
        </div>

        {/* Notifications */}
        {error && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError("")}><X className="w-4 h-4" /></button>
          </div>
        )}
        {success && (
          <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
              <span className="font-semibold">{success}</span>
            </div>
            <button onClick={() => setSuccess("")}><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Search */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm mb-6 flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama peminjam, kode barang, atau nama barang..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
            />
          </div>
          <div className="text-xs text-slate-500 font-medium px-2 whitespace-nowrap">
            Aktif Dipinjam: <span className="font-bold text-amber-600">{filtered.length}</span> transaksi
          </div>
        </div>

        {/* Table / List */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
              <span>Memuat daftar barang yang sedang dipinjam...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              {search
                ? "Tidak ada data peminjaman yang cocok dengan pencarian."
                : "Semua peralatan laboratorium sedang berada di tempat (tidak ada barang dipinjam)."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3.5 font-semibold">Nama Peminjam</th>
                    <th className="px-6 py-3.5 font-semibold">Barang Dipinjam</th>
                    <th className="px-6 py-3.5 font-semibold text-center">Jumlah</th>
                    <th className="px-6 py-3.5 font-semibold">Tanggal Pinjam</th>
                    <th className="px-6 py-3.5 font-semibold">Status</th>
                    <th className="px-6 py-3.5 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">
                          {tx.borrowerName}
                        </div>
                        {tx.notes && (
                          <div className="text-xs text-slate-400 mt-0.5">
                            {tx.notes}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-800 block">
                          {tx.item.name}
                        </span>
                        <span className="text-xs font-mono text-blue-600">
                          {tx.item.code}
                        </span>
                        <span className="text-xs text-slate-400 ml-2">
                          ({tx.item.category})
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-slate-800">
                        {tx.quantity} unit
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600">
                        {new Date(tx.borrowDate).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Sedang Dipinjam</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedTx(tx)}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Proses Kembali</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Return Confirmation Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
                <RotateCcw className="w-5 h-5 text-emerald-600" />
                <span>Konfirmasi Pengembalian</span>
              </h2>
              <button
                onClick={() => setSelectedTx(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReturn} className="space-y-4">
              <div className="p-3.5 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-600">
                <div>
                  <span className="font-semibold text-slate-800">Peminjam:</span> {selectedTx.borrowerName}
                </div>
                <div>
                  <span className="font-semibold text-slate-800">Barang:</span> {selectedTx.item.name} ({selectedTx.item.code})
                </div>
                <div>
                  <span className="font-semibold text-slate-800">Jumlah Kembali:</span> {selectedTx.quantity} unit
                </div>
                <div>
                  <span className="font-semibold text-slate-800">Stok Saat Ini:</span> {selectedTx.item.stock} unit &rarr; Akan menjadi{" "}
                  <span className="font-bold text-emerald-600">
                    {selectedTx.item.stock + selectedTx.quantity} unit
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Tanggal Pengembalian
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <input
                    type="date"
                    required
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedTx(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? "Memproses..." : "Selesaikan Pengembalian"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
