import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
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
  // Pakai local date string supaya gak kena UTC offset (user di WIB/WITA/WIT)
  const pad = (n) => String(n).padStart(2, "0");
  const start = `${y}-${pad(m + 1)}-01`;
  const lastDay = new Date(y, m + 1, 0).getDate();
  const end = `${y}-${pad(m + 1)}-${pad(lastDay)}`;
  return { start, end };
}

function formatMonthLabel(date) {
  return date.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

function getLocalDateStr(date = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function getDateLabel(dateStr) {
  const todayStr = getLocalDateStr();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalDateStr(yesterday);

  if (dateStr === todayStr) return "HARI INI";
  if (dateStr === yesterdayStr) return "KEMARIN";

  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d)
    .toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    .toUpperCase();
}

function groupByDate(transactions) {
  const groups = {};
  for (const tx of transactions) {
    const key = tx.transaction_date;
    if (!groups[key]) groups[key] = [];
    groups[key].push(tx);
  }
  // Urutkan tanggal descending (terbaru di atas)
  return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
}

// ─── Component ────────────────────────────────────────────────────────────────

function Home() {
  const { user } = useAuth();
  const displayName = user?.user_metadata?.display_name || "Pengguna";

  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Hitung summary dari data yang udah difetch
  const totalIncome = transactions
    .filter((tx) => tx.type === "pemasukan")
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const totalExpense = transactions
    .filter((tx) => tx.type === "pengeluaran")
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const saldo = totalIncome - totalExpense;

  useEffect(() => {
    async function fetchTransactions() {
      setLoading(true);
      setError("");

      const { start, end } = getMonthBounds(selectedMonth);

      const { data, error: fetchError } = await supabase
        .from("transactions")
        .select("*, categories(name, type)")
        .gte("transaction_date", start)
        .lte("transaction_date", end)
        .order("transaction_date", { ascending: false });

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

  const grouped = groupByDate(transactions);

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* ── Header ── */}
      <div className="bg-white px-4 pt-10 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#1A5C45] flex items-center justify-center">
            <span className="text-white text-sm font-bold">
              {displayName.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="font-semibold text-gray-800">PantauBelanja</span>
        </div>
        {/* Icon kalender — non-fungsi untuk MVP */}
        <button className="text-gray-300 text-lg cursor-not-allowed" disabled>
          <i className="fa fa-calendar" />
        </button>
      </div>

      <div className="px-4 pt-4">
        {/* ── Greeting ── */}
        <h1 className="text-lg font-bold text-gray-800">
          Halo, {displayName}! 👋
        </h1>
        <p className="text-sm text-gray-500 mb-4">
          Mari pantau pengeluaranmu hari ini.
        </p>

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

        {/* ── Sisa Saldo Card ── */}
        <div className="bg-[#1A5C45] rounded-2xl p-5 mb-3">
          <p className="text-xs text-green-300 uppercase tracking-wider mb-1">
            Sisa Saldo
          </p>
          {loading ? (
            <div className="h-8 w-40 bg-green-800 rounded-lg animate-pulse" />
          ) : (
            <p className="text-2xl font-bold text-white">
              {formatRupiah(saldo)}
            </p>
          )}
        </div>

        {/* ── Pemasukan & Pengeluaran ── */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-1.5 mb-1">
              <i className="fa fa-arrow-down text-[#1A5C45] text-xs" />
              <span className="text-xs text-gray-400 uppercase tracking-wide">
                Pemasukan
              </span>
            </div>
            {loading ? (
              <div className="h-5 w-20 bg-gray-100 rounded animate-pulse" />
            ) : (
              <p className="text-sm font-bold text-[#1A5C45]">
                {formatRupiah(totalIncome)}
              </p>
            )}
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-1.5 mb-1">
              <i className="fa fa-arrow-up text-red-400 text-xs" />
              <span className="text-xs text-gray-400 uppercase tracking-wide">
                Pengeluaran
              </span>
            </div>
            {loading ? (
              <div className="h-5 w-20 bg-gray-100 rounded animate-pulse" />
            ) : (
              <p className="text-sm font-bold text-red-500">
                {formatRupiah(totalExpense)}
              </p>
            )}
          </div>
        </div>

        {/* ── Section Header ── */}
        <p className="text-sm font-semibold text-gray-700 mb-3">
          Transaksi Terakhir
        </p>

        {/* ── Error state ── */}
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
                    <div className="h-3 w-20 bg-gray-100 rounded" />
                  </div>
                  <div className="h-4 w-20 bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && !error && transactions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <i className="fa fa-receipt text-3xl text-gray-300" />
            </div>
            <p className="text-gray-700 font-semibold mb-1">
              Belum ada transaksi
            </p>
            <p className="text-sm text-gray-400 max-w-[220px]">
              Ketuk tombol + untuk mulai mencatat keuanganmu.
            </p>
          </div>
        )}

        {/* ── Transaction list ── */}
        {!loading && !error && grouped.length > 0 && (
          <div className="space-y-5">
            {grouped.map(([dateStr, txs]) => (
              <div key={dateStr}>
                <p className="text-xs font-semibold text-gray-400 mb-2 px-1">
                  {getDateLabel(dateStr)}
                </p>
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  {txs.map((tx, idx) => (
                    <div
                      key={tx.id}
                      className={`flex items-center gap-3 px-4 py-3 ${
                        idx !== txs.length - 1 ? "border-b border-gray-50" : ""
                      }`}
                    >
                      {/* Avatar huruf pertama kategori */}
                      <div className="w-10 h-10 rounded-full bg-[#1A5C45] flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-bold">
                          {tx.categories?.name?.charAt(0)?.toUpperCase() || "?"}
                        </span>
                      </div>

                      {/* Nama kategori + catatan */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {tx.categories?.name || "Kategori"}
                        </p>
                        {tx.note ? (
                          <p className="text-xs text-gray-400 truncate">
                            {tx.note}
                          </p>
                        ) : null}
                      </div>

                      {/* Nominal */}
                      <p
                        className={`text-sm font-bold flex-shrink-0 ${
                          tx.type === "pemasukan"
                            ? "text-[#1A5C45]"
                            : "text-red-500"
                        }`}
                      >
                        {tx.type === "pemasukan" ? "+" : "-"}
                        {formatRupiah(tx.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

export default Home;
