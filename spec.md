# H4CK.FST

## Current State
The app is a hacker/Matrix-themed ecommerce store. The credit system currently only tracks credit from redeemed gift card codes. The staff panel has no way to manually add credit to a user's account.

## Requested Changes (Diff)

### Add
- `CreditAdjustment` type: amount, reason (Manual Refund | Compensation | Other | Payment for Promotion), notes (required), isPromoPayment flag, timestamp, targetUser
- `addCreditToUser(user, amount, reason, notes, isPromoPayment)` backend function - admin only
- `getCreditAdjustments(user)` backend function - admin or self
- `getAllRegisteredUsers()` backend function - admin only, returns list of users with name/email/playerId for search
- Update `getUserCredit` to include manual credit adjustments in the total
- Staff panel "Credits" tab: search users by name/email/player ID, form to add credit with amount, required reason dropdown, required notes, optional "Payment for Promotion" checkbox

### Modify
- `getUserCredit` - sum gift card redemptions + manual adjustments
- Backend user registration to store playerId for search

### Remove
- Nothing

## Implementation Plan
1. Update backend Motoko: add CreditAdjustment type, creditAdjustments map, addCreditToUser, getCreditAdjustments, getAllRegisteredUsers functions, update getUserCredit
2. Update frontend StaffPage: add Credits tab with user search and add credit form
3. Validate and deploy
