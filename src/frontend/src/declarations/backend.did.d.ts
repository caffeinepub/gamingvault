/* eslint-disable */

// @ts-nocheck

import type { ActorMethod } from '@icp-sdk/core/agent';
import type { IDL } from '@icp-sdk/core/candid';
import type { Principal } from '@icp-sdk/core/principal';

export type AmazonGiftCardCode = string;
export interface BuyerContactDetails { 'email' : [] | [string], 'playerId' : [] | [string] }
export type ClientAddress = string;
export interface Coupon {
  'active' : boolean,
  'value' : bigint,
  'code' : string,
  'createdAt' : Timestamp,
  'discountType' : DiscountType,
}
export type CreditReason = { 'manualRefund' : null } |
  { 'compensation' : null } |
  { 'promoPayment' : null } |
  { 'other' : string };
export interface CreditAdjustment {
  'id' : bigint,
  'targetUser' : Principal,
  'amount' : bigint,
  'reason' : CreditReason,
  'notes' : string,
  'isPromoPayment' : boolean,
  'createdAt' : Timestamp,
  'addedBy' : Principal,
}
export type DiscountType = { 'fixed' : null } |
  { 'percentage' : null };
export type EthereumWalletAddress = string;
export interface GiftCardCode {
  'value' : bigint,
  'code' : string,
  'redeemed' : boolean,
  'orderId' : OrderId,
  'buyerPrincipal' : Principal,
}
export type NexusBankId = bigint;
export interface Order {
  'id' : OrderId,
  'status' : OrderStatus,
  'paymentMethod' : PaymentMethod,
  'productTitle' : string,
  'createdAt' : Timestamp,
  'productId' : ProductId,
  'buyer' : Principal,
  'productPrice' : bigint,
  'buyerAnswer' : [] | [string],
  'creditUsed' : bigint,
}
export type OrderId = bigint;
export type OrderStatus = { 'pending' : null } |
  { 'accepted' : Timestamp } |
  { 'declined' : null };
export type PayPalEmail = string;
export type PaymentMethod = { 'amazon_gift_card' : AmazonGiftCardCode } |
  { 'ethereum' : EthereumWalletAddress } |
  { 'nexus_bank' : NexusBankId } |
  { 'paypal' : PayPalEmail } |
  { 'bitcoin' : ClientAddress };
export interface Product {
  'id' : ProductId,
  'title' : string,
  'createdAt' : Timestamp,
  'isGiftCard' : boolean,
  'description' : string,
  'giftCardValue' : bigint,
  'price' : bigint,
  'accountDetails' : string,
  'customQuestion' : [] | [string],
}
export type ProductId = bigint;
export interface RegisteredUser {
  'principal' : Principal,
  'name' : string,
  'email' : [] | [string],
  'playerId' : [] | [string],
}
export type Timestamp = bigint;
export interface UserProfile { 'name' : string }
export type UserRole = { 'admin' : null } |
  { 'user' : null } |
  { 'guest' : null };
export interface _SERVICE {
  '_initializeAccessControlWithSecret' : ActorMethod<[string], undefined>,
  'acceptOrder' : ActorMethod<[OrderId], undefined>,
  'addCoupon' : ActorMethod<[string, DiscountType, bigint], undefined>,
  'addCreditToUser' : ActorMethod<[Principal, bigint, CreditReason, string, boolean], undefined>,
  'addProduct' : ActorMethod<
    [string, string, bigint, string, [] | [boolean], [] | [bigint], [] | [string]],
    ProductId
  >,
  'assignCallerUserRole' : ActorMethod<[Principal, UserRole], undefined>,
  'declineOrder' : ActorMethod<[OrderId], undefined>,
  'deleteCoupon' : ActorMethod<[string], undefined>,
  'deleteProduct' : ActorMethod<[ProductId], undefined>,
  'editProduct' : ActorMethod<
    [ProductId, string, string, bigint, string, [] | [boolean], [] | [bigint], [] | [string]],
    undefined
  >,
  'generateGiftCardCode' : ActorMethod<[OrderId], string>,
  'getAllCoupons' : ActorMethod<[], Array<Coupon>>,
  'getAllGiftCardCodes' : ActorMethod<[], Array<GiftCardCode>>,
  'getAllOrders' : ActorMethod<[], Array<Order>>,
  'getAllProducts' : ActorMethod<[], Array<Product>>,
  'getAllRegisteredUsers' : ActorMethod<[], Array<RegisteredUser>>,
  'getBuyerContactDetails' : ActorMethod<[Principal], BuyerContactDetails>,
  'getCallerUserProfile' : ActorMethod<[], [] | [UserProfile]>,
  'getCallerUserRole' : ActorMethod<[], UserRole>,
  'getCreditAdjustments' : ActorMethod<[Principal], Array<CreditAdjustment>>,
  'getGiftCardCodeForOrder' : ActorMethod<[OrderId], string>,
  'getOrder' : ActorMethod<[OrderId], Order>,
  'getOrderAccountDetails' : ActorMethod<[OrderId], string>,
  'getOrderBuyerContact' : ActorMethod<[OrderId], BuyerContactDetails>,
  'getOrdersByBuyer' : ActorMethod<[Principal], Array<Order>>,
  'getPaymentInstructions' : ActorMethod<[string], string>,
  'getProduct' : ActorMethod<[ProductId], Product>,
  'getUserCredit' : ActorMethod<[Principal], bigint>,
  'getUserProfile' : ActorMethod<[Principal], [] | [UserProfile]>,
  'isCallerAdmin' : ActorMethod<[], boolean>,
  'placeOrder' : ActorMethod<[ProductId, PaymentMethod, [] | [string], bigint], OrderId>,
  'redeemGiftCardCode' : ActorMethod<[string], bigint>,
  'registerStaff' : ActorMethod<[string], undefined>,
  'saveBuyerContactDetails' : ActorMethod<[[] | [string], [] | [string]], undefined>,
  'saveCallerUserProfile' : ActorMethod<[UserProfile], undefined>,
  'setPaymentInstructions' : ActorMethod<[string, string], undefined>,
  'validateCoupon' : ActorMethod<[string], [] | [Coupon]>,
}
export declare const idlService: IDL.ServiceClass;
export declare const idlInitArgs: IDL.Type[];
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
