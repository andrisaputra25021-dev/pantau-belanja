import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRupiah(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function getMonthBounds(date) {
  const y = date.getFullYear();
  const m = date.getMonth();
  const pad = (n) => String(n).padStart(2, "0");
  const start = `${y}-${pad(m + 1)}-01`;
  const lastDay = new Date(y, m + 1, 0).getDate();
  const end = `${y}-${pad(m + 1)}-${pad(lastDay)}`;
  return { start, end };
}

function formatMonthLabel(date) {
  return date.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

function formatShortDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

function CategoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [category, setCategory] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null); // tx yang mau dihapus
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError("");

      const { start, end } = getMonthBounds(selectedMonth);

      const [categoryRes, transactionsRes] = await Promise.all([
        supabase
          .from("categories")
          .select("id, name, type")
          .eq("id", id)
          .single(),
        supabase
          .from("transactions")
          .select("*")
          .eq("category_id", id)
          .gte("transaction_date", start)
          .lte("transaction_date", end)
          .order("transaction_date", { ascending: false }),
      ]);

      if (categoryRes.error) {
        console.error("Gagal fetch kategori:", categoryRes.error.message);
        setError("Kategori tidak ditemukan.");
        setLoading(false);
        return;
      }

      setCategory(categoryRes.data);

      if (transactionsRes.error) {
        console.error("Gagal fetch transaksi:", transactionsRes.error.message);
        setError("Gagal memuat transaksi. Coba lagi.");
        setTransactions([]);
      } else {
        setTransactions(transactionsRes.data || []);
      }

      setLoading(false);
    }

    fetchData();
  }, [id, selectedMonth]);

  function prevMonth() {
    setSelectedMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
    );
  }

  function nextMonth() {
    setSelectedMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
    );
  }

  const total = transactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
  const isPengeluaran = category?.type === "pengeluaran";

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError("");

    const { error: deleteErr } = await supabase
      .from("transactions")
      .delete()
      .eq("id", deleteTarget.id);

    if (deleteErr) {
      console.error("Gagal hapus transaksi:", deleteErr.message);
      setDeleteError("Gagal menghapus transaksi. Coba lagi.");
      setDeleting(false);
      return;
    }

    setTransactions((prev) => prev.filter((tx) => tx.id !== deleteTarget.id));
    setDeleteTarget(null);
    setDeleting(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* ── Top bar ── */}
      <div className="bg-white px-4 pt-10 pb-4 flex items-center gap-3 border-b border-gray-100">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-500 text-lg"
          aria-label="Kembali"
        >
          <i className="fa fa-arrow-left" />
        </button>
        <span className="font-bold text-gray-800 flex-1 text-center pr-6">
          {category?.name || "Kategori"}
        </span>
      </div>

      <div className="px-4 pt-4">
        {/* ── Error ── */}
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-500 text-sm px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        {!error && (
          <>
            {/* ── Summary Card ── */}
            <div className="bg-[#1A5C45] rounded-2xl p-5 mb-4">
              <p className="text-xs text-green-300 uppercase tracking-wider mb-1">
                {isPengeluaran ? "Total Pengeluaran" : "Total Pemasukan"}
              </p>
              {loading ? (
                <div className="h-7 w-32 bg-green-800 rounded-lg animate-pulse mb-2" />
              ) : (
                <p className="text-xl font-bold text-white mb-1">
                  {formatRupiah(total)}
                </p>
              )}
              <p className="text-xs text-green-200">
                dari {transactions.length} transaksi bulan ini
              </p>
            </div>

            {/* ── Month Navigator ── */}
            <div className="flex items-center justify-center gap-6 mb-5 bg-white rounded-xl py-2.5 shadow-sm">
              <button
                onClick={prevMonth}
                className="text-gray-400 active:text-[#1A5C45] p-1"
              >
                <i className="fa fa-chevron-left text-sm" />
              </button>
              <span className="text-sm font-semibold text-gray-700 capitalize min-w-[120px] text-center">
                {formatMonthLabel(selectedMonth)}
              </span>
              <button
                onClick={nextMonth}
                className="text-gray-400 active:text-[#1A5C45] p-1"
              >
                <i className="fa fa-chevron-right text-sm" />
              </button>
            </div>

            <p className="text-sm font-semibold text-gray-700 mb-3">
              Daftar Transaksi
            </p>

            {/* ── Loading skeleton ── */}
            {loading && (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl p-4 animate-pulse"
                  >
                    <div className="flex items-center justify-between">
                      <div className="h-4 w-32 bg-gray-100 rounded" />
                      <div className="h-4 w-16 bg-gray-100 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Empty state ── */}
            {!loading && transactions.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <i className="fa fa-inbox text-3xl text-gray-300" />
                </div>
                <p className="text-gray-700 font-semibold mb-1">
                  Belum ada transaksi di kategori ini
                </p>
                <p className="text-sm text-gray-400 max-w-[240px] mb-4">
                  Mulai tambah transaksi untuk melihat catatannya di sini.
                </p>
                <button
                  onClick={() => navigate("/add")}
                  className="text-sm font-semibold text-[#1A5C45]"
                >
                  + Tambah Transaksi
                </button>
              </div>
            )}

            {/* ── Flat list transaksi ── */}
            {!loading && transactions.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {transactions.map((tx, idx) => (
                  <div
                    key={tx.id}
                    className={`flex items-center gap-3 px-4 py-3 ${
                      idx !== transactions.length - 1
                        ? "border-b border-gray-50"
                        : ""
                    }`}
                  >
                    <span className="text-xs text-gray-400 w-12 flex-shrink-0">
                      {formatShortDate(tx.transaction_date)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 truncate">
                        {tx.note || "-"}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-semibold flex-shrink-0 ${
                        isPengeluaran ? "text-red-500" : "text-[#1A5C45]"
                      }`}
                    >
                      {isPengeluaran ? "-" : "+"}
                      {formatRupiah(tx.amount)}
                    </span>
                    <button
                      onClick={() => setDeleteTarget(tx)}
                      className="text-gray-300 active:text-red-400 flex-shrink-0 pl-1"
                      aria-label="Hapus transaksi"
                    >
                      <i className="fa fa-trash text-sm" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Modal konfirmasi hapus ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !deleting && setDeleteTarget(null)}
          />
          <div className="relative w-full max-w-sm bg-white rounded-2xl p-6">
            <p className="font-bold text-gray-800 mb-1">Hapus Transaksi?</p>
            <p className="text-sm text-gray-500 mb-4">
              {deleteTarget.note || "Transaksi ini"} —{" "}
              {formatRupiah(deleteTarget.amount)} akan dihapus permanen.
              Tindakan ini tidak bisa dibatalkan.
            </p>

            {deleteError && (
              <div className="bg-red-50 border border-red-100 text-red-500 text-xs px-3 py-2 rounded-lg mb-3">
                {deleteError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 disabled:opacity-60"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-sm font-semibold text-white disabled:opacity-60"
              >
                {deleting ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CategoryDetail;
