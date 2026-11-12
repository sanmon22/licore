import React from "react";
import { useCartStore } from "../../store/cart.store";
import { useAuthStore } from "../../store/auth.store";
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag, Sparkles } from "lucide-react";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  onProceedCheckout,
}) => {
  const { items, updateQuantity, removeItem, clearCart, getGrandTotal, getTotalCases } =
    useCartStore();
  const { user } = useAuthStore();

  if (!isOpen) return null;

  const grandTotal = getGrandTotal();
  const totalCases = getTotalCases();

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-stone-950/70 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-stone-900 border-l border-stone-800 text-stone-100 flex flex-col shadow-2xl">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-stone-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-bold text-white">Carrito de Compras</h2>
              <span className="text-xs font-semibold bg-stone-800 text-amber-400 px-2 py-0.5 rounded-full">
                {totalCases} {totalCases === 1 ? "caja" : "cajas"}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-white p-1 rounded-md hover:bg-stone-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Customer tier indicator */}
          <div className="bg-stone-800/60 px-6 py-2 text-xs border-b border-stone-800 flex justify-between items-center">
            <span className="text-stone-400">Tarifa aplicada:</span>
            <span className="font-semibold text-amber-400">
              {user?.customerType === "INDUSTRIAL"
                ? "🏭 Precios Mayoristas (Industrial)"
                : "🛒 Precios de Lista (Retail)"}
            </span>
          </div>

          {/* Cart items list */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 rounded-full bg-stone-800 flex items-center justify-center text-stone-500 mb-4">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-base font-semibold text-stone-300">Tu carrito está vacío</h3>
                <p className="text-xs text-stone-400 max-w-xs mt-1">
                  Explora nuestro catálogo y agrega cajas de licor para calcular tus precios mayoristas.
                </p>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.productId}
                  className="bg-stone-800/80 rounded-xl p-3.5 border border-stone-700/60 flex flex-col space-y-2.5"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">
                        {item.product.category} • SKU: {item.product.sku}
                      </span>
                      <h4 className="text-sm font-semibold text-white leading-tight mt-0.5">
                        {item.product.name}
                      </h4>
                      <p className="text-xs text-stone-400">
                        {item.product.bottlesPerCase} botellas por caja
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="text-stone-400 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Volume Tier Badge if applied */}
                  {item.appliedTierMinCases > 1 && (
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-2 py-0.5 rounded-md">
                      <Sparkles className="w-3 h-3" />
                      <span>¡Tarifa con descuento activada (escala de {item.appliedTierMinCases}+ cajas)!</span>
                    </div>
                  )}

                  {/* Controls & Subtotal */}
                  <div className="flex items-center justify-between pt-1 border-t border-stone-700/50">
                    <div className="flex items-center space-x-2 bg-stone-900 border border-stone-700 rounded-lg p-1">
                      <button
                        onClick={() =>
                          updateQuantity(item.productId, item.casesQuantity - 1, user?.customerType)
                        }
                        className="p-1 hover:bg-stone-800 rounded text-stone-300 hover:text-white"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-bold text-white px-2">
                        {item.casesQuantity} {item.casesQuantity === 1 ? "caja" : "cajas"}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.productId, item.casesQuantity + 1, user?.customerType)
                        }
                        className="p-1 hover:bg-stone-800 rounded text-stone-300 hover:text-white"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-stone-400">
                        ${item.effectiveUnitPrice.toFixed(2)} / caja
                      </div>
                      <div className="text-sm font-bold text-amber-400">
                        ${item.subtotal.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="p-4 sm:p-6 border-t border-stone-800 bg-stone-900/90 space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-stone-400">
                  <span>Total de cajas:</span>
                  <span className="font-semibold text-white">{totalCases} cajas cerradas</span>
                </div>
                <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-stone-800">
                  <span>Total a Liquidar:</span>
                  <span className="text-amber-400 text-lg">
                    ${grandTotal.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={clearCart}
                  className="px-3 py-2.5 rounded-lg border border-stone-700 text-xs font-medium text-stone-400 hover:text-rose-400 hover:border-rose-900 transition-colors"
                >
                  Vaciar
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onProceedCheckout();
                  }}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm py-2.5 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors shadow-md"
                >
                  <span>Proceder al Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
