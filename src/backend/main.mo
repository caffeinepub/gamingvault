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
import Char "mo:core/Char";
import Nat "mo:core/Nat";

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
    price : Nat;
    accountDetails : Text;
    createdAt : Timestamp;
    isGiftCard : Bool;
    giftCardValue : Nat;
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

  public type GiftCardCode = {
    code : Text;
    orderId : OrderId;
    buyerPrincipal : Principal;
    value : Nat;
    redeemed : Bool;
  };

  public type UserProfile = {
    name : Text;
  };

  public type DiscountType = {
    #fixed;
    #percentage;
  };

  public type Coupon = {
    code : Text;
    discountType : DiscountType;
    value : Nat;
    active : Bool;
    createdAt : Timestamp;
  };

  let products = Map.empty<ProductId, Product>();
  let orders = Map.empty<OrderId, Order>();
  let buyers = Map.empty<Principal, BuyerContactDetails>();
  let giftCardCodes = Map.empty<Text, GiftCardCode>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let coupons = Map.empty<Text, Coupon>();

  var productCount : ProductId = 0;
  var orderCount : OrderId = 0;

  // Staff passcode (same as frontend)
  let STAFF_PASSCODE : Text = "2006";

  var paymentInstructions = {
    bitcoin = "Default Bitcoin instructions";
    ethereum = "Default Ethereum instructions";
    nexus_bank = "Default Nexus Bank instructions";
    amazon_gift_card = "Default Amazon Gift Card instructions";
    paypal = "Default Paypal instructions";
  };

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public shared ({ caller }) func registerStaff(passcode : Text) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Must be authenticated to register as staff");
    };
    if (passcode != STAFF_PASSCODE) {
      Runtime.trap("Invalid staff passcode");
    };
    accessControlState.userRoles.add(caller, #admin);
    accessControlState.adminAssigned := true;
  };

  // ========== USER PROFILE FUNCTIONS ==========

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // ========== PRODUCT FUNCTIONS ==========

  public shared ({ caller }) func addProduct(
    title : Text,
    description : Text,
    price : Nat,
    accountDetails : Text,
    isGiftCard : ?Bool,
    giftCardValue : ?Nat,
  ) : async ProductId {
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
      isGiftCard = switch (isGiftCard) { case (null) { false }; case (?isGiftCard) { isGiftCard } };
      giftCardValue = switch (giftCardValue) { case (null) { 0 }; case (?giftCardValue) { giftCardValue } };
    };
    products.add(productCount, newProduct);

    productCount += 1;
    newProduct.id;
  };

  public shared ({ caller }) func editProduct(
    id : ProductId,
    title : Text,
    description : Text,
    price : Nat,
    accountDetails : Text,
    isGiftCard : ?Bool,
    giftCardValue : ?Nat,
  ) : async () {
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
          isGiftCard = switch (isGiftCard) { case (null) { existing.isGiftCard }; case (?isGiftCard) { isGiftCard } };
          giftCardValue = switch (giftCardValue) { case (null) { existing.giftCardValue }; case (?giftCardValue) { giftCardValue } };
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

  // ========== ORDER FUNCTIONS ==========

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

  // ========== PAYMENT INSTRUCTIONS ==========

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

  // ========== BUYER CONTACT DETAILS ==========

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
      case (null) { { email = null } }; // Return empty record for new users
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

  // ========== GIFT CARD FUNCTIONS ==========

  func generateRandomAlphanumericString(length : Nat) : Text {
    let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let charsArray = chars.toArray();
    let charsSize = charsArray.size();
    let randomSeed = Time.now().toNat(); // Use current time as a seed

    var result = "";
    var i = 0;
    while (i < length) {
      let randomIndex = (randomSeed + i) % charsSize;
      let char = charsArray[randomIndex];
      result #= char.toText();
      i += 1;
    };
    result;
  };

  public shared ({ caller }) func generateGiftCardCode(orderId : OrderId) : async Text {
    let order = switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) { order };
    };

    if (order.buyer != caller and not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only order buyer or staff can generate gift card code");
    };

    // Check if code already exists for this order
    for ((_, gc) in giftCardCodes.entries()) {
      if (gc.orderId == orderId) {
        Runtime.trap("Gift card code already exists for this order, code: " # gc.code);
      };
    };

    // Ensure order corresponds to a gift card product
    let product = switch (products.get(order.productId)) {
      case (null) { Runtime.trap("Product not found") };
      case (?product) { product };
    };

    if (not product.isGiftCard) {
      Runtime.trap("Only gift card orders can generate codes");
    };

    let randomCode = generateRandomAlphanumericString(16);

    let newGiftCardCode : GiftCardCode = {
      code = randomCode;
      orderId;
      buyerPrincipal = order.buyer;
      value = product.giftCardValue;
      redeemed = false;
    };

    giftCardCodes.add(randomCode, newGiftCardCode);
    randomCode;
  };

  public query ({ caller }) func getGiftCardCodeForOrder(orderId : OrderId) : async Text {
    let order = switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) { order };
    };

    if (order.buyer != caller and not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only order buyer or staff can access gift card code");
    };

    for ((code, gc) in giftCardCodes.entries()) {
      if (gc.orderId == orderId) {
        return code;
      };
    };

    Runtime.trap("Gift card code not found for this order");
  };

  public shared ({ caller }) func redeemGiftCardCode(code : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can redeem gift cards");
    };

    switch (giftCardCodes.get(code)) {
      case (null) { Runtime.trap("Gift card code not found") };
      case (?gc) {
        if (gc.redeemed) {
          Runtime.trap("Gift card code already redeemed");
        };
        let updatedGc : GiftCardCode = {
          gc with
          redeemed = true;
        };
        giftCardCodes.add(code, updatedGc);
        gc.value;
      };
    };
  };

  public query ({ caller }) func getUserCredit(user : Principal) : async Nat {
    if (caller != user and not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Can only view your own credit balance");
    };

    let userCredit = giftCardCodes.values().foldLeft(
      0,
      func(acc, gc) {
        if (gc.buyerPrincipal == user and gc.redeemed) {
          acc + gc.value;
        } else {
          acc;
        };
      },
    );

    userCredit;
  };

  public query ({ caller }) func getAllGiftCardCodes() : async [GiftCardCode] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only staff can view all gift card codes");
    };

    giftCardCodes.values().toArray();
  };

  // ========== COUPON FUNCTIONS ==========

  public shared ({ caller }) func addCoupon(code : Text, discountType : DiscountType, value : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only staff can add coupons");
    };
    if (code.size() == 0) {
      Runtime.trap("Coupon code cannot be empty");
    };
    if (coupons.containsKey(code)) {
      Runtime.trap("Coupon code already exists");
    };
    if (value == 0) {
      Runtime.trap("Coupon value must be greater than 0");
    };
    switch (discountType) {
      case (#percentage) {
        if (value > 100) {
          Runtime.trap("Percentage discount cannot exceed 100");
        };
      };
      case (#fixed) {};
    };
    let newCoupon : Coupon = {
      code;
      discountType;
      value;
      active = true;
      createdAt = Time.now();
    };
    coupons.add(code, newCoupon);
  };

  public shared ({ caller }) func deleteCoupon(code : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only staff can delete coupons");
    };
    if (not coupons.containsKey(code)) {
      Runtime.trap("Coupon not found");
    };
    coupons.remove(code);
  };

  public query ({ caller }) func getAllCoupons() : async [Coupon] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only staff can view all coupons");
    };
    coupons.values().toArray();
  };

  public query func validateCoupon(code : Text) : async ?Coupon {
    switch (coupons.get(code)) {
      case (null) { null };
      case (?coupon) {
        if (coupon.active) { ?coupon } else { null };
      };
    };
  };
};
