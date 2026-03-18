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

  // ---- Stable-compatible stored types (unchanged from previous version) ----

  // NOTE: We do NOT add new fields to these stored types to avoid stable
  // variable compatibility errors. New fields are stored in separate maps.

  type StoredProduct = {
    id : ProductId;
    title : Text;
    description : Text;
    price : Nat;
    accountDetails : Text;
    createdAt : Timestamp;
    isGiftCard : Bool;
    giftCardValue : Nat;
  };

  type StoredOrder = {
    id : OrderId;
    productId : ProductId;
    productTitle : Text;
    productPrice : Nat;
    buyer : Principal;
    paymentMethod : PaymentMethod;
    status : OrderStatus;
    createdAt : Timestamp;
  };

  type StoredBuyerContactDetails = {
    email : ?Text;
  };

  // ---- Public API types (include new fields merged from separate maps) ----

  public type Product = {
    id : ProductId;
    title : Text;
    description : Text;
    price : Nat;
    accountDetails : Text;
    createdAt : Timestamp;
    isGiftCard : Bool;
    giftCardValue : Nat;
    customQuestion : ?Text;
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
    buyerAnswer : ?Text;
    creditUsed : Nat;
  };

  public type BuyerContactDetails = {
    email : ?Text;
    playerId : ?Text;
  };

  public type OrderStatus = {
    #pending;
    #accepted : Timestamp;
    #declined;
  };

  public type PaymentMethod = {
    #bitcoin : ClientAddress;
    #ethereum : EthereumWalletAddress;
    #nexus_bank : NexusBankId;
    #amazon_gift_card : AmazonGiftCardCode;
    #paypal : PayPalEmail;
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

  public type CreditReason = {
    #manualRefund;
    #compensation;
    #promoPayment;
    #other : Text;
  };

  public type CreditAdjustment = {
    id : Nat;
    targetUser : Principal;
    amount : Nat;
    reason : CreditReason;
    notes : Text;
    isPromoPayment : Bool;
    createdAt : Timestamp;
    addedBy : Principal;
  };

  public type RegisteredUser = {
    principal : Principal;
    name : Text;
    email : ?Text;
    playerId : ?Text;
  };

  // ---- Stable maps ----

  // Existing stable maps (types unchanged — backward compatible)
  let products = Map.empty<ProductId, StoredProduct>();
  let orders = Map.empty<OrderId, StoredOrder>();
  let buyers = Map.empty<Principal, StoredBuyerContactDetails>();
  let giftCardCodes = Map.empty<Text, GiftCardCode>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let coupons = Map.empty<Text, Coupon>();

  // New separate maps for new fields (no migration needed)
  let productQuestions = Map.empty<ProductId, Text>();
  let orderAnswers = Map.empty<OrderId, Text>();
  let orderCreditUsed = Map.empty<OrderId, Nat>();
  let buyerPlayerIds = Map.empty<Principal, Text>();
  let creditAdjustments = Map.empty<Nat, CreditAdjustment>();

  var productCount : ProductId = 0;
  var orderCount : OrderId = 0;
  var creditAdjustmentCount : Nat = 0;

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

  // ---- Helper: merge stored types into public types ----

  func mergeProduct(sp : StoredProduct) : Product = {
    id = sp.id;
    title = sp.title;
    description = sp.description;
    price = sp.price;
    accountDetails = sp.accountDetails;
    createdAt = sp.createdAt;
    isGiftCard = sp.isGiftCard;
    giftCardValue = sp.giftCardValue;
    customQuestion = productQuestions.get(sp.id);
  };

  func mergeOrder(so : StoredOrder) : Order = {
    id = so.id;
    productId = so.productId;
    productTitle = so.productTitle;
    productPrice = so.productPrice;
    buyer = so.buyer;
    paymentMethod = so.paymentMethod;
    status = so.status;
    createdAt = so.createdAt;
    buyerAnswer = orderAnswers.get(so.id);
    creditUsed = switch (orderCreditUsed.get(so.id)) { case (null) { 0 }; case (?v) { v } };
  };

  func mergeBuyer(principal : Principal, sb : StoredBuyerContactDetails) : BuyerContactDetails = {
    email = sb.email;
    playerId = buyerPlayerIds.get(principal);
  };

  // ========== STAFF REGISTRATION ==========

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

  public query ({ caller }) func getAllRegisteredUsers() : async [RegisteredUser] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only staff can view all users");
    };
    userProfiles.entries().toArray().map(func((p, profile)) {
      let contactDetails = buyers.get(p);
      {
        principal = p;
        name = profile.name;
        email = switch (contactDetails) { case (null) { null }; case (?d) { d.email } };
        playerId = buyerPlayerIds.get(p);
      };
    });
  };

  // ========== PRODUCT FUNCTIONS ==========

  public shared ({ caller }) func addProduct(
    title : Text,
    description : Text,
    price : Nat,
    accountDetails : Text,
    isGiftCard : ?Bool,
    giftCardValue : ?Nat,
    customQuestion : ?Text,
  ) : async ProductId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only staff can add products");
    };

    let stored : StoredProduct = {
      id = productCount;
      title;
      description;
      price;
      accountDetails;
      createdAt = Time.now();
      isGiftCard = switch (isGiftCard) { case (null) { false }; case (?v) { v } };
      giftCardValue = switch (giftCardValue) { case (null) { 0 }; case (?v) { v } };
    };
    products.add(productCount, stored);

    switch (customQuestion) {
      case (null) {};
      case (?q) { if (q.size() > 0) { productQuestions.add(productCount, q) } };
    };

    productCount += 1;
    stored.id;
  };

  public shared ({ caller }) func editProduct(
    id : ProductId,
    title : Text,
    description : Text,
    price : Nat,
    accountDetails : Text,
    isGiftCard : ?Bool,
    giftCardValue : ?Nat,
    customQuestion : ?Text,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only staff can edit products");
    };

    switch (products.get(id)) {
      case (null) { Runtime.trap("Product not found") };
      case (?existing) {
        let updated : StoredProduct = {
          id;
          title;
          description;
          price;
          accountDetails;
          createdAt = existing.createdAt;
          isGiftCard = switch (isGiftCard) { case (null) { existing.isGiftCard }; case (?v) { v } };
          giftCardValue = switch (giftCardValue) { case (null) { existing.giftCardValue }; case (?v) { v } };
        };
        products.add(id, updated);

        productQuestions.remove(id);
        switch (customQuestion) {
          case (null) {};
          case (?q) { if (q.size() > 0) { productQuestions.add(id, q) } };
        };
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
    productQuestions.remove(id);
  };

  public query func getProduct(id : ProductId) : async Product {
    switch (products.get(id)) {
      case (null) { Runtime.trap("Product not found") };
      case (?sp) { mergeProduct(sp) };
    };
  };

  public query func getAllProducts() : async [Product] {
    products.values().toArray().map(mergeProduct);
  };

  // ========== ORDER FUNCTIONS ==========

  public shared ({ caller }) func placeOrder(
    productId : ProductId,
    paymentMethod : PaymentMethod,
    buyerAnswer : ?Text,
    creditUsed : Nat,
  ) : async OrderId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can place orders");
    };

    let product = switch (products.get(productId)) {
      case (null) { Runtime.trap("Product not found") };
      case (?product) { product };
    };

    let stored : StoredOrder = {
      id = orderCount;
      productId;
      productTitle = product.title;
      productPrice = product.price;
      buyer = caller;
      paymentMethod;
      status = #pending;
      createdAt = Time.now();
    };

    orders.add(orderCount, stored);

    switch (buyerAnswer) {
      case (null) {};
      case (?a) { if (a.size() > 0) { orderAnswers.add(orderCount, a) } };
    };

    if (creditUsed > 0) {
      orderCreditUsed.add(orderCount, creditUsed);
    };

    orderCount += 1;
    stored.id;
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
        orders.add(orderId, { order with status = #accepted(Time.now()) });
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
        orders.add(orderId, { order with status = #declined });
      };
    };
  };

  public query ({ caller }) func getOrder(orderId : OrderId) : async Order {
    switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?so) {
        if (so.buyer != caller and not (AccessControl.isAdmin(accessControlState, caller))) {
          Runtime.trap("Unauthorized: Only order buyer or staff can view this order");
        };
        mergeOrder(so);
      };
    };
  };

  public query ({ caller }) func getAllOrders() : async [Order] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only staff can view all orders");
    };
    orders.values().toArray().map(mergeOrder);
  };

  public query ({ caller }) func getOrdersByBuyer(buyer : Principal) : async [Order] {
    if (caller != buyer and not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Can only view your own orders");
    };
    orders.values().toArray().filter(func(o) { o.buyer == buyer }).map(mergeOrder);
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
      case ("bitcoin") { paymentInstructions := { paymentInstructions with bitcoin = instructions } };
      case ("ethereum") { paymentInstructions := { paymentInstructions with ethereum = instructions } };
      case ("nexus_bank") { paymentInstructions := { paymentInstructions with nexus_bank = instructions } };
      case ("amazon_gift_card") { paymentInstructions := { paymentInstructions with amazon_gift_card = instructions } };
      case ("paypal") { paymentInstructions := { paymentInstructions with paypal = instructions } };
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

  public shared ({ caller }) func saveBuyerContactDetails(email : ?Text, playerId : ?Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can save contact details");
    };
    buyers.add(caller, { email });
    switch (playerId) {
      case (null) {};
      case (?pid) { if (pid.size() > 0) { buyerPlayerIds.add(caller, pid) } };
    };
  };

  public query ({ caller }) func getBuyerContactDetails(buyer : Principal) : async BuyerContactDetails {
    if (caller != buyer and not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Can only view your own contact details");
    };
    switch (buyers.get(buyer)) {
      case (null) { { email = null; playerId = null } };
      case (?sb) { mergeBuyer(buyer, sb) };
    };
  };

  public query ({ caller }) func getOrderBuyerContact(orderId : OrderId) : async BuyerContactDetails {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only staff can access this function");
    };
    let order = switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?o) { o };
    };
    switch (buyers.get(order.buyer)) {
      case (null) { { email = null; playerId = null } };
      case (?sb) { mergeBuyer(order.buyer, sb) };
    };
  };

  // ========== GIFT CARD FUNCTIONS ==========

  func generateRandomAlphanumericString(length : Nat) : Text {
    let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let charsArray = chars.toArray();
    let charsSize = charsArray.size();
    let randomSeed = Time.now().toNat();
    var result = "";
    var i = 0;
    while (i < length) {
      let randomIndex = (randomSeed + i * 7919) % charsSize;
      result #= charsArray[randomIndex].toText();
      i += 1;
    };
    result;
  };

  public shared ({ caller }) func generateGiftCardCode(orderId : OrderId) : async Text {
    let order = switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?o) { o };
    };
    if (order.buyer != caller and not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized");
    };
    for ((_, gc) in giftCardCodes.entries()) {
      if (gc.orderId == orderId) {
        Runtime.trap("Gift card code already exists for this order, code: " # gc.code);
      };
    };
    let product = switch (products.get(order.productId)) {
      case (null) { Runtime.trap("Product not found") };
      case (?p) { p };
    };
    if (not product.isGiftCard) {
      Runtime.trap("Only gift card orders can generate codes");
    };
    let code = generateRandomAlphanumericString(16);
    giftCardCodes.add(code, {
      code;
      orderId;
      buyerPrincipal = order.buyer;
      value = product.giftCardValue;
      redeemed = false;
    });
    code;
  };

  public query ({ caller }) func getGiftCardCodeForOrder(orderId : OrderId) : async Text {
    let order = switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?o) { o };
    };
    if (order.buyer != caller and not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized");
    };
    for ((code, gc) in giftCardCodes.entries()) {
      if (gc.orderId == orderId) { return code };
    };
    Runtime.trap("Gift card code not found for this order");
  };

  public shared ({ caller }) func redeemGiftCardCode(code : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    switch (giftCardCodes.get(code)) {
      case (null) { Runtime.trap("Gift card code not found") };
      case (?gc) {
        if (gc.redeemed) { Runtime.trap("Gift card code already redeemed") };
        giftCardCodes.add(code, { gc with redeemed = true; buyerPrincipal = caller });
        gc.value;
      };
    };
  };

  public query ({ caller }) func getUserCredit(user : Principal) : async Nat {
    if (caller != user and not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized");
    };
    let giftCardCredit = giftCardCodes.values().foldLeft(0, func(acc, gc) {
      if (gc.buyerPrincipal == user and gc.redeemed) { acc + gc.value } else { acc };
    });
    let manualCredit = creditAdjustments.values().foldLeft(0, func(acc, adj) {
      if (adj.targetUser == user) { acc + adj.amount } else { acc };
    });
    let creditSpent = orderCreditUsed.entries().foldLeft(0, func(acc, (oid, amt)) {
      switch (orders.get(oid)) {
        case (null) { acc };
        case (?o) { if (o.buyer == user) { acc + amt } else { acc } };
      };
    });
    let total = giftCardCredit + manualCredit;
    if (creditSpent > total) { 0 } else { total - creditSpent };
  };

  public query ({ caller }) func getAllGiftCardCodes() : async [GiftCardCode] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized");
    };
    giftCardCodes.values().toArray();
  };

  // ========== CREDIT ADJUSTMENT FUNCTIONS ==========

  public shared ({ caller }) func addCreditToUser(
    targetUser : Principal,
    amount : Nat,
    reason : CreditReason,
    notes : Text,
    isPromoPayment : Bool,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only staff can add credit to users");
    };
    if (amount == 0) { Runtime.trap("Credit amount must be greater than 0") };
    if (notes.size() == 0) { Runtime.trap("Notes are required") };
    creditAdjustments.add(creditAdjustmentCount, {
      id = creditAdjustmentCount;
      targetUser;
      amount;
      reason;
      notes;
      isPromoPayment;
      createdAt = Time.now();
      addedBy = caller;
    });
    creditAdjustmentCount += 1;
  };

  public query ({ caller }) func getCreditAdjustments(user : Principal) : async [CreditAdjustment] {
    if (caller != user and not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized");
    };
    creditAdjustments.values().toArray().filter(func(adj) { adj.targetUser == user });
  };

  // ========== COUPON FUNCTIONS ==========

  public shared ({ caller }) func addCoupon(code : Text, discountType : DiscountType, value : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized");
    };
    if (code.size() == 0) { Runtime.trap("Coupon code cannot be empty") };
    if (coupons.containsKey(code)) { Runtime.trap("Coupon code already exists") };
    if (value == 0) { Runtime.trap("Coupon value must be greater than 0") };
    switch (discountType) {
      case (#percentage) { if (value > 100) { Runtime.trap("Percentage discount cannot exceed 100") } };
      case (#fixed) {};
    };
    coupons.add(code, { code; discountType; value; active = true; createdAt = Time.now() });
  };

  public shared ({ caller }) func deleteCoupon(code : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized");
    };
    if (not coupons.containsKey(code)) { Runtime.trap("Coupon not found") };
    coupons.remove(code);
  };

  public query ({ caller }) func getAllCoupons() : async [Coupon] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized");
    };
    coupons.values().toArray();
  };

  public query func validateCoupon(code : Text) : async ?Coupon {
    switch (coupons.get(code)) {
      case (null) { null };
      case (?coupon) { if (coupon.active) { ?coupon } else { null } };
    };
  };
};
