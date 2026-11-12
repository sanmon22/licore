import React, { useState, useEffect } from "react";
import { Order } from "../types";
import { api } from "../services/api";
import { Package, MapPin, Calendar, Clock, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";

export const MyOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

  useEffect(() => {
    async function loadOrders() {
      try {
        const data = await api.getMyOrders();
        setOrders(data);
        if (data.length > 0) {
          setExpandedOrderId(data[0].id);
        }
      } catch (err: any) {
        setError(err.message || "Error al cargar pedidos");
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  const getStatusBadge = (status: Order["status"]) => {
    switch (status) {
      case "PENDING":
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">Pendiente</span>;
      case "CONFIRMED":
        return <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">Confirmado</span>;
      case "DISPATCHED":
        return <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">En Despacho</span>;
      case "DELIVERED":
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">Entregado</span>;
      case "CANCELLED":
        return <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">Cancelado (Stock Reintegrado)</span>;
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-stone-900 tracking-tight">Mis Pedidos</h2>
        <p className="text-xs text-stone-500 mt-1">
          Historial de compras directas por caja cerrada y seguimiento del estado de entrega.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-white rounded-xl animate-pulse border border-stone-200" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-6 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-stone-200 space-y-3">
          <Package className="w-12 h-12 text-stone-400 mx-auto" />
          <h3 className="text-base font-bold text-stone-800">Aún no has realizado pedidos</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Explora el catálogo y aprovecha nuestras tarifas mayoristas para tu bar o negocio.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isExpanded = expandedOrderId === order.id;
            const totalCases = order.items.reduce((acc, curr) => acc + curr.casesQuantity, 0);

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm transition-all"
              >
                {/* Header row */}
                <div
                  onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-stone-50/70"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-stone-950 font-mono">
                        {order.code}
                      </span>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-stone-400" />
                        {new Date(order.createdAt).toLocaleDateString("es-CO", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {order.branch && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-amber-500" />
                          <span>{order.branch.name} ({order.branch.city})</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-stone-100">
                    <div className="text-right">
                      <div className="text-[11px] text-stone-500 font-medium">
                        {totalCases} {totalCases === 1 ? "caja" : "cajas"}
                      </div>
                      <div className="text-base font-extrabold text-stone-950">
                        ${order.total.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    <button className="text-stone-400 p-1 rounded-lg">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="bg-stone-50/80 p-5 border-t border-stone-200 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-stone-600 bg-white p-3.5 rounded-xl border border-stone-200">
                      <div>
                        <span className="font-bold text-stone-900 block mb-0.5">Sede & Despacho:</span>
                        <p>{order.branch?.name} - {order.branch?.address}</p>
                        <p className="text-stone-500 mt-0.5">Receptor: {order.contactName} ({order.contactPhone})</p>
                      </div>
                      <div>
                        <span className="font-bold text-stone-900 block mb-0.5">Condición de Pago:</span>
                        <p className="uppercase font-semibold text-amber-700">
                          {order.paymentMethod === "CASH_ON_DELIVERY"
                            ? "Efectivo Contraentrega"
                            : order.paymentMethod === "BANK_TRANSFER"
                            ? "Transferencia Bancaria"
                            : "Crédito Comercial a 30 días"}
                        </p>
                        {order.notes && <p className="text-stone-500 mt-1 italic">"{order.notes}"</p>}
                      </div>
                    </div>

                    {/* Table of items */}
                    <div className="space-y-2">
                      <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">
                        Contenido del Pedido (Cajas Cerradas)
                      </span>
                      <div className="bg-white rounded-xl border border-stone-200 divide-y divide-stone-100 overflow-hidden text-xs">
                        {order.items.map((item) => (
                          <div key={item.id} className="p-3 flex justify-between items-center">
                            <div>
                              <span className="font-bold text-stone-900">{item.productName}</span>
                              <span className="text-stone-400 ml-2 font-mono text-[10px]">SKU: {item.productSku}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-stone-600">
                                {item.casesQuantity} cajas x ${item.unitPrice.toFixed(2)} =
                              </span>{" "}
                              <span className="font-bold text-stone-900">
                                ${item.subtotal.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
