# Stripe Managed Payments + Connect Royalty Roadmap

## Executive Summary

Deploy Hub should use a split Stripe architecture:

- `Stripe Managed Payments` for all customer-facing sales
- `Internal royalty ledger` for what each owner is owed
- `Stripe Connect` only as a separate payout service for royalty disbursements

This means:

- Deploy Hub is the seller
- owners are not sellers
- owners are royalty recipients
- Connect is used only to help the platform pay royalties out

## Final Target Architecture

### 1. Customer billing

Use `Stripe Managed Payments` for:

- owner subscription plans
- buyer license purchases
- recurring monthly/yearly license billing
- customer tax/compliance handling
- checkout, receipts, and customer-facing transaction lifecycle

### 2. Royalty accounting

Use an internal `royalty ledger` for:

- tracking sales attributed to an owner
- calculating platform revenue vs owner royalty
- applying hold periods
- determining payable balances

### 3. Royalty payouts

Use `Stripe Connect` only as an outbound payout rail for:

- onboarding royalty recipients
- collecting payout destination details
- checking payout readiness
- disbursing royalty payouts from platform funds

This is not a marketplace seller flow.

## Core Business Model

Deploy Hub sells the product.

The owner:

- creates the project
- creates the license
- chooses pricing and rules
- earns a royalty when the platform makes a sale

The owner does **not**:

- act as merchant of record
- directly sell to the buyer
- own the checkout flow

## What Connect Means In This Model

Connect is not used for:

- destination charges
- marketplace-style seller checkout
- seller-of-record behavior
- routing the original buyer payment to the owner

Connect is only used for:

- recipient onboarding
- storing payout account details
- sending royalty payouts later

So the architecture is:

1. `Managed Payments` = money in
2. `Royalty ledger` = what the platform owes
3. `Connect` = money out

## Before vs After

### Old / mixed model

- Paddle in the architecture
- mixed provider logic
- owner money flow looked partly like marketplace seller payouts
- docs blurred seller vs royalty recipient concepts

### New / target model

- Stripe Managed Payments for all sales
- owner royalties recorded internally
- Connect used only for royalty disbursement
- Deploy Hub is always the seller

## What Owners Will Experience

### Owner workflow

1. create project
2. create license
3. publish offer through Deploy Hub
4. complete royalty payout setup
5. see royalties accrue
6. receive royalty payouts from Deploy Hub

### Owner mental model

Owners should think:

- “I publish through Deploy Hub”
- “Deploy Hub sells my offer”
- “I receive royalties from the platform”

Not:

- “I am the merchant”
- “I sell directly through Stripe”

## Clear Roadmap

## Phase 1: Lock The Architecture Decision

Goal: make the intended money flow explicit everywhere.

### Decision

- seller = Deploy Hub
- checkout = Managed Payments
- royalty accrual = internal ledger
- payout rail = Connect

### Deliverables

- architecture doc updated
- roadmap updated
- internal language aligned

## Phase 2: Remove Paddle Completely

Goal: Paddle is no longer part of the architecture or code direction.

### Tasks

- remove outdated Paddle docs
- remove Paddle env requirements
- remove Paddle runtime assumptions
- delete remaining Paddle compatibility code when safe
- migrate remaining legacy fields

### Deliverables

- no active Paddle architecture
- no new code built around Paddle
- migration backlog for legacy data cleanup

## Phase 3: Move Platform Subscriptions To Managed Payments

Goal: owner subscriptions become fully first-party Managed Payments sales.

### Scope

- `/subscriptions`
- owner billing page
- subscription checkout
- billing portal
- subscription sync/webhooks

### Backend work

- make subscription billing explicitly first-party
- keep provider metadata clear
- align webhooks and checkout handling with Managed Payments usage

## Phase 4: Move License Sales To Managed Payments

Goal: buyer license purchases become fully first-party Managed Payments sales.

### Scope

- `/licenses/:id/checkout`
- order creation
- payment completion
- recurring license billing state
- license activation

### Backend work

- product and price management for license billing
- buyer checkout owned by Deploy Hub
- owner attribution stored only for royalties
- no seller/merchant behavior tied to the owner

### Data model

Track:

- gross sale amount
- platform revenue amount
- owner royalty amount
- owner attribution
- payout status

## Phase 5: Make Royalties The Canonical Payout Domain

Goal: payout APIs and UI should reflect royalty logic directly.

### Tasks

- keep `/royalties/*` as canonical
- remove duplicate old payout route shapes when safe
- rename UI and services toward royalty language
- separate customer billing from payout operations

### Deliverables

- owner sees royalty balances
- admin sees royalty liabilities and payout runs
- no seller-style payout language in the main product

## Phase 6: Keep Connect Only As A Payout Service

Goal: use Connect as infrastructure, not as the business model.

### Connect responsibilities

- recipient onboarding
- payout account readiness
- platform balance visibility
- payout execution
- payout status tracking

### Non-Connect responsibilities

- customer checkout
- tax/compliance for customer sale
- subscription billing
- license sale classification
- royalty calculation

## Phase 7: Strengthen The Royalty Ledger

Goal: make royalties operationally trustworthy.

### Required ledger behavior

- create royalty entries from completed customer sales
- hold royalties for a configured period
- release eligible royalties to payable
- send payouts from platform balance
- mark paid / failed / reversed states clearly

### Admin operations

- review royalty overview
- release pending entries
- process available payouts
- review payout failures
- reconcile provider payout IDs

## Phase 8: Clean Up Legacy Marketplace Assumptions

Goal: remove the old architecture ideas from code and docs.

### Remove over time

- marketplace seller language
- direct owner-sale assumptions
- seller onboarding phrasing
- mixed-route payout APIs
- leftover dual-architecture comments

## What To Delete

### Delete now

- old mixed-provider architecture docs
- old Paddle migration docs

### Delete during implementation

- duplicate non-canonical payout routes
- old payout copy implying seller behavior
- old compatibility aliases once clients are updated

### Delete after data migrations

- legacy billing columns and fixtures
- provider-specific residue from Paddle-era models

## Implementation Order

1. finalize this architecture decision
2. remove Paddle from docs and remaining code direction
3. complete Managed Payments migration for subscriptions
4. complete Managed Payments migration for license sales
5. keep royalties as the canonical payout domain
6. use Connect only for recipient onboarding and royalty payouts
7. clean up duplicate APIs and legacy naming

## Success Criteria

The migration is complete when:

- Deploy Hub subscriptions use Managed Payments
- license sales use Managed Payments
- owners are treated as royalty recipients
- Connect is used only as a payout service
- royalty setup replaces seller-style payment setup
- Paddle is gone from active architecture

## Practical Next Step

Translate this into implementation work against current modules:

1. `subscriptions` -> Managed Payments subscription flow
2. `licenses/orders/payments` -> Managed Payments license sale flow
3. `royalties/payouts` -> Connect-backed royalty payout flow
4. `legacy cleanup` -> remove Paddle residue and duplicate abstractions

That gives us a clean, consistent system:

- one seller
- one checkout story
- one royalty model
- one payout rail
