/* eslint-disable */

// @ts-nocheck

import { IDL } from '@icp-sdk/core/candid';

export const OrderId = IDL.Nat;
export const DiscountType = IDL.Variant({
  'fixed' : IDL.Null,
  'percentage' : IDL.Null,
});
export const ProductId = IDL.Nat;
export const UserRole = IDL.Variant({
  'admin' : IDL.Null,
  'user' : IDL.Null,
  'guest' : IDL.Null,
});
export const Timestamp = IDL.Int;
export const Coupon = IDL.Record({
  'active' : IDL.Bool,
  'value' : IDL.Nat,
  'code' : IDL.Text,
  'createdAt' : Timestamp,
  'discountType' : DiscountType,
});
export const CreditReason = IDL.Variant({
  'manualRefund' : IDL.Null,
  'compensation' : IDL.Null,
  'promoPayment' : IDL.Null,
  'other' : IDL.Text,
});
export const CreditAdjustment = IDL.Record({
  'id' : IDL.Nat,
  'targetUser' : IDL.Principal,
  'amount' : IDL.Nat,
  'reason' : CreditReason,
  'notes' : IDL.Text,
  'isPromoPayment' : IDL.Bool,
  'createdAt' : Timestamp,
  'addedBy' : IDL.Principal,
});
export const GiftCardCode = IDL.Record({
  'value' : IDL.Nat,
  'code' : IDL.Text,
  'redeemed' : IDL.Bool,
  'orderId' : OrderId,
  'buyerPrincipal' : IDL.Principal,
});
export const OrderStatus = IDL.Variant({
  'pending' : IDL.Null,
  'accepted' : Timestamp,
  'declined' : IDL.Null,
});
export const AmazonGiftCardCode = IDL.Text;
export const EthereumWalletAddress = IDL.Text;
export const NexusBankId = IDL.Nat;
export const PayPalEmail = IDL.Text;
export const ClientAddress = IDL.Text;
export const PaymentMethod = IDL.Variant({
  'amazon_gift_card' : AmazonGiftCardCode,
  'ethereum' : EthereumWalletAddress,
  'nexus_bank' : NexusBankId,
  'paypal' : PayPalEmail,
  'bitcoin' : ClientAddress,
});
export const Order = IDL.Record({
  'id' : OrderId,
  'status' : OrderStatus,
  'paymentMethod' : PaymentMethod,
  'productTitle' : IDL.Text,
  'createdAt' : Timestamp,
  'productId' : ProductId,
  'buyer' : IDL.Principal,
  'productPrice' : IDL.Nat,
  'buyerAnswer' : IDL.Opt(IDL.Text),
  'creditUsed' : IDL.Nat,
});
export const Product = IDL.Record({
  'id' : ProductId,
  'title' : IDL.Text,
  'createdAt' : Timestamp,
  'isGiftCard' : IDL.Bool,
  'description' : IDL.Text,
  'giftCardValue' : IDL.Nat,
  'price' : IDL.Nat,
  'accountDetails' : IDL.Text,
  'customQuestion' : IDL.Opt(IDL.Text),
});
export const BuyerContactDetails = IDL.Record({
  'email' : IDL.Opt(IDL.Text),
  'playerId' : IDL.Opt(IDL.Text),
});
export const UserProfile = IDL.Record({ 'name' : IDL.Text });
export const RegisteredUser = IDL.Record({
  'principal' : IDL.Principal,
  'name' : IDL.Text,
  'email' : IDL.Opt(IDL.Text),
  'playerId' : IDL.Opt(IDL.Text),
});

