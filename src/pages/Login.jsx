import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    setError("");
    if (!email || !password) {
      setError("Mohon isi email dan kata sandi.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError("Email atau kata sandi salah.");
    } else {
      navigate("/");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#1A5C45] flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3">
            <img
              src="/public/PantauBelanja_Logo.svg"
              alt="Logo PantauBelanja"
            />
          </div>
          <h1 className="text-xl font-bold text-[#1A5C45]">PantauBelanja</h1>
          <p className="text-sm text-gray-700 mt-1">
            Cara Mudah Pantau Pengeluaran.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        {/* Email */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray mb-1.5">
            Email
          </label>
          <div className="flex items-center border border-gray-500 rounded-xl px-3 py-3 bg-gray-50 focus-within:border-[#1A5C45]">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="masukan email anda"
              className="flex-1 bg-transparent text-sm outline-none text-gray-800 placeholder-gray-500"
            />
          </div>
        </div>

        {/* Password */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray mb-1.5">
            Password
          </label>
          <div className="flex items-center border border-gray-500 rounded-xl px-3 py-3 bg-gray-50 focus-within:border-[#1A5C45]">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="masukan kata sandi"
              className="flex-1 bg-transparent text-sm outline-none text-gray-800 placeholder-gray-500"
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="ml-2 text-gray-400"
            >
              <i
                className={`fa ${showPassword ? "fa-eye" : "fa-eye-slash"} text-sm`}
              />
            </button>
          </div>
        </div>

        {/* Tombol Masuk */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-[#1A5C45] text-white font-semibold py-3.5 rounded-xl flex items-center justify-center disabled:opacity-60 active:scale-95 transition-transform"
        >
          {loading ? "Memuat..." : "Masuk →"}
        </button>

        {/* Link Register */}
        <p className="text-center text-sm text-gray-700 mt-6">
          Belum punya akun?{" "}
          <Link to="/register" className="text-[#1A5C45] font-semibold">
            Daftar sekarang
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
