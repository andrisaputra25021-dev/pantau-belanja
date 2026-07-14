import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import BottomNav from "../components/BottomNav";

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

// Warna donut per grup pengeluaran — konsisten dipakai juga buat legend & bar
const GROUP_COLORS = ["#1A5C45", "#E05252", "#F0A830", "#378ADD", "#7F77DD"];

// Aggregate transaksi jadi breakdown per kategori (dipisah pengeluaran/pemasukan)
function aggregateByCategory(transactions, type) {
  const map = {};
  for (const tx of transactions) {
    if (tx.type !== type) continue;
    const catId = tx.category_id;
    const catName = tx.categories?.name || "Lainnya";
    if (!map[catId]) {
      map[catId] = { id: catId, name: catName, total: 0 };
    }
    map[catId].total += Number(tx.amount);
  }
  return Object.values(map).sort((a, b) => b.total - a.total);
}

// Susun path SVG buat tiap segment donut (stroke-dasharray based)
function buildDonutSegments(categoryTotals, totalAmount) {
  if (totalAmount === 0) return [];
  let cumulativePercent = 0;
  return categoryTotals.map((cat, idx) => {
    const percent = (cat.total / totalAmount) * 100;
    const segment = {
      ...cat,
      percent,
      color: GROUP_COLORS[idx % GROUP_COLORS.length],
      offset: cumulativePercent,
    };
    cumulativePercent += percent;
    return segment;
  });
}

// ─── Donut Chart Component (custom SVG, no dependency) ────────────────────────

