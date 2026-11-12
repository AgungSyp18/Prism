"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import {
  HandHelping,
  User,
  Boxes,
  Calendar,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";

interface Item {
  id: string;
  code: string;
  name: string;
  category: string;
  stock: number;
}

export default function BorrowPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; username: string; name: string; role: "ADMIN" | "STAFF" } | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [borrowerName, setBorrowerName] = useState("");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [quantity, setQuantity] = useState<number | string>(1);
  const [borrowDate, setBorrowDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [uRes, iRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/items"),
      ]);
      if (uRes.ok) {
        const u = await uRes.json();
        setUser(u.user);
      }
      if (iRes.ok) {
        const i = await iRes.json();
        setItems(i.items);
        if (i.items.length > 0) {
          // select first item with stock > 0
          const available = i.items.find((it: Item) => it.stock > 0);
          if (available) setSelectedItemId(available.id);
        }
      }
    } catch (e) {
      console.error(e);
      setError("Gagal memuat data barang.");
    } finally {
      setLoading(false);
    }
  };

  const selectedItem = items.find((i) => i.id === selectedItemId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedItem) {
      setError("Silakan pilih barang yang ingin dipinjam.");
      return;
    }

    const qty = Number(quantity);
    if (qty <= 0) {
      setError("Jumlah peminjaman minimal 1 unit.");
      return;
    }

    if (qty > selectedItem.stock) {
      setError(`Jumlah peminjaman melebihi stok yang tersedia (${selectedItem.stock} unit).`);
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/borrow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          borrowerName,
          itemId: selectedItemId,
          quantity: qty,
          borrowDate,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal mencatat peminjaman.");
        setSubmitting(false);
        return;
      }

      setSuccess(data.message || "Peminjaman berhasil dicatat!");
      setBorrowerName("");
      setQuantity(1);
      setNotes("");

      // Refresh items to show updated stock
      const iRes = await fetch("/api/items");
      if (iRes.ok) {
        const iData = await iRes.json();
        setItems(iData.items);
      }
    } catch (err) {
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {user && <Navbar user={user} />}

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center space-x-2.5">
            <HandHelping className="w-7 h-7 text-blue-600" />
            <span>Pencatatan Peminjaman Barang</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Formulir resmi pencatatan peminjaman peralatan laboratorium oleh mahasiswa, dosen, atau staf.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-2xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
              <span className="font-medium">{success}</span>
            </div>
            <a
              href="/returns"
              className="px-3 py-1 bg-emerald-700 text-white rounded-lg text-xs font-semibold hover:bg-emerald-800 transition"
            >
              Lihat di Pengembalian &rarr;
            </a>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
          {loading ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
              <span>Memuat data formulir...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 1. Nama Peminjam */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Nama Peminjam / Identitas <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={borrowerName}
                    onChange={(e) => setBorrowerName(e.target.value)}
                    placeholder="Contoh: Ahmad Fauzi (NIM: 210101 / Asisten Lab 2)"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* 2. Pilih Barang */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Pilih Peralatan Laboratorium <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Boxes className="w-4 h-4" />
                  </div>
                  <select
                    required
                    value={selectedItemId}
                    onChange={(e) => setSelectedItemId(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  >
                    {items.map((item) => (
                      <option
                        key={item.id}
                        value={item.id}
                        disabled={item.stock <= 0}
                      >
                        {item.code} - {item.name} ({item.category}) — Stok: {item.stock} unit
                        {item.stock <= 0 ? " [HABIS]" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedItem && (
                  <div className="mt-2 flex items-center space-x-2 text-xs">
                    <span className="text-slate-500">Stok Tersedia Saat Ini:</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded ${
                        selectedItem.stock > 0
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {selectedItem.stock} unit
                    </span>
                  </div>
                )}
              </div>

              {/* 3. Jumlah & Tanggal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Jumlah Barang Dipinjam <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={selectedItem?.stock || 1}
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Tanggal Peminjaman <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <input
                      type="date"
                      required
                      value={borrowDate}
                      onChange={(e) => setBorrowDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Catatan / Keperluan */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Keperluan / Keterangan (Opsional)
                </label>
                <div className="relative">
                  <div className="absolute top-3 left-3.5 pointer-events-none text-slate-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Contoh: Digunakan untuk praktikum Pemrograman Web di Ruang Lab 3"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting || !selectedItem || selectedItem.stock <= 0}
                  className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-md shadow-blue-500/20 transition flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <HandHelping className="w-4 h-4" />
                  <span>{submitting ? "Memproses Simpan..." : "Simpan Transaksi Peminjaman"}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
