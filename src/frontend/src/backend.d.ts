import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Product {
    id: ProductId;
    title: string;
    createdAt: Timestamp;
    isGiftCard: boolean;
    description: string;
    giftCardValue: bigint;
    price: bigint;
    accountDetails: string;
    customQuestion: [] | [string];
}
export type Timestamp = bigint;
export type PaymentMethod = {
    __kind__: "amazon_gift_card";
    amazon_gift_card: AmazonGiftCardCode;
} | {
    __kind__: "ethereum";
    ethereum: EthereumWalletAddress;
} | {
    __kind__: "nexus_bank";
    nexus_bank: NexusBankId;
} | {
    __kind__: "paypal";
    paypal: PayPalEmail;
} | {
    __kind__: "bitcoin";
    bitcoin: ClientAddress;
};
export interface Coupon {
    active: boolean;
    value: bigint;
    code: string;
    createdAt: Timestamp;
    discountType: DiscountType;
}
export interface BuyerContactDetails {
    email?: string;
    playerId?: string;
}
export type PayPalEmail = string;
export interface GiftCardCode {
    value: bigint;
    code: string;
    redeemed: boolean;
    orderId: OrderId;
    buyerPrincipal: Principal;
}
export type AmazonGiftCardCode = string;
export interface Order {
    id: OrderId;
    status: OrderStatus;
    paymentMethod: PaymentMethod;
    productTitle: string;
    createdAt: Timestamp;
    productId: ProductId;
    buyer: Principal;
    productPrice: bigint;
    buyerAnswer: [] | [string];
    creditUsed: bigint;
}
export type ClientAddress = string;
export type OrderStatus = {
    __kind__: "pending";
    pending: null;
} | {
    __kind__: "accepted";
    accepted: Timestamp;
} | {
    __kind__: "declined";
    declined: null;
};
export type NexusBankId = bigint;
export type EthereumWalletAddress = string;
export type ProductId = bigint;
export type OrderId = bigint;
export interface UserProfile {
    name: string;
}
export enum DiscountType {
    fixed = "fixed",
    percentage = "percentage"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export type CreditReason = {
    __kind__: "manualRefund";
    manualRefund: null;
} | {
    __kind__: "compensation";
    compensation: null;
} | {
    __kind__: "promoPayment";
    promoPayment: null;
} | {
    __kind__: "other";
    other: string;
};
export interface RegisteredUser {
    principal: Principal;
    name: string;
    email?: string;
    playerId?: string;
}
export interface CreditAdjustment {
    amount: bigint;
    reason: CreditReason;
    notes: string;
    isPromoPayment: boolean;
    createdAt: Timestamp;
}
export interface backendInterface {
    acceptOrder(orderId: OrderId): Promise<void>;
    addCoupon(code: string, discountType: DiscountType, value: bigint): Promise<void>;
    addCreditToUser(targetUser: Principal, amount: bigint, reason: CreditReason, notes: string, isPromoPayment: boolean): Promise<void>;
    addProduct(title: string, description: string, price: bigint, accountDetails: string, isGiftCard: boolean | null, giftCardValue: bigint | null, customQuestion: string | null): Promise<ProductId>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    declineOrder(orderId: OrderId): Promise<void>;
    deleteCoupon(code: string): Promise<void>;
    deleteProduct(id: ProductId): Promise<void>;
    editProduct(id: ProductId, title: string, description: string, price: bigint, accountDetails: string, isGiftCard: boolean | null, giftCardValue: bigint | null, customQuestion: string | null): Promise<void>;
    generateGiftCardCode(orderId: OrderId): Promise<string>;
    getAllCoupons(): Promise<Array<Coupon>>;
    getAllGiftCardCodes(): Promise<Array<GiftCardCode>>;
    getAllOrders(): Promise<Array<Order>>;
    getAllProducts(): Promise<Array<Product>>;
    getAllRegisteredUsers(): Promise<Array<RegisteredUser>>;
    getBuyerContactDetails(buyer: Principal): Promise<BuyerContactDetails>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCreditAdjustments(user: Principal): Promise<Array<CreditAdjustment>>;
    getGiftCardCodeForOrder(orderId: OrderId): Promise<string>;
    getOrder(orderId: OrderId): Promise<Order>;
    getOrderAccountDetails(orderId: OrderId): Promise<string>;
    getOrderBuyerContact(orderId: OrderId): Promise<BuyerContactDetails>;
    getOrdersByBuyer(buyer: Principal): Promise<Array<Order>>;
    getPaymentInstructions(method: string): Promise<string>;
    getProduct(id: ProductId): Promise<Product>;
    getUserCredit(user: Principal): Promise<bigint>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    placeOrder(productId: ProductId, paymentMethod: PaymentMethod, buyerAnswer: string | null, creditUsed: bigint): Promise<OrderId>;
    redeemGiftCardCode(code: string): Promise<bigint>;
    registerStaff(passcode: string): Promise<void>;
    saveBuyerContactDetails(email: string | null, playerId: string | null): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setPaymentInstructions(method: string, instructions: string): Promise<void>;
    validateCoupon(code: string): Promise<Coupon | null>;
}
