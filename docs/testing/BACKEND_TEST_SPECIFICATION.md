# ESPECIFICACIÓN MAESTRA DE PRUEBAS DE BACKEND
## FASES 1, 2 Y 3: DOMINIO PURO, INTEGRACIÓN DE SERVICIOS Y CONTRATOS API REST

> **Estado:** Aprobado para Ejecución de Pruebas Automatizadas  
> **Versión:** 2.1.0 (Master Unified Exhaustive Test Specification)  
> **Fecha de Actualización:** 23 de Noviembre de 2026  
> **Módulos Bajo Prueba:**  
> • **Fase 1 (Unit):** [`server/src/modules/orders/domain/order.rules.ts`](file:///C:/_code/licores-crm/server/src/modules/orders/domain/order.rules.ts)  
> • **Fase 2 (Integration):** [`server/src/modules/orders/services/order.service.ts`](file:///C:/_code/licores-crm/server/src/modules/orders/services/order.service.ts), [`server/src/modules/system-config/services/system-config.service.ts`](file:///C:/_code/licores-crm/server/src/modules/system-config/services/system-config.service.ts)  
> • **Fase 3 (API & RBAC):** [`server/src/modules/orders/order.routes.ts`](file:///C:/_code/licores-crm/server/src/modules/orders/order.routes.ts), [`server/src/modules/system-config/system-config.routes.ts`](file:///C:/_code/licores-crm/server/src/modules/system-config/system-config.routes.ts), [`server/src/middlewares/auth.middleware.ts`](file:///C:/_code/licores-crm/server/src/middlewares/auth.middleware.ts), [`server/src/middlewares/role.middleware.ts`](file:///C:/_code/licores-crm/server/src/middlewares/role.middleware.ts)  
> **Suites de Prueba:**  
> • Unit: [`server/tests/unit/order.rules.test.ts`](file:///C:/_code/licores-crm/server/tests/unit/order.rules.test.ts)  
> • Integration: [`server/tests/integration/order.service.test.ts`](file:///C:/_code/licores-crm/server/tests/integration/order.service.test.ts)  
> • API: [`server/tests/api/order.api.test.ts`](file:///C:/_code/licores-crm/server/tests/api/order.api.test.ts)  
> **Especificación Técnica Base:** [`TECHNICAL_SPECIFICATION.md`](file:///C:/_code/licores-crm/TECHNICAL_SPECIFICATION.md)  
> **Glosario Ubicuo:** [`GLOSSARY.md`](file:///C:/_code/licores-crm/GLOSSARY.md)  

---

## 1. Resumen Ejecutivo y Alcance Global (Fases 1, 2 y 3)

### 1.1. Pirámide de Pruebas y Estrategia de Calidad
La arquitectura de `licores-crm` implementa una estrategia de pruebas por capas estructurada según los principios de **Módulos Profundos (Deep Modules)** y **Diseño Dirigido por el Dominio (DDD)**. La suite desacopla las responsabilidades en tres fases consecutivas y complementarias:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PIRÁMIDE DE PRUEBAS DE BACKEND                  │
└────────────────────────────────────────────────────────────────────────┘
                   / \
                  /   \     FASE 3: Contratos API HTTP & Seguridad RBAC
                 / API \    - Supertest contra Express App & Routers
                /───────\   - Middleware Auth (JWT) & Role Middleware (401/403/201/200)
               /         \
              /  INTEGRA- \  FASE 2: Servicios de Negocio & Persistencia
             /    CIÓN     \ - Transacciones atómicas, descuento de inventario
            /───────────────\- Mocking de NotificationPort & Base data.test.db
           /                 \
          /      UNIDAD       \ FASE 1: Dominio Puro (`order.rules.ts`)
         /     (DOMINIO)       \- Cero I/O, sin BD, funciones síncronas puras
        /───────────────────────\- Tiempo de ejecución < 500ms
```

### 1.2. Alcance Detallado por Fase

| Fase | Alcance Arquitectónico | Dependencias Externas / I/O | Ubicación de Suites |
| :--- | :--- | :--- | :--- |
| **Fase 1: Dominio Puro** | Lógica matemática, cálculo de fletes, resolución de precios por volumen, generación de códigos Crockford Base32. | **Cero I/O**. Objetos en memoria pura sin persistencia. | `server/tests/unit/order.rules.test.ts` |
| **Fase 2: Integración** | Orquestación transaccional (`OrderService`, `SystemConfigService`), descuento/reintegro de stock en bodega, snapshots financieros, protocolo de reprogramación express y mock del seam de notificaciones. | Base de datos SQLite aislada (`server/data.test.db`) mediante `node:sqlite`. Seam de notificación mockeado. | `server/tests/integration/order.service.test.ts` |
| **Fase 3: API & Seguridad** | Enrutadores Express, traducción HTTP (Zod schemas), control de acceso basado en roles (`CUSTOMER`, `SUPERVISOR`, `ADMIN`), tokens JWT (`authMiddleware`, `optionalAuthMiddleware`). | Servidor Express en memoria (Supertest), base de datos de test (`data.test.db`). | `server/tests/api/order.api.test.ts` |

### 1.3. Asignación de Responsabilidades: Muestra Prioritaria (Agente 2) vs. Especificación Completa (Usuario)
Para garantizar una ejecución eficiente y modular del plan de automatización:
* **Agente 2 (Test Implementer):** Es responsable de codificar e implementar **2 escenarios prioritarios de muestra por fase** (6 escenarios en total), asegurando que la infraestructura, utilidades de prueba, mocks y fixtures queden completamente funcionales y con 100% de éxito en Vitest.
* **Usuario / Equipo de Desarrollo:** Cuenta con la especificación exhaustiva, rigurosa y formalizada de **todos los escenarios complementarios** en este documento para extender la suite de pruebas a demanda con total coherencia arquitectónica.

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│              DISTRIBUCIÓN DE IMPLEMENTACIÓN (MUESTRA PRIORITARIA vs COMPLEMENTARIOS)     │
└─────────────────────────────────────────────────────────────────────────────────────────┘
 • FASE 1 (Unit - order.rules.ts):
   [AGENTE 2] SCN-PRIO-U1: Validación de MOQ Dinámico (STANDARD vs EXPRESS_EMERGENCY).
   [AGENTE 2] SCN-PRIO-U2: Resolución de Precios Unitarios Escalonados (RETAIL vs INDUSTRIAL).
   [USUARIO]  SCN-MOQ-01..09, SCN-SHP-01..04, SCN-PRC-01..07, SCN-COD-01..02, SCN-PAY-01..05.

 • FASE 2 (Integration - OrderService & SystemConfigService):
   [AGENTE 2] SCN-PRIO-I1: Checkout Transaccional con Descuento Atómico de Stock e Inserción de Items.
   [AGENTE 2] SCN-PRIO-I2: Reprogramación Prioritaria Express con Descuento -$10.000 COP y Notificación.
   [USUARIO]  SCN-INT-CHK-02..05, SCN-INT-CAN-01..03, SCN-INT-RES-02..04, SCN-INT-CRT-01..03, SCN-INT-CFG-01..05.

 • FASE 3 (API HTTP & Seguridad RBAC):
   [AGENTE 2] SCN-PRIO-A1: Matriz de Autenticación y Autorización en POST /checkout (401, 403, 201).
   [AGENTE 2] SCN-PRIO-A2: Control RBAC en POST /orders/:id/reschedule-express (403 CUSTOMER vs 200 ADMIN/SUPERVISOR).
   [USUARIO]  SCN-API-CRT-01..04, SCN-API-CHK-03..05, SCN-API-RES-03..05, SCN-API-CFG-01..05.
```

### 1.4. Estructura de Directorios para Pruebas (`server/tests/`)

```
server/
├── src/                               # Código de producción (Vertical Slices)
│   ├── db/                            # Esquemas y conexión Drizzle ORM
│   ├── middlewares/                   # Guardrails transversales (authMiddleware, requireRoles)
│   └── modules/
│       ├── orders/
│       │   ├── domain/                # order.rules.ts, order.types.ts
│       │   ├── services/              # order.service.ts
│       │   ├── controllers/           # order.controller.ts
│       │   └── order.routes.ts
│       └── system-config/
│           ├── services/              # system-config.service.ts
│           └── system-config.routes.ts
└── tests/                             # SUITE CENTRALIZADA DE PRUEBAS
    ├── unit/                          ◄── FASE 1: Dominio Puro en Memoria
    │   └── order.rules.test.ts        ◄── Implementado (Agente 2 & Base)
    ├── integration/                   ◄── FASE 2: Servicios & Persistencia data.test.db
    │   └── order.service.test.ts      ◄── Implementación Agente 2 (Muestra Prioritaria)
    ├── api/                           ◄── FASE 3: Endpoints HTTP & Guardrails RBAC
    │   └── order.api.test.ts       ◄── Implementación Agente 2 (Muestra Prioritaria)
    └── e2e/                           ◄── FASE 4: Flujos Transaccionales Completos (Futuro)
        └── checkout-flow.test.ts
```

---

## 2. Invariantes de Negocio (Reglas Inviolables)

El sistema impone cinco invariantes fundamentales que ninguna capa (dominio, servicio, controlador, UI) puede violar:

### Invariante 1: Indivisibilidad en Cajas Cerradas y No Negatividad
* **Unidad Mínima de Venta:** Exclusivamente **Cajas Cerradas (`Case`)**. No existe venta de botellas individuales ni fracciones decimales.
* **Dominio Numérico:** Todas las variables de volumen (`casesQuantity`, `totalCases`, `minCases`, `stockCases`) pertenecen a enteros estrictamente positivos ($\mathbb{Z}^+ > 0$).
* **Moneda Base:** Pesos Colombianos (**COP**). Valores monetarios $\ge 0$.

### Invariante 2: Formato Canónico e Inconfundible del Código de Orden (`Order.code`)
* **Longitud Estricta:** Exactamente **13 caracteres** alfanuméricos en mayúscula.
* **Estructura:** `ORD-[YY][MM]-[XXXX]`
  * `ORD-`: Prefijo fijo de 4 caracteres.
  * `[YY][MM]`: 4 dígitos de año y mes cronológico (ej. `2611` para noviembre de 2026).
  * `-`: Guion separador (1 carácter).
  * `[XXXX]`: 4 caracteres generados con **Crockford Base32 restringido** (`23456789ABCDEFGHJKMNPQRSTVWXYZ`).
* **Exclusión de Ambigüedad:** Exclusión estricta de `0`, `O`, `1`, `I`, `L`, `U` y minúsculas.
* **Regex:** `^ORD-\d{2}(0[1-9]|1[0-2])-[23456789ABCDEFGHJKMNPQRSTVWXYZ]{4}$`

### Invariante 3: Segmentación Estricta de Precios (RETAIL vs INDUSTRIAL) y Snapshotting Financiero
* **Aislamiento de Tarifas:** Clientes `RETAIL` jamás acceden a tarifas `INDUSTRIAL`.
* **Escalonamiento Dinámico:** Para `INDUSTRIAL`, se activa el escalón más alto cumplido:
  $$\text{Tarifa Aplicable} = \max_{\text{minCases} \le \text{casesQuantity}} \{ \text{ProductPrice}(\text{customerType}, \text{minCases}) \}$$
* **Snapshotting Financiero Inmutable:** Una vez confirmada la compra, `OrderItem.unitPrice` y `OrderItem.subtotal` se congelan en la base de datos de manera inmutable frente a cambios posteriores del catálogo.

### Invariante 4: Dualidad Logística y Protocolo de Reprogramación Prioritaria
* **`STANDARD`:** MOQ $\ge 3$ cajas (`logistics_min_cases_standard`), flete **$0 COP**.
* **`EXPRESS_EMERGENCY`:** MOQ $\ge 1$ caja (`logistics_min_cases_express`), flete **$35.000 COP** (`logistics_express_fee_cop`).
* **Protocolo de Reprogramación:** Ante saturación nocturna, un `ADMIN` o `SUPERVISOR` puede reprogramar un pedido express a primera hora del día siguiente aplicando un **descuento compensatorio de $10.000 COP** (`logistics_express_reschedule_discount_cop`), manteniendo la orden en estado `PENDING`, agregando notas prioritarias e informando al cliente. Se previene estrictamente la doble reprogramación.

### Invariante 5: Integridad Transaccional de Inventario y Control de Pasarelas
* **En Checkout:** El stock requerido se verifica y debita de `Product.stockCases` de forma atómica. Si algún ítem no posee stock suficiente, toda la orden aborta sin efectos secundarios.
* **En Cancelación:** Si la orden está en estado `PENDING` y se cancela, el stock reservado se reintegra íntegramente a `Product.stockCases`.
* **Pasarelas de Pago:** El checkout rechaza la orden si el método seleccionado se encuentra desactivado en `SystemConfig`.

---

## 3. Precondiciones y Postcondiciones del Sistema

### 3.1. Costura de Dominio (Fase 1: `order.rules.ts`)
* `validateMinimumOrderQuantity(totalCases, deliveryType, minCasesStandard?, minCasesExpress?)`: Lanza `Error` si no alcanza el umbral de cajas para la modalidad.
* `calculateShippingFee(deliveryType, expressFeeCop?)`: Retorna `0` para `STANDARD` o `expressFeeCop` para `EXPRESS_EMERGENCY`.
* `resolveTieredUnitPrice(prices, customerType, casesQuantity)`: Resuelve tarifa unitaria o lanza error si no existen precios para el tipo de cliente.
* `generateOrderCode(date?)`: Genera string de 13 caracteres con patrón Crockford Base32.
* `getPaymentMethodConfigKey(paymentMethod)`: Retorna la clave de configuración asociada.
* `validatePaymentMethodActive(paymentMethod, isEnabled)`: Lanza error si `isEnabled === false`.

### 3.2. Costura de Servicios e Integración (Fase 2: `order.service.ts` y `system-config.service.ts`)

#### A. `OrderService.checkout(customerId, customerType, input)`
* **Precondiciones:**
  * `customerId` existe y pertenece a un cliente válido en `customers`.
  * `input.deliveryPlaceId` pertenece al `customerId`.
  * `input.items` tiene al menos 1 ítem con `productId` existente y `casesQuantity >= 1`.
  * `input.paymentMethod` está activo en `SystemConfig`.
  * `Product.stockCases >= item.casesQuantity` para todos los productos solicitados.
* **Postcondiciones (Éxito):**
  * Se inserta registro en tabla `orders` con estado `"PENDING"` y código único `ORD-YYMM-XXXX`.
  * Se insertan registros en `order_items` con `unitPrice` congelado al momento de compra.
  * Se descuenta `casesQuantity` de `Product.stockCases` para cada ítem.
* **Postcondiciones (Fallo):**
  * Lanza error y revierte operaciones si hay stock insuficiente, método inactivo o branch inválido.

#### B. `OrderService.cancelOrder(orderId)`
* **Precondiciones:**
  * `orderId` existe en tabla `orders`.
  * `order.status !== "CANCELLED"`.
* **Postcondiciones (Éxito):**
  * `order.status` muta a `"CANCELLED"`.
  * Para cada `OrderItem`, se incrementa `Product.stockCases` con `casesQuantity`.
  * Se invoca `notificationPort.notifyOrderCancelled`.

#### C. `OrderService.rescheduleExpressOrder(orderId, adminReason?)`
* **Precondiciones:**
  * `orderId` existe y tiene `deliveryType === "EXPRESS_EMERGENCY"`.
  * `order.status === "PENDING"`.
  * `order.notes` NO contiene `"[REPROGRAMADO PRIORITARIO]"`.
* **Postcondiciones (Éxito):**
  * `order.shippingFee` se reduce en $10.000 COP (mínimo 0).
  * `order.total` se reduce en $10.000 COP (mínimo 0).
  * `order.notes` se actualiza con prefijo `"[REPROGRAMADO PRIORITARIO]"`.
  * Se invoca `notificationPort.notifyExpressRescheduled`.

#### D. `SystemConfigService.getNumber(key, defaultValue)` y `getBoolean(key, defaultValue)`
* **Precondiciones:** Clave `key` en string.
* **Postcondiciones:** Retorna el valor parseado tipado o `defaultValue` si la clave no existe en BD.

#### E. `SystemConfigService.update(key, value)`
* **Precondiciones:** `key` existe en `system_config`. `value` es coherente con `type` (`NUMBER` o `BOOLEAN`).
* **Postcondiciones:** Actualiza el valor en BD con timestamp `updatedAt` actual y retorna el registro actualizado.

### 3.3. Costura de Contratos API HTTP & Seguridad (Fase 3: Express Routes)
* `POST /api/v1/orders/calculate-cart`:
  * Permite acceso público o anónimo (`optionalAuthMiddleware`).
  * Si viene autenticado, usa `req.user.customerType`; de lo contrario usa `req.body.customerType || "RETAIL"`.
* `POST /api/v1/orders/checkout`:
  * Requiere `authMiddleware` + `requireRoles("CUSTOMER")`.
  * Retorna `401` si no hay token Bearer válido.
  * Retorna `403` si el usuario no tiene rol `CUSTOMER`.
  * Retorna `201` con la orden creada si es exitoso.
* `POST /api/v1/orders/:id/reschedule-express`:
  * Requiere `authMiddleware` + `requireRoles("ADMIN", "SUPERVISOR")`.
  * Retorna `403` para usuarios `CUSTOMER`. Retorna `200` para `ADMIN` y `SUPERVISOR`.
* `GET /api/v1/config` y `PUT /api/v1/config/:key`:
  * `GET`: Requiere `ADMIN` o `SUPERVISOR` (200 OK). Deniega a `CUSTOMER` (403 Forbidden).
  * `PUT`: Requiere exclusivamente `ADMIN` (200 OK). Deniega a `SUPERVISOR` y `CUSTOMER` (403 Forbidden).

---

## 4. Contrato de Mensajes de Error y Mapeo de Códigos HTTP

| Código Interno | Capa | Disparador de la Falla | Mensaje Canónico Emitido | Código HTTP |
| :--- | :--- | :--- | :--- | :--- |
| `ERR_MOQ_STANDARD` | Dominio | `STANDARD` y `totalCases < minCasesStandard` | `Pedido mínimo no alcanzado: El despacho estándar requiere al menos {minStd} cajas (solicitadas: {solic}).` | `400 Bad Request` |
| `ERR_MOQ_EXPRESS` | Dominio | `EXPRESS_EMERGENCY` y `totalCases < minCasesExpress` | `Pedido mínimo no alcanzado: El despacho express nocturno requiere al menos {minExp} caja (solicitadas: {solic}).` | `400 Bad Request` |
| `ERR_NO_PRICES_SEGMENT` | Dominio | Producto sin precios para `customerType` | `No prices configured for customer type {customerType}` | `422 Unprocessable` |
| `ERR_PAYMENT_INACTIVE` | Dominio | Bandera de pasarela en `false` | `El método de pago '{friendlyName}' se encuentra temporalmente inactivo.` | `400 Bad Request` |
| `ERR_INSUFFICIENT_STOCK` | Servicio | `stockCases < casesQuantity` | `Insufficient stock for "{prodName}". Requested: {qty} cases, Available: {stock} cases.` | `400 Bad Request` |
| `ERR_INVALID_BRANCH` | Servicio | DeliveryPlace no pertenece al cliente | `Invalid delivery branch selected for this customer` | `400 Bad Request` |
| `ERR_ALREADY_CANCELLED` | Servicio | Orden ya cancelada | `Order is already cancelled` | `400 Bad Request` |
| `ERR_ALREADY_RESCHEDULED` | Servicio | Exceso de reprogramación express | `This express order has already been rescheduled` | `400 Bad Request` |
| `ERR_NOT_EXPRESS` | Servicio | Reprogramar orden estándar | `Only orders with EXPRESS_EMERGENCY delivery type can be rescheduled under this protocol` | `400 Bad Request` |
| `ERR_NOT_PENDING` | Servicio | Reprogramar orden no PENDING | `Cannot reschedule order in status '{status}'. Only PENDING orders can be rescheduled.` | `400 Bad Request` |
| `ERR_AUTH_REQUIRED` | HTTP | Sin cabecera `Authorization: Bearer <token>` | `Authentication token required` | `401 Unauthorized` |
| `ERR_FORBIDDEN_ROLE` | HTTP | Token válido pero rol no autorizado | `Forbidden: insufficient permissions` | `403 Forbidden` |
| `ERR_NOT_OWN_ORDER` | HTTP | Customer intentando ver orden ajena | `Forbidden: Not your order` | `403 Forbidden` |

---

## 5. Criterios de Aceptación en Formato Gherkin (Exhaustivos)

### 5.1. FASE 1: Reglas de Dominio Puro (`server/tests/unit/order.rules.test.ts`)

#### Característica 1: Validación de Cantidad Mínima de Pedido (MOQ Dinámico)
```gherkin
Característica: Validación de Cantidad Mínima de Pedido (MOQ)
  Como motor de reglas de checkout
  Quiero verificar que el pedido cumpla con el umbral mínimo de cajas según la modalidad
  Para optimizar los costos de ruta y despacho

  # [MUESTRA PRIORITARIA - AGENTE 2]
  Escenario: SCN-PRIO-U1 / SCN-MOQ-01: Pedido estándar cumple exactamente el MOQ por defecto
    Dado que el cliente selecciona modalidad de despacho "STANDARD"
    Y los parámetros del sistema definen un pedido mínimo estándar de 3 cajas
    Cuando el cliente agrega un total de 3 cajas al pedido
    Entonces la validación de MOQ debe ser exitosa sin lanzar errores

  Escenario: SCN-MOQ-02: Pedido estándar supera holgadamente el MOQ por defecto
    Dado que el cliente selecciona modalidad de despacho "STANDARD"
    Y los parámetros del sistema definen un pedido mínimo estándar de 3 cajas
    Cuando el cliente agrega un total de 12 cajas al pedido
    Entonces la validación de MOQ debe ser exitosa sin lanzar errores

  Escenario: SCN-MOQ-03: Pedido estándar no alcanza el MOQ por defecto
    Dado que el cliente selecciona modalidad de despacho "STANDARD"
    Y los parámetros del sistema definen un pedido mínimo estándar de 3 cajas
    Cuando el cliente intenta enviar un pedido con 2 cajas
    Entonces el sistema debe rechazar el pedido con el error:
      """
      Pedido mínimo no alcanzado: El despacho estándar requiere al menos 3 cajas (solicitadas: 2).
      """

  Escenario: SCN-MOQ-04: Pedido estándar con cero cajas
    Dado que el cliente selecciona modalidad de despacho "STANDARD"
    Cuando el cliente intenta enviar un pedido con 0 cajas
    Entonces el sistema debe rechazar el pedido con el error:
      """
      Pedido mínimo no alcanzado: El despacho estándar requiere al menos 3 cajas (solicitadas: 0).
      """

  # [MUESTRA PRIORITARIA - AGENTE 2]
  Escenario: SCN-PRIO-U1 / SCN-MOQ-05: Pedido express nocturno cumple el MOQ por defecto
    Dado que el cliente selecciona modalidad de despacho "EXPRESS_EMERGENCY"
    Y los parámetros del sistema definen un pedido mínimo express de 1 caja
    Cuando el cliente agrega 1 caja de emergencia al pedido
    Entonces la validación de MOQ debe ser exitosa sin lanzar errores

  Escenario: SCN-MOQ-06: Pedido express nocturno con volumen mayor
    Dado que el cliente selecciona modalidad de despacho "EXPRESS_EMERGENCY"
    Cuando el cliente agrega 4 cajas de emergencia al pedido
    Entonces la validación de MOQ debe ser exitosa sin lanzar errores

  Escenario: SCN-MOQ-07: Pedido express nocturno con cero cajas
    Dado que el cliente selecciona modalidad de despacho "EXPRESS_EMERGENCY"
    Y los parámetros del sistema definen un pedido mínimo express de 1 caja
    Cuando el cliente intenta enviar un pedido con 0 cajas
    Entonces el sistema debe rechazar el pedido con el error:
      """
      Pedido mínimo no alcanzado: El despacho express nocturno requiere al menos 1 caja (solicitadas: 0).
      """

  Escenario: SCN-MOQ-08: Parámetro dinámico de SystemConfig eleva el MOQ estándar a 5 cajas
    Dado que el administrador configuró "logistics_min_cases_standard" en 5
    Y el cliente selecciona modalidad "STANDARD"
    Cuando el cliente agrega 4 cajas al pedido
    Entonces el sistema debe rechazar el pedido indicando que se requieren 5 cajas
    Pero si el cliente agrega 5 cajas la validación debe ser aprobada

  Escenario: SCN-MOQ-09: Parámetro dinámico de SystemConfig eleva el MOQ express a 2 cajas
    Dado que el administrador configuró "logistics_min_cases_express" en 2
    Y el cliente selecciona modalidad "EXPRESS_EMERGENCY"
    Cuando el cliente agrega 1 caja al pedido
    Entonces el sistema debe rechazar el pedido indicando que se requieren 2 caja
    Pero si el cliente agrega 2 cajas la validación debe ser aprobada
```

#### Característica 2: Cálculo de Fletes para Logística Dual
```gherkin
Característica: Cálculo de Fletes para Logística Dual
  Como motor de tarifación financiera
  Quiero calcular el costo de envío exacto según la urgencia del despacho
  Para cobrar el recargo operativo adecuado o bonificar el envío estándar

  Escenario: SCN-SHP-01: Flete gratuito para despacho estándar por defecto
    Dado que el pedido tiene modalidad "STANDARD"
    Cuando se calcula el costo de flete
    Entonces el valor del flete debe ser exactamente 0 COP

  Escenario: SCN-SHP-02: Flete estándar permanece en cero con tarifa express configurada
    Dado que el pedido tiene modalidad "STANDARD"
    Y la tarifa express configurada es de 45000 COP
    Cuando se calcula el costo de flete
    Entonces el valor del flete debe mantenerse en 0 COP

  Escenario: SCN-SHP-03: Recargo fijo para despacho express nocturno por defecto
    Dado que el pedido tiene modalidad "EXPRESS_EMERGENCY"
    Cuando se calcula el costo de flete sin especificar recargo personalizado
    Entonces el valor del flete retornado debe ser de 35000 COP

  Escenario: SCN-SHP-04: Recargo dinámico para despacho express nocturno desde SystemConfig
    Dado que el pedido tiene modalidad "EXPRESS_EMERGENCY"
    Y el valor dinámico de "logistics_express_fee_cop" es 42000 COP
    Cuando se calcula el costo de flete pasando 42000 COP
    Entonces el valor del flete retornado debe ser de 42000 COP
```

#### Característica 3: Resolución de Precios Unitarios Escalonados (Tiered Pricing) y Aislamiento de Segmentos
```gherkin
Característica: Resolución de Precios Unitarios Escalonados por Volumen
  Como motor de catálogo y fijación de precios
  Quiero aplicar la tarifa por caja según el tipo de cliente y el volumen adquirido
  Para recompensar a clientes mayoristas y mantener la integridad comercial

  # [MUESTRA PRIORITARIA - AGENTE 2]
  Escenario: SCN-PRIO-U2 / SCN-PRC-01: Cliente RETAIL comprando volumen bajo
    Dado un producto con precio RETAIL de 150000 COP (minCases: 1)
    Y precios INDUSTRIAL escalonados a menor costo
    Cuando un cliente tipo "RETAIL" compra 1 caja
    Entonces el precio unitario liquidado debe ser 150000 COP
    Y el escalón aplicado debe ser minCases 1

  Escenario: SCN-PRC-02: Cliente RETAIL comprando gran volumen no accede a tarifas INDUSTRIAL
    Dado un producto con precio RETAIL de 150000 COP (minCases: 1)
    Y un escalón INDUSTRIAL de 110000 COP para más de 10 cajas
    Cuando un cliente tipo "RETAIL" compra 20 cajas
    Entonces el precio unitario liquidado debe permanecer en 150000 COP
    Y en ningún caso debe descender a 110000 COP

  Escenario: SCN-PRC-03: Cliente INDUSTRIAL comprando en Escalón 1 (Volumen Base)
    Dado los siguientes escalones para cliente INDUSTRIAL:
      | minCases | unitPrice (COP) |
      | 1        | 130000          |
      | 5        | 120000          |
      | 10       | 110000          |
    Cuando un cliente tipo "INDUSTRIAL" compra 3 cajas
    Entonces el precio unitario liquidado debe ser 130000 COP
    Y el escalón aplicado debe ser minCases 1

  # [MUESTRA PRIORITARIA - AGENTE 2]
  Escenario: SCN-PRIO-U2 / SCN-PRC-04: Cliente INDUSTRIAL comprando en Escalón 2 (Umbral Intermedio)
    Dado los mismos escalones para cliente INDUSTRIAL
    Cuando un cliente tipo "INDUSTRIAL" compra exactamente 5 cajas
    Entonces el precio unitario liquidado debe ser 120000 COP
    Y el escalón aplicado debe ser minCases 5

  Escenario: SCN-PRC-05: Cliente INDUSTRIAL comprando en Escalón 2 (Rango Intermedio)
    Dado los mismos escalones para cliente INDUSTRIAL
    Cuando un cliente tipo "INDUSTRIAL" compra 8 cajas
    Entonces el precio unitario liquidado debe ser 120000 COP
    Y el escalón aplicado debe ser minCases 5

  Escenario: SCN-PRC-06: Cliente INDUSTRIAL comprando en Escalón 3 (Volumen Máximo)
    Dado los mismos escalones para cliente INDUSTRIAL
    Cuando un cliente tipo "INDUSTRIAL" compra 15 cajas
    Entonces el precio unitario liquidado debe ser 110000 COP
    Y el escalón aplicado debe ser minCases 10

  Escenario: SCN-PRC-07: Intento de cotizar producto sin matriz de precios para el segmento
    Dado un producto que únicamente cuenta con tarifas para clientes "RETAIL"
    Cuando se solicita resolver el precio unitario para un cliente "INDUSTRIAL" con 2 cajas
    Entonces el sistema debe fallar inmediatamente con el error:
      """
      No prices configured for customer type INDUSTRIAL
      """
```

#### Característica 4: Generación y Validación de Código Crockford Base32
```gherkin
Característica: Generación Canónica de Códigos de Pedido
  Como sistema transaccional
  Quiero generar identificadores de pedido concisos, cronológicos y legibles
  Para que clientes y operarios puedan dictarlos al teléfono sin confusiones

  Escenario: SCN-COD-01: Código generado cumple longitud exacta y prefijo cronológico
    Dado que la orden se genera el 23 de Noviembre de 2026
    Cuando se invoca la función de generación de código con esa fecha
    Entonces el código retornado debe tener exactamente 13 caracteres de longitud
    Y debe comenzar con el prefijo "ORD-2611-"
    Y debe finalizar con un bloque aleatorio de 4 caracteres alfanuméricos válidos

  Escenario: SCN-COD-02: Ausencia total de caracteres ambiguos (I, L, O, U, 0, 1)
    Dado un proceso de generación masiva de 100 códigos consecutivos
    Cuando se analiza la porción aleatoria de cada código generado
    Entonces ninguno de los códigos debe contener los caracteres "I", "L", "O", "U" (mayúsculas o minúsculas)
    Y ninguno de los códigos debe contener dígitos ambiguos "0" o "1"
    Y cada código debe coincidir fielmente con el patrón regex:
      """
      ^ORD-\d{2}(0[1-9]|1[0-2])-[23456789ABCDEFGHJKMNPQRSTVWXYZ]{4}$
      """
```

#### Característica 5: Validación de Pasarelas de Pago Activas contra SystemConfig
```gherkin
Característica: Validación de Pasarelas de Pago Habilitadas
  Como pasarela de validación comercial
  Quiero comprobar que el método de pago elegido esté encendido en la configuración
  Para prevenir pedidos con métodos suspendidos por mantenimiento o liquidez

  Escenario: SCN-PAY-01: Mapeo correcto de métodos a claves de configuración
    Cuando se solicita la clave de configuración para los siguientes métodos:
      | paymentMethod      | expectedConfigKey                 |
      | "CASH_ON_DELIVERY" | "payment_cod_enabled"             |
      | "BANK_TRANSFER"    | "payment_bank_transfer_enabled"   |
      | "CREDIT_CARD"      | "payment_credit_card_enabled"     |
      | "CREDIT"           | "payment_credit_card_enabled"     |
    Entonces la clave devuelta debe coincidir exactamente con el valor esperado

  Escenario: SCN-PAY-02: Aprobación de métodos de pago activos
    Dado que el método "CASH_ON_DELIVERY" tiene bandera de habilitación en true
    Cuando se valida el método de pago
    Entonces la validación no debe emitir ninguna excepción

  Escenario: SCN-PAY-03: Rechazo de método Contra Entrega temporalmente inactivo
    Dado que el método "CASH_ON_DELIVERY" se encuentra deshabilitado (false)
    Cuando se valida el método de pago
    Entonces el sistema debe abortar con el mensaje:
      """
      El método de pago 'Contra Entrega (Efectivo/Datáfono)' se encuentra temporalmente inactivo.
      """

  Escenario: SCN-PAY-04: Rechazo de método Transferencia Bancaria inactivo
    Dado que el método "BANK_TRANSFER" se encuentra deshabilitado (false)
    Cuando se valida el método de pago
    Entonces el sistema debe abortar con el mensaje:
      """
      El método de pago 'Transferencia Bancaria' se encuentra temporalmente inactivo.
      """

  Escenario: SCN-PAY-05: Rechazo de método no reconocido por el sistema
    Dado un método de pago desconocido "BITCOIN_LIGHTNING"
    Cuando se intenta obtener su clave de configuración
    Entonces el sistema debe arrojar un error indicando "Método de pago no reconocido: BITCOIN_LIGHTNING"
```

---

### 5.2. FASE 2: Servicios e Integración con Base de Datos (`server/tests/integration/`)

#### Característica 6: `OrderService.checkout` - Orquestación Transaccional de Pedidos
```gherkin
Característica: Orquestación de Checkout y Transaccionalidad de Inventario
  Como servicio central de pedidos (OrderService)
  Quiero procesar la compra de un cliente verificando stock, precios y pasarelas
  Para garantizar la integridad financiera y el descuento atómico de inventario en bodega

  # [MUESTRA PRIORITARIA - AGENTE 2]
  Escenario: SCN-PRIO-I1 / SCN-INT-CHK-01: Checkout exitoso para cliente INDUSTRIAL descuenta stock y congela precios
    Dado un cliente registrado con ID 1 clasificado como "INDUSTRIAL"
    Y un DeliveryPlace registrado con ID 10 perteneciente al cliente 1
    Y un producto "Whisky Buchanan's 12" con stock inicial de 50 cajas
    Y precios configurados para INDUSTRIAL: 1 caja a $130.000 COP, 5 cajas a $120.000 COP
    Cuando el cliente ejecuta checkout solicitando 6 cajas con entrega "STANDARD"
    Entonces se debe crear un registro en la tabla "orders" con estado "PENDING"
    Y el código de la orden debe cumplir el patrón "ORD-YYMM-XXXX"
    Y el stock disponible del producto en bodega debe reducirse a 44 cajas (50 - 6)
    Y la orden debe contener 1 OrderItem con casesQuantity 6 y unitPrice congelado en $120.000 COP
    Y el total de la orden debe ser exactamente $720.000 COP ($120.000 * 6 + $0 flete)

  Escenario: SCN-INT-CHK-02: Checkout exitoso para cliente RETAIL con flete estándar
    Dado un cliente registrado con ID 2 clasificado como "RETAIL"
    Y un DeliveryPlace con ID 20 perteneciente al cliente 2
    Y un producto "Ron Zacapa 23" con stock de 25 cajas y precio RETAIL de $142.000 COP
    Cuando el cliente ejecuta checkout solicitando 3 cajas con entrega "STANDARD"
    Entonces se crea la orden con total de $426.000 COP ($142.000 * 3) y flete de $0 COP
    Y el stock del producto en bodega disminuye a 22 cajas

  # [MUESTRA PRIORITARIA - AGENTE 2]
  Escenario: SCN-PRIO-I1 / SCN-INT-CHK-03: Rechazo de checkout por stock insuficiente no muta inventario
    Dado un producto "Ron Zacapa 23" con stock disponible de solo 2 cajas en bodega
    Cuando un cliente intenta realizar checkout solicitando 5 cajas
    Entonces el servicio debe lanzar un error indicando:
      """
      Insufficient stock for "Ron Zacapa 23". Requested: 5 cases, Available: 2 cases.
      """
    Y el stock del producto en base de datos debe permanecer intacto en 2 cajas
    Y no debe haberse insertado ningún registro en la tabla "orders" ni en "order_items"

  Escenario: SCN-INT-CHK-04: Rechazo de checkout si el método de pago está inactivo en SystemConfig
    Dado que en SystemConfig el parámetro "payment_cod_enabled" está establecido en "false"
    Cuando un cliente intenta checkout seleccionando "CASH_ON_DELIVERY"
    Entonces el servicio debe abortar la transacción indicando que el método está inactivo
    Y el inventario de los productos en bodega no debe sufrir ninguna alteración

  Escenario: SCN-INT-CHK-05: Rechazo de checkout si el DeliveryPlace no pertenece al cliente
    Dado un cliente registrado con ID 1
    Y un DeliveryPlace con ID 99 que pertenece a otro cliente con ID 2
    Cuando el cliente 1 intenta realizar checkout indicando deliveryPlaceId 99
    Entonces el servicio debe lanzar un error "Invalid delivery branch selected for this customer"
    Y no se debe generar ninguna orden
```

#### Característica 7: `OrderService.cancelOrder` - Cancelación y Reintegro de Stock en Bodega
```gherkin
Característica: Cancelación de Pedidos y Reintegro de Stock
  Como servicio de ciclo de vida de órdenes
  Quiero cancelar pedidos pendientes y reembolsar el stock reservado al almacén
  Para que la disponibilidad física de cajas se mantenga exacta

  Escenario: SCN-INT-CAN-01: Cancelación de orden PENDING reintegra atómicamente el stock
    Dado una orden existente con ID 500 en estado "PENDING"
    Y la orden contiene 10 cajas reservadas del producto "Whisky Buchanan's 12"
    Y el stock actual en bodega de ese producto es de 40 cajas
    Cuando se invoca cancelOrder con el ID 500
    Entonces el estado de la orden en base de datos debe actualizarse a "CANCELLED"
    Y el stock disponible en bodega del producto debe aumentar a 50 cajas (40 + 10)

  Escenario: SCN-INT-CAN-02: Cancelación exitosa dispara notificación al cliente
    Dado una orden existente en estado "PENDING" perteneciente a un cliente con email "bar@poblado.com"
    Cuando se invoca cancelOrder para esa orden
    Entonces el NotificationPort debe haber sido invocado con el método notifyOrderCancelled
    Y el payload debe contener el código de orden y el email del cliente

  Escenario: SCN-INT-CAN-03: Rechazo de cancelación si la orden ya está cancelada
    Dado una orden en base de datos que ya se encuentra en estado "CANCELLED"
    Cuando se intenta invocar cancelOrder sobre dicha orden
    Entonces el servicio debe lanzar un error "Order is already cancelled"
    Y el inventario de bodega no debe sufrir doble reintegro
```

#### Característica 8: `OrderService.rescheduleExpressOrder` - Protocolo de Reprogramación Prioritaria Nocturna
```gherkin
Característica: Protocolo de Reprogramación Prioritaria por Saturación Logística
  Como administrador del centro de distribución
  Quiero reprogramar órdenes express nocturnas saturadas aplicando una compensación económica
  Para aliviar la flota nocturna y garantizar entrega prioritaria al cliente a primera hora

  # [MUESTRA PRIORITARIA - AGENTE 2]
  Escenario: SCN-PRIO-I2 / SCN-INT-RES-01: Reprogramación exitosa aplica compensación de $10.000 COP y notifica
    Dado una orden existente con código "ORD-2611-7B3K" en estado "PENDING"
    Y modalidad de entrega "EXPRESS_EMERGENCY" con shippingFee de $35.000 COP y total de $155.000 COP
    Cuando el administrador ejecuta rescheduleExpressOrder con motivo "Lluvia torrencial y saturación de flota"
    Entonces el shippingFee de la orden debe reducirse exactamente a $25.000 COP ($35.000 - $10.000)
    Y el total de la orden debe reducirse exactamente a $145.000 COP ($155.000 - $10.000)
    Y las notas de la orden deben contener el prefijo "[REPROGRAMADO PRIORITARIO]"
    Y el estado de la orden debe mantenerse en "PENDING"
    Y el NotificationPort debe haber registrado el evento notifyExpressRescheduled con el nuevo total

  # [MUESTRA PRIORITARIA - AGENTE 2]
  Escenario: SCN-PRIO-I2 / SCN-INT-RES-02: Prevención estricta de doble reprogramación express
    Dado una orden express que ya fue reprogramada previamente y contiene "[REPROGRAMADO PRIORITARIO]" en sus notas
    Cuando un operador intenta ejecutar nuevamente rescheduleExpressOrder sobre esa misma orden
    Entonces el servicio debe abortar la operación con el error:
      """
      This express order has already been rescheduled
      """
    Y los valores de shippingFee y total no deben sufrir descuentos adicionales

  Escenario: SCN-INT-RES-03: Rechazo de reprogramación para órdenes con modalidad STANDARD
    Dado una orden en base de datos con deliveryType "STANDARD"
    Cuando se intenta ejecutar rescheduleExpressOrder sobre dicha orden
    Entonces el servicio debe rechazar la operación indicando que solo aplica para EXPRESS_EMERGENCY

  Escenario: SCN-INT-RES-04: Rechazo de reprogramación para órdenes que ya no están PENDING
    Dado una orden express que ya avanzó a estado "DISPATCHED" o "CONFIRMED"
    Cuando se intenta invocar rescheduleExpressOrder
    Entonces el servicio debe rechazar la solicitud indicando que solo órdenes en PENDING pueden reprogramarse
```

#### Característica 9: `OrderService.calculateCart` - Simulación Dinámica de Carrito con Parámetros Globales
```gherkin
Característica: Simulación Dinámica de Carrito de Compras
  Como cliente o visitante de la plataforma
  Quiero simular el costo de mi pedido en tiempo real con flete y descuentos por volumen
  Para tomar decisiones de compra informadas antes de formalizar el checkout

  Escenario: SCN-INT-CRT-01: Simulación de carrito para cliente INDUSTRIAL aplicando escalas dinámicas
    Dado un cliente clasificado como "INDUSTRIAL"
    Y un producto "Whisky Buchanan's 12" con stock de 50 cajas y escala de $120.000 COP para >=5 cajas
    Cuando el cliente solicita simular un carrito con 6 cajas y despacho "STANDARD"
    Entonces el subtotal calculado debe ser $720.000 COP
    Y el shippingFee debe ser 0 COP
    Y el grandTotal debe ser $720.000 COP
    Y el ítem simulado debe reportar hasSufficientStock en true sin haber descontado stock en BD

  Escenario: SCN-INT-CRT-02: Simulación de carrito express nocturno con flete dinámico de SystemConfig
    Dado que en SystemConfig el parámetro "logistics_express_fee_cop" está configurado en 40000 COP
    Cuando se simula un carrito con 2 cajas de licor y modalidad "EXPRESS_EMERGENCY"
    Entonces el shippingFee debe reportar 40000 COP
    Y el grandTotal debe sumar el subtotal de las cajas más los 40000 COP de flete

  Escenario: SCN-INT-CRT-03: Rechazo de simulación express si el servicio nocturno está desactivado
    Dado que en SystemConfig el parámetro "logistics_express_enabled" tiene valor "false"
    Cuando se intenta simular un carrito con modalidad "EXPRESS_EMERGENCY"
    Entonces el servicio debe lanzar un error indicando que el servicio express nocturno está inactivo
```

#### Característica 10: `SystemConfigService` - Gestión Tipada de Parámetros Globales
```gherkin
Característica: Gestión Tipada de Parámetros Globales (SystemConfigService)
  Como motor transversal de configuración
  Quiero leer y mutar parámetros operativos con validación de tipo y valores por defecto
  Para gobernar el comportamiento del sistema en tiempo de ejecución sin redesplegar código

  Escenario: SCN-INT-CFG-01: Lectura de parámetro numérico existente en base de datos
    Dado que existe en BD la clave "logistics_min_cases_standard" con valor "3" y tipo "NUMBER"
    Cuando se invoca getNumber("logistics_min_cases_standard", 1)
    Entonces el método debe retornar el número entero 3

  Escenario: SCN-INT-CFG-02: Lectura de parámetro numérico con fallback ante clave inexistente
    Dado una clave inexistente "logistics_parametro_inexistente"
    Cuando se invoca getNumber("logistics_parametro_inexistente", 10)
    Entonces el método debe retornar el valor por defecto 10

  Escenario: SCN-INT-CFG-03: Lectura de parámetro booleano existente
    Dado que existe en BD la clave "payment_cod_enabled" con valor "true" y tipo "BOOLEAN"
    Cuando se invoca getBoolean("payment_cod_enabled", false)
    Entonces el método debe retornar el valor booleano true

  Escenario: SCN-INT-CFG-04: Actualización válida de parámetro numérico
    Dado la clave existente "logistics_express_fee_cop" de tipo "NUMBER"
    Cuando se invoca update("logistics_express_fee_cop", "45000")
    Entonces el registro en BD debe actualizar su campo value a "45000"
    Y el campo updatedAt debe renovarse con la fecha ISO actual

  Escenario: SCN-INT-CFG-05: Rechazo de actualización con tipo de dato incompatible
    Dado la clave "logistics_express_fee_cop" de tipo "NUMBER"
    Cuando se intenta invocar update("logistics_express_fee_cop", "TEXTO_NO_NUMERICO")
    Entonces el servicio debe abortar con el error "expects a numeric value"
    Y el valor original en BD debe permanecer inalterado
```

---

### 5.3. FASE 3: Contratos de API HTTP & Seguridad RBAC (`server/tests/api/`)

#### Característica 11: `POST /api/v1/orders/calculate-cart` - Contrato de Endpoint y Acceso Anónimo vs Autenticado
```gherkin
Característica: Endpoint de Simulación de Carrito (POST /api/v1/orders/calculate-cart)
  Como consumidor de la API REST
  Quiero cotizar mi carrito tanto de forma pública como autenticada
  Para visualizar los subtotales según mi segmento antes de ingresar credenciales

  Escenario: SCN-API-CRT-01: Acceso anónimo sin token calcula tarifas RETAIL por defecto
    Dado que un usuario no autenticado envía un POST a "/api/v1/orders/calculate-cart"
    Y el cuerpo contiene 2 cajas del producto con ID 101 sin especificar segmento
    Cuando la API procesa la petición a través de optionalAuthMiddleware
    Entonces el servidor debe responder con código HTTP 200 OK
    Y el cálculo financiero devuelto debe aplicar la lista de precios RETAIL

  Escenario: SCN-API-CRT-02: Acceso anónimo especificando customerType en el cuerpo
    Dado que un usuario no autenticado envía un POST a "/api/v1/orders/calculate-cart"
    Y en el cuerpo de la petición incluye {"customerType": "INDUSTRIAL", "items": [{"productId": 101, "casesQuantity": 6}]}
    Cuando la API procesa la solicitud
    Entonces el servidor responde 200 OK
    Y aplica los precios escalonados correspondientes al segmento INDUSTRIAL

  Escenario: SCN-API-CRT-03: Acceso autenticado con Bearer token de cliente INDUSTRIAL
    Dado un usuario autenticado con token Bearer válido cuyo req.user.customerType es "INDUSTRIAL"
    Cuando envía un POST a "/api/v1/orders/calculate-cart" con 6 cajas
    Entonces el servidor responde 200 OK
    Y resuelve automáticamente la tarifa mayorista sin requerir customerType en el body

  Escenario: SCN-API-CRT-04: Rechazo 400 Bad Request ante payload con esquema Zod inválido
    Dado que se envía un POST a "/api/v1/orders/calculate-cart" con un arreglo "items" vacío []
    Cuando la API valida el cuerpo con calculateCartSchema
    Entonces el servidor debe responder inmediatamente con código HTTP 400 Bad Request
```

#### Característica 12: `POST /api/v1/orders/checkout` - Seguridad de Endpoint, Autenticación y Autorización
```gherkin
Característica: Endpoint de Checkout y Guardrails de Seguridad (POST /api/v1/orders/checkout)
  Como gateway de seguridad del e-commerce
  Quiero asegurar que únicamente compradores autenticados con rol CUSTOMER puedan crear pedidos
  Para prevenir accesos no autorizados y fraudes transaccionales

  # [MUESTRA PRIORITARIA - AGENTE 2]
  Escenario: SCN-PRIO-A1 / SCN-API-CHK-01: Rechazo 401 Unauthorized sin cabecera Authorization
    Dado que se envía una petición POST a "/api/v1/orders/checkout" sin cabecera Authorization
    Cuando la petición es interceptada por authMiddleware
    Entonces el servidor debe responder con código de estado HTTP 401 Unauthorized
    Y el cuerpo de respuesta debe contener {"error": "Authentication token required"}

  # [MUESTRA PRIORITARIA - AGENTE 2]
  Escenario: SCN-PRIO-A1 / SCN-API-CHK-02: Rechazo 403 Forbidden para usuarios con rol SUPERVISOR o ADMIN
    Dado un usuario autenticado con token JWT válido cuyo rol asignado es "SUPERVISOR"
    Cuando intenta enviar un POST a "/api/v1/orders/checkout"
    Entonces el middleware requireRoles("CUSTOMER") debe bloquear la petición
    Y el servidor debe responder con código de estado HTTP 403 Forbidden
    Y el cuerpo JSON debe indicar {"error": "Forbidden: insufficient permissions"}

  # [MUESTRA PRIORITARIA - AGENTE 2]
  Escenario: SCN-PRIO-A1 / SCN-API-CHK-03: Checkout exitoso 201 Created para cliente con rol CUSTOMER
    Dado un usuario autenticado con rol "CUSTOMER", customerId 1 y customerType "INDUSTRIAL"
    Y un payload válido con deliveryPlaceId 10, items con stock suficiente y método "CASH_ON_DELIVERY"
    Cuando envía una petición POST a "/api/v1/orders/checkout"
    Entonces el controlador debe procesar exitosamente la orden
    Y el servidor debe responder con código de estado HTTP 201 Created
    Y la respuesta debe incluir el objeto de la orden con su código canónico "ORD-YYMM-XXXX"
    Y el estado retornado debe ser "PENDING"

  Escenario: SCN-API-CHK-04: Rechazo 400 Bad Request si el usuario CUSTOMER no tiene perfil en tabla customers
    Dado un usuario autenticado con rol "CUSTOMER" pero cuyo token carece de atributo customerId
    Cuando intenta realizar checkout en "/api/v1/orders/checkout"
    Entonces el servidor debe rechazar la solicitud con código HTTP 400 Bad Request
    Y el mensaje de error debe indicar "Only registered customers can place orders"

  Escenario: SCN-API-CHK-05: Rechazo 400 Bad Request cuando el payload viola el esquema Zod
    Dado un usuario autenticado con rol "CUSTOMER"
    Cuando envía una petición sin el campo obligatorio "contactName" o con formato de teléfono inválido
    Entonces el servidor debe responder con código HTTP 400 Bad Request
```

#### Característica 13: `POST /api/v1/orders/:id/reschedule-express` - Control de Acceso RBAC para Operaciones de Emergencia
```gherkin
Característica: Endpoint de Reprogramación Express y Control RBAC (POST /orders/:id/reschedule-express)
  Como módulo administrativo de despacho
  Quiero que la reprogramación de pedidos express sea potestad exclusiva de administradores y supervisores
  Para mantener el control logístico y evitar descuentos no autorizados por clientes

  # [MUESTRA PRIORITARIA - AGENTE 2]
  Escenario: SCN-PRIO-A2 / SCN-API-RES-01: Rechazo 403 Forbidden para usuarios con rol CUSTOMER
    Dado un usuario autenticado con rol "CUSTOMER"
    Cuando envía una petición POST a "/api/v1/orders/1/reschedule-express"
    Entonces el middleware requireRoles("ADMIN", "SUPERVISOR") debe denegar el acceso
    Y el servidor debe responder con código de estado HTTP 403 Forbidden

  # [MUESTRA PRIORITARIA - AGENTE 2]
  Escenario: SCN-PRIO-A2 / SCN-API-RES-02: Aprobación exitosa 200 OK para usuario con rol ADMIN
    Dado un usuario autenticado con rol "ADMIN"
    Y una orden express pendiente en base de datos con ID 1
    Cuando envía una petición POST a "/api/v1/orders/1/reschedule-express" con {"reason": "Saturación nocturna"}
    Entonces el servidor debe responder con código de estado HTTP 200 OK
    Y el cuerpo JSON devuelto debe contener la orden con su shippingFee y total recalculados

  Escenario: SCN-API-RES-03: Aprobación exitosa 200 OK para usuario con rol SUPERVISOR
    Dado un usuario autenticado con rol "SUPERVISOR"
    Y una orden express pendiente en base de datos con ID 2
    When envía un POST a "/api/v1/orders/2/reschedule-express"
    Entonces el servidor debe responder con código de estado HTTP 200 OK
    Y aplicar el protocolo de compensación y reprogramación

  Escenario: SCN-API-RES-04: Rechazo 401 Unauthorized ante petición sin autenticación
    Dado una petición POST a "/api/v1/orders/1/reschedule-express" sin cabecera Authorization
    Cuando es recibida por el servidor
    Entonces responde con código HTTP 401 Unauthorized

  Escenario: SCN-API-RES-05: Respuesta 404 Not Found si la orden no existe
    Dado un usuario autenticado con rol "ADMIN"
    Cuando envía una petición POST a "/api/v1/orders/9999/reschedule-express" para un ID inexistente
    Entonces el servidor debe responder con código de estado HTTP 404 Not Found
```

#### Característica 14: `GET /api/v1/config` y `PUT /api/v1/config/:key` - Gobernanza RBAC de Parámetros Globales
```gherkin
Característica: Endpoints de Configuración Global y Gobernanza RBAC
  Como subsistema de gestión de parámetros
  Quiero proteger la lectura y modificación de claves operativas mediante RBAC granular
  Para que solo personal autorizado consulte los parámetros y solo administradores los modifiquen

  Escenario: SCN-API-CFG-01: Consulta de configuración GET /api/v1/config permitida a SUPERVISOR (200 OK)
    Dado un usuario autenticado con rol "SUPERVISOR"
    Cuando realiza una petición GET a "/api/v1/config"
    Entonces el servidor responde con código HTTP 200 OK
    Y retorna el listado completo de parámetros operativos

  Escenario: SCN-API-CFG-02: Consulta de configuración GET /api/v1/config permitida a ADMIN (200 OK)
    Dado un usuario autenticado con rol "ADMIN"
    Cuando realiza una petición GET a "/api/v1/config"
    Entonces el servidor responde con código HTTP 200 OK

  Escenario: SCN-API-CFG-03: Consulta de configuración GET /api/v1/config denegada a CUSTOMER (403 Forbidden)
    Dado un usuario autenticado con rol "CUSTOMER"
    Cuando realiza una petición GET a "/api/v1/config"
    Entonces el servidor responde con código de estado HTTP 403 Forbidden

  Escenario: SCN-API-CFG-04: Modificación PUT /api/v1/config/:key permitida exclusivamente a ADMIN (200 OK)
    Dado un usuario autenticado con rol "ADMIN"
    Cuando envía un PUT a "/api/v1/config/logistics_express_fee_cop" con {"value": "40000"}
    Entonces el servidor responde con código HTTP 200 OK
    Y el cuerpo devuelto confirma el valor actualizado a "40000"

  Escenario: SCN-API-CFG-05: Modificación PUT /api/v1/config/:key denegada a SUPERVISOR (403 Forbidden)
    Dado un usuario autenticado con rol "SUPERVISOR"
    Cuando intenta enviar un PUT a "/api/v1/config/logistics_express_fee_cop" con un nuevo valor
    Entonces el middleware requireRoles("ADMIN") debe bloquear la petición
    Y el servidor responde con código de estado HTTP 403 Forbidden
```

---

## 6. Datos Canónicos de Prueba y Fixtures de Referencia

### 6.1. Fixtures en Memoria para Dominio Puro (Fase 1)
Definidos en [`server/tests/unit/order.rules.test.ts`](file:///C:/_code/licores-crm/server/tests/unit/order.rules.test.ts) con precios base e inventarios mockeados:
* Buchanan's 12: Retail $150.000 / Industrial 1 caja $130.000, 5 cajas $120.000, 10 cajas $110.000.
* Zacapa 23: Retail $142.000 / Industrial 1 caja $130.000, 3 cajas $122.000.

### 6.2. Fixtures de Base de Datos para Integración y API (`server/data.test.db`)

Para poblar la base de datos de test (`data.test.db`) antes de las suites de Fase 2 y 3:

```typescript
// Fixtures canónicos para pruebas en server/data.test.db

export const TEST_USERS = [
  { id: 1, email: "cliente@barpoblado.com", name: "Bar Poblado SAS", role: "CUSTOMER", passwordHash: "dummy" },
  { id: 2, email: "supervisor@licores.com", name: "Supervisor Despachos", role: "SUPERVISOR", passwordHash: "dummy" },
  { id: 3, email: "admin@licores.com", name: "Administrador General", role: "ADMIN", passwordHash: "dummy" },
];

export const TEST_CUSTOMERS = [
  { id: 1, userId: 1, businessName: "Bar El Templo SAS", taxId: "901234567-1", customerType: "INDUSTRIAL", phone: "3001234567" },
];

export const TEST_DELIVERY_PLACES = [
  { id: 10, customerId: 1, name: "Sede Poblado Principal", address: "Cra 43A # 10-25", city: "Medellín", phone: "3001234567" },
];

export const TEST_PRODUCTS = [
  { id: 101, sku: "WHI-BUCH12-C12", name: "Whisky Buchanan's 12 Años", category: "Whisky", stockCases: 50, bottlesPerCase: 12 },
  { id: 102, sku: "RON-ZAC23-C06", name: "Ron Zacapa 23", category: "Ron", stockCases: 2, bottlesPerCase: 6 },
];

export const TEST_PRODUCT_PRICES = [
  { id: 1, productId: 101, customerType: "RETAIL", minCases: 1, unitPrice: 150000 },
  { id: 2, productId: 101, customerType: "INDUSTRIAL", minCases: 1, unitPrice: 130000 },
  { id: 3, productId: 101, customerType: "INDUSTRIAL", minCases: 5, unitPrice: 120000 },
  { id: 4, productId: 102, customerType: "INDUSTRIAL", minCases: 1, unitPrice: 140000 },
];

export const TEST_SYSTEM_CONFIG = [
  { key: "logistics_min_cases_standard", value: "3", type: "NUMBER" },
  { key: "logistics_min_cases_express", value: "1", type: "NUMBER" },
  { key: "logistics_express_fee_cop", value: "35000", type: "NUMBER" },
  { key: "logistics_express_reschedule_discount_cop", value: "10000", type: "NUMBER" },
  { key: "logistics_express_enabled", value: "true", type: "BOOLEAN" },
  { key: "payment_cod_enabled", value: "true", type: "BOOLEAN" },
  { key: "payment_bank_transfer_enabled", value: "true", type: "BOOLEAN" },
  { key: "payment_credit_card_enabled", value: "true", type: "BOOLEAN" },
];
```

---

## 7. Matriz de Trazabilidad de Requisitos (RTM Exhaustiva)

A continuación se trazan de extremo a extremo el 100% de las cláusulas técnicas, reglas de negocio y escenarios Gherkin de las tres fases:

| Cláusula Técnica | Componente / Costura | ID Escenario Gherkin | Nombre del Test / Escenario | Nivel | Responsable de Implementación |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Secc 1.2 / 3 (Regla I)** | `order.rules.ts` | `SCN-PRIO-U1` / `SCN-MOQ-01` | Validación de MOQ estándar con 3 cajas | Unit | **Agente 2 (Muestra Prioritaria)** |
| **Secc 1.2 / 3 (Regla I)** | `order.rules.ts` | `SCN-MOQ-02` | Pedido estándar supera holgadamente MOQ (12 cajas) | Unit | Usuario (Complementario) |
| **Secc 1.2 / 3 (Regla I)** | `order.rules.ts` | `SCN-MOQ-03` | Rechazo de pedido estándar con 2 cajas | Unit | Usuario (Complementario) |
| **Secc 1.2 / 3 (Regla I)** | `order.rules.ts` | `SCN-MOQ-04` | Rechazo de pedido estándar con 0 cajas | Unit | Usuario (Complementario) |
| **Secc 4.1** | `order.rules.ts` | `SCN-PRIO-U1` / `SCN-MOQ-05` | Validación de MOQ express con 1 caja | Unit | **Agente 2 (Muestra Prioritaria)** |
| **Secc 4.1** | `order.rules.ts` | `SCN-MOQ-06` | Pedido express con mayor volumen (4 cajas) | Unit | Usuario (Complementario) |
| **Secc 4.1** | `order.rules.ts` | `SCN-MOQ-07` | Rechazo de pedido express con 0 cajas | Unit | Usuario (Complementario) |
| **Secc 4.1 / 7** | `order.rules.ts` | `SCN-MOQ-08` | MOQ estándar dinámico desde SystemConfig (5 cajas) | Unit | Usuario (Complementario) |
| **Secc 4.1 / 7** | `order.rules.ts` | `SCN-MOQ-09` | MOQ express dinámico desde SystemConfig (2 cajas) | Unit | Usuario (Complementario) |
| **Secc 4.1** | `order.rules.ts` | `SCN-SHP-01` | Flete gratuito ($0 COP) para despacho estándar | Unit | Usuario (Complementario) |
| **Secc 4.1** | `order.rules.ts` | `SCN-SHP-02` | Flete estándar inalterable con tarifa express pasada | Unit | Usuario (Complementario) |
| **Secc 4.1 / 7** | `order.rules.ts` | `SCN-SHP-03` | Flete fijo express nocturno ($35.000 COP) | Unit | Usuario (Complementario) |
| **Secc 4.1 / 7** | `order.rules.ts` | `SCN-SHP-04` | Flete express dinámico desde SystemConfig | Unit | Usuario (Complementario) |
| **Secc 2.1.E / 3 (Regla II)** | `order.rules.ts` | `SCN-PRIO-U2` / `SCN-PRC-01` | Precio base RETAIL para 1 caja | Unit | **Agente 2 (Muestra Prioritaria)** |
| **Secc 2.1.E / 3 (Regla II)** | `order.rules.ts` | `SCN-PRC-02` | Cliente RETAIL con gran volumen no accede a INDUSTRIAL | Unit | Usuario (Complementario) |
| **Secc 2.1.E / 3 (Regla II)** | `order.rules.ts` | `SCN-PRC-03` | Cliente INDUSTRIAL en escalón 1 (3 cajas) | Unit | Usuario (Complementario) |
| **Secc 2.1.E / 3 (Regla II)** | `order.rules.ts` | `SCN-PRIO-U2` / `SCN-PRC-04` | Cliente INDUSTRIAL activa escalón 2 (5 cajas) | Unit | **Agente 2 (Muestra Prioritaria)** |
| **Secc 2.1.E / 3 (Regla II)** | `order.rules.ts` | `SCN-PRC-05` | Cliente INDUSTRIAL en rango de escalón 2 (8 cajas) | Unit | Usuario (Complementario) |
| **Secc 2.1.E / 3 (Regla II)** | `order.rules.ts` | `SCN-PRC-06` | Cliente INDUSTRIAL activa escalón 3 (15 cajas) | Unit | Usuario (Complementario) |
| **Secc 3 (Regla II)** | `order.rules.ts` | `SCN-PRC-07` | Excepción si no existen precios para el segmento | Unit | Usuario (Complementario) |
| **Secc 2.3.1** | `order.rules.ts` | `SCN-COD-01` | Formato ORD-YYMM-XXXX con longitud 13 | Unit | Usuario (Complementario) |
| **Secc 2.3.1** | `order.rules.ts` | `SCN-COD-02` | Exclusión de caracteres ambiguos (I, L, O, U, 0, 1) | Unit | Usuario (Complementario) |
| **Secc 5.2 / 7** | `order.rules.ts` | `SCN-PAY-01` | Mapeo de método de pago a clave SystemConfig | Unit | Usuario (Complementario) |
| **Secc 5.2 / 7** | `order.rules.ts` | `SCN-PAY-02` | Aprobación de métodos de pago activos | Unit | Usuario (Complementario) |
| **Secc 5.2 / 7** | `order.rules.ts` | `SCN-PAY-03` | Rechazo de método Contra Entrega inactivo | Unit | Usuario (Complementario) |
| **Secc 5.2 / 7** | `order.rules.ts` | `SCN-PAY-04` | Rechazo de método Transferencia Bancaria inactivo | Unit | Usuario (Complementario) |
| **Secc 5.2 / 7** | `order.rules.ts` | `SCN-PAY-05` | Rechazo de método de pago desconocido | Unit | Usuario (Complementario) |
| **Secc 3 (Regla IV / III)** | `OrderService.checkout` | `SCN-PRIO-I1` / `SCN-INT-CHK-01` | Checkout exitoso descuenta stock en bodega y graba snapshot | Integration | **Agente 2 (Muestra Prioritaria)** |
| **Secc 1.2 / 4.1** | `OrderService.checkout` | `SCN-INT-CHK-02` | Checkout exitoso para cliente RETAIL con flete $0 | Integration | Usuario (Complementario) |
| **Secc 3 (Regla IV)** | `OrderService.checkout` | `SCN-PRIO-I1` / `SCN-INT-CHK-03` | Rechazo por stock insuficiente no muta inventario | Integration | **Agente 2 (Muestra Prioritaria)** |
| **Secc 5.2 / 7** | `OrderService.checkout` | `SCN-INT-CHK-04` | Rechazo si la pasarela está desactivada en SystemConfig | Integration | Usuario (Complementario) |
| **Secc 2.1.C** | `OrderService.checkout` | `SCN-INT-CHK-05` | Rechazo si DeliveryPlace no pertenece al cliente | Integration | Usuario (Complementario) |
| **Secc 3 (Regla IV / V)** | `OrderService.cancelOrder` | `SCN-INT-CAN-01` | Cancelación de orden PENDING reintegra stock a bodega | Integration | Usuario (Complementario) |
| **Secc 6.3.2** | `OrderService.cancelOrder` | `SCN-INT-CAN-02` | Cancelación exitosa invoca seam de notificación | Integration | Usuario (Complementario) |
| **Secc 3 (Regla V)** | `OrderService.cancelOrder` | `SCN-INT-CAN-03` | Rechazo de cancelación si orden ya está cancelada | Integration | Usuario (Complementario) |
| **Secc 4.2** | `OrderService.reschedule` | `SCN-PRIO-I2` / `SCN-INT-RES-01` | Reprogramación express con compensación -$10.000 COP y nota | Integration | **Agente 2 (Muestra Prioritaria)** |
| **Secc 4.2** | `OrderService.reschedule` | `SCN-PRIO-I2` / `SCN-INT-RES-02` | Prevención estricta de doble reprogramación express | Integration | **Agente 2 (Muestra Prioritaria)** |
| **Secc 4.2** | `OrderService.reschedule` | `SCN-INT-RES-03` | Rechazo de reprogramación para orden con entrega STANDARD | Integration | Usuario (Complementario) |
| **Secc 4.2** | `OrderService.reschedule` | `SCN-INT-RES-04` | Rechazo de reprogramación para orden no PENDING | Integration | Usuario (Complementario) |
| **Secc 1.2 / 2.1.E** | `OrderService.calculateCart` | `SCN-INT-CRT-01` | Simulación de carrito INDUSTRIAL con escalas dinámicas | Integration | Usuario (Complementario) |
| **Secc 4.1 / 7** | `OrderService.calculateCart` | `SCN-INT-CRT-02` | Simulación express nocturna con flete de SystemConfig | Integration | Usuario (Complementario) |
| **Secc 4.1 / 7** | `OrderService.calculateCart` | `SCN-INT-CRT-03` | Rechazo de simulación express si servicio nocturno está apagado | Integration | Usuario (Complementario) |
| **Secc 7** | `SystemConfigService` | `SCN-INT-CFG-01` | Lectura de parámetro numérico getNumber | Integration | Usuario (Complementario) |
| **Secc 7** | `SystemConfigService` | `SCN-INT-CFG-02` | Fallback de getNumber ante clave inexistente | Integration | Usuario (Complementario) |
| **Secc 7** | `SystemConfigService` | `SCN-INT-CFG-03` | Lectura de parámetro booleano getBoolean | Integration | Usuario (Complementario) |
| **Secc 7** | `SystemConfigService` | `SCN-INT-CFG-04` | Actualización válida de parámetro numérico con updatedAt | Integration | Usuario (Complementario) |
| **Secc 7** | `SystemConfigService` | `SCN-INT-CFG-05` | Rechazo de actualización con tipo de dato incompatible | Integration | Usuario (Complementario) |
| **Secc 6.1** | `POST /calculate-cart` | `SCN-API-CRT-01` | Acceso anónimo calcula tarifas RETAIL por defecto | API | Usuario (Complementario) |
| **Secc 6.1** | `POST /calculate-cart` | `SCN-API-CRT-02` | Acceso anónimo con customerType INDUSTRIAL en body | API | Usuario (Complementario) |
| **Secc 6.1** | `POST /calculate-cart` | `SCN-API-CRT-03` | Acceso autenticado INDUSTRIAL resuelve precios mayoristas | API | Usuario (Complementario) |
| **Secc 6.2** | `POST /calculate-cart` | `SCN-API-CRT-04` | Rechazo 400 Bad Request ante payload inválido en Zod | API | Usuario (Complementario) |
| **Secc 6.1 / IAM** | `POST /checkout` | `SCN-PRIO-A1` / `SCN-API-CHK-01` | Rechazo 401 Unauthorized sin token Bearer | API | **Agente 2 (Muestra Prioritaria)** |
| **Secc 6.1 / IAM** | `POST /checkout` | `SCN-PRIO-A1` / `SCN-API-CHK-02` | Rechazo 403 Forbidden para rol SUPERVISOR o ADMIN | API | **Agente 2 (Muestra Prioritaria)** |
| **Secc 6.1 / IAM** | `POST /checkout` | `SCN-PRIO-A1` / `SCN-API-CHK-03` | Checkout exitoso 201 Created para rol CUSTOMER | API | **Agente 2 (Muestra Prioritaria)** |
| **Secc 2.1.A** | `POST /checkout` | `SCN-API-CHK-04` | Rechazo 400 Bad Request si usuario carece de customerId | API | Usuario (Complementario) |
| **Secc 6.2** | `POST /checkout` | `SCN-API-CHK-05` | Rechazo 400 Bad Request ante fallo de validación Zod | API | Usuario (Complementario) |
| **Secc 4.2 / IAM** | `POST /:id/reschedule` | `SCN-PRIO-A2` / `SCN-API-RES-01` | Rechazo 403 Forbidden para rol CUSTOMER | API | **Agente 2 (Muestra Prioritaria)** |
| **Secc 4.2 / IAM** | `POST /:id/reschedule` | `SCN-PRIO-A2` / `SCN-API-RES-02` | Aprobación exitosa 200 OK para rol ADMIN | API | **Agente 2 (Muestra Prioritaria)** |
| **Secc 4.2 / IAM** | `POST /:id/reschedule` | `SCN-API-RES-03` | Aprobación exitosa 200 OK para rol SUPERVISOR | API | Usuario (Complementario) |
| **Secc 6.1** | `POST /:id/reschedule` | `SCN-API-RES-04` | Rechazo 401 Unauthorized sin cabecera de autenticación | API | Usuario (Complementario) |
| **Secc 4.2** | `POST /:id/reschedule` | `SCN-API-RES-05` | Respuesta 404 Not Found si orden no existe | API | Usuario (Complementario) |
| **Secc 7 / IAM** | `GET /config` | `SCN-API-CFG-01` | Consulta permitida 200 OK a rol SUPERVISOR | API | Usuario (Complementario) |
| **Secc 7 / IAM** | `GET /config` | `SCN-API-CFG-02` | Consulta permitida 200 OK a rol ADMIN | API | Usuario (Complementario) |
| **Secc 7 / IAM** | `GET /config` | `SCN-API-CFG-03` | Consulta denegada 403 Forbidden a rol CUSTOMER | API | Usuario (Complementario) |
| **Secc 7 / IAM** | `PUT /config/:key` | `SCN-API-CFG-04` | Modificación permitida exclusivamente a ADMIN (200 OK) | API | Usuario (Complementario) |
| **Secc 7 / IAM** | `PUT /config/:key` | `SCN-API-CFG-05` | Modificación denegada 403 Forbidden a SUPERVISOR | API | Usuario (Complementario) |

---

## 8. Definición de Hecho (DoD - Definition of Done)

Para declarar aprobada la suite de pruebas del backend en sus Fases 1, 2 y 3:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CRITERIOS DE ACEPTACIÓN (DoD)                   │
└────────────────────────────────────────────────────────────────────────┘
 [✓] 1. 100% de Pruebas en Verde (0 Fallos, 0 Saltos / Skips no justificados).
 [✓] 2. 0 Errores del Compilador TypeScript (`tsc --noEmit` sin errores).
 [✓] 3. Tiempo de Ejecución Eficiente:
      • Fase 1 (Unit):        < 500 ms (típicamente < 50 ms).
      • Fase 2 (Integration): < 3.000 ms sobre base de datos SQLite en disco/memoria.
      • Fase 3 (API):         < 5.000 ms ejecutando sobre Express + Supertest.
 [✓] 4. Cobertura de Código Mínima:
      • Fase 1: 100% Branch, Statement y Function en `order.rules.ts`.
      • Fase 2: 100% de los flujos críticos de stock, compensación y estados de `OrderService`.
      • Fase 3: Cobertura de los códigos de respuesta clave (401, 403, 200, 201, 400, 404).
 [✓] 5. Aislamiento Total de Persistencia:
      • Las pruebas de Fase 2 y 3 NUNCA tocan `server/data.db` de producción o desarrollo.
      • Operan exclusivamente sobre `server/data.test.db` o base SQLite en memoria.
 [✓] 6. Determinismo y Teardown Limpio:
      • Los tests pueden correr en cualquier orden sin depender del estado de tests previos.
      • `afterAll` cierra conexiones y desinfecta archivos residuales (`-wal`, `-shm`).
```

---

## 9. Política de Aislamiento de Base de Datos para Integración (`data.test.db`)

Para las suites de integración y API (Fases 2 y 3), se establece la siguiente política obligatoria:

### 9.1. Segregación de Archivos y Variables de Entorno
* **Ruta de Base de Datos de Prueba:** `server/data.test.db` (desconectada de `server/data.db`).
* **Variable de Entorno Obligatoria:** `NODE_ENV=test`.
* **Guardrail de Conexión:** Si el código detecta `NODE_ENV=test` e intenta conectarse a `data.db`, el proceso arrojará un error fatal de configuración.

### 9.2. Ciclo de Vida de los Datos (Setup, Teardown y Seeding)
1. **`beforeAll`:**
   * Inicialización de la base de datos `data.test.db`.
   * Ejecución de migraciones o creación de tablas relacionales de Drizzle ORM.
   * Carga de semillas base de prueba (`TEST_USERS`, `TEST_CUSTOMERS`, `TEST_DELIVERY_PLACES`, `TEST_PRODUCTS`, `TEST_PRODUCT_PRICES`, `TEST_SYSTEM_CONFIG`).
2. **`beforeEach` / `afterEach`:**
   * Las tablas transaccionales (`orders`, `order_items`) se limpian o se gestionan en transacciones aisladas.
   * Se restablece el inventario de `TEST_PRODUCTS` a sus valores canónicos (ej. 50 cajas para Buchanan's 12) para evitar que una prueba de checkout agote el stock de la prueba siguiente.
3. **`afterAll`:**
   * Cierre formal de la base de datos `node:sqlite`.
   * Limpieza de archivos temporales de base de datos de test (`data.test.db`, `data.test.db-wal`, `data.test.db-shm`).

---

*Documento Maestro unificado y compilado por el Agente 1 (Testing Documentation Architect).*  
*Aprobado para la implementación de pruebas unitarias, de integración y de contratos API.*
