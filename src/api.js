const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

// Access token lives only in memory (not localStorage) — safer against XSS
// reading it out of storage. The refresh token is an httpOnly cookie the
// browser sends automatically; JS never touches it directly.
let accessToken = null;
let onAuthChange = () => {};

export function setAuthChangeListener(fn) {
  onAuthChange = fn;
}

export function getAccessToken() {
  return accessToken;
}

function setAccessToken(token) {
  accessToken = token;
}

async function tryRefresh() {
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) return false;
  const data = await res.json();
  setAccessToken(data.accessToken);
  return true;
}

// Core request helper: attaches the bearer token, retries once after a
// silent refresh if the token expired, and throws a readable error otherwise.
async function request(path, { method = "GET", body, isForm = false } = {}) {
  const doFetch = () =>
    fetch(`${API_URL}${path}`, {
      method,
      credentials: "include", // sends the httpOnly refresh cookie when needed
      headers: {
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(isForm ? {} : { "Content-Type": "application/json" }),
      },
      body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
    });

  let res = await doFetch();

  if (res.status === 401 && accessToken) {
    const refreshed = await tryRefresh();
    if (refreshed) res = await doFetch();
  }

  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await res.json() : null;

  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  // ---------- auth ----------
  async register(payload) {
    const data = await request("/auth/register", { method: "POST", body: payload });
    setAccessToken(data.accessToken);
    onAuthChange(data.user);
    return data;
  },
  async login(payload) {
    const data = await request("/auth/login", { method: "POST", body: payload });
    setAccessToken(data.accessToken);
    onAuthChange(data.user);
    return data.user;
  },
  async googleSignIn(idToken) {
    const data = await request("/auth/google", { method: "POST", body: { idToken } });
    setAccessToken(data.accessToken);
    onAuthChange(data.user);
    return data.user;
  },
  async appleSignIn(identityToken, name) {
    const data = await request("/auth/apple", { method: "POST", body: { identityToken, name } });
    setAccessToken(data.accessToken);
    onAuthChange(data.user);
    return data.user;
  },
  verifyOtp(email, code) {
    return request("/auth/verify-otp", { method: "POST", body: { email, code } });
  },
  resendOtp(email) {
    return request("/auth/resend-otp", { method: "POST", body: { email } });
  },
  async logout() {
    try {
      await request("/auth/logout", { method: "POST" });
    } finally {
      setAccessToken(null);
      onAuthChange(null);
    }
  },
  async fetchMe() {
    try {
      const refreshed = await tryRefresh();
      if (!refreshed) return null;
      const data = await request("/auth/me");
      onAuthChange(data.user);
      return data.user;
    } catch {
      return null;
    }
  },

  // ---------- products ----------
  listProducts(params = {}) {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== ""));
    const suffix = qs.toString() ? `?${qs}` : "";
    return request(`/products${suffix}`).then((d) => d.products);
  },
  getProduct(id) {
    return request(`/products/${id}`);
  },
  createProduct(payload) {
    return request("/products", { method: "POST", body: payload }).then((d) => d.product);
  },
  sellerMine() {
    return request("/products/mine").then((d) => d.products);
  },
  uploadProductImages(files) {
    const form = new FormData();
    [...files].forEach((f) => form.append("images", f));
    return request("/uploads/product-images", { method: "POST", body: form, isForm: true }).then((d) => d.urls);
  },

  // ---------- sellers ----------
  applySeller(payload) {
    return request("/sellers/apply", { method: "POST", body: payload }).then((d) => d.seller);
  },
  getMySeller() {
    return request("/sellers/me").then((d) => d.seller);
  },
  listSellers() {
    return request("/sellers").then((d) => d.sellers);
  },
  adminPendingSellers() {
    return request("/sellers/admin/pending").then((d) => d.sellers);
  },
  adminSetSellerStatus(id, status) {
    return request(`/sellers/admin/${id}/status`, { method: "PATCH", body: { status } }).then((d) => d.seller);
  },

  // ---------- orders ----------
  placeOrder(payload) {
    return request("/orders", { method: "POST", body: payload });
  },
  myOrders() {
    return request("/orders").then((d) => d.orders);
  },
  getOrder(id) {
    return request(`/orders/${id}`);
  },
  updateOrderStatus(id, status) {
    return request(`/orders/${id}/status`, { method: "PATCH", body: { status } }).then((d) => d.order);
  },

  // ---------- admin ----------
  adminPendingProducts() {
    return request("/admin/products/pending").then((d) => d.products);
  },
  adminSetProductStatus(id, status) {
    return request(`/admin/products/${id}/status`, { method: "PATCH", body: { status } }).then((d) => d.product);
  },
  adminStats() {
    return request("/admin/stats");
  },

  // ---------- reviews ----------
  submitReview(payload) {
    return request("/reviews", { method: "POST", body: payload }).then((d) => d.review);
  },

  // ---------- wishlist ----------
  getWishlist() {
    return request("/wishlist").then((d) => d.products);
  },
  addWishlist(productId) {
    return request(`/wishlist/${productId}`, { method: "POST" });
  },
  removeWishlist(productId) {
    return request(`/wishlist/${productId}`, { method: "DELETE" });
  },

  // ---------- restaurants (food delivery) ----------
  listRestaurants() {
    return request("/restaurants").then((d) => d.restaurants);
  },
  getRestaurant(id) {
    return request(`/restaurants/${id}`);
  },
  adminCreateRestaurant(payload) {
    return request("/restaurants", { method: "POST", body: payload }).then((d) => d.restaurant);
  },
  applyRestaurant(payload) {
    return request("/restaurants/apply", { method: "POST", body: payload }).then((d) => d.restaurant);
  },
  myRestaurant() {
    return request("/restaurants/mine/status").then((d) => d.restaurant);
  },
  updateRestaurant(id, payload) {
    return request(`/restaurants/${id}`, { method: "PATCH", body: payload }).then((d) => d.restaurant);
  },
  adminPendingRestaurants() {
    return request("/restaurants/admin/pending").then((d) => d.restaurants);
  },
  adminSetRestaurantStatus(id, status) {
    return request(`/restaurants/admin/${id}/status`, { method: "PATCH", body: { status } }).then((d) => d.restaurant);
  },

  // ---------- menu items ----------
  createMenuItem(payload) {
    return request("/menu-items", { method: "POST", body: payload }).then((d) => d.menuItem);
  },
  updateMenuItem(id, payload) {
    return request(`/menu-items/${id}`, { method: "PUT", body: payload }).then((d) => d.menuItem);
  },
  myMenu(restaurantId) {
    return request(`/menu-items/mine/${restaurantId}`).then((d) => d.menuItems);
  },
  adminPendingMenuItems() {
    return request("/menu-items/admin/pending").then((d) => d.menuItems);
  },
  adminSetMenuItemStatus(id, status) {
    return request(`/menu-items/admin/${id}/status`, { method: "PATCH", body: { status } }).then((d) => d.menuItem);
  },

  // ---------- food orders ----------
  placeFoodOrder(payload) {
    return request("/food-orders", { method: "POST", body: payload });
  },
  myFoodOrders() {
    return request("/food-orders").then((d) => d.orders);
  },
  getFoodOrder(id) {
    return request(`/food-orders/${id}`);
  },
  availableFoodOrders() {
    return request("/food-orders/available").then((d) => d.orders);
  },
  myClaimedOrders() {
    return request("/food-orders/mine/claimed").then((d) => d.orders);
  },
  restaurantOrders(restaurantId) {
    return request(`/food-orders/restaurant/${restaurantId}`).then((d) => d.orders);
  },
  updateFoodOrderStatus(id, status) {
    return request(`/food-orders/${id}/status`, { method: "PATCH", body: { status } }).then((d) => d.order);
  },
  claimFoodOrder(id) {
    return request(`/food-orders/${id}/claim`, { method: "POST" }).then((d) => d.order);
  },
  riderUpdateStatus(id, status) {
    return request(`/food-orders/${id}/rider-status`, { method: "PATCH", body: { status } }).then((d) => d.order);
  },
};
