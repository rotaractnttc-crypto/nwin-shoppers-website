import React, { useState, useEffect, useRef } from "react";
import {
  Store, Star, Clock, MapPin, Plus, Minus, X, ShieldCheck, Bike,
  CheckCircle2, PackageCheck, Navigation, ChevronRight, Utensils,
} from "lucide-react";
import { api } from "./api";
import { connectSocket } from "./socket";

const money = (n) => "UGX " + Math.round(Number(n) || 0).toLocaleString();
const CUISINE_ICONS = { default: "🍽️" };

/* ---------------- BROWSE RESTAURANTS ---------------- */

export function FoodHome({ restaurants, onOpen }) {
  return (
    <div className="container" style={{ paddingBottom: 40 }}>
      <div className="hero" style={{ margin: "0 -24px 20px", borderRadius: 0 }}>
        <div className="hero-inner">
          <div className="hero-text">
            <div className="eyebrow">NWIN PLUS · FOOD DELIVERY</div>
            <h1>Hungry? We've got you.</h1>
            <p>Order from restaurants near you — tracked live, all the way to your door.</p>
          </div>
        </div>
      </div>
      <div className="section-head"><Utensils size={15} /> Restaurants</div>
      <div className="grid-products">
        {restaurants.length ? restaurants.map((r) => (
          <button key={r.id} className="pcard" onClick={() => onOpen(r)}>
            <div className="pcard-img" style={{ background: r.image ? "#fff" : "linear-gradient(135deg, #E2542D22, #E2542D0d)", padding: 0, overflow: "hidden" }}>
              {r.image ? <img src={r.image} alt={r.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 46 }}>{CUISINE_ICONS.default}</span>}
              {!r.is_open && <span className="discount-badge" style={{ background: "#8A8578" }}>Closed</span>}
            </div>
            <div style={{ padding: "12px 14px 14px" }}>
              <div className="pcard-name">{r.name}</div>
              <div style={{ fontSize: 12, color: "#8A8578", margin: "4px 0" }}>{r.cuisine_type || "Restaurant"} · {r.location}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#8A8578" }}>
                <Clock size={12} /> ~{r.avg_prep_minutes} min prep
              </div>
            </div>
          </button>
        )) : <div className="empty">No restaurants live yet — check back soon.</div>}
      </div>
    </div>
  );
}

/* ---------------- RESTAURANT MENU ---------------- */

export function RestaurantPage({ restaurantId, onBack, foodCart, setFoodCart, flash }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.getRestaurant(restaurantId).then(setData).catch((e) => flash(e.message));
  }, [restaurantId]);

  if (!data) return <div className="container" style={{ padding: 40 }}>Loading menu…</div>;
  const { restaurant, menu } = data;
  const grouped = menu.reduce((acc, m) => { (acc[m.category] = acc[m.category] || []).push(m); return acc; }, {});

  const addItem = (item) => {
    setFoodCart((c) => {
      const existing = c.find((i) => i.menu_item_id === item.id);
      if (existing) return c.map((i) => i.menu_item_id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...c, { menu_item_id: item.id, name: item.name, price: Number(item.price), quantity: 1, restaurant_id: restaurant.id, restaurant_name: restaurant.name }];
    });
    flash(`Added ${item.name}`);
  };

  return (
    <div className="container" style={{ paddingBottom: 40 }}>
      <button className="linkbtn" style={{ margin: "16px 0" }} onClick={onBack}>← Back</button>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        <div className="brand-mark" style={{ background: "#E2542D" }}><Store size={20} color="#fff" /></div>
        <div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 22 }}>{restaurant.name}</div>
          <div style={{ fontSize: 12.5, color: "#8A8578" }}>{restaurant.cuisine_type} · {restaurant.location} · ~{restaurant.avg_prep_minutes} min</div>
        </div>
        {!restaurant.is_open && <span className="status-pill rejected">Closed</span>}
      </div>

      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat}>
          <div className="section-head" style={{ textTransform: "capitalize" }}>{cat}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {items.map((m) => (
              <div key={m.id} className="cart-row">
                <div className="cart-thumb" style={{ overflow: "hidden", padding: 0 }}>
                  {m.image ? <img src={m.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "🍲"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{m.name}</div>
                  <div style={{ fontSize: 12, color: "#8A8578" }}>{m.description}</div>
                  <div style={{ fontWeight: 700, fontSize: 13, marginTop: 4 }}>{money(m.price)}</div>
                </div>
                <button className="mini-btn approve" disabled={!restaurant.is_open} onClick={() => addItem(m)}>Add</button>
              </div>
            ))}
          </div>
        </div>
      ))}
      {!menu.length && <div className="empty">No menu items live yet.</div>}
    </div>
  );
}

