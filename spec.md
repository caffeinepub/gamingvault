# H4CK.FST

## Current State
The store displays all prices in USD (`$`) using a hardcoded `formatPrice` function in `HomePage.tsx` and `ProductDetailPage.tsx`. There is no currency selector in the UI and no currency context.

## Requested Changes (Diff)

### Add
- `CurrencyContext` (`src/frontend/src/hooks/useCurrency.tsx`) providing selected currency (GBP £, USD $, EUR €), a setter, and a `formatPrice(cents: bigint)` helper that converts and formats using hardcoded exchange rates (USD base: GBP=0.79, EUR=0.92).
- Currency selector dropdown in the `Header` nav bar (between Patreon button and My Orders button) showing the current symbol and allowing switching.
- Persist selected currency to `localStorage` key `hfst_currency`.

### Modify
- `Header.tsx`: add currency selector UI element.
- `HomePage.tsx`: replace local `formatPrice` with `useCurrency().formatPrice`.
- `ProductDetailPage.tsx`: replace local `formatPrice` with `useCurrency().formatPrice`; update "Buy Now" button price display.
- `App.tsx` (or root layout): wrap app in `CurrencyProvider`.

### Remove
- Local `formatPrice` functions in `HomePage.tsx` and `ProductDetailPage.tsx`.

## Implementation Plan
1. Create `src/frontend/src/hooks/useCurrency.tsx` with context, provider, hook, and `formatPrice` utility.
2. Wrap app root in `CurrencyProvider`.
3. Add compact currency toggle (£ / $ / €) in `Header.tsx` nav.
4. Update `HomePage.tsx` to use `useCurrency().formatPrice`.
5. Update `ProductDetailPage.tsx` to use `useCurrency().formatPrice` everywhere prices are displayed.
6. Validate (lint + typecheck + build).
