import React, { useState, useEffect } from "react";
import { useCartStore } from "../store/cart.store";
import { useAuthStore } from "../store/auth.store";
import { Branch, PaymentMethod } from "../types";
import { api } from "../services/api";
import {
  MapPin,
  Plus,
  CreditCard,
  Banknote,
  Building,
  CheckCircle2,
  AlertCircle,
  Truck,
  ArrowLeft,
} from "lucide-react";

interface CheckoutPageProps {
  onBackToCatalog: () => void;
  onOrderSuccess: (orderId: number) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  onBackToCatalog,
  onOrderSuccess,
}) => {
  const { user } = useAuthStore();
  const { items, getGrandTotal, getTotalCases, clearCart } = useCartStore();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [contactName, setContactName] = useState(user?.name || "");
  const [contactPhone, setContactPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH_ON_DELIVERY");
  const [notes, setNotes] = useState("");

  const [showNewBranchModal, setShowNewBranchModal] = useState(false);
  const [newBranch, setNewBranch] = useState({ name: "", address: "", city: "Medellín", phone: "" });

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadBranches() {
      if (user?.customerId) {
        try {
          const list = await api.getMyBranches();
          setBranches(list);
          if (list.length > 0) {
            setSelectedBranchId(list[0].id);
          }
        } catch (err: any) {
          console.error("Error loading branches", err);
        }
      }
    }
    loadBranches();
  }, [user?.customerId]);

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await api.addBranch(newBranch);
      setBranches((prev) => [...prev, created]);
      setSelectedBranchId(created.id);
      setShowNewBranchModal(false);
      setNewBranch({ name: "", address: "", city: "Medellín", phone: "" });
    } catch (err: any) {
      alert(err.message || "Error al crear la sede");
    }
  };

  const handleCompleteCheckout = async () => {
    if (!selectedBranchId) {
      setErrorMessage("Por favor selecciona o añade una sede de entrega.");
      return;
    }
    if (!contactName.trim() || !contactPhone.trim()) {
      setErrorMessage("Por favor ingresa el nombre y teléfono del contacto receptor.");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const order = await api.checkout({
        branchId: selectedBranchId,
        contactName,
        contactPhone,
        paymentMethod,
        notes,
        items: items.map((i) => ({
          productId: i.productId,
          casesQuantity: i.casesQuantity,
        })),
      });

      clearCart();
      onOrderSuccess(order.id);
    } catch (err: any) {
      setErrorMessage(err.message || "Error al procesar la orden.");
    } finally {
      setSubmitting(false);
    }
  };

  const grandTotal = getGrandTotal();
  const totalCases = getTotalCases();

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-4">
        <h2 className="text-xl font-bold text-stone-900">Tu carrito no tiene productos</h2>
        <p className="text-sm text-stone-500">Agrega cajas desde el catálogo para continuar con el checkout.</p>
        <button
          onClick={onBackToCatalog}
          className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-4 py-2 rounded-lg text-sm"
        >
          Volver al Catálogo
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top back button */}
      <button
        onClick={onBackToCatalog}
        className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver a la tienda</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-6 shadow-sm">
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-500" />
              <span>1. Sede de Entrega y Despacho</span>
            </h2>

            {/* Branches Selection */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Selecciona la sede registrada donde recibirás las cajas
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {branches.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBranchId(b.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      selectedBranchId === b.id
                        ? "border-amber-500 bg-amber-50/60 ring-2 ring-amber-400/30"
                        : "border-stone-200 hover:border-stone-300 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className={`w-4 h-4 ${selectedBranchId === b.id ? "text-amber-600" : "text-stone-400"}`} />
                        <h4 className="text-xs font-bold text-stone-900">{b.name}</h4>
                      </div>
                      {selectedBranchId === b.id && (
                        <CheckCircle2 className="w-4 h-4 text-amber-600" />
                      )}
                    </div>
                    <p className="text-xs text-stone-600 mt-1 pl-6">{b.address}, {b.city}</p>
                    {b.phone && <p className="text-[11px] text-stone-400 mt-0.5 pl-6">{b.phone}</p>}
                  </div>
                ))}

                {/* Add new branch card */}
                <button
                  type="button"
                  onClick={() => setShowNewBranchModal(true)}
                  className="p-3.5 rounded-xl border border-dashed border-stone-300 hover:border-amber-500 hover:bg-amber-50/40 text-stone-600 hover:text-amber-700 flex items-center justify-center gap-2 text-xs font-bold transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Registrar Nueva Sede</span>
                </button>
              </div>
            </div>

            {/* Contact details */}
            <div className="pt-4 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Nombre de quien recibe en sede:
                </label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="ej. Mateo Gómez (Jefe de compras)"
                  className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Teléfono de contacto de entrega:
                </label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="ej. 3001234567"
                  className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4 shadow-sm">
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-amber-500" />
              <span>2. Condiciones de Pago</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div
                onClick={() => setPaymentMethod("CASH_ON_DELIVERY")}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === "CASH_ON_DELIVERY"
                    ? "border-amber-500 bg-amber-50/60 ring-2 ring-amber-400/30"
                    : "border-stone-200 hover:border-stone-300"
                }`}
              >
                <Banknote className="w-5 h-5 text-amber-600 mb-2" />
                <h4 className="text-xs font-bold text-stone-900">Contraentrega</h4>
                <p className="text-[11px] text-stone-500 mt-0.5">Pago en efectivo al recibir el pedido.</p>
              </div>

              <div
                onClick={() => setPaymentMethod("BANK_TRANSFER")}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === "BANK_TRANSFER"
                    ? "border-amber-500 bg-amber-50/60 ring-2 ring-amber-400/30"
                    : "border-stone-200 hover:border-stone-300"
                }`}
              >
                <Building className="w-5 h-5 text-amber-600 mb-2" />
                <h4 className="text-xs font-bold text-stone-900">Transferencia</h4>
                <p className="text-[11px] text-stone-500 mt-0.5">Bancolombia o transferencia directa.</p>
              </div>

              <div
                onClick={() => setPaymentMethod("CREDIT")}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === "CREDIT"
                    ? "border-amber-500 bg-amber-50/60 ring-2 ring-amber-400/30"
                    : "border-stone-200 hover:border-stone-300"
                }`}
              >
                <CreditCard className="w-5 h-5 text-amber-600 mb-2" />
                <h4 className="text-xs font-bold text-stone-900">Crédito Comercial</h4>
                <p className="text-[11px] text-stone-500 mt-0.5">Facturación a 15/30 días (B2B).</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Instrucciones o notas adicionales para el despacho (opcional):
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ej. Entregar por la puerta trasera del bar antes de las 5:00 PM..."
                className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Right Col: Order Summary */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4 shadow-sm sticky top-24">
            <h3 className="text-base font-bold text-stone-900 border-b border-stone-100 pb-3">
              Resumen del Pedido
            </h3>

            {/* List items */}
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {items.map((i) => (
                <div key={i.productId} className="flex justify-between items-start text-xs">
                  <div>
                    <span className="font-semibold text-stone-900">{i.product.name}</span>
                    <div className="text-[11px] text-stone-500">
                      {i.casesQuantity} {i.casesQuantity === 1 ? "caja" : "cajas"} x ${i.effectiveUnitPrice.toFixed(2)}
                    </div>
                  </div>
                  <span className="font-bold text-stone-900">
                    ${i.subtotal.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-stone-100 space-y-1.5 text-xs text-stone-600">
              <div className="flex justify-between">
                <span>Total Cajas:</span>
                <span className="font-bold text-stone-900">{totalCases} cajas</span>
              </div>
              <div className="flex justify-between">
                <span>Despacho a Sede:</span>
                <span className="font-bold text-emerald-600">Incluido</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-stone-950 pt-2 border-t border-stone-200">
                <span>Total a Pagar:</span>
                <span className="text-amber-600">${grandTotal.toLocaleString("es-CO", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {errorMessage && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-lg text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              disabled={submitting}
              onClick={handleCompleteCheckout}
              className="w-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {submitting ? (
                <span>Procesando y reservando stock...</span>
              ) : (
                <span>Confirmar y Emitir Pedido</span>
              )}
            </button>
            <p className="text-[10px] text-stone-400 text-center">
              Al confirmar, el inventario de cajas se descuenta en tiempo real.
            </p>
          </div>
        </div>
      </div>

      {/* New Branch Modal */}
      {showNewBranchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-stone-200">
            <h3 className="text-base font-bold text-stone-900">Registrar Nueva Sede de Entrega</h3>
            <form onSubmit={handleCreateBranch} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Nombre de la Sede:</label>
                <input
                  required
                  type="text"
                  placeholder="ej. Sede Belén / Terraza"
                  value={newBranch.name}
                  onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Dirección de Despacho:</label>
                <input
                  required
                  type="text"
                  placeholder="ej. Calle 30 # 75-10"
                  value={newBranch.address}
                  onChange={(e) => setNewBranch({ ...newBranch, address: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Ciudad:</label>
                <input
                  required
                  type="text"
                  placeholder="Medellín"
                  value={newBranch.city}
                  onChange={(e) => setNewBranch({ ...newBranch, city: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Teléfono:</label>
                <input
                  type="text"
                  placeholder="Opcional"
                  value={newBranch.phone}
                  onChange={(e) => setNewBranch({ ...newBranch, phone: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewBranchModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 font-bold text-stone-950"
                >
                  Guardar Sede
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
