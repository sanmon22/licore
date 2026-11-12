import React from "react";
import { useAuthStore } from "../../store/auth.store";
import { useCartStore } from "../../store/cart.store";
import {
  Wine,
  ShoppingCart,
  User as UserIcon,
  LogOut,
  Package,
  ShieldCheck,
  Building2,
  Store,
} from "lucide-react";

interface NavbarProps {
  onOpenCart: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCart, currentPage, onNavigate }) => {
  const { user, logout } = useAuthStore();
  const { getTotalCases, getGrandTotal } = useCartStore();

  const totalCases = getTotalCases();
  const grandTotal = getGrandTotal();

  return (
    <header className="sticky top-0 z-40 bg-stone-900 text-stone-100 shadow-md border-b border-stone-800">
      {/* Top Banner with Client Tier context */}
      <div className="bg-amber-600 px-4 py-1 text-xs text-white flex justify-between items-center font-medium">
        <div className="flex items-center space-x-2">
          <span>📦 Venta exclusiva por caja cerrada</span>
          <span className="hidden sm:inline">• Precios diferenciados para Bares, Restaurantes y Particulares</span>
        </div>
        <div>
          {user ? (
            <span className="font-semibold uppercase tracking-wider">
              Tarifa Activa: {user.customerType === "INDUSTRIAL" ? "🏭 Industrial / Mayorista" : "🛒 Cliente Final"}
            </span>
          ) : (
            <span>Inicia sesión para desbloquear tarifas industriales</span>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={() => onNavigate("catalog")}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center text-stone-900 group-hover:bg-amber-400 transition-colors shadow-inner">
            <Wine className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
              DISTRIBUIDORA <span className="text-amber-500">LICORES</span>
            </h1>
            <p className="text-[10px] text-stone-400 font-medium tracking-wider uppercase">
              Portal E-Commerce B2B & B2C
            </p>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="hidden md:flex items-center space-x-1">
          <button
            onClick={() => onNavigate("catalog")}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              currentPage === "catalog"
                ? "bg-stone-800 text-amber-400"
                : "text-stone-300 hover:text-white hover:bg-stone-800/60"
            }`}
          >
            Catálogo
          </button>

          {user?.role === "CUSTOMER" && (
            <button
              onClick={() => onNavigate("my-orders")}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                currentPage === "my-orders"
                  ? "bg-stone-800 text-amber-400"
                  : "text-stone-300 hover:text-white hover:bg-stone-800/60"
              }`}
            >
              <Package className="w-4 h-4" />
              Mis Pedidos
            </button>
          )}

          {(user?.role === "ADMIN" || user?.role === "SUPERVISOR") && (
            <button
              onClick={() => onNavigate("admin")}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                currentPage === "admin"
                  ? "bg-amber-500 text-stone-900 font-semibold"
                  : "text-amber-300 hover:bg-amber-500/20"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Panel Administrador
            </button>
          )}
        </nav>

        {/* User profile & Cart triggers */}
        <div className="flex items-center space-x-3">
          {/* Cart button */}
          <button
            onClick={onOpenCart}
            className="relative flex items-center space-x-2 bg-stone-800 hover:bg-stone-700/80 border border-stone-700 text-white px-3.5 py-2 rounded-lg transition-all shadow-sm"
          >
            <div className="relative">
              <ShoppingCart className="w-5 h-5 text-amber-400" />
              {totalCases > 0 && (
                <span className="absolute -top-2 -right-2 bg-amber-500 text-stone-950 text-[11px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                  {totalCases}
                </span>
              )}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-[10px] text-stone-400 uppercase font-semibold leading-none">
                {totalCases} {totalCases === 1 ? "caja" : "cajas"}
              </div>
              <div className="text-xs font-bold text-amber-400 leading-none mt-0.5">
                ${grandTotal.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
              </div>
            </div>
          </button>

          {/* User info / auth */}
          {user ? (
            <div className="flex items-center space-x-2 border-l border-stone-700 pl-3">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-white flex items-center justify-end gap-1">
                  {user.role === "CUSTOMER" ? (
                    user.customerType === "INDUSTRIAL" ? (
                      <Building2 className="w-3 h-3 text-emerald-400 inline" />
                    ) : (
                      <Store className="w-3 h-3 text-amber-400 inline" />
                    )
                  ) : (
                    <ShieldCheck className="w-3 h-3 text-purple-400 inline" />
                  )}
                  {user.name.split(" ")[0]}
                </div>
                <div className="text-[10px] font-semibold text-amber-500">
                  {user.role === "CUSTOMER"
                    ? user.customerType === "INDUSTRIAL"
                      ? "B2B Mayorista"
                      : "Cliente Retail"
                    : user.role}
                </div>
              </div>
              <button
                onClick={logout}
                title="Cerrar sesión"
                className="p-2 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-stone-800 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onNavigate("login")}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs px-3 py-2 rounded-lg transition-colors shadow-sm"
            >
              <UserIcon className="w-4 h-4" />
              <span>Ingresar</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
