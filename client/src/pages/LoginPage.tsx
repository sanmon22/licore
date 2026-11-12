import React, { useState } from "react";
import { useAuthStore } from "../store/auth.store";
import { useCartStore } from "../store/cart.store";
import { Wine, Building2, Store, ShieldCheck, ArrowRight, AlertCircle } from "lucide-react";

interface LoginPageProps {
  onSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const { login, register } = useAuthStore();
  const { recalculateAll } = useCartStore();

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [customerType, setCustomerType] = useState<"RETAIL" | "INDUSTRIAL">("INDUSTRIAL");
  const [branchAddress, setBranchAddress] = useState("");
  const [branchCity, setBranchCity] = useState("Medellín");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegisterMode) {
        await register({
          email,
          password,
          name,
          businessName,
          taxId,
          customerType,
          branchName: "Sede Principal",
          branchAddress,
          branchCity,
        });
      } else {
        await login(email, password);
      }

      // Recalculate cart prices based on logged in user's tier
      const state = useAuthStore.getState();
      recalculateAll(state.user?.customerType);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Error al autenticarse");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoEmail: string) => {
    setLoading(true);
    setError(null);
    try {
      await login(demoEmail, "password123");
      const state = useAuthStore.getState();
      recalculateAll(state.user?.customerType);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Error al ingresar con cuenta demo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 p-6 sm:p-8 bg-white rounded-3xl border border-stone-200 shadow-xl space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-stone-950 mx-auto shadow-md">
          <Wine className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-extrabold text-stone-900 tracking-tight">
          {isRegisterMode ? "Registro de Cuenta Comercial" : "Acceso al Portal de Licores"}
        </h2>
        <p className="text-xs text-stone-500">
          {isRegisterMode
            ? "Crea tu cuenta de Bar, Restaurante o Particular"
            : "Ingresa para acceder a tus tarifas preferenciales"}
        </p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {isRegisterMode && (
          <>
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Nombre y Apellido:</label>
              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ej. Mateo Gómez"
                className="w-full p-2.5 rounded-lg border border-stone-300 focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Razón Social / Negocio:</label>
              <input
                required
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="ej. Gastrobar Medellín S.A.S."
                className="w-full p-2.5 rounded-lg border border-stone-300 focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">NIT o Cédula:</label>
                <input
                  required
                  type="text"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  placeholder="900.123.456-1"
                  className="w-full p-2.5 rounded-lg border border-stone-300 focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Tipo de Cliente:</label>
                <select
                  value={customerType}
                  onChange={(e) => setCustomerType(e.target.value as any)}
                  className="w-full p-2.5 rounded-lg border border-stone-300 focus:ring-2 focus:ring-amber-500 bg-white"
                >
                  <option value="INDUSTRIAL">Industrial (Bares/Restaurantes)</option>
                  <option value="RETAIL">Retail (Cliente Final)</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Dirección Sede de Despacho:</label>
              <input
                required
                type="text"
                value={branchAddress}
                onChange={(e) => setBranchAddress(e.target.value)}
                placeholder="ej. Carrera 43A # 1-50"
                className="w-full p-2.5 rounded-lg border border-stone-300 focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </>
        )}

        <div>
          <label className="block font-semibold text-stone-700 mb-1">Correo Electrónico:</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ej. compras@bar.com"
            className="w-full p-2.5 rounded-lg border border-stone-300 focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div>
          <label className="block font-semibold text-stone-700 mb-1">Contraseña:</label>
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            className="w-full p-2.5 rounded-lg border border-stone-300 focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <button
          disabled={loading}
          type="submit"
          className="w-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          <span>{isRegisterMode ? "Crear Cuenta y Entrar" : "Iniciar Sesión"}</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <div className="text-center pt-1">
          <button
            type="button"
            onClick={() => setIsRegisterMode(!isRegisterMode)}
            className="text-stone-500 hover:text-amber-600 font-semibold"
          >
            {isRegisterMode
              ? "¿Ya tienes una cuenta? Inicia sesión aquí"
              : "¿Nuevo cliente? Regístrate para comprar por caja"}
          </button>
        </div>
      </form>

      {/* Quick Demo Logins Section */}
      {!isRegisterMode && (
        <div className="pt-4 border-t border-stone-100 space-y-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block text-center">
            Acceso Rápido con Perfiles Demo
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickDemoLogin("refugio@licores.com")}
              className="p-2.5 text-left border border-stone-200 rounded-xl hover:border-amber-500 hover:bg-amber-50/50 transition-all text-xs"
            >
              <div className="flex items-center gap-1.5 font-bold text-stone-900">
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Bar El Refugio</span>
              </div>
              <p className="text-[10px] text-stone-500">Tarifa B2B Industrial</p>
            </button>

            <button
              onClick={() => handleQuickDemoLogin("laoctava@licores.com")}
              className="p-2.5 text-left border border-stone-200 rounded-xl hover:border-amber-500 hover:bg-amber-50/50 transition-all text-xs"
            >
              <div className="flex items-center gap-1.5 font-bold text-stone-900">
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Discoteca La Octava</span>
              </div>
              <p className="text-[10px] text-stone-500">Tarifa B2B Industrial</p>
            </button>

            <button
              onClick={() => handleQuickDemoLogin("donmario@licores.com")}
              className="p-2.5 text-left border border-stone-200 rounded-xl hover:border-amber-500 hover:bg-amber-50/50 transition-all text-xs"
            >
              <div className="flex items-center gap-1.5 font-bold text-stone-900">
                <Store className="w-3.5 h-3.5 text-amber-600" />
                <span>Licorera Don Mario</span>
              </div>
              <p className="text-[10px] text-stone-500">Tarifa Retail Minorista</p>
            </button>

            <button
              onClick={() => handleQuickDemoLogin("admin@licores.com")}
              className="p-2.5 text-left border border-purple-200 bg-purple-50/30 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all text-xs"
            >
              <div className="flex items-center gap-1.5 font-bold text-purple-950">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                <span>Admin Bodega</span>
              </div>
              <p className="text-[10px] text-purple-700">Control de Stock & Pedidos</p>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
