# ESPECIFICACIÓN MAESTRA DE PRUEBAS DE BACKEND
## FASES 1, 2 Y 3: DOMINIO PURO, INTEGRACIÓN DE SERVICIOS Y CONTRATOS API REST

> **Estado:** Aprobado para Ejecución de Pruebas Automatizadas  
> **Versión:** 2.0.0 (Master Unified Test Specification)  
> **Fecha de Actualización:** 23 de Noviembre de 2026  
> **Módulos Bajo Prueba:**  
> • **Fase 1 (Unit):** [`server/src/modules/orders/domain/order.rules.ts`](file:///C:/_code/licores-crm/server/src/modules/orders/domain/order.rules.ts)  
> • **Fase 2 (Integration):** [`server/src/modules/orders/services/order.service.ts`](file:///C:/_code/licores-crm/server/src/modules/orders/services/order.service.ts), [`server/src/modules/system-config/services/system-config.service.ts`](file:///C:/_code/licores-crm/server/src/modules/system-config/services/system-config.service.ts)  
> • **Fase 3 (API & RBAC):** [`server/src/modules/orders/order.routes.ts`](file:///C:/_code/licores-crm/server/src/modules/orders/order.routes.ts), [`server/src/modules/system-config/system-config.routes.ts`](file:///C:/_code/licores-crm/server/src/modules/system-config/system-config.routes.ts), [`server/src/middlewares/auth.middleware.ts`](file:///C:/_code/licores-crm/server/src/middlewares/auth.middleware.ts), [`server/src/middlewares/role.middleware.ts`](file:///C:/_code/licores-crm/server/src/middlewares/role.middleware.ts)  
> **Suites de Prueba:**  
> • Unit: [`server/tests/unit/order.rules.test.ts`](file:///C:/_code/licores-crm/server/tests/unit/order.rules.test.ts)  
> • Integration: [`server/tests/integration/order.service.test.ts`](file:///C:/_code/licores-crm/server/tests/integration/order.service.test.ts)  
> • API: [`server/tests/api/order.routes.test.ts`](file:///C:/_code/licores-crm/server/tests/api/order.routes.test.ts)  
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
                /───────\   - Middleware Auth (JWT) & Role Middleware (401/403/201)
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
| **Fase 3: API & Seguridad** | Enrutadores Express, traducción HTTP (Zod schemas), control de acceso basado en roles (`CUSTOMER`, `SUPERVISOR`, `ADMIN`), tokens JWT (`authMiddleware`, `optionalAuthMiddleware`). | Servidor Express en memoria (Supertest), base de datos de test (`data.test.db`). | `server/tests/api/order.routes.test.ts` |

### 1.3. Asignación de Responsabilidades: Escenarios Prioritarios vs. Complementarios
Para asegurar una ejecución eficiente del plan de calidad:
* **Agente 2 (Test Implementer):** Es responsable de implementar **2 escenarios prioritarios de muestra por fase** (6 escenarios en total), garantizando la infraestructura base, utilidades de prueba, mocks y ejecución 100% verde en Vitest.
* **Usuario / Equipo de Desarrollo:** Cuenta con la especificación Gherkin exhaustiva de todos los **escenarios complementarios** formalizados en este documento para continuar extendiendo la suite a su propio ritmo.

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
   [USUARIO]  SCN-INT-CHK-02..04, SCN-INT-CAN-01..02, SCN-INT-RES-02..04, SCN-INT-CRT-01..02, SCN-INT-CFG-01..03.

 • FASE 3 (API HTTP & Seguridad RBAC):
   [AGENTE 2] SCN-PRIO-A1: Matriz de Autenticación y Autorización en POST /checkout (401, 403, 201).
   [AGENTE 2] SCN-PRIO-A2: Control RBAC en POST /orders/:id/reschedule-express (403 CUSTOMER vs 200 ADMIN).
   [USUARIO]  SCN-API-CRT-01..02, SCN-API-CHK-03..04, SCN-API-RES-03, SCN-API-CFG-01..04.
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
    │   └── order.routes.test.ts       ◄── Implementación Agente 2 (Muestra Prioritaria)
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

## 5. Criterios de Aceptación en Formato Gherkin

### 5.1. FASE 1: Reglas de Dominio Puro (`server/tests/unit/order.rules.test.ts`)

#### [AGENTE 2 - MUESTRA PRIORITARIA FASE 1]
```gherkin
Característica: [PRIORITARIO-U1] Validación de Cantidad Mínima de Pedido (MOQ Dinámico)
  Como motor de reglas de checkout
  Quiero validar el cumplimiento del pedido mínimo según la modalidad logística
  Para optimizar los despachos y costos operativos

  Escenario: Validación exitosa de pedido estándar con MOQ por defecto (3 cajas)
    Dado que se solicita despacho "STANDARD" con 3 cajas
    Cuando se valida la cantidad mínima de pedido
    Entonces la validación debe completarse sin arrojar errores

  Escenario: Rechazo de pedido estándar con menos de 3 cajas
    Dado que se solicita despacho "STANDARD" con 2 cajas
    Cuando se valida la cantidad mínima de pedido
    Entonces debe lanzar un error indicando que se requieren al menos 3 cajas

  Escenario: Aprobación de pedido express nocturno con 1 caja
    Dado que se solicita despacho "EXPRESS_EMERGENCY" con 1 caja
    Cuando se valida la cantidad mínima de pedido
    Entonces la validación debe completarse exitosamente
```

#### [AGENTE 2 - MUESTRA PRIORITARIA FASE 1]
```gherkin
Característica: [PRIORITARIO-U2] Resolución de Precios Unitarios Escalonados por Segmento
  Como motor de tarifas de catálogo
  Quiero resolver el precio unitario exacto por volumen y tipo de cliente
  Para aplicar precios justos y proteger el margen mayorista

  Escenario: Cliente INDUSTRIAL accede a tarifa con descuento al superar 5 cajas
    Dado un producto con tarifas INDUSTRIAL: 1 caja a $130.000 COP y 5 cajas a $120.000 COP
    Cuando un cliente "INDUSTRIAL" cotiza 6 cajas
    Entonces el precio unitario resuelto debe ser $120.000 COP
    Y el escalón aplicado debe ser minCases 5

  Escenario: Cliente RETAIL mantiene precio base sin importar el volumen
    Dado un producto con tarifa RETAIL: 1 caja a $150.000 COP
    Cuando un cliente "RETAIL" cotiza 15 cajas
    Entonces el precio unitario resuelto debe mantenerse en $150.000 COP
```

#### [ESCENARIOS COMPLEMENTARIOS FASE 1 - PARA EL USUARIO]
* `SCN-SHP-01`: Flete gratuito ($0 COP) para despacho estándar.
* `SCN-SHP-02`: Recargo fijo de $35.000 COP para despacho express nocturno.
* `SCN-COD-01`: Generación de código `ORD-YYMM-XXXX` con longitud 13 y fecha cronológica.
* `SCN-COD-02`: Ausencia estricta de caracteres ambiguos (I, L, O, U, 0, 1) en Crockford Base32.
* `SCN-PAY-01`: Validación y rechazo de pasarela desactivada en `SystemConfig`.

---

### 5.2. FASE 2: Servicios e Integración con Base de Datos (`server/tests/integration/`)

#### [AGENTE 2 - MUESTRA PRIORITARIA FASE 2]
```gherkin
Característica: [PRIORITARIO-I1] Checkout Transaccional con Descuento Atómico de Stock e Inserción de Items
  Como servicio central de pedidos (OrderService)
  Quiero procesar el checkout de un cliente descontando el inventario físico en bodega
  Para garantizar la consistencia transaccional y congelar los precios pactados

  Escenario: Checkout exitoso descuenta stock en bodega y graba snapshot de precios
    Dado un cliente registrado con ID 1 tipo "INDUSTRIAL"
    Y un DeliveryPlace registrado con ID 10 perteneciente al cliente 1
    Y un producto "Whisky Buchanan's 12" con stock de 50 cajas y tarifa de $120.000 COP para >=5 cajas
    Cuando el cliente realiza checkout solicitando 6 cajas con entrega "STANDARD"
    Entonces se debe crear una nueva orden en estado "PENDING"
    Y el stock disponible del producto en bodega debe reducirse exactamente a 44 cajas
    Y la orden debe contener 1 item con casesQuantity 6 y unitPrice congelado en $120.000 COP
    Y el total de la orden debe ser exactamente $720.000 COP ($120.000 * 6 + $0 flete)

  Escenario: Rechazo de checkout por stock insuficiente no debe mutar inventario
    Dado un producto "Ron Zacapa 23" con solo 2 cajas disponibles en bodega
    Cuando el cliente intenta realizar checkout solicitando 5 cajas
    Entonces el servicio debe lanzar un error indicando "Insufficient stock"
    Y el stock del producto en base de datos debe permanecer inalterado en 2 cajas
```

#### [AGENTE 2 - MUESTRA PRIORITARIA FASE 2]
```gherkin
Característica: [PRIORITARIO-I2] Protocolo de Reprogramación Prioritaria Express por Saturación Logística
  Como administrador operativo
  Quiero reprogramar una orden express nocturna para primera hora del día siguiente
  Para compensar al cliente con un descuento en flete y priorizar su despacho ante saturación

  Escenario: Reprogramación express aplica compensación de $10.000 COP, muta notas y notifica
    Dado una orden existente con código "ORD-2611-7B3K" en estado "PENDING"
    Y modalidad de entrega "EXPRESS_EMERGENCY" con shippingFee de $35.000 COP y total de $155.000 COP
    Cuando el administrador ejecuta rescheduleExpressOrder con motivo "Lluvia torrencial y saturación"
    Entonces el shippingFee de la orden debe reducirse a $25.000 COP ($35.000 - $10.000)
    Y el total de la orden debe reducirse a $145.000 COP
    Y las notas de la orden deben contener "[REPROGRAMADO PRIORITARIO]"
    Y el adaptador de notificaciones debe haber registrado el evento con el nuevo total y descuento
    Y el estado de la orden debe mantenerse en "PENDING"

  Escenario: Prevención estricta de doble reprogramación express
    Dado una orden express que ya fue reprogramada y contiene "[REPROGRAMADO PRIORITARIO]" en sus notas
    Cuando se intenta ejecutar nuevamente rescheduleExpressOrder sobre dicha orden
    Entonces el servicio debe abortar con el error "This express order has already been rescheduled"
```

#### [ESCENARIOS COMPLEMENTARIOS FASE 2 - PARA EL USUARIO]
* `SCN-INT-CAN-01`: `cancelOrder` restituye atómicamente el stock de cajas a la tabla `products` y muta estado a `"CANCELLED"`.
* `SCN-INT-CAN-02`: `cancelOrder` rechaza cancelar órdenes que ya se encuentren en estado `"CANCELLED"`.
* `SCN-INT-CHK-03`: `checkout` rechaza la transacción si el método de pago seleccionado está inactivo en `SystemConfig`.
* `SCN-INT-CRT-01`: `calculateCart` simula correctamente el carrito de compra leyendo dinámicamente umbrales de `SystemConfig`.
* `SCN-INT-CFG-01`: `SystemConfigService.getNumber` y `getBoolean` devuelven valores con fallback ante claves inexistentes.
* `SCN-INT-CFG-02`: `SystemConfigService.update` valida y actualiza parámetros dinámicos con tipos correctos.

---

### 5.3. FASE 3: Contratos de API HTTP & Seguridad RBAC (`server/tests/api/`)

#### [AGENTE 2 - MUESTRA PRIORITARIA FASE 3]
```gherkin
Característica: [PRIORITARIO-A1] Matriz de Autenticación y Autorización en POST /api/v1/orders/checkout
  Como gateway de seguridad de la API
  Quiero validar estrictamente el token JWT y el rol del usuario en el endpoint de checkout
  Para asegurar que solo compradores legítimos generen compras

  Escenario: Rechazo de solicitud sin cabecera Authorization (401 Unauthorized)
    Dado que un cliente realiza un POST a "/api/v1/orders/checkout" sin token Bearer
    Cuando se procesa la petición
    Entonces el servidor debe responder con código de estado HTTP 401
    Y la respuesta debe incluir el mensaje "Authentication token required"

  Escenario: Rechazo para usuarios con roles no-CUSTOMER (403 Forbidden)
    Dado un usuario autenticado con token válido cuyo rol es "SUPERVISOR"
    Cuando intenta enviar un POST a "/api/v1/orders/checkout"
    Entonces el servidor debe responder con código de estado HTTP 403
    Y la respuesta debe indicar "Forbidden: insufficient permissions"

  Escenario: Checkout exitoso para usuario con rol CUSTOMER (201 Created)
    Dado un usuario autenticado con token Bearer válido, rol "CUSTOMER" y customerId 1
    Y un payload válido con deliveryPlaceId y al menos 1 ítem con stock suficiente
    Cuando envía un POST a "/api/v1/orders/checkout"
    Entonces el servidor debe responder con código HTTP 201 Created
    Y la respuesta JSON debe contener el objeto de la orden creada con su código "ORD-"
```

#### [AGENTE 2 - MUESTRA PRIORITARIA FASE 3]
```gherkin
Característica: [PRIORITARIO-A2] Control de Acceso RBAC en POST /api/v1/orders/:id/reschedule-express
  Como controlador administrativo
  Quiero restringir la reprogramación de emergencias exclusivamente a administradores y supervisores
  Para prevenir manipulaciones comerciales o autofacturación de descuentos por clientes

  Escenario: Rechazo de reprogramación para rol CUSTOMER (403 Forbidden)
    Dado un usuario autenticado con rol "CUSTOMER"
    Cuando envía una petición POST a "/api/v1/orders/1/reschedule-express"
    Entonces el servidor debe responder con código de estado HTTP 403
    Y denegar el acceso a la operación

  Escenario: Aprobación de reprogramación para rol ADMIN o SUPERVISOR (200 OK)
    Dado un usuario autenticado con rol "ADMIN" o "SUPERVISOR"
    Y una orden express pendiente en base de datos con ID 1
    Cuando envía una petición POST a "/api/v1/orders/1/reschedule-express" con motivo operativo
    Entonces el servidor debe responder con código de estado HTTP 200 OK
    Y el cuerpo de respuesta debe confirmar la orden con el flete y total descontados
```

#### [ESCENARIOS COMPLEMENTARIOS FASE 3 - PARA EL USUARIO]
* `SCN-API-CRT-01`: `POST /api/v1/orders/calculate-cart` permite acceso anónimo (sin token) devolviendo precios calculados para `RETAIL`.
* `SCN-API-CRT-02`: `POST /api/v1/orders/calculate-cart` con Bearer token de cliente `INDUSTRIAL` resuelve automáticamente precios mayoristas sin necesidad de especificar `customerType` en el body.
* `SCN-API-CFG-01`: `GET /api/v1/config` permite acceso a `ADMIN` y `SUPERVISOR` (200 OK) y bloquea a `CUSTOMER` (403 Forbidden).
* `SCN-API-CFG-02`: `PUT /api/v1/config/:key` permite acceso exclusivamente a rol `ADMIN` (200 OK) y bloquea a rol `SUPERVISOR` (403 Forbidden).

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

## 7. Matriz de Trazabilidad de Requisitos (RTM Unificada)

| Cláusula Técnica | Componente / Costura | ID Escenario Gherkin | Nombre del Test / Escenario | Nivel | Responsable |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Secc 1.2 / 3 (Regla I):** MOQ estándar y cajas cerradas | `order.rules.ts` | `SCN-PRIO-U1` | Validación de MOQ Dinámico (STANDARD vs EXPRESS) | Unit | **Agente 2 (Prioritario)** |
| **Secc 2.1.E / 3 (Regla II):** Precios por volumen y segmento | `order.rules.ts` | `SCN-PRIO-U2` | Resolución de precios unitarios escalonados | Unit | **Agente 2 (Prioritario)** |
| **Secc 4.1:** Costo flete estándar $0 y express $35.000 | `order.rules.ts` | `SCN-SHP-01..02` | Cálculo de flete según modalidad | Unit | Usuario (Complementario) |
| **Secc 2.3.1:** Código Crockford Base32 inconfundible | `order.rules.ts` | `SCN-COD-01..02` | Generación y exclusión de caracteres confusos | Unit | Usuario (Complementario) |
| **Secc 5.2 / 7:** Pasarelas de pago y SystemConfig | `order.rules.ts` | `SCN-PAY-01` | Validación de pasarela activa en SystemConfig | Unit | Usuario (Complementario) |
| **Secc 3 (Regla IV):** Descuento atómico de stock y snapshot | `OrderService.checkout` | `SCN-PRIO-I1` | Checkout transaccional con descuento de stock y snapshot | Integration | **Agente 2 (Prioritario)** |
| **Secc 4.2:** Protocolo reprogramación express (-$10.000 COP) | `OrderService.reschedule` | `SCN-PRIO-I2` | Reprogramación express con compensación y nota | Integration | **Agente 2 (Prioritario)** |
| **Secc 3 (Regla IV / V):** Cancelación y reintegro de stock | `OrderService.cancel` | `SCN-INT-CAN-01` | Reintegro automático de stock y notificación | Integration | Usuario (Complementario) |
| **Secc 1.2 / 4.1:** Simulación dinámica de carrito | `OrderService.calculateCart` | `SCN-INT-CRT-01` | Cálculo de carrito con parámetros SystemConfig | Integration | Usuario (Complementario) |
| **Secc 7:** Lectura tipada y actualización de parámetros | `SystemConfigService` | `SCN-INT-CFG-01..02` | Lectura tipada con fallback y actualización validada | Integration | Usuario (Complementario) |
| **Secc 6.1 / IAM:** Autenticación y roles en Checkout | `POST /checkout` | `SCN-PRIO-A1` | Matriz de seguridad en checkout (401, 403, 201) | API | **Agente 2 (Prioritario)** |
| **Secc 4.2 / IAM:** RBAC exclusivo para reprogramar express | `POST /:id/reschedule` | `SCN-PRIO-A2` | Autorización exclusiva ADMIN/SUPERVISOR (403 vs 200) | API | **Agente 2 (Prioritario)** |
| **Secc 6.1:** Carrito anónimo vs autenticado | `POST /calculate-cart` | `SCN-API-CRT-01..02` | optionalAuthMiddleware: acceso público vs mayorista | API | Usuario (Complementario) |
| **Secc 7 / IAM:** Protección RBAC de SystemConfig | `GET/PUT /config` | `SCN-API-CFG-01..02` | GET (ADMIN/SUPERVISOR) vs PUT (Solo ADMIN) | API | Usuario (Complementario) |

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
      • Fase 3: Cobertura de los códigos de respuesta clave (401, 403, 200, 201, 400).
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
