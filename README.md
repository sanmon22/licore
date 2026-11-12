# Distribuidora de Licores — Plataforma E-Commerce B2B & B2C

MVP completo para una distribuidora de licores con flujo de compra tradicional de autoservicio (Storefront), cálculo dinámico de precios escalonados por volumen y tipo de cliente, gestión de múltiples sedes de entrega, descuento atómico de inventario en bodega y panel de control administrativo.

---

## Arquitectura y Tecnologías

El proyecto sigue una **Modular Clean Architecture (Vertical Slice Monolith)** en un **Monorepo**:

* **Backend (`/server`):**
  * **Runtime:** Node.js 26.13.1 (LTS) + Express en TypeScript.
  * **Persistencia:** SQLite nativo de Node.js (`node:sqlite` / `DatabaseSync`) con WAL mode y claves foráneas activas. Cero dependencias binarias de C++ ni necesidad de Visual Studio Build Tools.
  * **ORM:** **Drizzle ORM** (`drizzle-orm/node-sqlite`).
  * **Módulos:**
    * `auth`: Registro, login con JWT y contraseñas hasheadas (`bcryptjs`).
    * `catalog`: Catálogo público, precios por escala y control de stock.
    * `customers`: Clientes y gestión de múltiples sedes de despacho (`Branch`).
    * `orders`: Carrito reactivo, checkout atómico con descuento de inventario y reintegro por anulación.
* **Frontend (`/client`):**
  * **Framework:** React 19 + TypeScript + Vite.
  * **Estilos:** Tailwind CSS + Lucide Icons.
  * **Estado Global:** **Zustand** para el Carrito (`cart.store.ts`) y la Sesión (`auth.store.ts`) con sincronización a `localStorage`.

---

## Puesta en Marcha

### 1. Limpiar e Instalar Dependencias del Backend

Dado que se utiliza el SQLite nativo de Node.js (`node:sqlite`), la instalación es directa y ligera:

```bash
cd C:\_code\licores-crm\server
npm install
```

### 2. Iniciar el Servidor Backend

```bash
npm run dev
```
> El servidor inicializará automáticamente la base de datos SQLite (`server/data.db`) y ejecutará el seed con los productos, precios y usuarios de prueba en `http://localhost:4000`.

### 3. Instalar e Iniciar el Frontend

En otra terminal:
```bash
cd C:\_code\licores-crm\client
npm install
npm run dev
```
> Abre tu navegador en **`http://localhost:3000`**.

---

## Credenciales Demo para Pruebas

En la pantalla de inicio de sesión (`/login`) encontrarás botones de **Acceso Rápido con 1 clic**:

| Perfil | Correo | Contraseña | Rol / Tipo | Funcionalidad Clave |
| :--- | :--- | :--- | :--- | :--- |
| **Bar El Refugio** | `refugio@licores.com` | `password123` | `CUSTOMER` (Industrial B2B) | Ver precios mayoristas, 2 sedes registradas, comprar con escalas de volumen. |
| **La Octava Club** | `laoctava@licores.com` | `password123` | `CUSTOMER` (Industrial B2B) | Discoteca con sede en Parque Lleras, compras de alto volumen. |
| **Licorera Don Mario** | `donmario@licores.com` | `password123` | `CUSTOMER` (Retail) | Cliente con tarifas de lista minoristas. |
| **Admin Central** | `admin@licores.com` | `password123` | `ADMIN` | Panel de despacho de pedidos, cambios de estado y ajuste de stock en bodega. |
