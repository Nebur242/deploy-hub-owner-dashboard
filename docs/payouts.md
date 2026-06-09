# Owner Payouts

The owner dashboard has a payout workspace at `/dashboard/payouts`.

It is designed for this architecture:

- Deploy Hub is the seller of record for customer checkout.
- Stripe handles customer billing for subscriptions and license sales.
- Deploy Hub records owner earnings in an internal royalty ledger.
- Owners complete payout recipient setup so Deploy Hub can disburse royalties.

The page lets owners:

- start or continue royalty payout setup
- sync payout recipient status from the API
- view pending, available, processing, and paid balances
- review royalty ledger entries created from Deploy Hub sales

Owners must complete payout recipient setup before submitting paid public projects for review.
