"use client";

import { useState, useEffect } from "react";
import {
  History,
  Search,
  Clock,
  CheckCircle2,
  Loader2,
} from "lucide-react";

interface Transaction {
  id: string;
  borrowerName: string;
  quantity: number;
  borrowDate: string;
  returnDate: string | null;
  status: "DIPINJAM" | "DIKEMBALIKAN";
  notes: string | null;
  createdAt: string;
  item: {
    code: string;
    name: string;
    category: string;
  };
  recordedBy: {
    name: string;
    username: string;
    role: string;
  };
}

interface TransactionsClientProps {
  user: {
    id: string;
    username: string;
    name: string;
    role: "ADMIN" | "STAFF";
  };
}

export default function TransactionsClient({ user }: TransactionsClientProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "DIPINJAM" | "DIKEMBALIKAN">("ALL");

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const tRes = await fetch("/api/borrow");
      if (tRes.ok) {
        const t = await tRes.json();
        setTransactions(t.transactions || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = transactions.filter((tx) => {
    if (statusFilter !== "ALL" && tx.status !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      tx.borrowerName.toLowerCase().includes(q) ||
      tx.item.name.toLowerCase().includes(q) ||
      tx.item.code.toLowerCase().includes(q) ||
      (tx.notes && tx.notes.toLowerCase().includes(q)) ||
      tx.recordedBy.name.toLowerCase().includes(q)
    );
  });

  return (
    <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center space-x-2.5">
            <History className="w-7 h-7 text-blue-600" />
            <span>Riwayat Transaksi Peminjaman & Pengembalian</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Catatan lengkap aktivitas sirkulasi peralatan laboratorium.
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari peminjam, nama barang, kode barang, atau petugas..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center space-x-1.5 w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              statusFilter === "ALL"
                ? "bg-slate-800 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Semua ({transactions.length})
          </button>
          <button
            onClick={() => setStatusFilter("DIPINJAM")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              statusFilter === "DIPINJAM"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Dipinjam ({transactions.filter((t) => t.status === "DIPINJAM").length})
          </button>
          <button
            onClick={() => setStatusFilter("DIKEMBALIKAN")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              statusFilter === "DIKEMBALIKAN"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Dikembalikan ({transactions.filter((t) => t.status === "DIKEMBALIKAN").length})
          </button>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
            <span>Memuat data riwayat transaksi...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            Tidak ada catatan transaksi yang sesuai.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">Nama Peminjam</th>
                  <th className="px-6 py-3.5 font-semibold">Barang</th>
                  <th className="px-6 py-3.5 font-semibold text-center">Jumlah</th>
                  <th className="px-6 py-3.5 font-semibold">Tgl Pinjam</th>
                  <th className="px-6 py-3.5 font-semibold">Tgl Kembali</th>
                  <th className="px-6 py-3.5 font-semibold">Status</th>
                  <th className="px-6 py-3.5 font-semibold">Petugas Lab</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-800 block">
                        {tx.borrowerName}
                      </span>
                      {tx.notes && (
                        <span className="text-xs text-slate-400 block mt-0.5">
                          {tx.notes}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-800 block">
                        {tx.item.name}
                      </span>
                      <span className="text-xs font-mono text-blue-600">
                        {tx.item.code}
                      </span>
                      <span className="text-xs text-slate-400 ml-1.5">
                        ({tx.item.category})
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-slate-800">
                      {tx.quantity} unit
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {new Date(tx.borrowDate).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {tx.returnDate ? (
                        new Date(tx.returnDate).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      ) : (
                        <span className="text-slate-400 italic">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {tx.status === "DIPINJAM" ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Dipinjam</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Dikembalikan</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      <span className="font-medium text-slate-800 block">
                        {tx.recordedBy.name}
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        @{tx.recordedBy.username}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
