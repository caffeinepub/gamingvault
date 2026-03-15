import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  BuyerContactDetails,
  Order,
  PaymentMethod,
  Product,
} from "../backend.d";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

export function useGetAllProducts() {
  const { actor, isFetching } = useActor();
  return useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllProducts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetProduct(id: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Product | null>({
    queryKey: ["product", id?.toString()],
    queryFn: async () => {
      if (!actor || id === null) return null;
      return actor.getProduct(id);
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

export function useGetMyOrders() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  return useQuery<Order[]>({
    queryKey: ["myOrders", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return [];
      return actor.getOrdersByBuyer(identity.getPrincipal());
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useGetAllOrders() {
  const { actor, isFetching } = useActor();
  return useQuery<Order[]>({
    queryKey: ["allOrders"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllOrders();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetMyContactDetails() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  return useQuery<BuyerContactDetails | null>({
    queryKey: ["myContact", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return null;
      return actor.getBuyerContactDetails(identity.getPrincipal());
    },
    enabled: !!actor && !isFetching && !!identity,
    retry: false,
  });
}

export function useGetPaymentInstructions(method: string) {
  const { actor, isFetching } = useActor();
  return useQuery<string>({
    queryKey: ["paymentInstructions", method],
    queryFn: async () => {
      if (!actor) return "";
      return actor.getPaymentInstructions(method);
    },
    enabled: !!actor && !isFetching && !!method,
  });
}

export function useGetOrderAccountDetails(orderId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<string | null>({
    queryKey: ["orderAccountDetails", orderId?.toString()],
    queryFn: async () => {
      if (!actor || orderId === null) return null;
      return actor.getOrderAccountDetails(orderId);
    },
    enabled: !!actor && !isFetching && orderId !== null,
  });
}

export function useGetOrderBuyerContact(orderId: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery<BuyerContactDetails>({
    queryKey: ["orderBuyerContact", orderId.toString()],
    queryFn: async () => {
      if (!actor) return { email: undefined };
      return actor.getOrderBuyerContact(orderId);
    },
    enabled: !!actor && !isFetching,
  });
}

export function usePlaceOrder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      productId,
      paymentMethod,
    }: { productId: bigint; paymentMethod: PaymentMethod }) => {
      if (!actor) throw new Error("Not connected");
      return actor.placeOrder(productId, paymentMethod);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myOrders"] });
    },
  });
}

export function useAddProduct() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      title,
      description,
      price,
      accountDetails,
    }: {
      title: string;
      description: string;
      price: bigint;
      accountDetails: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.addProduct(title, description, price, accountDetails);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useEditProduct() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      title,
      description,
      price,
      accountDetails,
    }: {
      id: bigint;
      title: string;
      description: string;
      price: bigint;
      accountDetails: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.editProduct(id, title, description, price, accountDetails);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useDeleteProduct() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteProduct(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useAcceptOrder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.acceptOrder(orderId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allOrders"] });
    },
  });
}

export function useDeclineOrder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.declineOrder(orderId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allOrders"] });
    },
  });
}

export function useSaveBuyerContact() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (email: string | null) => {
      if (!actor) throw new Error("Not connected");
      return actor.saveBuyerContactDetails(email);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myContact"] });
    },
  });
}

export function useSetPaymentInstructions() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      method,
      instructions,
    }: { method: string; instructions: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.setPaymentInstructions(method, instructions);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["paymentInstructions", variables.method],
      });
    },
  });
}
