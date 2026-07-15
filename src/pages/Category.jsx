import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import BottomNav from "../components/BottomNav";

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Susun kategori pengeluaran jadi grup { header, children[] }, sama pola
// dengan AddTransaction.jsx supaya konsisten.
function buildExpenseGroups(categories) {
  const headers = categories.filter(
    (c) => c.type === "pengeluaran" && c.parent_id === null,
  );
  return headers.map((header) => ({
    header,
    children: categories.filter((c) => c.parent_id === header.id),
  }));
}

function buildIncomeList(categories) {
  return categories.filter((c) => c.type === "pemasukan");
}

// Hitung jumlah transaksi per category_id dari list transaksi
function countTransactionsByCategory(transactions) {
  const counts = {};
  for (const tx of transactions) {
    counts[tx.category_id] = (counts[tx.category_id] || 0) + 1;
  }
  return counts;
}

// ─── Component ────────────────────────────────────────────────────────────────

function Category() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("pengeluaran");
  const [searchQuery, setSearchQuery] = useState("");

  const [categories, setCategories] = useState([]);
  const [txCounts, setTxCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError("");

      // Fetch kategori dan transaksi secara paralel
      const [categoriesRes, transactionsRes] = await Promise.all([
        supabase
          .from("categories")
          .select("id, name, type, parent_id")
          .order("created_at", { ascending: true }),
        supabase.from("transactions").select("category_id"),
      ]);

      if (categoriesRes.error) {
        console.error("Gagal fetch kategori:", categoriesRes.error.message);
        setError("Gagal memuat kategori. Coba lagi.");
        setLoading(false);
        return;
      }

      setCategories(categoriesRes.data || []);

      if (transactionsRes.error) {
        console.error(
          "Gagal fetch jumlah transaksi:",
          transactionsRes.error.message,
        );
        // Non-fatal — tetap render kategori, cuma count-nya kosong
        setTxCounts({});
      } else {
        setTxCounts(countTransactionsByCategory(transactionsRes.data || []));
      }

      setLoading(false);
    }

    fetchData();
  }, []);

  const expenseGroups = buildExpenseGroups(categories);
  const incomeList = buildIncomeList(categories);

  // Filter search — client-side, case-insensitive
  const query = searchQuery.trim().toLowerCase();

  const filteredExpenseGroups = expenseGroups
    .map((group) => ({
      ...group,
      children: group.children.filter((c) =>
        c.name.toLowerCase().includes(query),
      ),
    }))
    .filter((group) => group.children.length > 0);

  const filteredIncomeList = incomeList.filter((c) =>
    c.name.toLowerCase().includes(query),
  );

  const isPengeluaran = activeTab === "pengeluaran";
  const hasResults = isPengeluaran
    ? filteredExpenseGroups.length > 0
    : filteredIncomeList.length > 0;

  function handleCategoryClick(cat) {
    navigate(`/category/${cat.id}`);
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* ── Top bar ── */}
      <div className="bg-white px-4 pt-10 pb-4">
        <span className="font-bold text-gray-800 block text-center">
          Kategori
        </span>
      </div>

      <div className="px-4 pt-4">
        {/* ── Tabs ── */}
        <div className="grid grid-cols-2 gap-2 bg-gray-100 rounded-xl p-1 mb-4">
          <button
            onClick={() => setActiveTab("pengeluaran")}
            className={`py-2 rounded-lg text-sm font-semibold transition-colors ${
              isPengeluaran
                ? "bg-white text-[#1A5C45] shadow-sm"
                : "text-gray-500"
            }`}
          >
            Pengeluaran
          </button>
          <button
            onClick={() => setActiveTab("pemasukan")}
            className={`py-2 rounded-lg text-sm font-semibold transition-colors ${
              !isPengeluaran
                ? "bg-white text-[#1A5C45] shadow-sm"
                : "text-gray-500"
            }`}
          >
            Pemasukan
          </button>
        </div>

        {/* ── Search bar ── */}
        <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-3 mb-4 shadow-sm">
          <i className="fa fa-search text-gray-300 text-sm" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kategori..."
            className="flex-1 text-sm text-gray-800 bg-transparent outline-none placeholder-gray-400"
          />
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-500 text-sm px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        {/* ── Loading skeleton ── */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-28 bg-gray-100 rounded" />
                    <div className="h-3 w-16 bg-gray-100 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Empty: search gak ketemu ── */}
        {!loading && !error && query && !hasResults && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <i className="fa fa-search text-2xl text-gray-300" />
            </div>
            <p className="text-gray-700 font-semibold mb-1">
              Kategori tidak ditemukan
            </p>
            <p className="text-sm text-gray-400">Coba kata kunci lain.</p>
          </div>
        )}

        {/* ── List: Pengeluaran (grouped) ── */}
        {!loading && !error && isPengeluaran && (
          <div className="space-y-5">
            {filteredExpenseGroups.map((group) => (
              <div key={group.header.id}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
                  {group.header.name}
                </p>
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  {group.children.map((cat, idx) => {
                    const count = txCounts[cat.id] || 0;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => handleCategoryClick(cat)}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 text-left ${
                          idx !== group.children.length - 1
                            ? "border-b border-gray-50"
                            : ""
                        } ${count === 0 ? "opacity-50" : ""}`}
                      >
                        <div className="w-10 h-10 rounded-full bg-[#1A5C45] flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-sm font-bold">
                            {cat.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">
                            {cat.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {count} transaksi
                          </p>
                        </div>
                        <i className="fa fa-chevron-right text-gray-300 text-xs flex-shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── List: Pemasukan (flat) ── */}
        {!loading &&
          !error &&
          !isPengeluaran &&
          filteredIncomeList.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
                Pemasukan
              </p>
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {filteredIncomeList.map((cat, idx) => {
                  const count = txCounts[cat.id] || 0;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryClick(cat)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 text-left ${
                        idx !== filteredIncomeList.length - 1
                          ? "border-b border-gray-50"
                          : ""
                      } ${count === 0 ? "opacity-50" : ""}`}
                    >
                      <div className="w-10 h-10 rounded-full bg-[#1A5C45] flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-bold">
                          {cat.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {cat.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {count} transaksi
                        </p>
                      </div>
                      <i className="fa fa-chevron-right text-gray-300 text-xs flex-shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
      </div>

      <BottomNav />
    </div>
  );
}

export default Category;
