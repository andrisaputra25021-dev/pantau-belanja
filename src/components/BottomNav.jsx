import { Link, useLocation } from "react-router-dom";

function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex items-end justify-around px-2 pb-2 pt-2 z-50">
      <Link to="/" className="flex flex-col items-center gap-1 px-3">
        <i
          className={`fa fa-home text-xl ${pathname === "/" ? "text-[#1A5C45]" : "text-gray-400"}`}
        />
        <span
          className={`text-xs ${pathname === "/" ? "text-[#1A5C45] font-semibold" : "text-gray-400"}`}
        >
          Beranda
        </span>
      </Link>

      <Link to="/recap" className="flex flex-col items-center gap-1 px-3">
        <i
          className={`fa fa-chart-bar text-xl ${pathname === "/recap" ? "text-[#1A5C45]" : "text-gray-400"}`}
        />
        <span
          className={`text-xs ${pathname === "/recap" ? "text-[#1A5C45] font-semibold" : "text-gray-400"}`}
        >
          Rekap
        </span>
      </Link>

      {/* Tombol Tambah — elevated */}
      <Link to="/add" className="flex flex-col items-center gap-1 -mt-5">
        <div className="w-14 h-14 bg-[#1A5C45] rounded-full flex items-center justify-center shadow-lg">
          <i className="fa fa-plus text-white text-xl" />
        </div>
        <span className="text-xs text-gray-400">Tambah</span>
      </Link>

      <Link to="/category" className="flex flex-col items-center gap-1 px-3">
        <i
          className={`fa fa-tag text-xl ${pathname === "/category" ? "text-[#1A5C45]" : "text-gray-400"}`}
        />
        <span
          className={`text-xs ${pathname === "/category" ? "text-[#1A5C45] font-semibold" : "text-gray-400"}`}
        >
          Kategori
        </span>
      </Link>

      <Link to="/profile" className="flex flex-col items-center gap-1 px-3">
        <i
          className={`fa fa-user text-xl ${pathname === "/profile" ? "text-[#1A5C45]" : "text-gray-400"}`}
        />
        <span
          className={`text-xs ${pathname === "/profile" ? "text-[#1A5C45] font-semibold" : "text-gray-400"}`}
        >
          Profil
        </span>
      </Link>
    </nav>
  );
}

export default BottomNav;
