import React, { useState, useEffect } from "react";
import { Order, Product, OrderStatus } from "../types";
import { api } from "../services/api";
import {
  ShieldCheck,
  Package,
  Boxes,
  CheckCircle,
  Truck,
  XCircle,
  RefreshCw,
  Search,
} from "lucide-react";

export const AdminDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"orders" | "inventory">("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [stockUpdating, setStockUpdating] = useState<number | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordersData, prodsData] = await Promise.all([
        api.getAllOrders(),
        api.getProducts(),
      ]);
      setOrders(ordersData);
      setProducts(prodsData);
    } catch (err: any) {
      console.error("Error loading admin data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (orderId: number, newStatus: OrderStatus) => {
    if (newStatus === "CANCELLED") {
      const confirmCancel = window.confirm(
        "¿Deseas anular esta orden? El sistema reintegrará automáticamente las cajas de licor al inventario de bodega."
      );
      if (!confirmCancel) return;
    }

    try {
      await api.updateOrderStatus(orderId, newStatus);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Error al actualizar estado");
    }
  };

  const handleUpdateStock = async (productId: number, newStock: number) => {
    setStockUpdating(productId);
    try {
      await api.updateStock(productId, Math.max(0, newStock));
      await loadData();
    } catch (err: any) {
      alert(err.message || "Error al actualizar stock");
    } finally {
      setStockUpdating(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    return statusFilter === "ALL" || o.status === statusFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-900 text-white p-6 rounded-2xl border border-stone-800 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-amber-500" />
            <h2 className="text-xl font-extrabold tracking-tight">Panel de Control Operativo</h2>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            Gestión de despachos, pedidos entrantes y control de inventario de bodega en tiempo real.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex bg-stone-800 p-1 rounded-xl border border-stone-700">
          <button
            onClick={() => setActiveTab("orders")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === "orders" ? "bg-amber-500 text-stone-950" : "text-stone-300 hover:text-white"
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Pedidos ({orders.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("inventory")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === "inventory" ? "bg-amber-500 text-stone-950" : "text-stone-300 hover:text-white"
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Inventario Bodega</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-64 bg-white rounded-2xl animate-pulse border border-stone-200" />
      ) : activeTab === "orders" ? (
        /* Orders Tab */
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {["ALL", "PENDING", "CONFIRMED", "DISPATCHED", "DELIVERED", "CANCELLED"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                  statusFilter === st
                    ? "bg-stone-900 text-amber-400 shadow-sm"
                    : "bg-white text-stone-600 hover:bg-stone-100 border border-stone-200"
                }`}
              >
                {st === "ALL"
                  ? "Todos los Pedidos"
                  : st === "PENDING"
                  ? "Pendientes"
                  : st === "CONFIRMED"
                  ? "Confirmados"
                  : st === "DISPATCHED"
                  ? "En Despacho"
                  : st === "DELIVERED"
                  ? "Entregados"
                  : "Cancelados"}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase font-bold text-[10px] tracking-wider">
                  <tr>
                    <th className="p-4">Código / Fecha</th>
                    <th className="p-4">Cliente / Razón Social</th>
                    <th className="p-4">Sede Despacho</th>
                    <th className="p-4">Total / Cajas</th>
                    <th className="p-4">Estado Actual</th>
                    <th className="p-4 text-right">Acciones de Despacho</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-stone-400">
                        No hay pedidos en este estado.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((ord) => {
                      const totalCases = ord.items.reduce((acc, curr) => acc + curr.casesQuantity, 0);

                      return (
                        <tr key={ord.id} className="hover:bg-stone-50/70 transition-colors">
                          <td className="p-4">
                            <span className="font-mono font-bold text-stone-950 block">{ord.code}</span>
                            <span className="text-[11px] text-stone-400">
                              {new Date(ord.createdAt).toLocaleDateString("es-CO", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="font-bold text-stone-900 block">{ord.customer?.businessName || "Cliente"}</span>
                            <span className="text-[10px] uppercase font-semibold text-amber-700">
                              {ord.customer?.customerType === "INDUSTRIAL" ? "Industrial (B2B)" : "Retail"}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="font-semibold text-stone-800 block">{ord.branch?.name}</span>
                            <span className="text-[11px] text-stone-500">{ord.branch?.address}</span>
                          </td>
                          <td className="p-4">
                            <span className="font-extrabold text-stone-950 block">
                              ${ord.total.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                            </span>
                            <span className="text-[11px] text-stone-500">{totalCases} cajas</span>
                          </td>
                          <td className="p-4">
                            <span
                              className={`text-[10px] font-bold px-2.5 py-1 rounded-full inline-block ${
                                ord.status === "PENDING"
                                  ? "bg-amber-100 text-amber-800"
                                  : ord.status === "CONFIRMED"
                                  ? "bg-blue-100 text-blue-800"
                                  : ord.status === "DISPATCHED"
                                  ? "bg-purple-100 text-purple-800"
                                  : ord.status === "DELIVERED"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-rose-100 text-rose-800"
                              }`}
                            >
                              {ord.status}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-1 whitespace-nowrap">
                            {ord.status === "PENDING" && (
                              <button
                                onClick={() => handleUpdateStatus(ord.id, "CONFIRMED")}
                                className="bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg"
                              >
                                Confirmar
                              </button>
                            )}
                            {ord.status === "CONFIRMED" && (
                              <button
                                onClick={() => handleUpdateStatus(ord.id, "DISPATCHED")}
                                className="bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg"
                              >
                                Despachar
                              </button>
                            )}
                            {ord.status === "DISPATCHED" && (
                              <button
                                onClick={() => handleUpdateStatus(ord.id, "DELIVERED")}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg"
                              >
                                Entregar
                              </button>
                            )}
                            {ord.status !== "CANCELLED" && ord.status !== "DELIVERED" && (
                              <button
                                onClick={() => handleUpdateStatus(ord.id, "CANCELLED")}
                                className="bg-stone-100 hover:bg-rose-100 text-stone-600 hover:text-rose-700 text-[11px] font-bold px-2 py-1 rounded-lg border border-stone-200"
                              >
                                Anular
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Inventory Tab */
        <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-6 shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-stone-900">Control de Existencias en Bodega</h3>
              <p className="text-xs text-stone-500">
                Ajuste directo de inventario por cajas cerradas.
              </p>
            </div>
            <button
              onClick={loadData}
              className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 px-3 py-1.5 rounded-lg border"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Actualizar</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((prod) => (
              <div
                key={prod.id}
                className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-amber-600 font-mono">
                      {prod.sku} • {prod.category}
                    </span>
                    <h4 className="text-xs font-bold text-stone-900 leading-snug mt-0.5">
                      {prod.name}
                    </h4>
                  </div>
                  <span
                    className={`text-xs font-extrabold px-2 py-0.5 rounded-md ${
                      prod.stockCases > 10 ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {prod.stockCases} cajas
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-stone-200/80">
                  <span className="text-xs text-stone-500 font-medium">Reabastecer Cajas:</span>
                  <div className="flex items-center space-x-1.5">
                    <button
                      disabled={stockUpdating === prod.id || prod.stockCases <= 0}
                      onClick={() => handleUpdateStock(prod.id, prod.stockCases - 5)}
                      className="px-2 py-0.5 text-xs font-bold bg-white border border-stone-300 rounded hover:bg-stone-100 text-stone-700 disabled:opacity-30"
                    >
                      -5
                    </button>
                    <button
                      disabled={stockUpdating === prod.id}
                      onClick={() => handleUpdateStock(prod.id, prod.stockCases + 10)}
                      className="px-2 py-0.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 rounded shadow-sm"
                    >
                      +10 cajas
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
