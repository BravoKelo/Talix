# Talix Product Vision

## Status and authority

**Stage:** Shared core implementation
**Product discovery updated:** October 6, 2026
**Current approved slices:** Business-neutral commerce/fulfillment (Issue #1) and self-service customer signup/editable Talix offerings (Issue #3)

This document owns the confirmed overall product intent. These are requirements for the overall vision, not implemented functionality or authorization to implement the entire product. The bounded core slice and Next.js/Supabase/Vercel foundation are approved. Full-product scope, commercial pricing, provider selection and detailed final UI remain separate decisions.

Discovery source: [Talix FigJam](https://www.figma.com/board/WtSucgcWZBc29V8SXToWKS/Talix?node-id=0-1), refined through explicit product-owner clarifications on October 6, 2026. The board is a visual companion; repository documentation is durable project truth.

## Purpose and strategy

Talix is primarily an online ordering and fulfillment service, connecting managed product data to customer commerce and business operations. Restaurants are the first audience. The shared business foundation is intended to support other business types over time; the industry-specific module defines how that business uses Talix.

Modularity and easy connection to an owner's preferred external tools are strategic differentiators. This is a product objective, not approval of a technical modular architecture or a promise that every third-party tool already has a supported integration.

Build a working shared core before industry-specific modules. Any business type must be able to use the core; industry modules later define how that business type interacts with it. The full vision below does not authorize implementing its entire breadth.

## Clients, subscriptions, locations, and users

- A client can hold multiple subscriptions.
- Each subscription selects one business type and its corresponding industry module.
- One subscription can cover multiple locations of that business type.
- Owners use one login, switch subscriptions, then select a location.
- Employees use one login across subscriptions they have been granted access to.
- Employee access is granted to a subscription; location access and defined roles are configured within it. Roles can differ between locations.
- Talix supplies initial predefined roles; owners can create custom roles.
- Employees switch between authorized locations. Permissions govern what they can view and do.
- Business users include owners/operators, staff handling orders, kitchen/preparation staff, and drivers.
- Business customers can use guest checkout or accounts.
- Talix administrators manage client businesses through their own administrative CRM.

## Application areas

### Shared business core

Business-facing capabilities include product management, BOM and inventory, financial tracking and reporting, business CRM, settings, payment support, employee management, marketing, and communications.

Industry modules shape business-specific options and workflows. Restaurants are the first supported audience; other industry details are not yet defined.

### Website and revenue engine

A shared business website directs customers to Talix's customer-facing revenue engine. Customers select a location before ordering; that location determines the product offering, local inventory, and receiving order queue.

Existing websites can be retained. Initially new website building is handled by Talix staff or outsourced. Longer term, a Talix-owned website-builder module or an external website-builder integration is planned.

Managed products and subscription settings drive the commerce experience: products, cart, checkout, order status, and transactional notifications. The restaurant experience also supports staff-entered counter, phone, and table-service orders and in-person table QR ordering.

### Talix administration

Talix Admin has a separate CRM covering client relationships, subscription information, support history, tickets, billing, and administrative reports. It manages the client's overall relationship with subscription-level detail. It is distinct from the business CRM managing that business's customers.

## Talix customer signup and subscription selection

The owner approved the landing-page signup experience on October 6, 2026 (Pacific). Prospective Talix customers enter business/contact details, choose one business type, select a subscription tier and optional Talix products, and review the total and billing frequency before confirmation. Before live launch, email verification must precede subscription creation. For current development the owner approved deferring email delivery/verification: account creation leads to a confirmation page showing the account email and “(Feature coming soon)”, then Continue to the saved selection and final review. Their selection and business details must survive confirmation and later sign-in. Additional subscriptions use the same selection/review experience.

The signup information is intended to feed the Talix administrative CRM as it grows. The current slice collects business name, contact name/email/phone, billing address, first location name/address and online store address. Additional CRM fields remain to be defined rather than invented now.

Business types, subscription plans and optional Talix products are managed in Talix admin and can be added, edited or withdrawn from new sales at any time. Existing subscriptions preserve their agreed terms. Sample offerings/prices are approved for development; commercial offerings will be defined later. Current subscription billing is simulated, with no charges or card data. Selecting a sample offering does not implement its future benefits. Customer copy uses business language without technology/provider/implementation references.

## Subscription and location configuration

- Branding and business configuration are subscription-level only, with no location-specific branding overrides.
- Each location has its own address, contact details, and operating hours.
- Location operational settings include fulfillment options, immediate/scheduled ordering, table QR payment behavior, preparation stations and routing, inventory, orders, and employee location roles.
- Tool selection is subscription-wide, not per location.
- Reports support subscription-wide and individual-location views, subject to permissions.

## Product management

Owners manage product images, prices, descriptions, and broad product configuration. Available options depend on the subscription's business type.

For restaurants, options include sizes, add-ons, substitutions, and removals, affecting price and BOM material usage where applicable.

Products can be:

- **General:** identical configuration across every location in the subscription.
- **Location specific:** configuration can differ in any way for the relevant location.

General products still have separate inventory quantities at each location, visible by location subject to access. Preparation routing is local operational configuration, not a change to a general product's shared definition.

## BOM, production, and inventory

BOM describes materials and quantities required for a product: recipe ingredients for food or materials for a 3D-printed toy, for example.

BOM calculates/reports only the materials portion of product cost. It is one input to final COGS reporting, not a complete COGS calculation. Other COGS components remain to be defined.

Production behavior is configured per product, available to any business type:

- **Made to order:** selling the product deducts BOM materials.
- **Produced ahead of sale:** production deducts materials and increases finished-product inventory; sales decrease finished-product inventory.

This supersedes the earlier idea that production timing is determined solely by business type. Restaurants can use both workflows, such as meals and pre-produced bottled sauces.

Inventory covers materials and finished goods, receipts, transfers between locations in the same subscription, and adjustments. Every inventory adjustment requires a reason, including adjustments associated with cancellations/refunds. Detailed reversal, waste, costing, and transfer rules remain to be specified; a refund is not assumed to automatically restore materials.

## Restaurant ordering and operations

- Support online customer orders and staff-entered counter, phone, and table-service orders.
- Online and staff-entered orders feed the same location-specific order queue.
- Authorized staff manage preparation, fulfillment, and status.
- Each location chooses pickup, delivery, and dine-in offerings.
- Each location chooses immediate orders, scheduled orders, or both.
- Product customization supports industry-relevant restaurant options.
- Kitchen staff have a dedicated preparation view of the shared queue.
- Order items route to preparation stations, such as bar and kitchen.
- Authorized staff configure stations and product routing separately per location.

### Dine-in

Support table assignments and open tabs. Staff can add items over time, close the tab, and collect payment. Customers can order at their table with a Talix QR code associated with the location/table.

Each location configures whether QR orders join an open tab for later payment or require checkout payment. Tabs support split bills and multiple payment methods.

### Delivery

The built-in delivery module supports a restaurant's own drivers, driver assignment, delivery-status tracking, routes, and dispatch coordination. Drivers access assigned delivery details and update status in Talix under their applicable roles/access.

An owner can replace this tool through an external delivery integration selected for the subscription. Specific providers and integration behavior are not yet defined.

### Payments and corrections

Support online payments and staff-collected payments, including cash; the business controls available methods. Authorized staff can cancel orders and issue full or partial refunds, with actions recorded for reporting. Providers, payment hardware, and detailed payment rules remain undecided.

## Business CRM and customer contact

Customer data is tracked at subscription level; customer activity is attributable to locations for reporting. A customer's activity across locations belongs to the subscription-level relationship.

Customers can order as guests or account holders:

- **Online orders:** email and phone required for notifications and potential future marketing.
- **In-person QR checkout:** email and phone optional.
- **Staff-entered orders:** both are not required.

The latest clarification limits mandatory contact collection to online orders; it supersedes the earlier broader self-checkout requirement.

Account holders can manage marketing preferences. Guest checkout has no preference controls in the confirmed vision; emails generally provide unsubscribe links. Marketing opt-outs stop marketing while preserving transactional confirmations and active-order status updates.

## Marketing and communications

Marketing covers campaigns and promotions, with email/texting sending the associated communications. All marketing efforts are separate from legitimate business communications such as confirmations and status updates.

Capturing contact details and providing unsubscribe links does not resolve channel-specific consent/eligibility requirements. Those remain an open communications requirement; no automatic marketing entitlement is established here.

Transactional notifications and broader post-POC communications automation must be considered separately during POC definition.

## Financial reporting and employee management

Built-in Accounting covers financial tracking and reporting only. Full bookkeeping is outside Talix's product scope and requires an external accounting integration, such as QuickBooks.

BOM contributes materials costs to broader COGS reporting. Reporting also includes business performance and customer/consumer trends, with subscription/location views controlled by permissions.

Employee Management includes scheduling, time tracking, and permissions. Talix can provide payroll-related reports/exports to external payroll/accounting tools. Payroll processing is out of scope; no future Talix payroll module is planned at this time.

## Integration and replacement model

- Talix offers built-in capabilities.
- Selecting an external tool replaces the corresponding built-in tool while selected; parallel use is not the selected model.
- The selection applies to the entire subscription and its locations.
- Owners can remove an external tool at any time, return to the built-in tool, or choose another external tool.
- Existing business data/history and ongoing work should remain available in Talix and carry over where the selected tools support it.
- Transfer limitations must be made clear. Detailed data responsibility, supported providers, mappings, switching procedures, and compatibility remain unresolved.

Do not infer a built-in full bookkeeping or payroll tool from this general replacement principle: those capabilities are explicitly outside Talix scope.

## Timing, open boundaries, and next step

The initial FigJam marked Marketing, Reports, broader Email/Text Automation, Employee Management, and Integrations as post POC. Preserve these as initial sequencing intent, not an approved POC definition. Mandatory access controls and transactional notifications require separate consideration from broader deferred capabilities. Unmarked capabilities are not automatically POC requirements.

The owner approved the initial business-neutral core slice: subscription/location access and configuration, general/local products, generic options, guest online checkout, order fulfillment/status, and payment/refund simulation. See Issue #1. Restaurants, BOM/inventory, QR/table/station/driver workflows, marketing, customer accounts, reporting and external integrations are deferred from this slice. The later owner-approved review batch includes predefined/custom user roles (Issue #9). Remaining detailed questions can be resolved when needed, including additional COGS components, provider compatibility/data portability, communications consent, order/payment edge cases, and commercial subscription terms.

The discovery record alone did not authorize implementation. Subsequent owner approval authorized the bounded core and Next.js, Supabase and Vercel. Real payment processing is explicitly deferred: simulate card approvals/declines/refunds without collecting card data or moving money.

