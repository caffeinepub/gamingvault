import Map "mo:core/Map";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Order "mo:core/Order";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import AccessControl "authorization/access-control";
import Time "mo:core/Time";
import Int "mo:core/Int";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  type Timestamp = Int;

  type ProductId = Nat;
  type OrderId = Nat;
  type ClientAddress = Text;
  type EthereumWalletAddress = Text;
  type NexusBankId = Nat;
  type AmazonGiftCardCode = Text;
  type PayPalEmail = Text;

  module Product {
    public func compareByTitle(prod1 : Product, prod2 : Product) : Order.Order {
      Text.compare(prod1.title, prod2.title);
    };
  };

  module OrderModule {
    public func compareByCreatedAtProdTitle(ord1 : Order, ord2 : Order) : Order.Order {
      switch (Int.compare(ord1.createdAt, ord2.createdAt)) {
        case (#equal) { Text.compare(ord1.productTitle, ord2.productTitle) };
        case (order) { order };
      };
    };
  };

  public type OrderStatus = {
    #pending;
    #accepted : Timestamp;
    #declined;
  };

  public type Product = {
    id : ProductId;
    title : Text;
    description : Text;
    price : Nat; // Price in USD cents for consistency
    accountDetails : Text; // Gaming account details
    createdAt : Timestamp;
  };

  public type PaymentMethod = {
    #bitcoin : ClientAddress;
    #ethereum : EthereumWalletAddress;
    #nexus_bank : NexusBankId;
    #amazon_gift_card : AmazonGiftCardCode;
    #paypal : PayPalEmail;
  };

  public type Order = {
    id : OrderId;
    productId : ProductId;
    productTitle : Text;
    productPrice : Nat;
    buyer : Principal;
    paymentMethod : PaymentMethod;
    status : OrderStatus;
    createdAt : Timestamp;
  };

  public type BuyerContactDetails = {
    email : ?Text;
  };

  public type PaymentInstructions = {
    bitcoin : Text;
    ethereum : Text;
    nexus_bank : Text;
    amazon_gift_card : Text;
    paypal : Text;
  };

  let products = Map.empty<ProductId, Product>();
  let orders = Map.empty<OrderId, Order>();
  let buyers = Map.empty<Principal, BuyerContactDetails>();

  var productCount : ProductId = 0;
  var orderCount : OrderId = 0;

  var paymentInstructions = {
    bitcoin = "Default Bitcoin instructions";
    ethereum = "Default Ethereum instructions";
    nexus_bank = "Default Nexus Bank instructions";
    amazon_gift_card = "Default Amazon Gift Card instructions";
    paypal = "Default Paypal instructions";
  };

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public shared ({ caller }) func addProduct(title : Text, description : Text, price : Nat, accountDetails : Text) : async ProductId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only staff can add products");
    };

    let newProduct : Product = {
      id = productCount;
      title;
      description;
      price;
      accountDetails;
      createdAt = Time.now();
    };
    products.add(productCount, newProduct);

    productCount += 1;
    newProduct.id;
  };

  public shared ({ caller }) func editProduct(id : ProductId, title : Text, description : Text, price : Nat, accountDetails : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only staff can edit products");
    };

    switch (products.get(id)) {
      case (null) { Runtime.trap("Product not found") };
      case (?existing) {
        let updatedProduct : Product = {
          id;
          title;
          description;
          price;
          accountDetails;
          createdAt = existing.createdAt;
        };
        products.add(id, updatedProduct);
      };
    };
  };

  public shared ({ caller }) func deleteProduct(id : ProductId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only staff can delete products");
    };

    if (not products.containsKey(id)) {
      Runtime.trap("Product does not exist");
    };
    products.remove(id);
  };

  public query func getProduct(id : ProductId) : async Product {
    switch (products.get(id)) {
      case (null) { Runtime.trap("Product not found") };
      case (?product) { product };
    };
  };

  public query func getAllProducts() : async [Product] {
    products.values().toArray();
  };

  public shared ({ caller }) func placeOrder(productId : ProductId, paymentMethod : PaymentMethod) : async OrderId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can place orders");
    };

    let product = switch (products.get(productId)) {
      case (null) { Runtime.trap("Product not found") };
      case (?product) { product };
    };

    let newOrder : Order = {
      id = orderCount;
      productId;
      productTitle = product.title;
      productPrice = product.price;
      buyer = caller;
      paymentMethod;
      status = #pending;
      createdAt = Time.now();
    };

    orders.add(orderCount, newOrder);
    orderCount += 1;
    newOrder.id;
  };

  public shared ({ caller }) func acceptOrder(orderId : OrderId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only staff can accept orders");
    };
    switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        if (order.status != #pending) {
          Runtime.trap("Only pending orders can be accepted");
        };
        let updatedOrder : Order = {
          order with
          status = #accepted(Time.now());
        };
        orders.add(orderId, updatedOrder);
      };
    };
  };

  public shared ({ caller }) func declineOrder(orderId : OrderId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only staff can decline orders");
    };

    switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        if (order.status != #pending) {
          Runtime.trap("Only pending orders can be declined");
        };
        let updatedOrder : Order = {
          order with
          status = #declined;
        };
        orders.add(orderId, updatedOrder);
      };
    };
  };

  public query ({ caller }) func getOrder(orderId : OrderId) : async Order {
    switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        if (order.buyer != caller and not (AccessControl.isAdmin(accessControlState, caller))) {
          Runtime.trap("Unauthorized: Only order buyer or staff can view this order");
        };
        order;
      };
    };
  };

  public query ({ caller }) func getAllOrders() : async [Order] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only staff can view all orders");
    };
    orders.values().toArray().sort(OrderModule.compareByCreatedAtProdTitle);
  };

  public query ({ caller }) func getOrdersByBuyer(buyer : Principal) : async [Order] {
    if (caller != buyer and not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Can only view your own orders");
    };
    orders.values().toArray().filter(
      func(order) {
        order.buyer == buyer;
      }
    );
  };

  public query ({ caller }) func getOrderAccountDetails(orderId : OrderId) : async Text {
    switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        if (order.buyer != caller and not (AccessControl.isAdmin(accessControlState, caller))) {
          Runtime.trap("Unauthorized: Only order buyer or staff can access details");
        };
        switch (order.status) {
          case (#accepted(_)) {
            switch (products.get(order.productId)) {
              case (null) { Runtime.trap("Product not found") };
              case (?product) { product.accountDetails };
            };
          };
          case (_) { Runtime.trap("Account details only available for accepted orders") };
        };
      };
    };
  };

  public shared ({ caller }) func setPaymentInstructions(method : Text, instructions : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only staff can set payment instructions");
    };

    switch (method) {
      case ("bitcoin") {
        paymentInstructions := {
          paymentInstructions with
          bitcoin = instructions;
        };
      };
      case ("ethereum") {
        paymentInstructions := {
          paymentInstructions with
          ethereum = instructions;
        };
      };
      case ("nexus_bank") {
        paymentInstructions := {
          paymentInstructions with
          nexus_bank = instructions;
        };
      };
      case ("amazon_gift_card") {
        paymentInstructions := {
          paymentInstructions with
          amazon_gift_card = instructions;
        };
      };
      case ("paypal") {
        paymentInstructions := {
          paymentInstructions with
          paypal = instructions;
        };
      };
      case (_) { Runtime.trap("Invalid payment method") };
    };
  };

  public query func getPaymentInstructions(method : Text) : async Text {
    switch (method) {
      case ("bitcoin") { paymentInstructions.bitcoin };
      case ("ethereum") { paymentInstructions.ethereum };
      case ("nexus_bank") { paymentInstructions.nexus_bank };
      case ("amazon_gift_card") { paymentInstructions.amazon_gift_card };
      case ("paypal") { paymentInstructions.paypal };
      case (_) { Runtime.trap("Invalid payment method") };
    };
  };

  public shared ({ caller }) func saveBuyerContactDetails(email : ?Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can save contact details");
    };
    buyers.add(caller, { email });
  };

  public query ({ caller }) func getBuyerContactDetails(buyer : Principal) : async BuyerContactDetails {
    if (caller != buyer and not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Can only view your own contact details");
    };
    switch (buyers.get(buyer)) {
      case (null) { Runtime.trap("Buyer not found") };
      case (?details) { details };
    };
  };

  public query ({ caller }) func getOrderBuyerContact(orderId : OrderId) : async BuyerContactDetails {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only staff can access this function");
    };

    let order = switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) { order };
    };

    switch (buyers.get(order.buyer)) {
      case (null) { Runtime.trap("Buyer contact details not found") };
      case (?details) { details };
    };
  };
};
