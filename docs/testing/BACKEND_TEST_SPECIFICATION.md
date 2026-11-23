# ESPECIFICACIÓN MAESTRA DE PRUEBAS DE BACKEND
## FASE 1: REGLAS DE DOMINIO PURO (`order.rules.ts`)

> **Estado:** Aprobado para Ejecución de Pruebas  
> **Versión:** 1.1.0  
> **Fecha de Emisión:** 23 de Noviembre de 2026  
> **Módulo Bajo Prueba:** [`server/src/modules/orders/domain/order.rules.ts`](file:///C:/_code/licores-crm/server/src/modules/orders/domain/order.rules.ts)  
> **Suite de Prueba Unitaria:** [`server/tests/unit/order.rules.test.ts`](file:///C:/_code/licores-crm/server/tests/unit/order.rules.test.ts)  
> **Especificación Técnica Base:** [`TECHNICAL_SPECIFICATION.md`](file:///C:/_code/licores-crm/TECHNICAL_SPECIFICATION.md)  
> **Glosario Ubicuo:** [`GLOSSARY.md`](file:///C:/_code/licores-crm/GLOSSARY.md)  

---

## 1. Resumen Ejecutivo y Alcance de la Fase 1

### 1.1. Contexto Arquitectónico
La plataforma e-commerce de licores (`licores-crm`) está diseñada bajo el patrón de **Monolito Modular (Vertical Slices)** y los principios de **Módulos Profundos (Deep Modules)** y **Diseño Dirigido por el Dominio (DDD)**. 

En este marco arquitectónico, la **Costura 1 (Seam 1: Dominio Puro)** representa el núcleo matemático, lógico e inviolable del negocio. Toda la lógica de cálculo financiero, elegibilidad logística, escalonamiento de precios y codificación canónica reside en funciones puras libres de efectos secundarios dentro de [`order.rules.ts`](file:///C:/_code/licores-crm/server/src/modules/orders/domain/order.rules.ts).

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ARQUITECTURA DE CAPAS                           │
└────────────────────────────────────────────────────────────────────────┘
  [Controladores HTTP / API REST]  ◄── Entrada Shallow (Zod, Express)
                 │
                 ▼
     [Servicios Orquestadores]    ◄── Manejo Transaccional & Persistencia
                 │
                 ▼
 ┌───────────────────────────────┐
 │ COSTURA 1: DOMINIO PURO       │ ◄─── ¡ALCANCE EXCLUSIVO DE LA FASE 1!
 │ (`order.rules.ts`)            │      - Cero I/O (Sin BD, sin Red, sin FS)
 │                               │      - Cero Asincronía (Síncrono puro)
 │ • resolveTieredUnitPrice()    │      - 100% Determinista y Aislado
 │ • validateMinimumOrderQty()   │      - Tiempo de ejecución < 500ms
 │ • calculateShippingFee()      │
 │ • generateOrderCode()         │
 │ • validatePaymentMethodActive│
 └───────────────────────────────┘
```

### 1.2. Propósito de la Fase 1
Garantizar que el 100% de las reglas matemáticas, límites de borde, validaciones de cantidad mínima de pedido (MOQ), bifurcaciones de tarifas logísticas y algoritmos de generación de códigos alfanuméricos funcionen de manera infalible antes de acoplarlos con el motor de persistencia SQLite o el framework web Express.

### 1.3. Fronteras y Límites del Alcance (Boundaries)

| Dimensión | En Alcance (Fase 1) | Fuera de Alcance (Diferido a Fases 2-4) |
| :--- | :--- | :--- |
| **Componentes** | [`server/src/modules/orders/domain/order.rules.ts`](file:///C:/_code/licores-crm/server/src/modules/orders/domain/order.rules.ts) | Servicios (`order.service.ts`), Controladores, Middlewares |
| **Persistencia** | Fixtures canónicos en memoria pura (POJOs tipados) | Base de datos SQLite (`node:sqlite`), Drizzle ORM |
| **I/O & Red** | Inexistente (ejecución síncrona en CPU) | Llamadas HTTP, Pasarelas de Pago, Webhooks |
| **Efectos Secundarios** | Funciones puras (Entrada $\to$ Salida / Error) | Logs en disco, Envíos de Notificaciones (Email/WhatsApp) |
| **Validación Request** | Validación interna de reglas de dominio | Validación de esquemas Zod en capas de transporte |

### 1.4. Estructura de Directorios para Pruebas (`server/tests/`)
Para garantizar un crecimiento ordenado y escalable de la infraestructura de pruebas de calidad de software del backend, se separa la suite de pruebas del código fuente de producción (`server/src/`), organizando las pruebas bajo la carpeta centralizada `server/tests/` clasificada por niveles de la pirámide de testing:

```
server/
├── src/                               # Código de producción (Vertical Slices)
│   ├── db/                            # Esquemas y conexión Drizzle ORM
│   ├── middlewares/                   # Guardrails transversales (auth, roles)
│   └── modules/
│       ├── orders/
│       │   ├── domain/
│       │   │   ├── order.rules.ts     ◄── SUJETO BAJO PRUEBA (Fase 1)
│       │   │   └── order.types.ts     ◄── Contratos y esquemas Zod
│       │   ├── services/
│       │   │   └── order.service.ts   ◄── Orquestación transaccional
│       │   ├── controllers/
│       │   └── order.routes.ts
│       └── ...
└── tests/                             # SUITE CENTRALIZADA DE PRUEBAS
    ├── unit/                          ◄── FASE 1: Pruebas Unitarias de Dominio Puro
    │   └── order.rules.test.ts        ◄── SUITE ACTUAL DE FASE 1
    ├── integration/                   ◄── FASE 2: Pruebas de Integración (Servicios + data.test.db)
    │   └── order.service.test.ts
    ├── api/                           ◄── FASE 3: Pruebas de Contratos HTTP & Endpoints Express
    │   └── order.routes.test.ts
    └── e2e/                           ◄── FASE 4: Flujos Transaccionales Completos de Checkout
        └── checkout-flow.test.ts
```

* **`server/tests/unit/` (Alcance Fase 1):** Aloja pruebas puras de lógica algorítmica y funciones matemáticas. No requiere levantar bases de datos ni servidores Express.
* **`server/tests/integration/` (Fase 2):** Pruebas de servicios orquestadores con base de datos de pruebas aislada (`data.test.db`) y control de transacciones.
* **`server/tests/api/` (Fase 3):** Pruebas sobre la capa HTTP usando Supertest/Fetch contra controladores y validadores Zod.
* **`server/tests/e2e/` (Fase 4):** Pruebas de extremo a extremo que simulan compras reales, reservas de inventario y cancelaciones.

---

## 2. Invariantes de Negocio (Reglas Inviolables)

El sistema impone cinco invariantes fundamentales que ninguna capa superior (servicios, controladores, interfaces gráficas) puede violar bajo ninguna circunstancia:

### Invariante 1: Indivisibilidad en Cajas Cerradas y No Negatividad
* **Unidad Mínima de Venta:** Exclusivamente **Cajas Cerradas (`Case`)**. No existe venta de botellas individuales ni fracciones decimales.
* **Dominio Numérico:** Todas las variables de volumen (`casesQuantity`, `totalCases`, `minCases`, `stockCases`) pertenecen al conjunto de enteros estrictamente positivos ($\mathbb{Z}^+$, donde $\text{valor} \ge 1$). Cantidades de cero ($0$) o números negativos son inmediatamente rechazadas.
* **Moneda Base:** Pesos Colombianos (**COP**). Los valores monetarios unitarios y totales deben ser mayores o iguales a cero ($\ge 0$).

### Invariante 2: Formato Canónico e Inconfundible del Código de Orden (`Order.code`)
* **Longitud Estricta:** Exactamente **13 caracteres** alfanuméricos en mayúscula.
* **Estructura:** `ORD-[YY][MM]-[XXXX]`
  * `ORD-`: Prefijo fijo de 4 caracteres.
  * `[YY][MM]`: 4 dígitos cronológicos de año y mes de creación (ej. `2611` para noviembre de 2026).
  * `-`: Guion separador (1 carácter).
  * `[XXXX]`: 4 caracteres generados con el alfabeto restringido **Crockford Base32**.
* **Alfabeto Crockford Base32 Restringido:**  
  `23456789ABCDEFGHJKMNPQRSTVWXYZ` (32 símbolos).
* **Exclusión de Ambigüedad Visual y Semántica:**
  * Se excluye el `0` (cero) y la letra `O` para evitar confusiones al leer o dictar el código.
  * Se excluye el `1` (uno), la letra `I` y la letra `L` para evitar ambigüedades tipográficas.
  * Se excluye la letra `U` para impedir la formación involuntaria de palabras altisonantes u ofensivas.
* **Expresión Regular Canónica:**
  ```regex
  ^ORD-\d{2}(0[1-9]|1[0-2])-[23456789ABCDEFGHJKMNPQRSTVWXYZ]{4}$
  ```

### Invariante 3: Segmentación Estricta de Precios (RETAIL vs INDUSTRIAL) y Escalonamiento por Volumen
* **Aislamiento de Tarifas:** Un cliente clasificado como `RETAIL` jamás podrá beneficiarse de las tarifas con descuento por volumen reservadas para clientes `INDUSTRIAL`.
* **Escalonamiento Dinámico:** Para clientes `INDUSTRIAL`, la tarifa unitaria por caja se resuelve seleccionando el escalón de mayor volumen que satisfaga la condición:
  $$\text{Tarifa Aplicable} = \max_{\text{minCases} \le \text{casesQuantity}} \{ \text{ProductPrice}(\text{customerType}, \text{minCases}) \}$$
* **Prohibición de Fallback Cruzado:** Si un producto no tiene tarifas registradas para el tipo de cliente solicitante (`customerType`), el sistema debe lanzar un error explícito. Bajo ninguna premisa se sustituirá un precio `RETAIL` por uno `INDUSTRIAL` ni viceversa.

### Invariante 4: Dualidad Logística y Política de Fletes
* **Modalidad Estándar (`STANDARD`):**
  * Pedido mínimo por defecto: $\ge 3$ cajas (`logistics_min_cases_standard`).
  * Costo de flete: **$0 COP** (flete subsidiado incluido con el cumplimiento del MOQ).
* **Modalidad Express Nocturna (`EXPRESS_EMERGENCY`):**
  * Pedido mínimo por defecto: $\ge 1$ caja (`logistics_min_cases_express`).
  * Costo de flete: **$35.000 COP** (`logistics_express_fee_cop`) o tarifa configurable.
* **Gobernanza Dinámica:** Ambos umbrales y el valor del flete provienen de la configuración del sistema (`SystemConfig`) y sus valores pasados por parámetro anulan los valores por defecto.

### Invariante 5: Validación de Pasarelas de Pago Habilitadas
* Todo método de pago seleccionado (`CASH_ON_DELIVERY`, `BANK_TRANSFER`, `CREDIT_CARD`) debe contrastarse contra su bandera booleana activa en `SystemConfig`.
* Si la pasarela está deshabilitada (`false`), la orden no puede procesarse y debe abortar con un mensaje amigable al comprador.

---

## 3. Precondiciones y Postcondiciones del Sistema

A continuación se detalla el contrato formal de entrada y salida para cada función pura del dominio:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        CONTRATOS DE ENTRADA Y SALIDA                                   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.1. `validateMinimumOrderQuantity(totalCases, deliveryType, minCasesStandard?, minCasesExpress?)`

* **Precondiciones:**
  * `totalCases` es un valor numérico finito.
  * `deliveryType` es una cadena válida: `"STANDARD"` o `"EXPRESS_EMERGENCY"`.
  * `minCasesStandard` (opcional, default: `3`) es un entero $\ge 1$.
  * `minCasesExpress` (opcional, default: `1`) es un entero $\ge 1$.
* **Postcondiciones (Éxito):**
  * Retorna `void` (ejecución sin interrupciones).
* **Postcondiciones (Fallo):**
  * Lanza `Error` con mensaje descriptivo si:
    * `deliveryType === "STANDARD"` y `totalCases < minCasesStandard`.
    * `deliveryType === "EXPRESS_EMERGENCY"` y `totalCases < minCasesExpress`.

---

### 3.2. `calculateShippingFee(deliveryType, expressFeeCop?)`

* **Precondiciones:**
  * `deliveryType` es `"STANDARD"` o `"EXPRESS_EMERGENCY"`.
  * `expressFeeCop` (opcional, default: `35000`) es un número entero $\ge 0$.
* **Postcondiciones (Éxito):**
  * Retorna `0` si `deliveryType === "STANDARD"`.
  * Retorna el valor de `expressFeeCop` (ej. `35000`) si `deliveryType === "EXPRESS_EMERGENCY"`.
* **Postcondiciones (Fallo):**
  * No produce fallos para entradas válidas del tipo.

---

### 3.3. `resolveTieredUnitPrice(prices, customerType, casesQuantity)`

* **Precondiciones:**
  * `prices` es un arreglo de `ProductPrice` asociados a un mismo `productId`.
  * `customerType` es `"RETAIL"` o `"INDUSTRIAL"`.
  * `casesQuantity` es un número entero $\ge 1$.
* **Postcondiciones (Éxito):**
  * Retorna un objeto `{ unitPrice: number, appliedMinCases: number }` donde:
    * `unitPrice` corresponde al precio del escalón más ventajoso que cumpla `casesQuantity >= minCases`.
    * `appliedMinCases` indica el umbral del escalón activado.
    * Si la cantidad es inferior al menor `minCases`, aplica como fallback el escalón base (menor `minCases`) de ese `customerType`.
* **Postcondiciones (Fallo):**
  * Lanza `Error("No prices configured for customer type <customerType>")` si no existe ningún precio para ese segmento.

---

### 3.4. `generateOrderCode(date?)`

* **Precondiciones:**
  * `date` (opcional, default: `new Date()`) es una instancia válida de `Date`.
* **Postcondiciones (Éxito):**
  * Retorna un `string` de longitud exactamente igual a 13 caracteres.
  * Los primeros 4 caracteres coinciden con `ORD-`.
  * Los caracteres 5 al 8 representan `YYMM` de la fecha provista.
  * El carácter 9 es un guion `-`.
  * Los caracteres 10 al 13 son 4 símbolos tomados exclusivamente del alfabeto Crockford Base32 `[23456789ABCDEFGHJKMNPQRSTVWXYZ]`.
* **Postcondiciones (Fallo):**
  * No produce fallos para fechas válidas.

---

### 3.5. `getPaymentMethodConfigKey(paymentMethod)`

* **Precondiciones:**
  * `paymentMethod` es `"CASH_ON_DELIVERY"`, `"BANK_TRANSFER"`, `"CREDIT_CARD"` o `"CREDIT"`.
* **Postcondiciones (Éxito):**
  * Retorna `"payment_cod_enabled"` para `"CASH_ON_DELIVERY"`.
  * Retorna `"payment_bank_transfer_enabled"` para `"BANK_TRANSFER"`.
  * Retorna `"payment_credit_card_enabled"` para `"CREDIT_CARD"` o `"CREDIT"`.
* **Postcondiciones (Fallo):**
  * Lanza `Error("Método de pago no reconocido: <paymentMethod>")` si el método no está tipado o es inválido.

---

### 3.6. `validatePaymentMethodActive(paymentMethod, isEnabled)`

* **Precondiciones:**
  * `paymentMethod` es un método de pago soportado.
  * `isEnabled` es un booleano (`true` o `false`).
* **Postcondiciones (Éxito):**
  * Retorna `void` si `isEnabled === true`.
* **Postcondiciones (Fallo):**
  * Lanza `Error("El método de pago '<Nombre Amigable>' se encuentra temporalmente inactivo.")` si `isEnabled === false`.

---

## 4. Contrato de Mensajes de Error

Para mantener una experiencia de usuario (UX) coherente en el frontend y evitar mensajes crípticos o técnicos, las funciones de dominio emiten mensajes estandarizados bajo el siguiente contrato:

| Código Interno | Disparador de la Falla | Mensaje Canónico Emitido por el Dominio | Texto Recomendado para Toast/Alert UI | Código HTTP Mapeable |
| :--- | :--- | :--- | :--- | :--- |
| `ERR_MOQ_STANDARD` | `STANDARD` y `totalCases < minCasesStandard` | `Pedido mínimo no alcanzado: El despacho estándar requiere al menos {minCasesStandard} cajas (solicitadas: {totalCases}).` | *"El pedido estándar requiere mínimo {minCasesStandard} cajas para despacho gratuito. Añade más cajas a tu carrito."* | `400 Bad Request` |
| `ERR_MOQ_EXPRESS` | `EXPRESS_EMERGENCY` y `totalCases < minCasesExpress` | `Pedido mínimo no alcanzado: El despacho express nocturno requiere al menos {minCasesExpress} caja (solicitadas: {totalCases}).` | *"El pedido express requiere al menos {minCasesExpress} caja para despachar de inmediato."* | `400 Bad Request` |
| `ERR_NO_PRICES_SEGMENT` | Catálogo sin precios para el `customerType` | `No prices configured for customer type {customerType}` | *"No hay lista de precios configurada para tu tipo de cuenta ({customerType}). Contacta a tu asesor comercial."* | `422 Unprocessable` |
| `ERR_PAYMENT_INACTIVE` | Método de pago con bandera `isEnabled === false` | `El método de pago '{friendlyName}' se encuentra temporalmente inactivo.` | *"El método de pago '{friendlyName}' no está disponible temporalmente. Por favor selecciona otro medio de pago."* | `400 Bad Request` |
| `ERR_PAYMENT_UNKNOWN` | Cadena de método de pago no registrada | `Método de pago no reconocido: {paymentMethod}` | *"Método de pago no admitido por el sistema."* | `400 Bad Request` |

### Mapeo de Nombres Amigables de Pasarelas:
* `CASH_ON_DELIVERY` $\to$ `"Contra Entrega (Efectivo/Datáfono)"`
* `BANK_TRANSFER` $\to$ `"Transferencia Bancaria"`
* `CREDIT_CARD` / `CREDIT` $\to$ `"Tarjeta de Crédito / Pasarela"`

---

## 5. Criterios de Aceptación en Formato Gherkin

### Característica 1: Validación de Cantidad Mínima de Pedido (MOQ Dinámico)
```gherkin
Característica: Validación de Cantidad Mínima de Pedido (MOQ)
  Como motor de reglas de checkout
  Quiero verificar que el pedido cumpla con el umbral mínimo de cajas según la modalidad
  Para optimizar los costos de ruta y despacho

  # ---------------------------------------------------------
  # DESPACHO ESTÁNDAR
  # ---------------------------------------------------------
  Escenario: Pedido estándar cumple exactamente el MOQ por defecto
    Dado que el cliente selecciona modalidad de despacho "STANDARD"
    Y los parámetros del sistema definen un pedido mínimo estándar de 3 cajas
    Cuando el cliente agrega un total de 3 cajas al pedido
    Entonces la validación de MOQ debe ser exitosa sin lanzar errores

  Escenario: Pedido estándar supera holgadamente el MOQ por defecto
    Dado que el cliente selecciona modalidad de despacho "STANDARD"
    Y los parámetros del sistema definen un pedido mínimo estándar de 3 cajas
    Cuando el cliente agrega un total de 12 cajas al pedido
    Entonces la validación de MOQ debe ser exitosa sin lanzar errores

  Escenario: Pedido estándar no alcanza el MOQ por defecto (Límite inferior)
    Dado que el cliente selecciona modalidad de despacho "STANDARD"
    Y los parámetros del sistema definen un pedido mínimo estándar de 3 cajas
    Cuando el cliente intenta enviar un pedido con 2 cajas
    Entonces el sistema debe rechazar el pedido con el error:
      """
      Pedido mínimo no alcanzado: El despacho estándar requiere al menos 3 cajas (solicitadas: 2).
      """

  Escenario: Pedido estándar con cero cajas
    Dado que el cliente selecciona modalidad de despacho "STANDARD"
    Cuando el cliente intenta enviar un pedido con 0 cajas
    Entonces el sistema debe rechazar el pedido con el error:
      """
      Pedido mínimo no alcanzado: El despacho estándar requiere al menos 3 cajas (solicitadas: 0).
      """

  # ---------------------------------------------------------
  # DESPACHO EXPRESS NOCTURNO
  # ---------------------------------------------------------
  Escenario: Pedido express nocturno cumple el MOQ por defecto
    Dado que el cliente selecciona modalidad de despacho "EXPRESS_EMERGENCY"
    Y los parámetros del sistema definen un pedido mínimo express de 1 caja
    Cuando el cliente agrega 1 caja de emergencia al pedido
    Entonces la validación de MOQ debe ser exitosa sin lanzar errores

  Escenario: Pedido express nocturno con volumen mayor
    Dado que el cliente selecciona modalidad de despacho "EXPRESS_EMERGENCY"
    Cuando el cliente agrega 4 cajas de emergencia al pedido
    Entonces la validación de MOQ debe ser exitosa sin lanzar errores

  Escenario: Pedido express nocturno con cero cajas
    Dado que el cliente selecciona modalidad de despacho "EXPRESS_EMERGENCY"
    Y los parámetros del sistema definen un pedido mínimo express de 1 caja
    Cuando el cliente intenta enviar un pedido con 0 cajas
    Entonces el sistema debe rechazar el pedido con el error:
      """
      Pedido mínimo no alcanzado: El despacho express nocturno requiere al menos 1 caja (solicitadas: 0).
      """

  # ---------------------------------------------------------
  # PARÁMETROS DINÁMICOS DE SYSTEMCONFIG
  # ---------------------------------------------------------
  Escenario: Parámetro dinámico de SystemConfig eleva el MOQ estándar a 5 cajas
    Dado que el administrador configuró "logistics_min_cases_standard" en 5
    Y el cliente selecciona modalidad "STANDARD"
    Cuando el cliente agrega 4 cajas al pedido
    Entonces el sistema debe rechazar el pedido indicando que se requieren 5 cajas
    Pero si el cliente agrega 5 cajas la validación debe ser aprobada

  Escenario: Parámetro dinámico de SystemConfig eleva el MOQ express a 2 cajas
    Dado que el administrador configuró "logistics_min_cases_express" en 2
    Y el cliente selecciona modalidad "EXPRESS_EMERGENCY"
    Cuando el cliente agrega 1 caja al pedido
    Entonces el sistema debe rechazar el pedido indicando que se requieren 2 caja
    Pero si el cliente agrega 2 cajas la validación debe ser aprobada
```

---

### Característica 2: Cálculo de Fletes para Logística Dual
```gherkin
Característica: Cálculo de Fletes para Logística Dual
  Como motor de tarifación financiera
  Quiero calcular el costo de envío exacto según la urgencia del despacho
  Para cobrar el recargo operativo adecuado o bonificar el envío estándar

  Escenario: Flete gratuito para despacho estándar por defecto
    Dado que el pedido tiene modalidad "STANDARD"
    Cuando se calcula el costo de flete
    Entonces el valor del flete debe ser exactamente 0 COP

  Escenario: Flete estándar permanece en cero incluso si se pasa parámetro express
    Dado que el pedido tiene modalidad "STANDARD"
    Y la tarifa express configurada es de 45000 COP
    Cuando se calcula el costo de flete
    Entonces el valor del flete debe mantenerse en 0 COP

  Escenario: Recargo fijo para despacho express nocturno por defecto
    Dado que el pedido tiene modalidad "EXPRESS_EMERGENCY"
    Cuando se calcula el costo de flete sin especificar recargo personalizado
    Entonces el valor del flete retornado debe ser de 35000 COP

  Escenario: Recargo dinámico para despacho express nocturno desde SystemConfig
    Dado que el pedido tiene modalidad "EXPRESS_EMERGENCY"
    Y el valor dinámico de "logistics_express_fee_cop" es 42000 COP
    Cuando se calcula el costo de flete pasando 42000 COP
    Entonces el valor del flete retornado debe ser de 42000 COP
```

---

### Característica 3: Resolución de Precios Unitarios Escalonados (Tiered Pricing) y Aislamiento de Segmentos
```gherkin
Característica: Resolución de Precios Unitarios Escalonados por Volumen
  Como motor de catálogo y fijación de precios
  Quiero aplicar la tarifa por caja según el tipo de cliente y el volumen adquirido
  Para recompensar a clientes mayoristas y mantener la integridad comercial

  # ---------------------------------------------------------
  # SEGMENTO RETAIL (PRECIO PLANO INDEPENDIENTE DEL VOLUMEN)
  # ---------------------------------------------------------
  Escenario: Cliente RETAIL comprando volumen bajo
    Dado un producto con precio RETAIL de 150000 COP (minCases: 1)
    Y precios INDUSTRIAL escalonados a menor costo
    Cuando un cliente tipo "RETAIL" compra 1 caja
    Entonces el precio unitario liquidado debe ser 150000 COP
    Y el escalón aplicado debe ser minCases 1

  Escenario: Cliente RETAIL comprando gran volumen no accede a tarifas INDUSTRIAL
    Dado un producto con precio RETAIL de 150000 COP (minCases: 1)
    Y un escalón INDUSTRIAL de 110000 COP para más de 10 cajas
    Cuando un cliente tipo "RETAIL" compra 20 cajas
    Entonces el precio unitario liquidado debe permanecer en 150000 COP
    Y en ningún caso debe descender a 110000 COP

  # ---------------------------------------------------------
  # SEGMENTO INDUSTRIAL (VOLUMEN ESCALONADO)
  # ---------------------------------------------------------
  Escenario: Cliente INDUSTRIAL comprando en Escalón 1 (Volumen Base)
    Dado los siguientes escalones para cliente INDUSTRIAL:
      | minCases | unitPrice (COP) |
      | 1        | 130000          |
      | 5        | 120000          |
      | 10       | 110000          |
    Cuando un cliente tipo "INDUSTRIAL" compra 3 cajas
    Entonces el precio unitario liquidado debe ser 130000 COP
    Y el escalón aplicado debe ser minCases 1

  Escenario: Cliente INDUSTRIAL comprando en Escalón 2 (Umbral Intermedio)
    Dado los mismos escalones para cliente INDUSTRIAL
    Cuando un cliente tipo "INDUSTRIAL" compra exactamente 5 cajas
    Entonces el precio unitario liquidado debe ser 120000 COP
    Y el escalón aplicado debe ser minCases 5

  Escenario: Cliente INDUSTRIAL comprando en Escalón 2 (Rango Intermedio)
    Dado los mismos escalones para cliente INDUSTRIAL
    Cuando un cliente tipo "INDUSTRIAL" compra 8 cajas
    Entonces el precio unitario liquidado debe ser 120000 COP
    Y el escalón aplicado debe ser minCases 5

  Escenario: Cliente INDUSTRIAL comprando en Escalón 3 (Volumen Máximo)
    Dado los mismos escalones para cliente INDUSTRIAL
    Cuando un cliente tipo "INDUSTRIAL" compra 15 cajas
    Entonces el precio unitario liquidado debe ser 110000 COP
    Y el escalón aplicado debe ser minCases 10

  # ---------------------------------------------------------
  # MANEJO DE EXCEPCIONES Y SEGURIDAD DE SEGMENTO
  # ---------------------------------------------------------
  Escenario: Intento de cotizar producto sin matriz de precios para el segmento
    Dado un producto que únicamente cuenta con tarifas para clientes "RETAIL"
    Cuando se solicita resolver el precio unitario para un cliente "INDUSTRIAL" con 2 cajas
    Entonces el sistema debe fallar inmediatamente con el error:
      """
      No prices configured for customer type INDUSTRIAL
      """
```

---

### Característica 4: Generación y Validación de Código Crockford Base32
```gherkin
Característica: Generación Canónica de Códigos de Pedido
  Como sistema transaccional
  Quiero generar identificadores de pedido concisos, cronológicos y legibles
  Para que clientes y operarios puedan dictarlos al teléfono sin confusiones

  Escenario: Código generado cumple longitud exacta y prefijo cronológico
    Dado que la orden se genera el 23 de Noviembre de 2026
    Cuando se invoca la función de generación de código con esa fecha
    Entonces el código retornado debe tener exactamente 13 caracteres de longitud
    Y debe comenzar con el prefijo "ORD-2611-"
    Y debe finalizar con un bloque aleatorio de 4 caracteres alfanuméricos válidos

  Escenario: Ausencia total de caracteres ambiguos (I, L, O, U, 0, 1) en múltiples iteraciones
    Dado un proceso de generación masiva de 100 códigos consecutivos
    Cuando se analiza la porción aleatoria de cada código generado
    Entonces ninguno de los códigos debe contener los caracteres "I", "L", "O", "U" (mayúsculas o minúsculas)
    Y ninguno de los códigos debe contener dígitos ambiguos "0" o "1"
    Y cada código debe coincidir fielmente con el patrón regex:
      """
      ^ORD-\d{2}(0[1-9]|1[0-2])-[23456789ABCDEFGHJKMNPQRSTVWXYZ]{4}$
      """
```

---

### Característica 5: Validación de Pasarelas de Pago Activas contra SystemConfig
```gherkin
Característica: Validación de Pasarelas de Pago Habilitadas
  Como pasarela de validación comercial
  Quiero comprobar que el método de pago elegido esté encendido en la configuración
  Para prevenir pedidos con métodos suspendidos por mantenimiento o liquidez

  Escenario: Mapeo correcto de métodos a claves de configuración
    Cuando se solicita la clave de configuración para los siguientes métodos:
      | paymentMethod      | expectedConfigKey                 |
      | "CASH_ON_DELIVERY" | "payment_cod_enabled"             |
      | "BANK_TRANSFER"    | "payment_bank_transfer_enabled"   |
      | "CREDIT_CARD"      | "payment_credit_card_enabled"     |
      | "CREDIT"           | "payment_credit_card_enabled"     |
    Entonces la clave devuelta debe coincidir exactamente con el valor esperado

  Escenario: Aprobación de métodos de pago activos
    Dado que el método "CASH_ON_DELIVERY" tiene bandera de habilitación en true
    Cuando se valida el método de pago
    Entonces la validación no debe emitir ninguna excepción

  Escenario: Rechazo de método Contra Entrega temporalmente inactivo
    Dado que el método "CASH_ON_DELIVERY" se encuentra deshabilitado (false)
    Cuando se valida el método de pago
    Entonces el sistema debe abortar con el mensaje:
      """
      El método de pago 'Contra Entrega (Efectivo/Datáfono)' se encuentra temporalmente inactivo.
      """

  Escenario: Rechazo de método Transferencia Bancaria inactivo
    Dado que el método "BANK_TRANSFER" se encuentra deshabilitado (false)
    Cuando se valida el método de pago
    Entonces el sistema debe abortar con el mensaje:
      """
      El método de pago 'Transferencia Bancaria' se encuentra temporalmente inactivo.
      """

  Escenario: Rechazo de método no reconocido por el sistema
    Dado un método de pago desconocido o no soportado "BITCOIN_LIGHTNING"
    Cuando se intenta obtener su clave de configuración
    Entonces el sistema debe arrojar un error indicando "Método de pago no reconocido: BITCOIN_LIGHTNING"
```

---

## 6. Datos Canónicos de Prueba (Fixtures de Referencia)

Para garantizar consistencia y repetibilidad en toda la suite de pruebas automatizadas, se definen los siguientes fixtures canónicos en TypeScript:

```typescript
// Fixtures de Referencia Canónicos (In-Memory Data)

export interface CanonicalProductFixture {
  id: number;
  sku: string;
  name: string;
  category: string;
  stockCases: number;
  bottlesPerCase: number;
}

export interface CanonicalPriceFixture {
  id: number;
  productId: number;
  customerType: "RETAIL" | "INDUSTRIAL";
  minCases: number;
  unitPrice: number;
}

/**
 * Catálogo Canónico de Productos para Pruebas Unitarias
 */
export const FIXTURE_PRODUCTS: Record<string, CanonicalProductFixture> = {
  BUCHANANS_12: {
    id: 101,
    sku: "WHI-BUCH12-C12",
    name: "Whisky Buchanan's Deluxe 12 Años",
    category: "Whisky",
    stockCases: 50,
    bottlesPerCase: 12,
  },
  ZACAPA_23: {
    id: 102,
    sku: "RON-ZAC23-C06",
    name: "Ron Zacapa Centenario 23 Solera Gran Reserva",
    category: "Ron",
    stockCases: 25,
    bottlesPerCase: 6,
  },
  DON_JULIO_REPO: {
    id: 103,
    sku: "TEQ-DJUL-REP-C06",
    name: "Tequila Don Julio Reposado",
    category: "Tequila",
    stockCases: 15,
    bottlesPerCase: 6,
  },
  ANTIOQUENO_AZUL: {
    id: 104,
    sku: "AGU-ANT-AZU-C12",
    name: "Aguardiente Antioqueño Tapa Azul Sin Azúcar",
    category: "Aguardiente",
    stockCases: 100,
    bottlesPerCase: 12,
  },
};

/**
 * Matriz Canónica de Precios Escalonados
 */
export const FIXTURE_PRICES: CanonicalPriceFixture[] = [
  // Buchanan's 12 - RETAIL (Precio Plano)
  { id: 1, productId: 101, customerType: "RETAIL", minCases: 1, unitPrice: 1850000 },

  // Buchanan's 12 - INDUSTRIAL (Escalonado por Volumen)
  { id: 2, productId: 101, customerType: "INDUSTRIAL", minCases: 1, unitPrice: 1650000 },
  { id: 3, productId: 101, customerType: "INDUSTRIAL", minCases: 5, unitPrice: 1550000 },
  { id: 4, productId: 101, customerType: "INDUSTRIAL", minCases: 10, unitPrice: 1480000 },

  // Ron Zacapa 23 - RETAIL
  { id: 5, productId: 102, customerType: "RETAIL", minCases: 1, unitPrice: 1420000 },

  // Ron Zacapa 23 - INDUSTRIAL
  { id: 6, productId: 102, customerType: "INDUSTRIAL", minCases: 1, unitPrice: 1300000 },
  { id: 7, productId: 102, customerType: "INDUSTRIAL", minCases: 3, unitPrice: 1220000 },

  // Don Julio Reposado - SOLO RETAIL (Para probar fallo por segmento sin precio)
  { id: 8, productId: 103, customerType: "RETAIL", minCases: 1, unitPrice: 1750000 },
];

/**
 * Configuración Operativa Canónica (SystemConfig)
 */
export const FIXTURE_SYSTEM_CONFIG = {
  logistics_min_cases_standard: { key: "logistics_min_cases_standard", value: 3, type: "NUMBER" },
  logistics_min_cases_express: { key: "logistics_min_cases_express", value: 1, type: "NUMBER" },
  logistics_express_fee_cop: { key: "logistics_express_fee_cop", value: 35000, type: "NUMBER" },
  logistics_express_reschedule_discount_cop: { key: "logistics_express_reschedule_discount_cop", value: 10000, type: "NUMBER" },
  logistics_express_enabled: { key: "logistics_express_enabled", value: true, type: "BOOLEAN" },
  payment_cod_enabled: { key: "payment_cod_enabled", value: true, type: "BOOLEAN" },
  payment_bank_transfer_enabled: { key: "payment_bank_transfer_enabled", value: true, type: "BOOLEAN" },
  payment_credit_card_enabled: { key: "payment_credit_card_enabled", value: true, type: "BOOLEAN" },
};
```

---

## 7. Matriz de Trazabilidad de Requisitos (RTM)

La siguiente tabla traza de extremo a extremo cada acápite de la [`TECHNICAL_SPECIFICATION.md`](file:///C:/_code/licores-crm/TECHNICAL_SPECIFICATION.md) con la regla implementada, el escenario Gherkin formulado y su test unitario en [`server/tests/unit/order.rules.test.ts`](file:///C:/_code/licores-crm/server/tests/unit/order.rules.test.ts):

| Cláusula Especificación Técnica | Regla en `order.rules.ts` | ID Escenario Gherkin | Nombre del Test en Vitest (`server/tests/unit/order.rules.test.ts`) | Estado de Cobertura |
| :--- | :--- | :--- | :--- | :--- |
| **Secc 1.2 / Secc 3 (Regla I):** Unidad de medida en cajas cerradas y MOQ | `validateMinimumOrderQuantity()` | `SCN-MOQ-01` a `SCN-MOQ-04` | `debe permitir pedido estándar cuando alcanza o supera el MOQ configurado...` | :white_check_mark: Cubierto (100%) |
| **Secc 4.1:** Logística Dual, SLA y MOQ express nocturno | `validateMinimumOrderQuantity()` | `SCN-MOQ-05` a `SCN-MOQ-07` | `debe permitir pedido express nocturno con 1 o más cajas / rechazar con 0` | :white_check_mark: Cubierto (100%) |
| **Secc 4.1 / Secc 7:** Parámetros dinámicos de MOQ en SystemConfig | `validateMinimumOrderQuantity(..., minStd, minExp)` | `SCN-MOQ-08`, `SCN-MOQ-09` | `debe respetar los parámetros dinámicos de MOQ provenientes de SystemConfig` | :white_check_mark: Cubierto (100%) |
| **Secc 4.1:** Costo de envío estándar ($0 COP) | `calculateShippingFee()` | `SCN-SHP-01`, `SCN-SHP-02` | `debe retornar flete de 0 COP para despacho estándar` | :white_check_mark: Cubierto (100%) |
| **Secc 4.1 / Secc 7:** Recargo express nocturno ($35.000 COP y configurable) | `calculateShippingFee(..., feeCop)` | `SCN-SHP-03`, `SCN-SHP-04` | `debe retornar 35.000 COP para despacho express... / respetar valor dinámico` | :white_check_mark: Cubierto (100%) |
| **Secc 2.1.E / Secc 3 (Regla II):** Matriz de precios por volumen y segmento | `resolveTieredUnitPrice()` | `SCN-PRC-01` a `SCN-PRC-06` | `debe aplicar precio base para RETAIL... / escalones correctos para INDUSTRIAL` | :white_check_mark: Cubierto (100%) |
| **Secc 3 (Regla II):** Aislamiento de segmentos y fallo por catálogo sin tarifa | `resolveTieredUnitPrice()` | `SCN-PRC-07` | `debe lanzar un error si no existen precios para el tipo de cliente` | :white_check_mark: Cubierto (100%) |
| **Secc 2.3.1:** Patrón de código de orden `ORD-YYMM-XXXX` (Crockford Base32) | `generateOrderCode()` | `SCN-COD-01`, `SCN-COD-02` | `debe generar un código con el formato ORD-YYMM-XXXX usando Crockford Base32` | :white_check_mark: Cubierto (100%) |
| **Secc 2.3.1:** Exclusión de caracteres ambiguos (I, L, O, U, 0, 1) | `generateOrderCode()` | `SCN-COD-02` | `no debe contener caracteres ambiguos excluidos de Crockford Base32...` | :white_check_mark: Cubierto (100%) |
| **Secc 5.2 / Secc 7:** Mapeo de métodos de pago a SystemConfig | `getPaymentMethodConfigKey()` | `SCN-PAY-01` | `debe mapear correctamente los métodos de pago a sus claves de SystemConfig` | :white_check_mark: Cubierto (100%) |
| **Secc 5.2 / Secc 7:** Validación de pasarelas de pago habilitadas / deshabilitadas | `validatePaymentMethodActive()` | `SCN-PAY-02` a `SCN-PAY-05` | `debe permitir métodos activos / rechazar métodos desactivados con mensaje...` | :white_check_mark: Cubierto (100%) |

---

## 8. Definición de Hecho (DoD - Definition of Done) para la Suite de Pruebas

Para considerar que la Fase 1 de pruebas está **100% Completada y Aprobada para Producción**, la suite de pruebas unitarias (`server/tests/unit/order.rules.test.ts`) debe cumplir de forma rigurosa los siguientes criterios:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CRITERIOS DE ACEPTACIÓN (DoD)                   │
└────────────────────────────────────────────────────────────────────────┘
 [✓] 1. 100% de Pruebas en Verde (0 Fallos, 0 Saltos / Skips no justificados).
 [✓] 2. 0 Errores del Compilador TypeScript (`tsc --noEmit` limpio).
 [✓] 3. Tiempo de Ejecución Ultra-rápido: Suite completa ejecutada en < 500 ms.
 [✓] 4. Cobertura de Código Mínima:
      • Branch Coverage:   100% en `order.rules.ts`.
      • Statement/Line:    100% en `order.rules.ts`.
      • Function Coverage: 100% en `order.rules.ts`.
 [✓] 5. Ubicación Estándar: Archivo suite en `server/tests/unit/order.rules.test.ts`.
 [✓] 6. Aislamiento Total: 0 llamadas de red, 0 accesos a SQLite, 0 I/O de disco.
 [✓] 7. Determinismo Absoluto: Concurrencia segura (`concurrent: true`), sin carreras.
 [✓] 8. Validaciones Negativas Robustas: Cada excepción esperada debe verificar
      tanto el lanzamiento del error como la coincidencia estricta de su mensaje.
```

---

## 9. Política de Aislamiento de Base de Datos para Fases Posteriores

Aunque la **Fase 1** opera sobre dominio puro en memoria, esta especificación establece la política estricta de aislamiento de persistencia para la inminente **Fase 2 (Pruebas de Integración y Servicios)**:

### 9.1. Segregación de Archivos de Base de Datos
* **Ambiente de Desarrollo:** `server/data.db` (utilizado exclusivamente en modo dev).
* **Ambiente de Pruebas Automatizadas:** `server/data.test.db` (o base de datos SQLite en memoria `:memory:` mediante `node:sqlite`).
* **Protección de Entorno:**
  * El runner de pruebas forzará la variable de entorno `NODE_ENV=test`.
  * Cualquier intento de inicializar la conexión en modo test contra `data.db` abortará de inmediato el proceso.

### 9.2. Ciclo de Vida y Teardown de Datos de Prueba (Sandbox State)
1. **Fase Pre-Suite (`beforeAll`):**
   * Creación limpia del esquema relacional completo aplicando las migraciones de Drizzle ORM sobre la base de datos de pruebas.
   * Carga de semillas base controladas (`fixtures dummy`).
2. **Fase Entre Pruebas (`beforeEach` / `afterEach`):**
   * Cada prueba de integración debe ejecutarse dentro de una transacción aislada o limpiar las tablas transaccionales (`orders`, `order_items`) al finalizar.
   * Los productos y parámetros de `system_config` deben restablecerse a su estado canónico al concluir cada test para evitar la contaminación cruzada entre pruebas (Test State Bleeding).
3. **Fase Post-Suite (`afterAll`):**
   * Cierre seguro de todas las conexiones activas al motor SQLite.
   * Eliminación física del archivo temporal `data.test.db` y sus archivos auxiliares (`-wal`, `-shm`) para garantizar un entorno estéril y reproducibilidad idéntica en pipelines de CI/CD.

---

*Documento Maestro compilado por el Agente 1 (Testing Documentation Architect).*  
*Cualquier modificación a las reglas aquí descritas requiere una enmienda formal a la especificación técnica.*