/* ---------------- FOOD CART + CHECKOUT ---------------- */

export function FoodCartPage({ foodCart, setFoodCart, onCheckout }) {
  const subtotal = foodCart.reduce((s, i) => s + i.price * i.quantity, 0);
  const update = (id, delta) => setFoodCart((c) => c.map((i) => i.menu_item_id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i));
  const remove = (id) => setFoodCart((c) => c.filter((i) => i.menu_item_id !== id));

  return (
    <div className="container" style={{ paddingBottom: 40 }}>
      <div className="section-head">Food cart</div>
      {!foodCart.length && <div className="empty" style={{ marginTop: 30 }}>Nothing here yet</div>}
      <div className="cart-layout">
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
          {foodCart.map((i) => (
            <div key={i.menu_item_id} className="cart-row">
              <div className="cart-thumb">🍲</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{i.name}</div>
                <div style={{ fontSize: 11.5, color: "#8A8578" }}>{i.restaurant_name}</div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{money(i.price)}</div>
              </div>
              <div className="qty-ctrl">
                <button onClick={() => update(i.menu_item_id, -1)}><Minus size={12} /></button>
                <span>{i.quantity}</span>
                <button onClick={() => update(i.menu_item_id, 1)}><Plus size={12} /></button>
              </div>
              <button className="linkbtn" onClick={() => remove(i.menu_item_id)}><X size={18} /></button>
            </div>
          ))}
        </div>
        {foodCart.length > 0 && (
          <div className="summary" style={{ minWidth: 280 }}>
            <div className="sumrow"><span>Subtotal</span><span>{money(subtotal)}</span></div>
            <div className="sumrow"><span>Delivery</span><span>{money(3000)}</span></div>
            <div className="sumrow total"><span>Total</span><span>{money(subtotal + 3000)}</span></div>
            <button className="btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 12 }} onClick={onCheckout}>Checkout <ChevronRight size={16} /></button>
          </div>
        )}
      </div>
    </div>
  );
}

