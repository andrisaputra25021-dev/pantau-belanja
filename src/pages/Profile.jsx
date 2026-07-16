import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDisplayName(user) {
  return user?.user_metadata?.display_name?.trim() || "";
}

function getInitial(user) {
  const name = getDisplayName(user);
  if (name) return name.charAt(0).toUpperCase();
  const email = user?.email || "";
  return email.charAt(0).toUpperCase() || "?";
}

// ─── Component ────────────────────────────────────────────────────────────────

function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  const displayName = getDisplayName(user);
  const initial = getInitial(user);

  async function handleLogout() {
    setLoggingOut(true);
    setLogoutError("");

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Gagal logout:", error.message);
      setLogoutError("Gagal keluar. Coba lagi.");
      setLoggingOut(false);
      return;
    }

    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* ── Top bar ── */}
      <div className="bg-white px-4 pt-10 pb-4 flex items-center justify-center border-b border-gray-100">
        <span className="font-bold text-gray-800">Profil</span>
      </div>

      <div className="px-4 pt-4">
        {logoutError && (
          <div className="bg-red-50 border border-red-100 text-red-500 text-sm px-4 py-3 rounded-xl mb-4">
            {logoutError}
          </div>
        )}

        {/* ── Profile card ── */}
        <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col items-center mb-5">
          <div className="w-20 h-20 rounded-full bg-[#1A5C45] flex items-center justify-center mb-3">
            <span className="text-white text-2xl font-bold">{initial}</span>
          </div>
          {displayName && (
            <p className="text-lg font-bold text-gray-800">{displayName}</p>
          )}
          <p className="text-sm text-gray-500">{user?.email}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-5">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 active:bg-gray-50 disabled:opacity-60"
          >
            <i className="fa fa-right-from-bracket text-red-500" />
            <span className="text-sm font-semibold text-red-500">
              {loggingOut ? "Keluar..." : "Keluar"}
            </span>
          </button>
        </div>

        {/* ── App version ── */}
        <p className="text-center text-xs text-gray-500 mt-6">
          PantauBelanja v1.0.0
        </p>
      </div>
    </div>
  );
}

export default Profile;