export const idlService = IDL.Service({
  '_initializeAccessControlWithSecret' : IDL.Func([IDL.Text], [], []),
  'acceptOrder' : IDL.Func([OrderId], [], []),
  'addCoupon' : IDL.Func([IDL.Text, DiscountType, IDL.Nat], [], []),
  'addCreditToUser' : IDL.Func([IDL.Principal, IDL.Nat, CreditReason, IDL.Text, IDL.Bool], [], []),
  'addProduct' : IDL.Func(
      [
        IDL.Text,
        IDL.Text,
        IDL.Nat,
        IDL.Text,
        IDL.Opt(IDL.Bool),
        IDL.Opt(IDL.Nat),
        IDL.Opt(IDL.Text),
      ],
      [ProductId],
      [],
    ),
  'assignCallerUserRole' : IDL.Func([IDL.Principal, UserRole], [], []),
  'declineOrder' : IDL.Func([OrderId], [], []),
  'deleteCoupon' : IDL.Func([IDL.Text], [], []),
  'deleteProduct' : IDL.Func([ProductId], [], []),
  'editProduct' : IDL.Func(
      [
        ProductId,
        IDL.Text,
        IDL.Text,
        IDL.Nat,
        IDL.Text,
        IDL.Opt(IDL.Bool),
        IDL.Opt(IDL.Nat),
        IDL.Opt(IDL.Text),
      ],
      [],
      [],
    ),
  'generateGiftCardCode' : IDL.Func([OrderId], [IDL.Text], []),
  'getAllCoupons' : IDL.Func([], [IDL.Vec(Coupon)], ['query']),
  'getAllGiftCardCodes' : IDL.Func([], [IDL.Vec(GiftCardCode)], ['query']),
  'getAllOrders' : IDL.Func([], [IDL.Vec(Order)], ['query']),
  'getAllProducts' : IDL.Func([], [IDL.Vec(Product)], ['query']),
  'getAllRegisteredUsers' : IDL.Func([], [IDL.Vec(RegisteredUser)], ['query']),
  'getBuyerContactDetails' : IDL.Func(
      [IDL.Principal],
      [BuyerContactDetails],
      ['query'],
    ),
  'getCallerUserProfile' : IDL.Func([], [IDL.Opt(UserProfile)], ['query']),
  'getCallerUserRole' : IDL.Func([], [UserRole], ['query']),
  'getCreditAdjustments' : IDL.Func([IDL.Principal], [IDL.Vec(CreditAdjustment)], ['query']),
  'getGiftCardCodeForOrder' : IDL.Func([OrderId], [IDL.Text], ['query']),
  'getOrder' : IDL.Func([OrderId], [Order], ['query']),
  'getOrderAccountDetails' : IDL.Func([OrderId], [IDL.Text], ['query']),
  'getOrderBuyerContact' : IDL.Func(
      [OrderId],
      [BuyerContactDetails],
      ['query'],
    ),
  'getOrdersByBuyer' : IDL.Func([IDL.Principal], [IDL.Vec(Order)], ['query']),
  'getPaymentInstructions' : IDL.Func([IDL.Text], [IDL.Text], ['query']),
  'getProduct' : IDL.Func([ProductId], [Product], ['query']),
  'getUserCredit' : IDL.Func([IDL.Principal], [IDL.Nat], ['query']),
  'getUserProfile' : IDL.Func(
      [IDL.Principal],
      [IDL.Opt(UserProfile)],
      ['query'],
    ),
  'isCallerAdmin' : IDL.Func([], [IDL.Bool], ['query']),
  'placeOrder' : IDL.Func([ProductId, PaymentMethod, IDL.Opt(IDL.Text), IDL.Nat], [OrderId], []),
  'redeemGiftCardCode' : IDL.Func([IDL.Text], [IDL.Nat], []),
  'registerStaff' : IDL.Func([IDL.Text], [], []),
  'saveBuyerContactDetails' : IDL.Func([IDL.Opt(IDL.Text), IDL.Opt(IDL.Text)], [], []),
  'saveCallerUserProfile' : IDL.Func([UserProfile], [], []),
  'setPaymentInstructions' : IDL.Func([IDL.Text, IDL.Text], [], []),
  'validateCoupon' : IDL.Func([IDL.Text], [IDL.Opt(Coupon)], ['query']),
});

export const idlInitArgs = [];

