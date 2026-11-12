"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import {
  Boxes,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  X,
  Loader2,
} from "lucide-react";

interface Item {
  id: string;
  code: string;
  name: string;
  category: string;
  stock: number;
  _count?: {
    transactions: number;
  };
}

export default function ItemsPage() {
  const [user, setUser] = useState<{ id: string; username: string; name: string; role: "ADMIN" | "STAFF" } | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [deletingItem, setDeletingItem] = useState<Item | null>(null);

  // Form states
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formStock, setFormStock] = useState<number | string>(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUserAndItems();
  }, []);

  const fetchUserAndItems = async () => {
    try {
      setLoading(true);
      const [userRes, itemsRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/items"),
      ]);

      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData.user);
      }
      if (itemsRes.ok) {
        const itemsData = await itemsRes.json();
        setItems(itemsData.items);
      }
    } catch (e) {
      console.error(e);
      setError("Gagal memuat data inventaris.");
    } finally {
      setLoading(false);
    }
  };

  const reloadItems = async () => {
    try {
      const res = await fetch(`/api/items?q=${encodeURIComponent(search)}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    reloadItems();
  };

  const openAddModal = () => {
    setFormCode("");
    setFormName("");
    setFormCategory("Aksesoris");
    setFormStock(5);
    setIsAddModalOpen(true);
    setError("");
  };

  const openEditModal = (item: Item) => {
    setEditingItem(item);
    setFormCode(item.code);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormStock(item.stock);
    setError("");
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const url = editingItem ? `/api/items/${editingItem.id}` : "/api/items";
      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: formCode,
          name: formName,
          category: formCategory,
          stock: Number(formStock),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal menyimpan barang.");
        setSubmitting(false);
        return;
      }

      setSuccess(data.message || "Barang berhasil disimpan.");
      setIsAddModalOpen(false);
      setEditingItem(null);
      await reloadItems();
      setTimeout(() => setSuccess(""), 4000);
    } catch (e) {
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/items/${deletingItem.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Gagal menghapus barang.");
        setSubmitting(false);
        return;
      }

      setSuccess(data.message || "Barang berhasil dihapus.");
      setDeletingItem(null);
      await reloadItems();
      setTimeout(() => setSuccess(""), 4000);
    } catch (e) {
      setError("Terjadi kesalahan saat menghapus barang.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredItems = items.filter((item) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      item.code.toLowerCase().includes(q) ||
      item.name.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {user && <Navbar user={user} />}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center space-x-2.5">
              <Boxes className="w-7 h-7 text-blue-600" />
              <span>Manajemen Inventaris Barang</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {user?.role === "ADMIN"
                ? "Kelola data master peralatan laboratorium: tambah, ubah, cari, dan hapus barang."
                : "Daftar peralatan laboratorium dan status ketersediaan stok."}
            </p>
          </div>

          {user?.role === "ADMIN" && (
            <button
              onClick={openAddModal}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Barang Baru</span>
            </button>
          )}
        </div>

        {/* Notifications */}
        {error && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError("")}><X className="w-4 h-4" /></button>
          </div>
        )}
        {success && (
          <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl flex items-center justify-between">
            <span>{success}</span>
            <button onClick={() => setSuccess("")}><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm mb-6 flex flex-col sm:flex-row items-center gap-3">
          <form onSubmit={handleSearch} className="relative flex-1 w-full">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari berdasarkan kode (BR001), nama barang, atau kategori..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </form>
          <div className="text-xs text-slate-500 font-medium px-2 whitespace-nowrap">
            Ditemukan: <span className="font-bold text-slate-800">{filteredItems.length}</span> barang
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
              <span>Memuat data inventaris...</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              Tidak ada barang yang sesuai dengan kriteria pencarian.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3.5 font-semibold">Kode</th>
                    <th className="px-6 py-3.5 font-semibold">Nama Barang</th>
                    <th className="px-6 py-3.5 font-semibold">Kategori</th>
                    <th className="px-6 py-3.5 font-semibold text-center">Stok Tersedia</th>
                    <th className="px-6 py-3.5 font-semibold">Status Ketersediaan</th>
                    {user?.role === "ADMIN" && (
                      <th className="px-6 py-3.5 font-semibold text-right">Aksi</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map((item) => {
                    const isAvailable = item.stock > 0;
                    const isLow = item.stock > 0 && item.stock <= 3;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-6 py-4 font-mono font-bold text-blue-600">
                          {item.code}
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-800">
                          {item.name}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg">
                            {item.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-slate-800">
                          {item.stock} unit
                        </td>
                        <td className="px-6 py-4">
                          {item.stock > 3 ? (
                            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Tersedia</span>
                            </span>
                          ) : isLow ? (
                            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                              <span>Stok Terbatas</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                              <XCircle className="w-3.5 h-3.5 text-red-600" />
                              <span>Habis</span>
                            </span>
                          )}
                        </td>
                        {user?.role === "ADMIN" && (
                          <td className="px-6 py-4 text-right">
                            <div className="inline-flex items-center space-x-1.5">
                              <button
                                onClick={() => openEditModal(item)}
                                className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="Edit Barang"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeletingItem(item)}
                                className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Hapus Barang"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Add / Edit Item Modal */}
      {(isAddModalOpen || editingItem) && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-lg font-bold text-slate-800">
                {editingItem ? "Edit Data Barang" : "Tambah Barang Baru"}
              </h2>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingItem(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Kode Barang (e.g. BR009)
                </label>
                <input
                  type="text"
                  required
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  placeholder="BR001"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Nama Barang
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Laptop Lenovo ThinkPad"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Kategori
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Laptop">Laptop / Komputer</option>
                  <option value="Aksesoris">Aksesoris (Mouse/Keyboard)</option>
                  <option value="Display">Display / Monitor</option>
                  <option value="Multimedia">Multimedia / Proyektor</option>
                  <option value="Jaringan">Jaringan (Router/Switch)</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Jumlah Stok
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formStock}
                  onChange={(e) => setFormStock(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingItem(null);
                  }}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? "Menyimpan..." : "Simpan Barang"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 mb-2">
              Hapus Barang Ini?
            </h2>
            <p className="text-sm text-slate-600 mb-5">
              Apakah Anda yakin ingin menghapus{" "}
              <span className="font-semibold text-slate-900">
                {deletingItem.code} - {deletingItem.name}
              </span>
              ? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={submitting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold shadow-sm transition disabled:opacity-50"
              >
                {submitting ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
