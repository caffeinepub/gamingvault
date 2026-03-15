import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
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
export interface BuyerContactDetails {
    email?: string;
}
export type PayPalEmail = string;
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
export interface Product {
    id: ProductId;
    title: string;
    createdAt: Timestamp;
    description: string;
    price: bigint;
    accountDetails: string;
}
export type OrderId = bigint;
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    acceptOrder(orderId: OrderId): Promise<void>;
    addProduct(title: string, description: string, price: bigint, accountDetails: string): Promise<ProductId>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    declineOrder(orderId: OrderId): Promise<void>;
    deleteProduct(id: ProductId): Promise<void>;
    editProduct(id: ProductId, title: string, description: string, price: bigint, accountDetails: string): Promise<void>;
    getAllOrders(): Promise<Array<Order>>;
    getAllProducts(): Promise<Array<Product>>;
    getBuyerContactDetails(buyer: Principal): Promise<BuyerContactDetails>;
    getCallerUserRole(): Promise<UserRole>;
    getOrder(orderId: OrderId): Promise<Order>;
    getOrderAccountDetails(orderId: OrderId): Promise<string>;
    getOrderBuyerContact(orderId: OrderId): Promise<BuyerContactDetails>;
    getOrdersByBuyer(buyer: Principal): Promise<Array<Order>>;
    getPaymentInstructions(method: string): Promise<string>;
    getProduct(id: ProductId): Promise<Product>;
    isCallerAdmin(): Promise<boolean>;
    placeOrder(productId: ProductId, paymentMethod: PaymentMethod): Promise<OrderId>;
    saveBuyerContactDetails(email: string | null): Promise<void>;
    setPaymentInstructions(method: string, instructions: string): Promise<void>;
}
