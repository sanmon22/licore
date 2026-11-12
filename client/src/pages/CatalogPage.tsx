import React, { useState, useEffect } from "react";
import { Product } from "../types";
import { api } from "../services/api";
import { useAuthStore } from "../store/auth.store";
import { useCartStore } from "../store/cart.store";
import {
  Wine,
  Search,
  Plus,
  Check,
  Building2,
  Tag,
  Boxes,
  Sparkles,
} from "lucide-react";

export const CatalogPage: React.FC = () => {
  const { user } = useAuthStore();
  const { addItem } = useCartStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("TODOS");
  const [searchTerm, setSearchTerm] = useState("");
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [addedAnimation, setAddedAnimation] = useState<Record<number, boolean>>({});

  useEffect(() => {
    async function loadCatalog() {
      setLoading(true);
      setError(null);
      try {
        const data = await api.getProducts(user?.customerType);
        setProducts(data);
        // Initialize default quantities
        const initialQty: Record<number, number> = {};
        data.forEach((p) => {
          initialQty[p.id] = 1;
        });
        setQuantities(initialQty);
      } catch (err: any) {
        setError(err.message || "Error al cargar el catálogo");
      } finally {
        setLoading(false);
      }
    }

    loadCatalog();
  }, [user?.customerType]);

  const categories = ["TODOS", ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === "TODOS" || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleQuantityChange = (productId: number, delta: number, maxStock: number) => {
    setQuantities((prev) => {
      const current = prev[productId] || 1;
      const next = Math.max(1, Math.min(maxStock, current + delta));
      return { ...prev, [productId]: next };
    });
  };

  const handleAddToCart = (product: Product) => {
    const qty = quantities[product.id] || 1;
    addItem(product, qty, user?.customerType);

    // Trigger visual check animation
    setAddedAnimation((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedAnimation((prev) => ({ ...prev, [product.id]: false }));
    }, 1200);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-stone-900 via-stone-800 to-amber-950 p-6 sm:p-10 text-white shadow-xl overflow-hidden border border-stone-800">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-semibold border border-amber-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Distribución Mayorista Directa de Licores</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Catálogo Oficial de Cajas Cerradas
          </h2>
          <p className="text-stone-300 text-sm sm:text-base leading-relaxed">
            Abastecimiento en tiempo real para Bares, Restaurantes y Licoreras. Precios calculados
            por escalas de volumen con despacho directo a tus sedes registradas.
          </p>

          <div className="pt-2 flex flex-wrap gap-4 text-xs font-medium text-stone-300">
            <div className="flex items-center gap-1.5 bg-stone-800/80 px-3 py-1.5 rounded-lg border border-stone-700">
              <Boxes className="w-4 h-4 text-amber-400" />
              <span>Unidad: Cajas selladas</span>
            </div>
            <div className="flex items-center gap-1.5 bg-stone-800/80 px-3 py-1.5 rounded-lg border border-stone-700">
              <Tag className="w-4 h-4 text-amber-400" />
              <span>Descuentos automáticos por cantidad</span>
            </div>
            {user?.customerType === "INDUSTRIAL" && (
              <div className="flex items-center gap-1.5 bg-emerald-950/80 text-emerald-300 px-3 py-1.5 rounded-lg border border-emerald-700/60 font-semibold">
                <Building2 className="w-4 h-4" />
                <span>Cuenta B2B: Precios Industriales Activos</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
        {/* Categories */}
        <div className="flex items-center space-x-1 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                selectedCategory === cat
                  ? "bg-stone-900 text-amber-400 shadow-sm"
                  : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por licor o SKU..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-80 bg-white rounded-2xl animate-pulse border border-stone-200" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-6 rounded-xl text-center">
          <p className="font-semibold">{error}</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-stone-200">
          <Wine className="w-12 h-12 text-stone-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-stone-800">No se encontraron productos</h3>
          <p className="text-xs text-stone-500 mt-1">
            Intenta cambiar los términos de búsqueda o el filtro de categoría.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => {
            const qty = quantities[product.id] || 1;
            const isAdded = addedAnimation[product.id];
            const isOutOfStock = product.stockCases <= 0;

            // Find applicable price for the current quantity selected
            const activePrice =
              product.priceTiers
                .filter((t) => qty >= t.minCases)
                .sort((a, b) => b.minCases - a.minCases)[0]?.unitPrice || product.basePrice;

            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl border border-stone-200 hover:border-amber-400 hover:shadow-lg transition-all duration-200 flex flex-col overflow-hidden group"
              >
                {/* Image & Category Tag */}
                <div className="relative h-44 bg-stone-100 overflow-hidden">
                  <img
                    src={product.imageUrl || "https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=400&q=80"}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    <span className="bg-stone-900/85 backdrop-blur-sm text-amber-400 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md">
                      {product.category}
                    </span>
                  </div>

                  {/* Stock Badge */}
                  <div className="absolute top-3 right-3">
                    {isOutOfStock ? (
                      <span className="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                        Agotado
                      </span>
                    ) : (
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md shadow-sm ${
                          product.stockCases > 10
                            ? "bg-emerald-600 text-white"
                            : "bg-amber-600 text-white"
                        }`}
                      >
                        Stock: {product.stockCases} cajas
                      </span>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-[11px] font-mono text-stone-500 uppercase">
                        SKU: {product.sku}
                      </span>
                      <span className="text-xs text-stone-500 font-medium">
                        {product.bottlesPerCase} botellas/caja
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-stone-900 mt-1 leading-snug">
                      {product.name}
                    </h3>

                    {/* Tiered Pricing Table in Card */}
                    <div className="mt-3 bg-stone-50 rounded-xl p-2.5 border border-stone-100 space-y-1.5">
                      <div className="text-[10px] uppercase font-bold text-stone-500 tracking-wider flex justify-between">
                        <span>Escala de Volumen</span>
                        <span>Precio / Caja</span>
                      </div>
                      {product.priceTiers.map((tier) => (
                        <div
                          key={tier.id}
                          className={`flex justify-between text-xs py-0.5 px-1.5 rounded transition-colors ${
                            qty >= tier.minCases
                              ? "bg-amber-100/70 text-amber-900 font-bold"
                              : "text-stone-600"
                          }`}
                        >
                          <span>Desde {tier.minCases} {tier.minCases === 1 ? "caja" : "cajas"}:</span>
                          <span>${tier.unitPrice.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Buy / Quantity Action */}
                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-3">
                    {/* Stepper */}
                    <div className="flex items-center bg-stone-100 border border-stone-300 rounded-lg p-0.5">
                      <button
                        disabled={isOutOfStock || qty <= 1}
                        onClick={() => handleQuantityChange(product.id, -1, product.stockCases)}
                        className="px-2 py-1 text-stone-600 hover:text-stone-900 disabled:opacity-30 text-xs font-bold"
                      >
                        -
                      </button>
                      <span className="px-2 text-xs font-bold text-stone-900">
                        {qty}
                      </span>
                      <button
                        disabled={isOutOfStock || qty >= product.stockCases}
                        onClick={() => handleQuantityChange(product.id, 1, product.stockCases)}
                        className="px-2 py-1 text-stone-600 hover:text-stone-900 disabled:opacity-30 text-xs font-bold"
                      >
                        +
                      </button>
                    </div>

                    {/* Add Button */}
                    <button
                      disabled={isOutOfStock}
                      onClick={() => handleAddToCart(product)}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-all shadow-sm ${
                        isOutOfStock
                          ? "bg-stone-200 text-stone-400 cursor-not-allowed"
                          : isAdded
                          ? "bg-emerald-600 text-white"
                          : "bg-amber-500 hover:bg-amber-400 text-stone-950"
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>¡Agregado!</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>
                            {isOutOfStock ? "Sin Stock" : `Agregar ($${(activePrice * qty).toFixed(2)})`}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
