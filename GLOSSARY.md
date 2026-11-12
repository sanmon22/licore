# Liquor Distributor E-Commerce Platform

Direct B2B and B2C self-service e-commerce platform for ordering liquor in cases with tiered volume pricing, real-time stock allocation, and multi-branch delivery management.

## Language

### Customers & Accounts

**Customer**:
An individual or business entity registered on the platform to place direct orders, categorized as `RETAIL` or `INDUSTRIAL`.
_Avoid_: Account, Buyer, Client (we standardize on Customer for the e-commerce storefront).

**Customer Type**:
Commercial category (`RETAIL` or `INDUSTRIAL`) assigned to a Customer that determines visible catalog prices and bulk discounts.
_Avoid_: Tier, Segment.

**Delivery Place**:
A registered physical delivery address or venue belonging to a Customer where cases are dispatched.
_Avoid_: Branch, Location, Store, Shipping address.

**Contact**:
The designated recipient or representative at a Delivery Place authorized to receive deliveries.
_Avoid_: Recipient, Agent.

### Catalog & Stock

**Product**:
An alcoholic beverage tracked in inventory and sold strictly in closed Case units.
_Avoid_: Item, Article, Bottle.

**Case**:
The sole standard unit of packaging, ordering, and inventory deduction for a Product.
_Avoid_: Box, Pack, Carton.

**Stock**:
The real-time warehouse availability of Cases for a given Product.
_Avoid_: Units, Inventory count.

**Product Price**:
The pricing rule establishing the Case price for a specific Customer Type and volume tier.
_Avoid_: Tariff, Rate.

### E-Commerce Flow & Checkout

**Cart**:
The customer's active shopping basket accumulating Products and Case quantities, calculating dynamic tiered discounts in real-time.
_Avoid_: Basket, Bag.

**Order**:
The committed commercial transaction submitted by a Customer at checkout, which deducts warehouse Stock immediately.
_Avoid_: Quote, Estimate, Cart (once placed).

**Order Item**:
A line entry within an Order detailing the Product, ordered Case quantity, locked unit price, and subtotal.
_Avoid_: Line, Row, Detail.

**Order Status**:
Fulfillment and payment stage of an Order (`PENDING`, `CONFIRMED`, `DISPATCHED`, `DELIVERED`, `CANCELLED`).
_Avoid_: State, Phase.

**Delivery Type**:
Logistical fulfillment urgency for an Order: `STANDARD` (scheduled delivery) or `EXPRESS_EMERGENCY` (immediate off-hours restock for bars with surcharge).
_Avoid_: Priority, Shipping mode.

**Payment Method**:
Commercial payment vehicle used for an Order: `CASH_ON_DELIVERY`, `BANK_TRANSFER` (with 24h reservation TTL), or `CREDIT_CARD`.
_Avoid_: Credit line, Internal credit (we do not manage internal accounts receivable).

### Administration, Configuration & Roles

**System Config**:
An extensible key-value store of dynamic operational parameters (e.g., minimum order cases, express fees, reservation TTL) adjustable at runtime without code deployments.
_Avoid_: Env vars, Hardcoded flags.

**User**:
An authenticated account holder: either a `CUSTOMER` (placing orders) or an internal operator (`ADMIN`, `SUPERVISOR`).
_Avoid_: Account, Member.

**Role**:
System permission level (`CUSTOMER`, `SUPERVISOR`, `ADMIN`).
_Avoid_: Privilege, Profile.
