import React, { useState, useEffect } from "react";
import { Navbar } from "./components/layout/Navbar";
import { CartDrawer } from "./components/cart/CartDrawer";
import { CatalogPage } from "./pages/CatalogPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { MyOrdersPage } from "./pages/MyOrdersPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { useAuthStore } from "./store/auth.store";
import { Wine, ShieldAlert } from "lucide-react";

export function App() {
  const { user, loadSession, isLoading } = useAuthStore();
  const [currentPage, setCurrentPage] = useState<string>("catalog");
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-900 flex flex-col items-center justify-center text-amber-500 space-y-3">
        <Wine className="w-10 h-10 animate-bounce" />
        <span className="text-xs font-bold tracking-wider text-stone-300">
          Cargando portal de licores...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      {/* Navigation */}
      <Navbar
        currentPage={currentPage}
        onNavigate={(page) => setCurrentPage(page)}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Cart Drawer Modal */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onProceedCheckout={() => {
          if (!user) {
            setCurrentPage("login");
          } else {
            setCurrentPage("checkout");
          }
        }}
      />

      {/* Main Page Content */}
      <main className="flex-1">
        {currentPage === "catalog" && <CatalogPage />}

        {currentPage === "checkout" && (
          <CheckoutPage
            onBackToCatalog={() => setCurrentPage("catalog")}
            onOrderSuccess={(_orderId) => {
              setCurrentPage("my-orders");
            }}
          />
        )}

        {currentPage === "my-orders" && (
          user?.role === "CUSTOMER" ? (
            <MyOrdersPage />
          ) : (
            <div className="max-w-md mx-auto py-16 text-center space-y-3">
              <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto" />
              <h3 className="text-base font-bold text-stone-900">Acceso exclusivo para Clientes</h3>
              <p className="text-xs text-stone-500">
                Inicia sesión como cliente (ej. Bar El Refugio) para ver el historial de pedidos de tus sedes.
              </p>
              <button
                onClick={() => setCurrentPage("login")}
                className="bg-amber-500 text-stone-950 px-4 py-2 rounded-lg text-xs font-bold"
              >
                Ir a Iniciar Sesión
              </button>
            </div>
          )
        )}

        {currentPage === "admin" && (
          user?.role === "ADMIN" || user?.role === "SUPERVISOR" ? (
            <AdminDashboardPage />
          ) : (
            <div className="max-w-md mx-auto py-16 text-center space-y-3">
              <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto" />
              <h3 className="text-base font-bold text-stone-900">Acceso Restringido</h3>
              <p className="text-xs text-stone-500">
                Se requieren permisos de Administrador o Supervisor de bodega para acceder a este panel.
              </p>
              <button
                onClick={() => setCurrentPage("login")}
                className="bg-amber-500 text-stone-950 px-4 py-2 rounded-lg text-xs font-bold"
              >
                Cambiar a Cuenta Administrador
              </button>
            </div>
          )
        )}

        {currentPage === "login" && (
          <LoginPage
            onSuccess={() => {
              setCurrentPage("catalog");
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-stone-900 border-t border-stone-800 text-stone-400 py-8 px-4 text-center text-xs space-y-2">
        <div className="flex items-center justify-center space-x-2 text-stone-300 font-bold">
          <Wine className="w-4 h-4 text-amber-500" />
          <span>Distribuidora de Licores S.A.S. — Portal E-Commerce B2B & B2C</span>
        </div>
        <p className="text-[11px] text-stone-500 max-w-md mx-auto">
          El exceso de alcohol es perjudicial para la salud. Ley 30 de 1986. Prohíbase el expendio de bebidas embriagantes a menores de edad. Ley 124 de 1994.
        </p>
      </footer>
    </div>
  );
}
export default App;