export const idlFactory = ({ IDL }) => {
  const OrderId = IDL.Nat;
  const DiscountType = IDL.Variant({
    'fixed' : IDL.Null,
    'percentage' : IDL.Null,
  });
  const ProductId = IDL.Nat;
  const UserRole = IDL.Variant({
    'admin' : IDL.Null,
    'user' : IDL.Null,
    'guest' : IDL.Null,
  });
  const Timestamp = IDL.Int;
  const Coupon = IDL.Record({
    'active' : IDL.Bool,
    'value' : IDL.Nat,
    'code' : IDL.Text,
    'createdAt' : Timestamp,
    'discountType' : DiscountType,
  });
  const CreditReason = IDL.Variant({
    'manualRefund' : IDL.Null,
    'compensation' : IDL.Null,
    'promoPayment' : IDL.Null,
    'other' : IDL.Text,
  });
  const CreditAdjustment = IDL.Record({
    'id' : IDL.Nat,
    'targetUser' : IDL.Principal,
    'amount' : IDL.Nat,
    'reason' : CreditReason,
    'notes' : IDL.Text,
    'isPromoPayment' : IDL.Bool,
    'createdAt' : Timestamp,
    'addedBy' : IDL.Principal,
  });
  const GiftCardCode = IDL.Record({
    'value' : IDL.Nat,
    'code' : IDL.Text,
    'redeemed' : IDL.Bool,
    'orderId' : OrderId,
    'buyerPrincipal' : IDL.Principal,
  });
  const OrderStatus = IDL.Variant({
    'pending' : IDL.Null,
    'accepted' : Timestamp,
    'declined' : IDL.Null,
  });
  const AmazonGiftCardCode = IDL.Text;
  const EthereumWalletAddress = IDL.Text;
  const NexusBankId = IDL.Nat;
  const PayPalEmail = IDL.Text;
  const ClientAddress = IDL.Text;
  const PaymentMethod = IDL.Variant({
    'amazon_gift_card' : AmazonGiftCardCode,
    'ethereum' : EthereumWalletAddress,
    'nexus_bank' : NexusBankId,
    'paypal' : PayPalEmail,
    'bitcoin' : ClientAddress,
  });
  const Order = IDL.Record({
    'id' : OrderId,
    'status' : OrderStatus,
    'paymentMethod' : PaymentMethod,
    'productTitle' : IDL.Text,
    'createdAt' : Timestamp,
    'productId' : ProductId,
    'buyer' : IDL.Principal,
    'productPrice' : IDL.Nat,
    'buyerAnswer' : IDL.Opt(IDL.Text),
    'creditUsed' : IDL.Nat,
  });
  const Product = IDL.Record({
    'id' : ProductId,
    'title' : IDL.Text,
    'createdAt' : Timestamp,
    'isGiftCard' : IDL.Bool,
    'description' : IDL.Text,
    'giftCardValue' : IDL.Nat,
    'price' : IDL.Nat,
    'accountDetails' : IDL.Text,
    'customQuestion' : IDL.Opt(IDL.Text),
  });
  const BuyerContactDetails = IDL.Record({
    'email' : IDL.Opt(IDL.Text),
    'playerId' : IDL.Opt(IDL.Text),
  });
  const UserProfile = IDL.Record({ 'name' : IDL.Text });
  const RegisteredUser = IDL.Record({
    'principal' : IDL.Principal,
    'name' : IDL.Text,
    'email' : IDL.Opt(IDL.Text),
    'playerId' : IDL.Opt(IDL.Text),
  });
  
  return IDL.Service({
    '_initializeAccessControlWithSecret' : IDL.Func([IDL.Text], [], []),
    'acceptOrder' : IDL.Func([OrderId], [], []),
    'addCoupon' : IDL.Func([IDL.Text, DiscountType, IDL.Nat], [], []),
    'addCreditToUser' : IDL.Func([IDL.Principal, IDL.Nat, CreditReason, IDL.Text, IDL.Bool], [], []),
    'addProduct' : IDL.Func(
        [
          IDL.Text,
          IDL.Text,
          IDL.Nat,
          IDL.Text,
          IDL.Opt(IDL.Bool),
          IDL.Opt(IDL.Nat),
          IDL.Opt(IDL.Text),
        ],
        [ProductId],
        [],
      ),
    'assignCallerUserRole' : IDL.Func([IDL.Principal, UserRole], [], []),
    'declineOrder' : IDL.Func([OrderId], [], []),
    'deleteCoupon' : IDL.Func([IDL.Text], [], []),
    'deleteProduct' : IDL.Func([ProductId], [], []),
    'editProduct' : IDL.Func(
        [
          ProductId,
          IDL.Text,
          IDL.Text,
          IDL.Nat,
          IDL.Text,
          IDL.Opt(IDL.Bool),
          IDL.Opt(IDL.Nat),
          IDL.Opt(IDL.Text),
        ],
        [],
        [],
      ),
    'generateGiftCardCode' : IDL.Func([OrderId], [IDL.Text], []),
    'getAllCoupons' : IDL.Func([], [IDL.Vec(Coupon)], ['query']),
    'getAllGiftCardCodes' : IDL.Func([], [IDL.Vec(GiftCardCode)], ['query']),
    'getAllOrders' : IDL.Func([], [IDL.Vec(Order)], ['query']),
    'getAllProducts' : IDL.Func([], [IDL.Vec(Product)], ['query']),
    'getAllRegisteredUsers' : IDL.Func([], [IDL.Vec(RegisteredUser)], ['query']),
    'getBuyerContactDetails' : IDL.Func(
        [IDL.Principal],
        [BuyerContactDetails],
        ['query'],
      ),
    'getCallerUserProfile' : IDL.Func([], [IDL.Opt(UserProfile)], ['query']),
    'getCallerUserRole' : IDL.Func([], [UserRole], ['query']),
    'getCreditAdjustments' : IDL.Func([IDL.Principal], [IDL.Vec(CreditAdjustment)], ['query']),
    'getGiftCardCodeForOrder' : IDL.Func([OrderId], [IDL.Text], ['query']),
    'getOrder' : IDL.Func([OrderId], [Order], ['query']),
    'getOrderAccountDetails' : IDL.Func([OrderId], [IDL.Text], ['query']),
    'getOrderBuyerContact' : IDL.Func(
        [OrderId],
        [BuyerContactDetails],
        ['query'],
      ),
    'getOrdersByBuyer' : IDL.Func([IDL.Principal], [IDL.Vec(Order)], ['query']),
    'getPaymentInstructions' : IDL.Func([IDL.Text], [IDL.Text], ['query']),
    'getProduct' : IDL.Func([ProductId], [Product], ['query']),
    'getUserCredit' : IDL.Func([IDL.Principal], [IDL.Nat], ['query']),
    'getUserProfile' : IDL.Func(
        [IDL.Principal],
        [IDL.Opt(UserProfile)],
        ['query'],
      ),
    'isCallerAdmin' : IDL.Func([], [IDL.Bool], ['query']),
    'placeOrder' : IDL.Func([ProductId, PaymentMethod, IDL.Opt(IDL.Text), IDL.Nat], [OrderId], []),
    'redeemGiftCardCode' : IDL.Func([IDL.Text], [IDL.Nat], []),
    'registerStaff' : IDL.Func([IDL.Text], [], []),
    'saveBuyerContactDetails' : IDL.Func([IDL.Opt(IDL.Text), IDL.Opt(IDL.Text)], [], []),
    'saveCallerUserProfile' : IDL.Func([UserProfile], [], []),
    'setPaymentInstructions' : IDL.Func([IDL.Text, IDL.Text], [], []),
    'validateCoupon' : IDL.Func([IDL.Text], [IDL.Opt(Coupon)], ['query']),
  });
};

export const init = ({ IDL }) => { return []; };
