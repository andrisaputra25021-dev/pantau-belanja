import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRupiah(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function getLocalDateStr(date = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Susun kategori pengeluaran jadi grup { header, children[] } dari flat rows.
// parent_id null + type pengeluaran = header grup.
// parent_id terisi = child dari salah satu header.
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

// ─── Component ────────────────────────────────────────────────────────────────

function AddTransaction() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [type, setType] = useState("pengeluaran"); // default sesuai README
  const [amountDisplay, setAmountDisplay] = useState(""); // string angka mentah, tanpa format
  const [selectedCategory, setSelectedCategory] = useState(null); // { id, name }
  const [date, setDate] = useState(getLocalDateStr());
  const [note, setNote] = useState("");

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [showPicker, setShowPicker] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // ── Fetch semua kategori user sekali di awal ──
  useEffect(() => {
    async function fetchCategories() {
      setCategoriesLoading(true);
      const { data, error: fetchError } = await supabase
        .from("categories")
        .select("id, name, type, parent_id")
        .order("created_at", { ascending: true });

      if (fetchError) {
        console.error("Gagal fetch kategori:", fetchError.message);
        setError("Gagal memuat kategori. Coba refresh halaman.");
      } else {
        setCategories(data || []);
      }
      setCategoriesLoading(false);
    }
    fetchCategories();
  }, []);

  const expenseGroups = buildExpenseGroups(categories);
  const incomeList = buildIncomeList(categories);

  // ── FIX BUG LAMA: reset kategori terpilih tiap kali toggle type berubah,
  // supaya gak ada kategori pengeluaran nyangkut waktu type = pemasukan (atau sebaliknya) ──
  function handleTypeChange(newType) {
    if (newType === type) return;
    setType(newType);
    setSelectedCategory(null);
  }

  // ── Input nominal: cuma terima digit, simpan sebagai string angka mentah ──
  function handleAmountChange(e) {
    const digitsOnly = e.target.value.replace(/[^0-9]/g, "");
    setAmountDisplay(digitsOnly);
  }

  function handleSelectCategory(cat) {
    setSelectedCategory(cat);
    setShowPicker(false);
  }

  async function handleSave() {
    setError("");

    const amountNumber = Number(amountDisplay);
    if (!amountDisplay || amountNumber <= 0) {
      setError("Nominal harus diisi dan lebih dari 0.");
      return;
    }
    if (!selectedCategory) {
      setError("Pilih kategori terlebih dahulu.");
      return;
    }
    if (!date) {
      setError("Tanggal harus diisi.");
      return;
    }

    setSaving(true);

    const { error: insertError } = await supabase.from("transactions").insert({
      user_id: user.id,
      type, // 'pemasukan' | 'pengeluaran' — konsisten skema, JANGAN 'income'/'expense'
      amount: amountNumber,
      category_id: selectedCategory.id,
      transaction_date: date,
      note: note || null,
    });

    if (insertError) {
      console.error("Gagal simpan transaksi:", insertError.message);
      setError("Gagal menyimpan transaksi. Coba lagi.");
      setSaving(false);
      return;
    }

    navigate("/");
  }

  const isPengeluaran = type === "pengeluaran";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ── Top bar ── */}
      <div className="bg-white px-4 pt-10 pb-4 flex items-center justify-between border-b border-gray-100">
        <span className="font-bold text-gray-800">Tambah Transaksi</span>
        <button
          onClick={() => navigate(-1)}
          className="text-gray-400 text-lg"
          aria-label="Tutup"
        >
          <i className="fa fa-times" />
        </button>
      </div>

      <div className="flex-1 px-4 pt-5 pb-8">
        {/* ── Error ── */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        {/* ── Toggle Pengeluaran / Pemasukan — dua tombol terpisah ── */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => handleTypeChange("pengeluaran")}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-colors ${
              isPengeluaran
                ? "bg-red-500 text-white"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            <i className="fa fa-minus-circle" />
            Pengeluaran
          </button>
          <button
            onClick={() => handleTypeChange("pemasukan")}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-colors ${
              !isPengeluaran
                ? "bg-[#1A5C45] text-white"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            <i className="fa fa-plus-circle" />
            Pemasukan
          </button>
        </div>

        {/* ── Nominal ── */}
        <div className="text-center mb-6">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
            Nominal
          </p>
          <div className="flex items-center justify-center">
            <span className="text-2xl font-bold text-[#1A5C45] mr-1">Rp</span>
            <input
              type="text"
              inputMode="numeric"
              value={
                amountDisplay
                  ? Number(amountDisplay).toLocaleString("id-ID")
                  : ""
              }
              onChange={handleAmountChange}
              placeholder="0"
              className="text-3xl font-bold text-[#1A5C45] bg-transparent outline-none text-center w-[60%] placeholder-gray-300"
            />
          </div>
        </div>

        {/* ── Kategori ── */}
        <button
          onClick={() => setShowPicker(true)}
          className="w-full flex items-center justify-between bg-white rounded-xl px-4 py-3.5 mb-3 shadow-sm"
        >
          <span className="text-sm text-gray-700">Kategori</span>
          <div className="flex items-center gap-2">
            {selectedCategory ? (
              <span className="flex items-center gap-1.5 text-sm font-medium text-[#1A5C45] bg-green-50 px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-[#1A5C45]" />
                {selectedCategory.name}
              </span>
            ) : (
              <span className="text-sm text-gray-400">Pilih kategori</span>
            )}
            <i className="fa fa-chevron-right text-gray-300 text-xs" />
          </div>
        </button>

        {/* ── Tanggal ── */}
        <div className="w-full flex items-center justify-between bg-white rounded-xl px-4 py-3.5 mb-3 shadow-sm">
          <span className="text-sm text-gray-700">Tanggal</span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="text-sm text-gray-700 bg-transparent outline-none text-right"
            />
          </div>
        </div>

        {/* ── Catatan ── */}
        <div className="bg-white rounded-xl px-4 py-3.5 mb-6 shadow-sm">
          <label className="text-sm text-gray-700 block mb-2">
            Catatan (opsional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Tambah catatan..."
            rows={3}
            className="w-full text-sm text-gray-800 bg-transparent outline-none placeholder-gray-400 resize-none"
          />{" "}
        </div>

        {/* ── Tombol Simpan ── */}
        <button
          onClick={handleSave}
          disabled={saving || categoriesLoading}
          className="w-full bg-[#1A5C45] text-white font-semibold py-3.5 rounded-xl disabled:opacity-60 active:scale-95 transition-transform"
        >
          {saving ? "Menyimpan..." : "Simpan Transaksi"}
        </button>
      </div>

      {/* ── Bottom sheet: Pilih Kategori ── */}
      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowPicker(false)}
          />

          {/* Sheet */}
          <div className="relative w-full bg-white rounded-t-3xl max-h-[75vh] flex flex-col">
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
              <span className="font-bold text-gray-800">Pilih Kategori</span>
              <button
                onClick={() => setShowPicker(false)}
                className="text-gray-400 text-lg"
                aria-label="Tutup"
              >
                <i className="fa fa-times" />
              </button>
            </div>

            <div className="overflow-y-auto px-5 py-3">
              {categoriesLoading && (
                <p className="text-sm text-gray-400 py-6 text-center">
                  Memuat kategori...
                </p>
              )}

              {/* Pengeluaran: grouped by header */}
              {!categoriesLoading &&
                isPengeluaran &&
                expenseGroups.map(({ header, children }) => (
                  <div key={header.id} className="mb-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                      {header.name}
                    </p>
                    <div className="space-y-1">
                      {children.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => handleSelectCategory(cat)}
                          className="w-full flex items-center gap-3 py-2.5 text-left"
                        >
                          <span className="w-2.5 h-2.5 rounded-full bg-[#1A5C45] flex-shrink-0" />
                          <span className="text-sm text-gray-700">
                            {cat.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

              {/* Pemasukan: flat list */}
              {!categoriesLoading && !isPengeluaran && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    Pemasukan
                  </p>
                  <div className="space-y-1">
                    {incomeList.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => handleSelectCategory(cat)}
                        className="w-full flex items-center gap-3 py-2.5 text-left"
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-[#1A5C45] flex-shrink-0" />
                        <span className="text-sm text-gray-700">
                          {cat.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AddTransaction;