export function FoodCheckoutPage({ foodCart, onPlace, busy, flash }) {
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [payment, setPayment] = useState("cod");
  const [coords, setCoords] = useState(null);
  const [quote, setQuote] = useState(null);
  const [locatingBusy, setLocatingBusy] = useState(false);
  const subtotal = foodCart.reduce((s, i) => s + i.price * i.quantity, 0);
  const deliveryFee = quote ? quote.fee : 3000;
  const canSubmit = address.trim().length >= 5 && phone.trim().length >= 7 && !busy;

  const captureLocation = () => {
    if (!navigator.geolocation) return flash("Location isn't available in this browser");
    setLocatingBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const c = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setCoords(c);
        setLocatingBusy(false);
        try {
          const q = await api.quoteFoodDeliveryFee({ restaurant_id: foodCart[0]?.restaurant_id, delivery_latitude: c.latitude, delivery_longitude: c.longitude });
          setQuote(q);
        } catch { /* best-effort */ }
      },
      (err) => { flash("Couldn't get your location: " + err.message); setLocatingBusy(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="container" style={{ paddingBottom: 40 }}>
      <div className="section-head">Checkout — food order</div>
      <div className="checkout-layout">
        <div style={{ flex: 1 }}>
          <label className="field-label"><MapPin size={12} /> Deliver to</label>
          <textarea className="addr-input" rows={2} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. Plot 12, Kigo Road, Nwin Town" />
          <button type="button" className="mini-btn" style={{ marginTop: 8 }} onClick={captureLocation} disabled={locatingBusy}>
            {locatingBusy ? "Getting location..." : coords ? "📍 Location set — improves delivery fee accuracy" : "📍 Share my location for accurate delivery pricing"}
          </button>
          <label className="field-label">Delivery phone</label>
          <input className="text-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+2567..." />
          <label className="field-label">Payment method</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
            {["cod", "momo", "card"].map((m) => (
              <button key={m} className={"paymethod" + (payment === m ? " active" : "")} onClick={() => setPayment(m)}>
                <span style={{ flex: 1, textAlign: "left", textTransform: "uppercase" }}>{m === "cod" ? "Cash on Delivery" : m}</span>
                <span className={"radio" + (payment === m ? " on" : "")} />
              </button>
            ))}
          </div>
        </div>
        <div className="summary" style={{ minWidth: 280 }}>
          <div className="sumrow"><span>Subtotal</span><span>{money(subtotal)}</span></div>
          <div className="sumrow"><span>Delivery{quote?.estimated ? ` (${quote.distanceKm} km)` : " (estimate)"}</span><span>{money(deliveryFee)}</span></div>
          <div className="sumrow total"><span>Total</span><span>{money(subtotal + deliveryFee)}</span></div>
          <button className="btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 12 }} disabled={!canSubmit}
            onClick={() => onPlace({ address, phone, payment, latitude: coords?.latitude, longitude: coords?.longitude })}>
            <ShieldCheck size={16} /> {busy ? "Placing order..." : "Place order"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- LIVE TRACKING ---------------- */

const FOOD_STEPS = [
  { key: "placed", label: "Order placed", icon: PackageCheck },
  { key: "confirmed", label: "Confirmed by restaurant", icon: ShieldCheck },
  { key: "preparing", label: "Preparing your food", icon: Utensils },
  { key: "ready_for_pickup", label: "Ready — waiting for a rider", icon: Clock },
  { key: "claimed", label: "Rider assigned", icon: Bike },
  { key: "picked_up", label: "Picked up", icon: Bike },
  { key: "delivered", label: "Delivered", icon: CheckCircle2 },
];
const FOOD_ORDER_SEQ = FOOD_STEPS.map((s) => s.key);

export function FoodTrackingPage({ orderId, flash }) {
  const [order, setOrder] = useState(null);
  const [riderLocation, setRiderLocation] = useState(null);
  const [lastPing, setLastPing] = useState(null);

  useEffect(() => {
    let mounted = true;
    api.getFoodOrder(orderId).then((d) => {
      if (!mounted) return;
      setOrder(d.order);
      setRiderLocation(d.riderLocation);
    }).catch((e) => flash(e.message));

    const socket = connectSocket();
    if (socket) {
      socket.emit("order:subscribe", orderId);
      socket.on("order:status", (payload) => {
        if (payload.foodOrderId === orderId) setOrder((o) => o ? { ...o, status: payload.status } : o);
      });
      socket.on("rider:position", (payload) => {
        if (payload.foodOrderId === orderId) {
          setRiderLocation({ latitude: payload.latitude, longitude: payload.longitude, updated_at: new Date().toISOString() });
          setLastPing(Date.now());
        }
      });
    }
    return () => {
      mounted = false;
      socket?.off("order:status");
      socket?.off("rider:position");
    };
  }, [orderId]);

  if (!order) return <div className="container" style={{ padding: 40 }}>Loading order…</div>;
  const activeIdx = Math.max(0, FOOD_ORDER_SEQ.indexOf(order.status));

  return (
    <div className="container" style={{ maxWidth: 560, paddingBottom: 40 }}>
      <div className="section-head">Track your food order</div>
      <div className="rider-card" style={{ background: "#E2542D" }}>
        <Bike size={22} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{order.restaurant_name}</div>
          <div style={{ fontSize: 12, color: "#FBE7E4" }}>Status: {order.status.replace(/_/g, " ")}</div>
        </div>
      </div>

      {riderLocation && ["claimed", "picked_up"].includes(order.status) && (
        <div className="banner-notice" style={{ background: "#E6F2E9", color: "#1B5E3A", display: "flex", alignItems: "center", gap: 10 }}>
          <Navigation size={16} />
          <div style={{ fontSize: 12.5 }}>
            Rider live position: {riderLocation.latitude.toFixed(5)}, {riderLocation.longitude.toFixed(5)}
            {lastPing && <span style={{ display: "block", color: "#8A8578" }}>updated {Math.max(0, Math.round((Date.now() - lastPing) / 1000))}s ago</span>}
          </div>
        </div>
      )}

      <div style={{ padding: "18px 6px" }}>
        {FOOD_STEPS.map((s, i) => (
          <div key={s.key} className="step-row" style={{ paddingBottom: i === FOOD_STEPS.length - 1 ? 0 : 22 }}>
            <div className={"step-dot" + (i <= activeIdx ? " on" : "")}><s.icon size={13} /></div>
            {i < FOOD_STEPS.length - 1 && <div className={"step-line" + (i < activeIdx ? " on" : "")} />}
            <div style={{ marginLeft: 12, paddingTop: 4, fontSize: 13, fontWeight: 600, color: i <= activeIdx ? "#1C2B22" : "#A69B87" }}>{s.label}</div>
          </div>
        ))}
      </div>
      {order.status !== "delivered" && (
        <div style={{ fontSize: 11.5, color: "#8A8578", textAlign: "center" }}>
          A live map view is a fast follow-up once a Maps API key is configured — for now, position updates in real time as raw coordinates above.
        </div>
      )}
    </div>
  );
}

/* ---------------- RESTAURANT DASHBOARD (owner) ---------------- */

export function RestaurantDashboard({ restaurant, onApply, applyBusy, flash }) {
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState("orders");

  useEffect(() => {
    if (!restaurant || restaurant.status !== "approved") return;
    api.myMenu(restaurant.id).then(setMenuItems).catch(() => {});
    api.restaurantOrders(restaurant.id).then(setOrders).catch(() => {});
  }, [restaurant, tab]);

  if (!restaurant) return <ApplyRestaurantForm onApply={onApply} busy={applyBusy} flash={flash} />;

  const advance = async (id, status) => {
    try {
      await api.updateFoodOrderStatus(id, status);
      setOrders((os) => os.map((o) => o.id === id ? { ...o, status } : o));
      flash(`Order marked ${status.replace(/_/g, " ")}`);
    } catch (e) { flash(e.message); }
  };

  return (
    <div className="container" style={{ paddingBottom: 40 }}>
      <div style={{ paddingTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 12, color: "#8A8578" }}>Restaurant dashboard</div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 22 }}>{restaurant.name}</div>
        </div>
        <span className={"status-pill " + restaurant.status}>{restaurant.status}</span>
      </div>
      {restaurant.status !== "approved" && <div className="banner-notice">Awaiting admin approval — you'll be able to manage orders once approved.</div>}

      {restaurant.status === "approved" && (
        <>
          <div className="dash-tabs">
            <button className={tab === "orders" ? "active" : ""} onClick={() => setTab("orders")}>Orders</button>
            <button className={tab === "menu" ? "active" : ""} onClick={() => setTab("menu")}>Menu</button>
          </div>
          {tab === "orders" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {!orders.length && <div className="empty">No orders yet</div>}
              {orders.map((o) => (
                <div key={o.id} className="cart-row">
                  <div className="cart-thumb"><Utensils size={16} /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>Order #{o.id.slice(0, 8)}</div>
                    <div style={{ fontSize: 12, color: "#8A8578" }}>{money(o.total)} · {o.status}</div>
                  </div>
                  {o.status === "placed" && <button className="mini-btn" onClick={() => advance(o.id, "confirmed")}>Confirm</button>}
                  {o.status === "confirmed" && <button className="mini-btn" onClick={() => advance(o.id, "preparing")}>Start preparing</button>}
                  {o.status === "preparing" && <button className="mini-btn approve" onClick={() => advance(o.id, "ready_for_pickup")}>Ready for pickup</button>}
                </div>
              ))}
            </div>
          )}
          {tab === "menu" && <RestaurantMenuManager restaurantId={restaurant.id} menuItems={menuItems} setMenuItems={setMenuItems} flash={flash} />}
        </>
      )}
    </div>
  );
}

// Captures the browser's GPS position with one tap — this is what powers
// the distance-based delivery fee, no manual map-pin-dropping required.
function LocationPicker({ latitude, longitude, onCapture, flash }) {
  const [busy, setBusy] = useState(false);
  const capture = () => {
    if (!navigator.geolocation) return flash("Location isn't available in this browser");
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { onCapture(pos.coords.latitude, pos.coords.longitude); setBusy(false); },
      (err) => { flash("Couldn't get your location: " + err.message); setBusy(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };
  return (
    <div style={{ marginTop: 14 }}>
      <label className="field-label"><MapPin size={12} /> Pickup location (for delivery pricing)</label>
      <button type="button" className="mini-btn" style={{ marginTop: 6 }} onClick={capture} disabled={busy}>
        {busy ? "Getting location..." : latitude ? "📍 Location set — tap to update" : "📍 Use my current location"}
      </button>
      {latitude && <div style={{ fontSize: 11, color: "#8A8578", marginTop: 4 }}>{Number(latitude).toFixed(5)}, {Number(longitude).toFixed(5)}</div>}
    </div>
  );
}

// One-photo uploader used for restaurant logos and menu item photos —
// shows a preview, uploads on submit via the given API call.
function PhotoPicker({ label, preview, onFile }) {
  return (
    <div style={{ marginTop: 12 }}>
      <label className="field-label">{label}</label>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
        <div style={{ width: 56, height: 56, borderRadius: 10, background: "#F2EFE4", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {preview ? <img src={preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 22 }}>📷</span>}
        </div>
        <input type="file" accept="image/*" onChange={(e) => e.target.files[0] && onFile(e.target.files[0])} />
      </div>
    </div>
  );
}

function ApplyRestaurantForm({ onApply, busy, flash }) {
  const [form, setForm] = useState({ name: "", description: "", location: "", cuisine_type: "", phone: "", latitude: null, longitude: null });
  const [photoFile, setPhotoFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const pickPhoto = (file) => { setPhotoFile(file); setPreview(URL.createObjectURL(file)); };

  const submit = async () => {
    let image = null;
    if (photoFile) {
      try {
        const form2 = new FormData();
        form2.append("image", photoFile);
        const { url } = await api.uploadRestaurantLogo(form2);
        image = url;
      } catch (e) { flash(e.message); return; }
    }
    onApply({ ...form, image });
  };

  return (
    <div className="container" style={{ maxWidth: 480, padding: "40px 16px" }}>
      <div className="section-head">Add your restaurant to Nwin Plus</div>
      <PhotoPicker label="Restaurant logo" preview={preview} onFile={pickPhoto} />
      <label className="field-label">Restaurant name</label>
      <input className="text-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <label className="field-label">Cuisine type</label>
      <input className="text-input" value={form.cuisine_type} onChange={(e) => setForm({ ...form, cuisine_type: e.target.value })} placeholder="e.g. Ugandan, Fast food, Grill" />
      <label className="field-label">Location (address text)</label>
      <input className="text-input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
      <LocationPicker latitude={form.latitude} longitude={form.longitude} flash={flash} onCapture={(lat, lng) => setForm({ ...form, latitude: lat, longitude: lng })} />
      <label className="field-label">Phone</label>
      <input className="text-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+2567..." />
      <label className="field-label">Description</label>
      <textarea className="text-input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      <button className="btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 16 }} disabled={!form.name || busy} onClick={submit}>
        {busy ? "Submitting..." : "Apply"}
      </button>
    </div>
  );
}

// Lets an admin manage the menu for ANY restaurant — including ones added
// directly (no owner account, so RestaurantDashboard's owner-only flow
// doesn't apply to them). Backend already allows admin on these endpoints;
// this just gives it a screen to use.
export function AdminManageMenuPage({ restaurantId, restaurantName, flash, onBack }) {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.myMenu(restaurantId).then((rows) => { setMenuItems(rows); setLoading(false); }).catch((e) => { flash(e.message); setLoading(false); });
  }, [restaurantId]);

  return (
    <div className="container" style={{ paddingBottom: 40 }}>
      <button className="linkbtn" style={{ margin: "16px 0" }} onClick={onBack}>← Back to admin console</button>
      <div className="section-head">🍲 Menu — {restaurantName}</div>
      {loading ? <div className="empty">Loading…</div> : (
        <RestaurantMenuManager restaurantId={restaurantId} menuItems={menuItems} setMenuItems={setMenuItems} flash={flash} />
      )}
    </div>
  );
}

function RestaurantMenuManager({ restaurantId, menuItems, setMenuItems, flash }) {
  const [form, setForm] = useState({ name: "", price: "", category: "main", description: "" });
  const [photoFile, setPhotoFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);

  const pickPhoto = (file) => { setPhotoFile(file); setPreview(URL.createObjectURL(file)); };

  const submit = async () => {
    setBusy(true);
    try {
      let image = null;
      if (photoFile) {
        const form2 = new FormData();
        form2.append("image", photoFile);
        const { url } = await api.uploadMenuItemPhoto(form2);
        image = url;
      }
      const item = await api.createMenuItem({ restaurant_id: restaurantId, ...form, price: Number(form.price), image });
      setMenuItems((m) => [item, ...m]);
      setForm({ name: "", price: "", category: "main", description: "" });
      setPhotoFile(null);
      setPreview(null);
      flash("Submitted for admin approval");
    } catch (e) { flash(e.message); } finally { setBusy(false); }
  };

  return (
    <div>
      <div style={{ maxWidth: 420, marginBottom: 20 }}>
        <PhotoPicker label="Photo" preview={preview} onFile={pickPhoto} />
        <label className="field-label">Item name</label>
        <input className="text-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <label className="field-label">Price (UGX)</label>
        <input className="text-input" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        <label className="field-label">Category</label>
        <select className="text-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          {["starter", "main", "drink", "dessert", "other"].map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <label className="field-label">Description</label>
        <textarea className="text-input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <button className="btn-primary" style={{ marginTop: 12 }} disabled={!form.name || !form.price || busy} onClick={submit}>
          {busy ? "Adding..." : "Add menu item"}
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {menuItems.map((m) => (
          <div key={m.id} className="cart-row">
            <div className="cart-thumb" style={{ overflow: "hidden", padding: 0 }}>
              {m.image ? <img src={m.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "🍲"}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{m.name}</div>
              <div style={{ fontSize: 12, color: "#8A8578" }}>{money(m.price)}</div>
            </div>
            <span className={"status-pill " + m.status}>{m.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- RIDER DASHBOARD ---------------- */

export function RiderDashboard({ flash }) {
  const [available, setAvailable] = useState([]);
  const [claimed, setClaimed] = useState([]);
  const watchIdRef = useRef(null);

  const refresh = () => {
    api.availableFoodOrders().then(setAvailable).catch(() => {});
    api.myClaimedOrders().then(setClaimed).catch(() => {});
  };
  useEffect(() => { refresh(); const id = setInterval(refresh, 10000); return () => clearInterval(id); }, []);

  // Broadcast this rider's live GPS position for any order currently in
  // progress — this is what customers see on the tracking screen.
  useEffect(() => {
    if (!claimed.length || !navigator.geolocation) return;
    const socket = connectSocket();
    if (!socket) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        claimed.forEach((o) => {
          socket.emit("rider:location", {
            foodOrderId: o.id,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        });
      },
      (err) => console.warn("Geolocation error:", err.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
    return () => { if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current); };
  }, [claimed]);

  const claim = async (id) => {
    try {
      await api.claimFoodOrder(id);
      flash("Order claimed!");
      refresh();
    } catch (e) { flash(e.message); }
  };

  const advance = async (id, status) => {
    try {
      await api.riderUpdateStatus(id, status);
      flash(`Marked ${status.replace(/_/g, " ")}`);
      refresh();
    } catch (e) { flash(e.message); }
  };

  return (
    <div className="container" style={{ paddingBottom: 40 }}>
      <div style={{ paddingTop: 20 }}>
        <div style={{ fontSize: 12, color: "#8A8578" }}>Rider dashboard</div>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 22 }}>Available deliveries</div>
      </div>
      {claimed.length > 0 && (
        <div className="banner-notice" style={{ background: "#E6F2E9", color: "#1B5E3A" }}>
          Your location is being shared live while you have an active delivery. Keep this tab open and location permission on.
        </div>
      )}

      {claimed.length > 0 && (
        <>
          <div className="section-head">My active deliveries</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
            {claimed.map((o) => (
              <div key={o.id} className="cart-row">
                <div className="cart-thumb"><Bike size={16} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{o.restaurant_name}</div>
                  <div style={{ fontSize: 12, color: "#8A8578" }}>{o.delivery_address} · {o.status}</div>
                </div>
                {o.status === "claimed" && <button className="mini-btn" onClick={() => advance(o.id, "picked_up")}>Picked up</button>}
                {o.status === "picked_up" && <button className="mini-btn approve" onClick={() => advance(o.id, "delivered")}>Delivered</button>}
              </div>
            ))}
          </div>
        </>
      )}

      <div className="section-head">Ready to claim</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {!available.length && <div className="empty">No deliveries waiting right now</div>}
        {available.map((o) => (
          <div key={o.id} className="cart-row">
            <div className="cart-thumb"><Store size={16} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{o.restaurant_name}</div>
              <div style={{ fontSize: 12, color: "#8A8578" }}>{o.restaurant_location} → {o.delivery_address}</div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{money(o.total)}</div>
            </div>
            <button className="mini-btn approve" onClick={() => claim(o.id)}>Claim</button>
          </div>
        ))}
      </div>
    </div>
  );
}