function DonutChart({ segments, centerLabel, centerValue }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="relative w-[180px] h-[180px] mx-auto">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        {/* Track kosong (background) */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth="12"
        />
        {segments.map((seg) => {
          const segLength = (seg.percent / 100) * circumference;
          const gap = circumference - segLength;
          const dashOffset = -((seg.offset / 100) * circumference);
          return (
            <circle
              key={seg.id}
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth="12"
              strokeDasharray={`${segLength} ${gap}`}
              strokeDashoffset={dashOffset}
              strokeLinecap="butt"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs text-gray-400">{centerLabel}</span>
        <span className="text-2xl font-bold text-gray-800">{centerValue}</span>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

function Recap() {
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchTransactions() {
      setLoading(true);
      setError("");

      const { start, end } = getMonthBounds(selectedMonth);

      const { data, error: fetchError } = await supabase
        .from("transactions")
        .select("*, categories(name, type)")
        .gte("transaction_date", start)
        .lte("transaction_date", end);

      if (fetchError) {
        console.error("Gagal fetch transaksi:", fetchError.message);
        setError("Gagal memuat data. Coba lagi.");
        setTransactions([]);
      } else {
        setTransactions(data || []);
      }

      setLoading(false);
    }

    fetchTransactions();
  }, [selectedMonth]);

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

  const totalIncome = transactions
    .filter((tx) => tx.type === "pemasukan")
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const totalExpense = transactions
    .filter((tx) => tx.type === "pengeluaran")
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const saldo = totalIncome - totalExpense;

  const expenseByCategory = aggregateByCategory(transactions, "pengeluaran");
  const incomeByCategory = aggregateByCategory(transactions, "pemasukan");

  const donutSegments = buildDonutSegments(expenseByCategory, totalExpense);
  // "Terpakai" = proporsi pengeluaran terhadap total pemasukan bulan ini
  const terpakaiPercent =
    totalIncome > 0 ? Math.round((totalExpense / totalIncome) * 100) : 0;

  const hasData = transactions.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* ── Top bar ── */}
      <div className="bg-white px-4 pt-10 pb-4">
        <span className="font-bold text-gray-800">Rekap Bulanan</span>
      </div>

      <div className="px-4 pt-4">
        {/* ── Month Navigator ── */}
        <div className="flex items-center justify-center gap-6 mb-4">
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

        {/* ── Error ── */}
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-500 text-sm px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        {/* ── 3 Kartu Ringkasan ── */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="bg-white rounded-xl p-3 shadow-sm text-center">
            <p className="text-[10px] text-gray-400 uppercase mb-1">
              Pemasukan
            </p>
            {loading ? (
              <div className="h-4 w-14 bg-gray-100 rounded mx-auto animate-pulse" />
            ) : (
              <p className="text-xs font-bold text-[#1A5C45]">
                {formatRupiah(totalIncome)}
              </p>
            )}
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm text-center">
            <p className="text-[10px] text-gray-400 uppercase mb-1">Keluar</p>
            {loading ? (
              <div className="h-4 w-14 bg-gray-100 rounded mx-auto animate-pulse" />
            ) : (
              <p className="text-xs font-bold text-red-500">
                {formatRupiah(totalExpense)}
              </p>
            )}
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm text-center">
            <p className="text-[10px] text-gray-400 uppercase mb-1">Saldo</p>
            {loading ? (
              <div className="h-4 w-14 bg-gray-100 rounded mx-auto animate-pulse" />
            ) : (
              <p className="text-xs font-bold text-gray-800">
                {formatRupiah(saldo)}
              </p>
            )}
          </div>
        </div>

        {/* ── Loading skeleton ── */}
        {loading && (
          <div className="bg-white rounded-2xl p-6 mb-6 flex items-center justify-center">
            <div className="w-[180px] h-[180px] rounded-full bg-gray-100 animate-pulse" />
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && !error && !hasData && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <i className="fa fa-folder-open text-3xl text-gray-300" />
            </div>
            <p className="text-gray-700 font-semibold mb-1">
              Belum ada rekap bulan ini
            </p>
            <p className="text-sm text-gray-400 max-w-[240px] mb-4">
              Catat transaksi pertamamu untuk melihat laporan keuangan di sini.
            </p>
            <button
              onClick={() => navigate("/add")}
              className="text-sm font-semibold text-[#1A5C45]"
            >
              Mulai di sini ↓
            </button>
          </div>
        )}

        {/* ── Donut Chart: Alokasi Belanja ── */}
        {!loading && !error && hasData && totalExpense > 0 && (
          <div className="bg-white rounded-2xl p-5 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-gray-700">
                Alokasi Belanja
              </span>
              <span className="text-xs font-medium text-[#1A5C45] bg-green-50 px-3 py-1 rounded-full">
                Bulan Ini
              </span>
            </div>

            <DonutChart
              segments={donutSegments}
              centerLabel="Terpakai"
              centerValue={`${terpakaiPercent}%`}
            />

            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-5">
              {donutSegments.map((seg) => (
                <div key={seg.id} className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span className="text-xs text-gray-600">{seg.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Pengeluaran per Kategori ── */}
        {!loading && !error && expenseByCategory.length > 0 && (
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-700 mb-3">
              Pengeluaran per Kategori
            </p>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {expenseByCategory.map((cat, idx) => {
                const percent =
                  totalExpense > 0 ? (cat.total / totalExpense) * 100 : 0;
                return (
                  <button
                    key={cat.id}
                    onClick={() => navigate(`/kategori/${cat.id}`)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-left ${
                      idx !== expenseByCategory.length - 1
                        ? "border-b border-gray-50"
                        : ""
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor:
                          GROUP_COLORS[idx % GROUP_COLORS.length],
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate mb-1">
                        {cat.name}
                      </p>
                      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${percent}%`,
                            backgroundColor:
                              GROUP_COLORS[idx % GROUP_COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-gray-800 flex-shrink-0">
                      {formatRupiah(cat.total)}
                    </span>
                    <i className="fa fa-chevron-right text-gray-300 text-xs flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Pemasukan per Kategori ── */}
        {!loading && !error && incomeByCategory.length > 0 && (
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-700 mb-3">
              Pemasukan per Kategori
            </p>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {incomeByCategory.map((cat, idx) => {
                const percent =
                  totalIncome > 0 ? (cat.total / totalIncome) * 100 : 0;
                return (
                  <button
                    key={cat.id}
                    onClick={() => navigate(`/kategori/${cat.id}`)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-left ${
                      idx !== incomeByCategory.length - 1
                        ? "border-b border-gray-50"
                        : ""
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-[#1A5C45] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate mb-1">
                        {cat.name}
                      </p>
                      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#1A5C45]"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-[#1A5C45] flex-shrink-0">
                      {formatRupiah(cat.total)}
                    </span>
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

export default Recap;
