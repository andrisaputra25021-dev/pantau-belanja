import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

const DEFAULT_CATEGORIES = [
  { name: "Gaji", type: "income" },
  { name: "Pemasukan Lain", type: "income" },
  { name: "Belanja Dapur", type: "expense" },
  { name: "Makan & Minum", type: "expense" },
  { name: "Transport", type: "expense" },
  { name: "Listrik & Air", type: "expense" },
  { name: "Kesehatan", type: "expense" },
  { name: "Pendidikan", type: "expense" },
  { name: "Lainnya", type: "expense" },
];

function getPasswordStrength(password) {
  if (!password)
    return {
      label: "Belum diisi",
      bar: "w-0",
      color: "bg-gray-200",
      text: "text-gray-400",
    };
  if (password.length < 6)
    return {
      label: "Lemah",
      bar: "w-1/4",
      color: "bg-red-400",
      text: "text-red-500",
    };
  if (password.length < 8)
    return {
      label: "Sedang",
      bar: "w-2/4",
      color: "bg-yellow-400",
      text: "text-yellow-500",
    };
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*]/.test(password);
  if (hasNumber && hasSpecial)
    return {
      label: "Kuat",
      bar: "w-full",
      color: "bg-[#1A5C45]",
      text: "text-[#1A5C45]",
    };
  return {
    label: "Cukup",
    bar: "w-3/4",
    color: "bg-green-400",
    text: "text-green-600",
  };
}

async function seedCategories(userId) {
  const rows = DEFAULT_CATEGORIES.map((cat) => ({
    ...cat,
    user_id: userId,
    parent_id: null,
  }));
  const { error } = await supabase.from("categories").insert(rows);
  if (error) console.error("Seed gagal:", error.message);
}

function Register() {
  const navigate = useNavigate();
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const strength = getPasswordStrength(password);

  async function handleRegister() {
    setError("");
    if (!nama || !email || !password || !confirmPassword) {
      setError("Semua kolom wajib diisi.");
      return;
    }
    if (password.length < 8) {
      setError("Kata sandi minimal 8 karakter.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: nama } },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      await seedCategories(data.user.id);
    }

    navigate("/");
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        {/* Back */}
        <Link
          to="/login"
          className="inline-flex items-center gap-1 text-gray-700 text-sm mb-6 font-semibold"
        >
          <i className="fa fa-arrow-left text-sm" />
          Kembali
        </Link>

        <h1 className="text-xl text-center font-bold text-[#1A5C45] mb-1">
          Buat Akun
        </h1>
        <p className="text-sm text-center text-gray-700 mb-6">
          Mulai catat keuanganmu hari ini.
        </p>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        {/* Nama */}
        <div className="mb-4">
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            Nama
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Masukkan nama anda"
            className="w-full border border-gray-500 rounded-xl px-4 py-3 text-sm bg-gray-50 outline-none text-gray-800 placeholder-gray-400 focus:border-[#1A5C45]"
          />
        </div>

        {/* Email */}
        <div className="mb-4">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="masukan email anda"
            className="w-full border border-gray-500 rounded-xl px-4 py-3 text-sm bg-gray-50 outline-none text-gray-800 placeholder-gray-400 focus:border-[#1A5C45]"
          />
        </div>

        {/* Kata Sandi */}
        <div className="mb-4">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            Kata Sandi
          </label>
          <div className="flex items-center border border-gray-500 rounded-xl px-3 py-3 bg-gray-50 focus-within:border-[#1A5C45]">
            <input
              id="password"
              autoComplete="new-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 8 karakter"
              className="flex-1 bg-transparent text-sm outline-none text-gray-800 placeholder-gray-400"
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="ml-2 text-gray-400"
            >
              <i
                className={`fa ${showPassword ? "fa-eye-slash" : "fa-eye"} text-sm`}
              />
            </button>
          </div>
          <div className="mt-2">
            <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${strength.bar} ${strength.color} transition-all duration-300`}
              />
            </div>
            <p className={`text-xs mt-1 ${strength.text}`}>
              Keamanan kata sandi: {strength.label}
            </p>
          </div>
        </div>

        {/* Konfirmasi */}
        <div className="mb-5">
          <label
            htmlFor="password-confirm"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            Konfirmasi Kata Sandi
          </label>
          <div className="flex items-center border border-gray-500 rounded-xl px-3 py-3 bg-gray-50 focus-within:border-[#1A5C45]">
            <input
              id="password-confirm"
              autoComplete="new-confirm"
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi kata sandi"
              className="flex-1 bg-transparent text-sm outline-none text-gray-800 placeholder-gray-400"
            />
            <button
              onClick={() => setShowConfirm(!showConfirm)}
              className="ml-2 text-gray-400"
            >
              <i
                className={`fa ${showConfirm ? "fa-eye-slash" : "fa-eye"} text-sm`}
              />
            </button>
          </div>
        </div>

        {/* Tombol Daftar */}
        <button
          onClick={handleRegister}
          disabled={loading}
          className="w-full bg-[#1A5C45] text-white font-semibold py-3.5 rounded-xl flex items-center justify-center disabled:opacity-60 active:scale-95 transition-transform"
        >
          {loading ? "Memproses..." : "Daftar Sekarang →"}
        </button>

        {/* Link Login */}
        <p className="text-center text-sm text-gray-700 mt-6">
          Sudah punya akun?{" "}
          <Link to="/login" className="text-[#1A5C45] font-semibold">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
