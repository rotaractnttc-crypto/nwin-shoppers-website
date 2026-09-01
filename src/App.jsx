import React, { useState, useEffect } from "react";
import {
  Search, Star, ShoppingCart, Heart, User, X, Plus, Minus, ChevronRight,
  MapPin, CreditCard, Smartphone, Banknote, ShieldCheck, Store, Globe,
  Percent, MessageCircle, Flag, ShoppingBag, LogOut, Menu, Clock,
  CheckCircle2, Truck, PackageCheck, Bike, Gift, Copy, Sparkles, Facebook,
  Instagram, Twitter, Users, BadgeCheck,
} from "lucide-react";
import { api, setAuthChangeListener } from "./api";
import { disconnectSocket } from "./socket";
import {
  FoodHome, RestaurantPage, FoodCartPage, FoodCheckoutPage, FoodTrackingPage,
  RestaurantDashboard, RiderDashboard, AdminManageMenuPage,
} from "./Food";

/* ---------------------------------------------------------------
   NWIN SHOPPERS — buyer website
   Responsive storefront (not a phone-frame mock). Sellers/admins
   still get a full shopping experience here if they log in, but
   listing management lives in the separate seller dashboard.
--------------------------------------------------------------- */

const CATS = [
  { id: "electronics", name: "Electronics", icon: "📱", color: "#2F3E8C" },
  { id: "fashion", name: "Fashion", icon: "👗", color: "var(--accent)" },
  { id: "home", name: "Home & Living", icon: "🏠", color: "var(--primary)" },
  { id: "grocery", name: "Grocery", icon: "🥦", color: "#3F8F4E" },
  { id: "beauty", name: "Beauty", icon: "💄", color: "#B84A7A" },
  { id: "phones", name: "Phones & Tabs", icon: "☎️", color: "#2F3E8C" },
  { id: "shoes", name: "Shoes", icon: "👟", color: "#B8862B" },
  { id: "baby", name: "Baby Products", icon: "🍼", color: "#B84A7A" },
  { id: "auto", name: "Auto & Motorcycles", icon: "🏍️", color: "#3A362E" },
  { id: "building", name: "Building Materials", icon: "🧱", color: "#8A5A3B" },
  { id: "sports", name: "Sports", icon: "⚽", color: "#3F8F4E" },
  { id: "services", name: "Services", icon: "🛠️", color: "#2F3E8C" },
];

const BANNERS = [
  { id: "b1", title: "Nwin Specials", sub: "Homegrown sellers, front row", color: "var(--primary)" },
  { id: "b2", title: "Payday Deals", sub: "Up to 30% off electronics", color: "var(--accent)" },
  { id: "b3", title: "Pay on delivery", sub: "No card? No problem.", color: "#2F3E8C" },
];

const FLASH_END = Date.now() + 3 * 60 * 60 * 1000;
const money = (n) => "UGX " + Math.round(Number(n) || 0).toLocaleString();

function toUiProduct(p) {
  const cat = CATS.find((c) => c.id === p.category) || CATS[0];
  const images = Array.isArray(p.images) ? p.images : [];
  return {
    id: p.id, name: p.name, price: Number(p.price),
    was: p.was_price ? Number(p.was_price) : undefined,
    cat: p.category || cat.id, sellerId: p.seller_id, sellerName: p.seller_name,
    nwin: !!p.made_in_nwin, special: !!p.is_special, deal: !!p.is_deal,
    rating: Number(p.rating_avg) || 0, revCount: Number(p.rating_count) || 0,
    emoji: cat.icon, images, photo: images[0] || null,
    desc: p.description || "No description provided.",
    stock: p.stock, status: p.status,
  };
}

// Renders a real uploaded photo when one exists, falling back to the
// category emoji tile otherwise — so listings never look broken while a
// seller hasn't added photos yet, but do show real photos once they have.
function Thumb({ photo, emoji, size = 46, style }) {
  if (photo) {
    return <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", ...style }} />;
  }
  return <span style={{ fontSize: size, ...style }}>{emoji}</span>;
}

function FlashTimer() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  const remain = Math.max(0, FLASH_END - now);
  const h = Math.floor(remain / 3600000), m = Math.floor((remain % 3600000) / 60000), s = Math.floor((remain % 60000) / 1000);
  const pad = (n) => String(n).padStart(2, "0");
  return <span className="flash-clock"><Clock size={12} style={{ marginRight: 4 }} />{pad(h)}:{pad(m)}:{pad(s)}</span>;
}

function Toast({ msg }) {
  if (!msg) return null;
  return <div className="toast">{msg}</div>;
}

function Stamp({ children, style }) {
  return <span className="stamp" style={style}>{children}</span>;
}

function PriceTag({ price, was, big }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 9 }}>
      <span style={{ fontWeight: 800, fontSize: big ? 32 : 16, color: "var(--text)", fontFamily: "'IBM Plex Mono',monospace", letterSpacing: big ? "-0.01em" : 0 }}>{money(price)}</span>
      {was && <span style={{ fontSize: big ? 15 : 12, color: "var(--muted-light)", textDecoration: "line-through" }}>{money(was)}</span>}
      {was && big && <span style={{ fontSize: 12, fontWeight: 700, color: "var(--sale)", background: "#FFE9F1", padding: "3px 8px", borderRadius: 6 }}>-{Math.round((1 - price / was) * 100)}%</span>}
    </div>
  );
}

function ProductCard({ p, onOpen, wishlist, onToggleWish }) {
  const cat = CATS.find((c) => c.id === p.cat) || CATS[0];
  const wished = wishlist.includes(p.id);
  return (
    <button className="pcard" onClick={() => onOpen(p)}>
      <div className="pcard-img" style={{ background: p.photo ? "#fff" : `linear-gradient(135deg, ${cat.color}22, ${cat.color}0d)`, padding: 0, overflow: "hidden" }}>
        <Thumb photo={p.photo} emoji={p.emoji} size={46} />
        {p.nwin && <Stamp style={{ position: "absolute", top: 10, left: 10 }}>Nwin made</Stamp>}
        <button className="card-heart" onClick={(e) => { e.stopPropagation(); onToggleWish(p.id); }}>
          <Heart size={14} fill={wished ? "var(--accent)" : "none"} color={wished ? "var(--accent)" : "#8A8578"} />
        </button>
        {p.was && <span className="discount-badge">-{Math.round((1 - p.price / p.was) * 100)}%</span>}
      </div>
      <div style={{ padding: "12px 14px 14px" }}>
        <div className="pcard-name">{p.name}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 3, margin: "4px 0 8px", color: "#C9962A", fontSize: 12 }}>
          <Star size={12} fill="#C9962A" strokeWidth={0} /> {p.rating || "New"} {p.revCount > 0 && <span style={{ color: "#A69B87" }}>({p.revCount})</span>}
        </div>
        <PriceTag price={p.price} was={p.was} />
      </div>
    </button>
  );
}

/* ---------------- HEADER / FOOTER ---------------- */

function Header({ user, cartCount, wishlistCount, query, setQuery, onNav, onLogout, onSearch }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="header-inner">
        <button className="brand" onClick={() => onNav("home")}>
          <div className="brand-mark"><ShoppingBag size={20} color="#fff" /></div>
          <span>Nwin <b>Shoppers</b></span>
        </button>

        <form className="header-search" onSubmit={(e) => { e.preventDefault(); onSearch(); }}>
          <Search size={16} color="#8A8578" />
          <input placeholder="Search products, brands, categories..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </form>

        <nav className="header-nav">
          <button onClick={() => onNav("categories")}>Categories</button>
          <button onClick={() => onNav("home", { deal: true })}>Deals</button>
          <button onClick={() => onNav("food-home")} style={{ color: "var(--accent)" }}>🍔 Food</button>
          <button onClick={() => onNav("sell")}>Sell on Nwin</button>
        </nav>

        <div className="header-actions">
          <button className="icon-pill" onClick={() => onNav("wishlist")}>
            <Heart size={18} />
            {wishlistCount > 0 && <span className="pill-badge">{wishlistCount}</span>}
          </button>
          <button className="icon-pill" onClick={() => onNav("cart")}>
            <ShoppingCart size={18} />
            {cartCount > 0 && <span className="pill-badge">{cartCount}</span>}
          </button>
          {user ? (
            <div className="account-menu">
              <button className="icon-pill" onClick={() => setMenuOpen((v) => !v)}><User size={18} /></button>
              {menuOpen && (
                <div className="dropdown">
                  <div style={{ padding: "8px 12px", fontSize: 12, color: "#8A8578" }}>{user.name} · {user.role}</div>
                  <button onClick={() => { onNav("orders"); setMenuOpen(false); }}>My orders</button>
                  {user.role === "seller" && <button onClick={() => { onNav("seller-home"); setMenuOpen(false); }}><Store size={13} /> Seller dashboard</button>}
                  {user.role === "admin" && <button onClick={() => { onNav("admin-home"); setMenuOpen(false); }}><ShieldCheck size={13} /> Admin console</button>}
                  {user.role === "rider" && <button onClick={() => { onNav("rider-dashboard"); setMenuOpen(false); }}>🏍️ Rider dashboard</button>}
                  {user.role === "shopper" && <button onClick={() => { onNav("sell"); setMenuOpen(false); }}>Sell on Nwin</button>}
                  <button onClick={() => { onNav("restaurant-dashboard"); setMenuOpen(false); }}>🍔 Restaurant dashboard</button>
                  <button onClick={() => { onNav("food-cart"); setMenuOpen(false); }}>Food cart</button>
                  <button onClick={() => { onLogout(); setMenuOpen(false); }}><LogOut size={13} /> Log out</button>
                </div>
              )}
            </div>
          ) : (
            <button className="btn-primary small" onClick={() => onNav("auth")}>Log in</button>
          )}
        </div>
      </div>
      <div className="header-mobile-search">
        <form onSubmit={(e) => { e.preventDefault(); onSearch(); }} className="header-search">
          <Search size={16} color="#8A8578" />
          <input placeholder="Search Nwin Shoppers" value={query} onChange={(e) => setQuery(e.target.value)} />
        </form>
      </div>
    </header>
  );
}

function Footer({ onNav }) {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-col">
          <div className="brand" style={{ pointerEvents: "none" }}>
            <div className="brand-mark"><ShoppingBag size={18} color="#fff" /></div>
            <span style={{ color: "#fff" }}>Nwin <b>Shoppers</b></span>
          </div>
          <p style={{ fontSize: 12.5, color: "#C9C2AF", marginTop: 10, maxWidth: 260 }}>
            Everything you need, all in one place. Shop, sell, and grow with Nwin Shoppers.
          </p>
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <div className="footer-social"><Facebook size={15} color="#EDE7D6" /></div>
            <div className="footer-social"><Instagram size={15} color="#EDE7D6" /></div>
            <div className="footer-social"><Twitter size={15} color="#EDE7D6" /></div>
          </div>
        </div>
        <div className="footer-col">
          <div className="footer-head">Shop</div>
          <button onClick={() => onNav("home")}>All products</button>
          <button onClick={() => onNav("categories")}>Categories</button>
          <button onClick={() => onNav("home", { deal: true })}>Flash deals</button>
        </div>
        <div className="footer-col">
          <div className="footer-head">Sell</div>
          <button onClick={() => onNav("sell")}>Become a seller</button>
        </div>
        <div className="footer-col">
          <div className="footer-head">Account</div>
          <button onClick={() => onNav("orders")}>My orders</button>
          <button onClick={() => onNav("wishlist")}>Wishlist</button>
        </div>
      </div>
      <div className="footer-bottom">© {new Date().getFullYear()} Nwin Shoppers. All rights reserved.</div>
    </footer>
  );
}

function GoogleButton({ onCredential }) {
  const ref = React.useRef(null);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId || !window.google?.accounts?.id || !ref.current) return;
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (resp) => onCredential(resp.credential),
    });
    window.google.accounts.id.renderButton(ref.current, { theme: "outline", size: "large", width: 320 });
  }, [clientId]);

  if (!clientId) {
    return (
      <button type="button" className="apple-btn" style={{ background: "#fff", color: "#3A362E", border: "1.5px solid #E4DCC6", cursor: "not-allowed" }} disabled>
        Continue with Google (not configured yet)
      </button>
    );
  }
  return <div className="google-btn-wrap" ref={ref} />;
}

function AppleButton() {
  return (
    <button type="button" className="apple-btn" disabled title="Requires an Apple Developer Program account ($99/yr) — not set up yet">
      Continue with Apple (coming soon)
    </button>
  );
}

/* ---------------- AUTH ---------------- */

function OtpPage({ email, onVerified, flash }) {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [busy, setBusy] = useState(false);
  const refs = React.useRef([]);

  const setDigit = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...digits];
    next[i] = val;
    setDigits(next);
    if (val && i < 5) refs.current[i + 1]?.focus();
  };

  const submit = async () => {
    const code = digits.join("");
    if (code.length !== 6) return flash("Enter the full 6-digit code");
    setBusy(true);
    try {
      await api.verifyOtp(email, code);
      flash("Email verified!");
      onVerified();
    } catch (err) {
      flash(err.message);
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    try {
      await api.resendOtp(email);
      flash("New code sent — check your email");
    } catch (err) {
      flash(err.message);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card" style={{ textAlign: "center" }}>
        <div className="brand-mark" style={{ margin: "0 auto 10px" }}><ShieldCheck size={26} color="#fff" /></div>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 19 }}>Verify your email</div>
        <p style={{ fontSize: 13, color: "#8A8578", marginTop: 8 }}>We sent a 6-digit code to <b>{email}</b>. Enter it below to activate checkout and selling.</p>
        <div className="otp-input">
          {digits.map((d, i) => (
            <input key={i} ref={(el) => (refs.current[i] = el)} value={d} maxLength={1}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => { if (e.key === "Backspace" && !d && i > 0) refs.current[i - 1]?.focus(); }} />
          ))}
        </div>
        <button className="btn-primary" style={{ width: "100%", justifyContent: "center" }} disabled={busy} onClick={submit}>
          {busy ? "Verifying..." : "Verify"}
        </button>
        <button className="linkbtn" style={{ marginTop: 12, fontSize: 12.5 }} onClick={resend}>Didn't get it? Resend code</button>
      </div>
    </div>
  );
}

function AuthPage({ onLogin, onRegister, onGoogle, flash }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", role: "shopper" });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") await onLogin({ email: form.email, password: form.password });
      else await onRegister({ name: form.name, email: form.email, phone: form.phone || undefined, password: form.password, role: form.role });
    } catch (err) {
      flash(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div className="brand-mark" style={{ margin: "0 auto 10px" }}><ShoppingBag size={26} color="#fff" /></div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 20, color: "var(--primary)" }}>
            {mode === "login" ? "Welcome back" : "Create your account"}
          </div>
        </div>
        {mode === "register" && (
          <>
            <label className="field-label">Full name</label>
            <input className="text-input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <label className="field-label">Phone (optional)</label>
            <input className="text-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+2567..." />
          </>
        )}
        <label className="field-label">Email</label>
        <input className="text-input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <label className="field-label">Password</label>
        <input className="text-input" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 8 characters" />
        <button className="btn-primary" style={{ width: "100%", marginTop: 18, justifyContent: "center" }} disabled={busy} type="submit">
          {busy ? "Please wait..." : mode === "login" ? "Log in" : "Create account"}
        </button>
        <button type="button" className="linkbtn" style={{ width: "100%", marginTop: 10, textAlign: "center", fontSize: 13 }}
          onClick={() => setMode(mode === "login" ? "register" : "login")}>
          {mode === "login" ? "New here? Create an account" : "Already have an account? Log in"}
        </button>

        <div className="divider">or continue with</div>
        <GoogleButton onCredential={(idToken) => onGoogle(idToken).catch((e) => flash(e.message))} />
        <AppleButton />
      </form>
    </div>
  );
}

/* ---------------- HOME ---------------- */

function Home({ products, onOpen, onCat, wishlist, onToggleWish, query, filterDeal }) {
  const q = query.trim().toLowerCase();
  const searching = q.length > 0;
  const searchResults = searching ? products.filter((p) => p.name.toLowerCase().includes(q)) : [];
  const specials = products.filter((p) => p.special);
  const deals = products.filter((p) => p.deal);
  const shown = filterDeal ? deals : products;

  if (searching) {
    return (
      <div className="container">
        <div className="section-head">Results for "{query}"</div>
        <div className="grid-products">
          {searchResults.length ? searchResults.map((p) => <ProductCard key={p.id} p={p} onOpen={onOpen} wishlist={wishlist} onToggleWish={onToggleWish} />)
            : <div className="empty">No products match your search</div>}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="hero">
        <div className="hero-blob hero-blob-1" />
        <div className="hero-blob hero-blob-2" />
        <div className="hero-inner hero-grid">
          <div className="hero-text">
            <div className="eyebrow">🛍️ SHOP · SELL · SAVE · SMILE</div>
            <h1>Everything<br />you need.<br /><span className="hero-accent-word">All in one place.</span></h1>
            <p>Uganda's homegrown marketplace — buy from trusted local sellers, order food, or start selling in minutes.</p>
            <div style={{ display: "flex", gap: 12, marginTop: 28, flexWrap: "wrap" }}>
              <button className="btn-cta" onClick={() => document.getElementById("catalogue")?.scrollIntoView({ behavior: "smooth" })}>
                Start shopping <ChevronRight size={17} />
              </button>
              <button className="btn-cta-ghost" onClick={() => document.getElementById("catalogue")?.scrollIntoView({ behavior: "smooth" })}>
                Browse deals
              </button>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-tile hero-tile-1">📱</div>
            <div className="hero-tile hero-tile-2">👗</div>
            <div className="hero-tile hero-tile-3">🍔</div>
            <div className="hero-tile hero-tile-4">🏠</div>
            <div className="hero-tile hero-tile-5">👟</div>
          </div>
        </div>
        <div className="trust-bar">
          <div className="trust-item"><Truck size={18} /><span>Fast delivery</span></div>
          <div className="trust-item"><ShieldCheck size={18} /><span>Secure payments</span></div>
          <div className="trust-item"><BadgeCheck size={18} /><span>Verified sellers</span></div>
          <div className="trust-item"><MessageCircle size={18} /><span>24/7 support</span></div>
        </div>
      </div>

      <div className="container">
        <div className="cat-strip">
          {CATS.map((c) => (
            <button key={c.id} className="catchip" onClick={() => onCat(c.id)}>
              <div className="catchip-icon" style={{ background: `linear-gradient(135deg, ${c.color}1f, ${c.color}0a)` }}>{c.icon}</div>
              <span>{c.name}</span>
            </button>
          ))}
        </div>

        {!filterDeal && specials.length > 0 && (
          <>
            <div className="section-head accent"><Star size={15} fill="var(--primary)" strokeWidth={0} /> Nwin Specials <Stamp style={{ marginLeft: 8 }}>Made in Nwin</Stamp></div>
            <div className="grid-products">
              {specials.map((p) => <ProductCard key={p.id} p={p} onOpen={onOpen} wishlist={wishlist} onToggleWish={onToggleWish} />)}
            </div>
          </>
        )}

        <div className="flash-row">
          <div className="section-head" style={{ padding: "10px 0 0" }}><Sparkles size={15} color="var(--accent)" /> Flash Deals</div>
          <FlashTimer />
        </div>
        <div className="grid-products">
          {deals.length ? deals.map((p) => <ProductCard key={p.id} p={p} onOpen={onOpen} wishlist={wishlist} onToggleWish={onToggleWish} />)
            : <div className="empty">No active deals right now</div>}
        </div>

        <div id="catalogue" className="section-head">{filterDeal ? "All deals" : "All products"}</div>
        <div className="grid-products" style={{ paddingBottom: 30 }}>
          {shown.length ? shown.map((p) => <ProductCard key={p.id} p={p} onOpen={onOpen} wishlist={wishlist} onToggleWish={onToggleWish} />)
            : <div className="empty">No products yet — check back soon.</div>}
        </div>
      </div>
    </>
  );
}

function CategoryPage({ catId, products, onOpen, wishlist, onToggleWish }) {
  const cat = CATS.find((c) => c.id === catId);
  const list = products.filter((p) => p.cat === catId);
  return (
    <div className="container">
      <div className="section-head">{cat?.icon} {cat?.name}</div>
      <div className="grid-products" style={{ paddingBottom: 30 }}>
        {list.length ? list.map((p) => <ProductCard key={p.id} p={p} onOpen={onOpen} wishlist={wishlist} onToggleWish={onToggleWish} />) : <div className="empty">No products in this category yet</div>}
      </div>
    </div>
  );
}

function AllCategoriesPage({ onCat }) {
  return (
    <div className="container">
      <div className="section-head">All categories</div>
      <div className="grid-products" style={{ paddingBottom: 30 }}>
        {CATS.map((c) => (
          <button key={c.id} className="pcard" style={{ alignItems: "center", padding: 24 }} onClick={() => onCat(c.id)}>
            <div style={{ fontSize: 38 }}>{c.icon}</div>
            <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 8 }}>{c.name}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function WishlistPage({ products, wishlist, onOpen, onToggleWish }) {
  const list = products.filter((p) => wishlist.includes(p.id));
  return (
    <div className="container">
      <div className="section-head">Wishlist</div>
      <div className="grid-products" style={{ paddingBottom: 30 }}>
        {list.length ? list.map((p) => <ProductCard key={p.id} p={p} onOpen={onOpen} wishlist={wishlist} onToggleWish={onToggleWish} />)
          : <div className="empty"><Heart size={26} color="#C9C2AF" /><div>Nothing here yet</div></div>}
      </div>
    </div>
  );
}

/* ---------------- PRODUCT ---------------- */

function ProductPage({ product, onBack, onAddToCart, onBuyNow, wishlist, onToggleWish, flash, reviews }) {
  const [qty, setQty] = useState(1);
  const [activePhoto, setActivePhoto] = useState(0);
  const cat = CATS.find((c) => c.id === product.cat) || CATS[0];
  const wished = wishlist.includes(product.id);
  const photos = product.images || [];
  return (
    <div className="container">
      <button className="linkbtn" style={{ margin: "16px 0", display: "flex", alignItems: "center", gap: 4 }} onClick={onBack}>
        <ChevronRight size={14} style={{ transform: "rotate(180deg)" }} /> Back
      </button>
      <div className="product-layout">
        <div>
          <div className="pd-img" style={{ background: photos.length ? "#fff" : `linear-gradient(135deg, ${cat.color}33, ${cat.color}11)` }}>
            {photos.length ? (
              <img src={photos[activePhoto]} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ fontSize: 130 }}>{product.emoji}</span>
            )}
            {product.nwin && <Stamp style={{ position: "absolute", top: 16, left: 16, fontSize: 12 }}>Made in Nwin</Stamp>}
          </div>
          {photos.length > 1 && (
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              {photos.map((src, i) => (
                <button key={i} onClick={() => setActivePhoto(i)} style={{ width: 56, height: 56, borderRadius: 10, overflow: "hidden", border: i === activePhoto ? `2px solid ${cat.color}` : "1px solid #EFE9D9", padding: 0, cursor: "pointer" }}>
                  <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="pd-info">
          <div style={{ fontSize: 13, color: "#8A8578", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Store size={13} /> {product.sellerName}</span>
            <span className="verified-tag"><ShieldCheck size={13} /> Verified seller</span>
          </div>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 26, margin: "6px 0 10px" }}>{product.name}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 3, color: "#C9962A", fontSize: 14 }}><Star size={14} fill="#C9962A" strokeWidth={0} /> {product.rating || "New"}</span>
            <span style={{ fontSize: 13, color: "#8A8578" }}>{product.revCount} reviews · {product.stock} in stock</span>
          </div>
          <PriceTag price={product.price} was={product.was} big />

          <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "#3A362E", marginTop: 20, maxWidth: 520 }}>{product.desc}</p>

          <div style={{ display: "flex", gap: 10, margin: "18px 0" }}>
            <button className="mini-btn" onClick={() => flash("WhatsApp seller — add real numbers once sellers are onboarded")}><MessageCircle size={13} /> WhatsApp seller</button>
            <button className="mini-btn" onClick={() => flash("Report submitted to Nwin Shoppers admin")}><Flag size={13} /> Report</button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 6 }}>
            <div className="qty-ctrl">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))}><Minus size={14} /></button>
              <span>{qty}</span>
              <button onClick={() => setQty((q) => Math.min(product.stock || 1, q + 1))}><Plus size={14} /></button>
            </div>
            <button className="btn-secondary" onClick={() => onToggleWish(product.id)}>
              <Heart size={18} fill={wished ? "var(--accent)" : "none"} color={wished ? "var(--accent)" : "var(--primary)"} />
            </button>
            <button className="btn-secondary" style={{ width: 46 }} onClick={() => onAddToCart(product, qty)}><ShoppingCart size={18} /></button>
            <button className="btn-primary" style={{ flex: 1, justifyContent: "center" }} onClick={() => onBuyNow(product, qty)}>Buy now</button>
          </div>

          {reviews?.length > 0 && (
            <div style={{ marginTop: 30 }}>
              <div className="label-eyebrow">{reviews.length} reviews</div>
              {reviews.map((r, i) => (
                <div key={i} className="review-item">
                  <div className="review-head">{r.reviewer_name}
                    <span style={{ display: "flex", color: "#C9962A" }}>{Array.from({ length: r.rating }).map((_, j) => <Star key={j} size={12} fill="#C9962A" strokeWidth={0} />)}</span>
                  </div>
                  <div className="review-text">{r.text}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- CART / CHECKOUT ---------------- */

function CartPage({ cart, products, setCart, onCheckout }) {
  const items = cart.map((c) => ({ ...c, product: products.find((p) => p.id === c.id) })).filter((i) => i.product);
  const subtotal = items.reduce((s, i) => s + i.product.price * i.qty, 0);
  const deliveryFee = items.length ? 4000 : 0;
  const update = (id, delta) => setCart((c) => c.map((i) => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i));
  const remove = (id) => setCart((c) => c.filter((i) => i.id !== id));

  return (
    <div className="container">
      <div className="section-head">Your cart</div>
      {!items.length && <div className="empty" style={{ marginTop: 40 }}><ShoppingCart size={30} color="#C9C2AF" /><div style={{ marginTop: 8 }}>Nothing here yet</div></div>}
      <div className="cart-layout">
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((i) => (
            <div key={i.id} className="cart-row">
              <div className="cart-thumb">{i.product.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{i.product.name}</div>
                <PriceTag price={i.product.price} />
              </div>
              <div className="qty-ctrl">
                <button onClick={() => update(i.id, -1)}><Minus size={12} /></button>
                <span>{i.qty}</span>
                <button onClick={() => update(i.id, 1)}><Plus size={12} /></button>
              </div>
              <button className="linkbtn" onClick={() => remove(i.id)}><X size={18} /></button>
            </div>
          ))}
        </div>
        {items.length > 0 && (
          <div className="summary" style={{ minWidth: 280 }}>
            <div className="sumrow"><span>Subtotal</span><span>{money(subtotal)}</span></div>
            <div className="sumrow"><span>Delivery</span><span>{money(deliveryFee)}</span></div>
            <div className="sumrow total"><span>Total</span><span>{money(subtotal + deliveryFee)}</span></div>
            <button className="btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 12 }} onClick={onCheckout}>Checkout <ChevronRight size={16} /></button>
          </div>
        )}
      </div>
    </div>
  );
}

function CheckoutPage({ cart, products, points, onPlace, busy, flash }) {
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [payment, setPayment] = useState("cod");
  const [couponInput, setCouponInput] = useState("");
  const [coords, setCoords] = useState(null);
  const [quote, setQuote] = useState(null);
  const [locatingBusy, setLocatingBusy] = useState(false);

  const items = cart.map((c) => ({ ...c, product: products.find((p) => p.id === c.id) })).filter((i) => i.product);
  const subtotal = items.reduce((s, i) => s + i.product.price * i.qty, 0);
  const deliveryFee = quote ? quote.fee : (subtotal > 100000 ? 0 : 5000);
  const methods = [
    { id: "cod", label: "Cash on Delivery", icon: Banknote, tag: "Most popular" },
    { id: "momo", label: "Mobile Money (MTN / Airtel)", icon: Smartphone },
    { id: "card", label: "Card", icon: CreditCard },
  ];
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
          const q = await api.quoteDeliveryFee({ items: cart.map((i) => ({ product_id: i.id })), delivery_latitude: c.latitude, delivery_longitude: c.longitude });
          setQuote(q);
        } catch { /* quote is best-effort */ }
      },
      (err) => { flash("Couldn't get your location: " + err.message); setLocatingBusy(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="container">
      <div className="section-head">Checkout</div>
      <div className="checkout-layout">
        <div style={{ flex: 1 }}>
          <label className="field-label"><MapPin size={12} /> Deliver to</label>
          <textarea className="addr-input" rows={2} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. Plot 12, Kigo Road, Nwin Town" />
          <button type="button" className="mini-btn" style={{ marginTop: 8 }} onClick={captureLocation} disabled={locatingBusy}>
            {locatingBusy ? "Getting location..." : coords ? "📍 Location set — improves delivery fee accuracy" : "📍 Share my location for accurate delivery pricing"}
          </button>
          <label className="field-label">Delivery phone</label>
          <input className="text-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+2567..." />

          <label className="field-label" style={{ marginTop: 18 }}>Payment method</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
            {methods.map((m) => (
              <button key={m.id} className={"paymethod" + (payment === m.id ? " active" : "")} onClick={() => setPayment(m.id)}>
                <m.icon size={18} />
                <span style={{ flex: 1, textAlign: "left" }}>{m.label}</span>
                {m.tag && <Stamp style={{ borderColor: "var(--accent)", color: "var(--accent)" }}>{m.tag}</Stamp>}
                <span className={"radio" + (payment === m.id ? " on" : "")} />
              </button>
            ))}
          </div>

          <label className="field-label" style={{ marginTop: 18 }}><Percent size={12} /> Coupon code</label>
          <input className="text-input" placeholder="e.g. NWIN10" value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())} />
          <div style={{ fontSize: 11.5, color: "#8A8578", marginTop: 14 }}>Nwin Points: {points.toLocaleString()} pts (earn ~1 pt per UGX 1,000 spent)</div>
        </div>
        <div className="summary" style={{ minWidth: 300 }}>
          <div className="sumrow"><span>Subtotal</span><span>{money(subtotal)}</span></div>
          <div className="sumrow"><span>Delivery{quote?.estimated ? ` (${quote.distanceKm} km)` : " (estimate)"}</span><span>{money(deliveryFee)}</span></div>
          <div className="sumrow total"><span>Total (before coupon)</span><span>{money(subtotal + deliveryFee)}</span></div>
          <button className="btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 12 }} disabled={!canSubmit}
            onClick={() => onPlace({ address, phone, payment, couponInput, latitude: coords?.latitude, longitude: coords?.longitude })}>
            <ShieldCheck size={16} /> {busy ? "Placing order..." : "Place order"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RatingWidget({ order, onRate }) {
  const [stars, setStars] = useState(0);
  if (order.rated) return <div className="rate-thanks">Thanks for rating!</div>;
  return (
    <div className="rate-card">
      <div style={{ fontWeight: 700, fontSize: 14 }}>How was your order?</div>
      <div className="rate-stars">
        {[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => setStars(n)}><Star size={26} fill={n <= stars ? "#C9962A" : "none"} color="#C9962A" /></button>)}
      </div>
      <button className="btn-primary" disabled={!stars} onClick={() => stars && onRate(order, stars)}>Submit rating</button>
    </div>
  );
}

function TrackingPage({ order, onRate, ratedIds }) {
  if (!order) return null;
  const steps = [
    { key: "placed", label: "Order placed", icon: PackageCheck },
    { key: "confirmed", label: "Confirmed by seller", icon: ShieldCheck },
    { key: "out_for_delivery", label: "Rider picked up", icon: Bike },
    { key: "delivered", label: "Delivered", icon: CheckCircle2 },
  ];
  const order_ = ["placed", "confirmed", "out_for_delivery", "delivered"];
  const activeIdx = Math.max(0, order_.indexOf(order.status));
  return (
    <div className="container" style={{ maxWidth: 560 }}>
      <div className="section-head">Track order</div>
      <div className="rider-card">
        <Bike size={22} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{order.status === "delivered" ? "Delivered!" : "Your rider is on the way"}</div>
          <div style={{ fontSize: 12, color: "#EDE7D6" }}>Status: {order.status.replace(/_/g, " ")}</div>
        </div>
      </div>
      <div style={{ padding: "18px 6px" }}>
        {steps.map((s, i) => (
          <div key={s.key} className="step-row" style={{ paddingBottom: i === steps.length - 1 ? 0 : 26 }}>
            <div className={"step-dot" + (i <= activeIdx ? " on" : "")}><s.icon size={13} /></div>
            {i < steps.length - 1 && <div className={"step-line" + (i < activeIdx ? " on" : "")} />}
            <div style={{ marginLeft: 12, paddingTop: 4, fontSize: 13, fontWeight: 600, color: i <= activeIdx ? "#1C2B22" : "#A69B87" }}>{s.label}</div>
          </div>
        ))}
      </div>
      {order.status === "delivered" && <RatingWidget order={{ ...order, rated: ratedIds.includes(order.id) }} onRate={onRate} />}
    </div>
  );
}

function OrdersPage({ user, orders, onTrack, points }) {
  return (
    <div className="container" style={{ maxWidth: 720 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "20px 0" }}>
        <div className="avatar">{user?.name?.[0]?.toUpperCase() || "N"}</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 17 }}>{user?.name}</div>
          <div style={{ fontSize: 12.5, color: "#8A8578" }}>{user?.email}</div>
        </div>
      </div>
      <div className="points-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11.5, opacity: 0.85 }}>Nwin Points</div>
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: 800, fontSize: 24 }}>{points.toLocaleString()} pts</div>
          </div>
          <Gift size={28} />
        </div>
      </div>
      {user?.referral_code && (
        <div className="referral-card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Invite friends, earn points</div>
              <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>Share code {user.referral_code}</div>
            </div>
            <button className="withdraw-btn" style={{ color: "#2F3E8C" }} onClick={() => navigator.clipboard?.writeText(user.referral_code)}><Copy size={13} /> Copy</button>
          </div>
        </div>
      )}
      <div className="section-head">My orders</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {!orders.length && <div className="empty">Nothing here yet</div>}
        {orders.map((o) => (
          <button key={o.id} className="order-row" onClick={() => onTrack(o)}>
            <div className={"order-badge " + o.status}>{o.status === "delivered" ? <CheckCircle2 size={16} /> : <Truck size={16} />}</div>
            <div style={{ flex: 1, textAlign: "left" }}>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>Order #{o.id.slice(0, 8)}</div>
              <div style={{ fontSize: 12, color: "#8A8578" }}>{money(o.total)} · {o.payment_method.toUpperCase()} · {o.status}</div>
            </div>
            <ChevronRight size={16} color="#A69B87" />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------------- SELL / BECOME A SELLER ---------------- */

function SellPage({ user, seller, onApply, busy, flash }) {
  const [form, setForm] = useState({ business_name: "", description: "", location: "" });

  if (!user) {
    return (
      <div className="container" style={{ maxWidth: 560, textAlign: "center", padding: "60px 16px" }}>
        <Store size={36} color="var(--primary)" />
        <h2 style={{ fontFamily: "'Space Grotesk',sans-serif" }}>Sell on Nwin Shoppers</h2>
        <p style={{ color: "#3A362E" }}>Log in or create an account to apply as a seller.</p>
      </div>
    );
  }

  if (seller) {
    return (
      <div className="container" style={{ maxWidth: 560, padding: "40px 16px" }}>
        <div className="section-head">Your seller application</div>
        <div className="cart-row">
          <div className="cart-thumb"><Store size={18} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700 }}>{seller.business_name}</div>
            <div style={{ fontSize: 12, color: "#8A8578" }}>{seller.location}</div>
          </div>
          <span className={"status-pill " + seller.status}>{seller.status}</span>
        </div>
        {seller.status === "approved" ? (
          <p style={{ marginTop: 16, fontSize: 13.5 }}>You're approved! Manage your listings from the seller dashboard.</p>
        ) : (
          <p style={{ marginTop: 16, fontSize: 13.5, color: "#8A6A1E" }}>An admin will review your application shortly.</p>
        )}
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: 560, padding: "40px 16px" }}>
      <div className="section-head">Become a seller</div>
      <label className="field-label">Business name</label>
      <input className="text-input" value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} placeholder="e.g. Mama Ruth Fabrics" />
      <label className="field-label">Description</label>
      <textarea className="text-input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What do you sell?" />
      <label className="field-label">Location (address text)</label>
      <input className="text-input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Nwin Central Market" />
      <div style={{ marginTop: 12 }}>
        <label className="field-label"><MapPin size={12} /> Pickup point (for delivery pricing)</label>
        <button type="button" className="mini-btn" style={{ marginTop: 6 }} onClick={() => {
          if (!navigator.geolocation) return flash("Location isn't available in this browser");
          navigator.geolocation.getCurrentPosition(
            (pos) => setForm((f) => ({ ...f, latitude: pos.coords.latitude, longitude: pos.coords.longitude })),
            (err) => flash("Couldn't get location: " + err.message),
            { enableHighAccuracy: true, timeout: 10000 }
          );
        }}>
          {form.latitude ? `📍 ${form.latitude.toFixed(5)}, ${form.longitude.toFixed(5)}` : "📍 Use my current location"}
        </button>
      </div>
      <button className="btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 18 }} disabled={!form.business_name || busy} onClick={() => onApply(form)}>
        {busy ? "Submitting..." : "Apply to sell"}
      </button>
    </div>
  );
}

/* ---------------- SELLER DASHBOARD ---------------- */

function SellerDashboard({ seller, myProducts, myOrders, onNav, tab, flash, onAddProduct, onUpdateOrderStatus, addBusy, onEditProduct, editingProduct, onEditSubmit }) {
  if (!seller) {
    return (
      <div className="container" style={{ maxWidth: 560, padding: "60px 16px", textAlign: "center" }}>
        <Store size={36} color="var(--primary)" />
        <h2 style={{ fontFamily: "'Space Grotesk',sans-serif" }}>No seller profile yet</h2>
        <p style={{ color: "#3A362E" }}>Apply from the "Sell on Nwin" page first.</p>
        <button className="btn-primary" style={{ marginTop: 10 }} onClick={() => onNav("sell")}>Apply to sell</button>
      </div>
    );
  }

  const earnings = myOrders.reduce((s, o) => s + Number(o.total || 0), 0);

  return (
    <div className="container" style={{ paddingBottom: 40 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 20 }}>
        <div>
          <div style={{ fontSize: 12, color: "#8A8578" }}>Seller dashboard</div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 22 }}>{seller.business_name}</div>
        </div>
        <span className={"status-pill " + seller.status}>{seller.status}</span>
      </div>
      {seller.status !== "approved" && (
        <div className="banner-notice">Your seller account is awaiting admin approval. You can prepare products below — they'll go live once you're approved.</div>
      )}

      <div className="dash-tabs">
        <button className={tab === "overview" ? "active" : ""} onClick={() => onNav("seller-home")}>Overview</button>
        <button className={tab === "add" ? "active" : ""} onClick={() => onNav("seller-add")}>Add product</button>
        <button className={tab === "orders" ? "active" : ""} onClick={() => onNav("seller-orders")}>Orders</button>
      </div>

      {tab === "overview" && (
        <>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <div className="stat-tile"><TrendingIcon /><div className="stat-n">{myOrders.length}</div><div className="stat-l">Orders</div></div>
            <div className="stat-tile"><Store size={18} color="#2F3E8C" /><div className="stat-n">{myProducts.length}</div><div className="stat-l">Products</div></div>
            <div className="stat-tile"><Gift size={18} color="#C9962A" /><div className="stat-n">{money(earnings)}</div><div className="stat-l">Order value</div></div>
          </div>
          <div className="section-head">My products</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {!myProducts.length && <div className="empty">No products yet</div>}
            {myProducts.map((p) => (
              <div key={p.id} className="cart-row">
                <div className="cart-thumb" style={{ overflow: "hidden", padding: 0 }}>
                  {p.photo ? <img src={p.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : p.emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                  <PriceTag price={p.price} />
                </div>
                <span className={"status-pill " + p.status}>{p.status}</span>
                <button className="mini-btn" onClick={() => onEditProduct(p)}>Edit</button>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "add" && <ProductForm onSubmit={onAddProduct} busy={addBusy} submitLabel="Submit for approval" />}
      {tab === "edit" && <ProductForm initial={editingProduct} onSubmit={onEditSubmit} busy={addBusy} submitLabel="Save changes" onCancel={() => onNav("seller-home")} />}

      {tab === "orders" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {!myOrders.length && <div className="empty">No orders yet</div>}
          {myOrders.map((o) => (
            <div key={o.id} className="cart-row">
              <div className="cart-thumb"><Truck size={18} /></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Order #{o.id.slice(0, 8)}</div>
                <div style={{ fontSize: 12, color: "#8A8578" }}>{money(o.total)} · {o.payment_method.toUpperCase()} · {o.status}</div>
              </div>
              {o.status === "placed" && <button className="mini-btn" onClick={() => onUpdateOrderStatus(o.id, "confirmed")}>Confirm</button>}
              {o.status === "confirmed" && <button className="mini-btn" onClick={() => onUpdateOrderStatus(o.id, "out_for_delivery")}>Out for delivery</button>}
              {o.status === "out_for_delivery" && <button className="mini-btn approve" onClick={() => onUpdateOrderStatus(o.id, "delivered")}>Mark delivered</button>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TrendingIcon() { return <Sparkles size={18} color="var(--primary)" />; }

function ProductForm({ initial, onSubmit, busy, submitLabel, onCancel }) {
  const [form, setForm] = useState({
    name: initial?.name || "", price: initial?.price || "", stock: initial?.stock ?? 10,
    cat: initial?.cat || "electronics", desc: initial?.desc || "",
  });
  const [photos, setPhotos] = useState((initial?.images || []).map((url, i) => ({ key: `existing-${i}`, url })));

  const addFiles = (fileList) => {
    const room = 6 - photos.length;
    const items = Array.from(fileList).slice(0, room).map((f, i) => ({ key: `new-${Date.now()}-${i}`, url: URL.createObjectURL(f), file: f }));
    setPhotos((p) => [...p, ...items]);
  };
  const removePhoto = (key) => setPhotos((p) => p.filter((x) => x.key !== key));
  const makeCover = (key) => setPhotos((p) => { const item = p.find((x) => x.key === key); return item ? [item, ...p.filter((x) => x.key !== key)] : p; });

  const submit = () => onSubmit(form, photos);

  return (
    <div className="form-card" style={{ maxWidth: 560 }}>
      <div className="form-card-head">
        <div className="form-card-icon"><ShoppingBag size={17} /></div>
        <div>
          <div className="form-card-title">{initial ? "Edit product" : "Add a new product"}</div>
          <div className="form-card-sub">First photo is the cover shoppers see first — add up to 6, from different angles.</div>
        </div>
      </div>

      <div className="photo-grid">
        {photos.map((p, i) => (
          <div key={p.key} className="photo-tile">
            <img src={p.url} alt="" />
            {i === 0 && <span className="photo-cover-badge">Cover</span>}
            <button type="button" className="photo-remove" onClick={() => removePhoto(p.key)}>×</button>
            {i !== 0 && <button type="button" className="photo-setcover" onClick={() => makeCover(p.key)}>Set cover</button>}
          </div>
        ))}
        {photos.length < 6 && (
          <label className="photo-add">
            <span style={{ fontSize: 22 }}>+</span>
            <input type="file" accept="image/*" multiple hidden onChange={(e) => e.target.files.length && addFiles(e.target.files)} />
          </label>
        )}
      </div>

      <div className="form-grid">
        <div className="form-field">
          <label className="field-label">Product name</label>
          <input className="text-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Ankara Print Dress" />
        </div>
        <div className="form-field">
          <label className="field-label">Category</label>
          <select className="text-input" value={form.cat} onChange={(e) => setForm({ ...form, cat: e.target.value })}>
            {CATS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="form-field">
          <label className="field-label">Price (UGX)</label>
          <input className="text-input" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        </div>
        <div className="form-field">
          <label className="field-label">Stock quantity</label>
          <input className="text-input" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
        </div>
      </div>
      <div className="form-field" style={{ marginTop: 14 }}>
        <label className="field-label">Description</label>
        <textarea className="text-input" rows={3} value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} />
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
        {onCancel && <button className="btn-secondary" style={{ width: "auto", padding: "0 20px" }} onClick={onCancel}>Cancel</button>}
        <button className="btn-primary" style={{ flex: 1, justifyContent: "center" }} disabled={!form.name || !form.price || busy} onClick={submit}>
          {busy ? "Saving..." : submitLabel}
        </button>
      </div>
    </div>
  );
}

/* ---------------- ADMIN CONSOLE ---------------- */

function AdminConsole({
  pendingSellers, pendingProducts, stats, onApproveSeller, onApproveProduct,
  pendingRestaurants, pendingMenuItems, onApproveRestaurant, onApproveMenuItem,
  onAddRestaurantDirect, addRestaurantBusy, flash, allRestaurants, onManageMenu,
}) {
  const [showAddRestaurant, setShowAddRestaurant] = useState(false);

  return (
    <div className="container" style={{ paddingBottom: 40 }}>
      <div style={{ paddingTop: 20 }}>
        <div style={{ fontSize: 12, color: "#8A8578" }}>Admin console</div>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 22 }}>Nwin Shoppers HQ</div>
      </div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", margin: "16px 0" }}>
        <div className="stat-tile"><Users size={18} color="#2F3E8C" /><div className="stat-n">{stats?.approvedSellers ?? "–"}</div><div className="stat-l">Sellers</div></div>
        <div className="stat-tile"><Store size={18} color="var(--primary)" /><div className="stat-n">{stats?.liveProducts ?? "–"}</div><div className="stat-l">Products</div></div>
        <div className="stat-tile"><Truck size={18} color="var(--accent)" /><div className="stat-n">{stats?.totalOrders ?? "–"}</div><div className="stat-l">Orders</div></div>
        <div className="stat-tile"><Gift size={18} color="#C9962A" /><div className="stat-n">{money(stats?.paidRevenue || 0)}</div><div className="stat-l">Paid revenue</div></div>
        <div className="stat-tile"><span style={{ fontSize: 18 }}>🍔</span><div className="stat-n">{stats?.approvedRestaurants ?? "–"}</div><div className="stat-l">Restaurants</div></div>
        <div className="stat-tile"><span style={{ fontSize: 18 }}>🛵</span><div className="stat-n">{stats?.totalFoodOrders ?? "–"}</div><div className="stat-l">Food orders</div></div>
      </div>

      <div className="section-head">Pending seller approval ({pendingSellers.length})</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {!pendingSellers.length && <div className="empty">All caught up</div>}
        {pendingSellers.map((s) => (
          <div key={s.id} className="cart-row">
            <div className="cart-thumb"><Store size={18} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{s.business_name}</div>
              <div style={{ fontSize: 12, color: "#8A8578" }}>{s.applicant_name} · {s.email}</div>
            </div>
            <button className="mini-btn approve" onClick={() => onApproveSeller(s.id)}>Approve</button>
          </div>
        ))}
      </div>

      <div className="section-head">Pending product approval ({pendingProducts.length})</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {!pendingProducts.length && <div className="empty">All caught up</div>}
        {pendingProducts.map((p) => (
          <div key={p.id} className="cart-row">
            <div className="cart-thumb">{CATS.find((c) => c.id === p.category)?.icon || "🛍️"}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
              <div style={{ fontSize: 12, color: "#8A8578" }}>{p.seller_name}</div>
              <PriceTag price={p.price} />
            </div>
            <button className="mini-btn approve" onClick={() => onApproveProduct(p.id)}>Approve</button>
          </div>
        ))}
      </div>

      <div className="section-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>🍔 Restaurants — pending ({pendingRestaurants.length})</span>
        <button className="mini-btn" onClick={() => setShowAddRestaurant((v) => !v)}>{showAddRestaurant ? "Cancel" : "+ Add restaurant directly"}</button>
      </div>
      {showAddRestaurant && <AdminAddRestaurantForm onSubmit={onAddRestaurantDirect} busy={addRestaurantBusy} flash={flash} />}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {!pendingRestaurants.length && <div className="empty">All caught up</div>}
        {pendingRestaurants.map((r) => (
          <div key={r.id} className="cart-row">
            <div className="cart-thumb">🍔</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{r.name}</div>
              <div style={{ fontSize: 12, color: "#8A8578" }}>{r.applicant_name} · {r.email} · {r.cuisine_type}</div>
            </div>
            <button className="mini-btn approve" onClick={() => onApproveRestaurant(r.id)}>Approve</button>
          </div>
        ))}
      </div>

      <div className="section-head">🍲 Menu items — pending ({pendingMenuItems.length})</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {!pendingMenuItems.length && <div className="empty">All caught up</div>}
        {pendingMenuItems.map((m) => (
          <div key={m.id} className="cart-row">
            <div className="cart-thumb">🍲</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{m.name}</div>
              <div style={{ fontSize: 12, color: "#8A8578" }}>{m.restaurant_name}</div>
              <PriceTag price={m.price} />
            </div>
            <button className="mini-btn approve" onClick={() => onApproveMenuItem(m.id)}>Approve</button>
          </div>
        ))}
      </div>

      <div className="section-head">🍔 All restaurants — manage menus ({allRestaurants.length})</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {!allRestaurants.length && <div className="empty">No restaurants yet — add one above</div>}
        {allRestaurants.map((r) => (
          <div key={r.id} className="cart-row">
            <div className="cart-thumb" style={{ overflow: "hidden", padding: 0 }}>
              {r.image ? <img src={r.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "🍔"}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{r.name}</div>
              <div style={{ fontSize: 12, color: "#8A8578" }}>{r.cuisine_type} · {r.location}</div>
            </div>
            <button className="mini-btn" onClick={() => onManageMenu(r)}>Manage menu</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminAddRestaurantForm({ onSubmit, busy, flash }) {
  const [form, setForm] = useState({ name: "", cuisine_type: "", location: "", phone: "", avg_prep_minutes: "20", description: "", manager_email: "", latitude: null, longitude: null });
  const [photoFile, setPhotoFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [locating, setLocating] = useState(false);

  const pickPhoto = (file) => { setPhotoFile(file); setPreview(URL.createObjectURL(file)); };

  const captureLocation = () => {
    if (!navigator.geolocation) return flash("Location isn't available in this browser");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setForm((f) => ({ ...f, latitude: pos.coords.latitude, longitude: pos.coords.longitude })); setLocating(false); },
      (err) => { flash("Couldn't get location: " + err.message); setLocating(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const submit = async () => {
    setUploading(true);
    try {
      let image = null;
      if (photoFile) {
        const fd = new FormData();
        fd.append("image", photoFile);
        const { url } = await api.uploadRestaurantLogo(fd);
        image = url;
      }
      onSubmit({ ...form, avg_prep_minutes: Number(form.avg_prep_minutes) || 20, image });
    } catch (e) { flash(e.message); } finally { setUploading(false); }
  };

  return (
    <div className="form-card">
      <div className="form-card-head">
        <div className="form-card-icon"><Store size={17} /></div>
        <div>
          <div className="form-card-title">Add a new restaurant</div>
          <div className="form-card-sub">Goes live on Nwin Plus immediately — no approval step needed.</div>
        </div>
      </div>

      <label
        className="dropzone"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); e.dataTransfer.files[0] && pickPhoto(e.dataTransfer.files[0]); }}
      >
        {preview ? (
          <img src={preview} alt="" className="dropzone-preview" />
        ) : (
          <>
            <span className="dropzone-icon">📷</span>
            <span className="dropzone-text">Click or drag a logo here</span>
          </>
        )}
        <input type="file" accept="image/*" hidden onChange={(e) => e.target.files[0] && pickPhoto(e.target.files[0])} />
      </label>

      <div className="form-grid">
        <div className="form-field">
          <label className="field-label">Restaurant name</label>
          <input className="text-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Mama's Kitchen" />
        </div>
        <div className="form-field">
          <label className="field-label">Cuisine type</label>
          <input className="text-input" value={form.cuisine_type} onChange={(e) => setForm({ ...form, cuisine_type: e.target.value })} placeholder="e.g. Ugandan, Grill, Fast food" />
        </div>
        <div className="form-field">
          <label className="field-label">Location (address text)</label>
          <input className="text-input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Kampala Road" />
        </div>
        <div className="form-field">
          <label className="field-label">Phone</label>
          <input className="text-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+2567..." />
        </div>
        <div className="form-field">
          <label className="field-label">Avg. prep time (minutes)</label>
          <input className="text-input" type="number" value={form.avg_prep_minutes} onChange={(e) => setForm({ ...form, avg_prep_minutes: e.target.value })} />
        </div>
        <div className="form-field">
          <label className="field-label">Pickup location (GPS)</label>
          <button type="button" className="mini-btn" onClick={captureLocation} disabled={locating} style={{ width: "100%", justifyContent: "center" }}>
            {locating ? "Getting location..." : form.latitude ? `📍 ${form.latitude.toFixed(5)}, ${form.longitude.toFixed(5)}` : "📍 Use my current location"}
          </button>
        </div>
      </div>

      <div className="form-field" style={{ marginTop: 14 }}>
        <label className="field-label">Description</label>
        <textarea className="text-input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>

      <div className="invite-box">
        <label className="field-label"><Users size={12} /> Invite a manager (optional)</label>
        <input className="text-input" value={form.manager_email} onChange={(e) => setForm({ ...form, manager_email: e.target.value })} placeholder="their-email@example.com" />
        <div className="invite-hint">Whoever logs in with this email automatically gets access to manage this restaurant's menu and orders — no separate application needed.</div>
      </div>

      <button className="btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 16 }} disabled={!form.name || busy || uploading} onClick={submit}>
        {busy || uploading ? "Adding..." : "Add restaurant"}
      </button>
    </div>
  );
}

/* ---------------- SMART APP BANNER ---------------- */

function AppBanner({ onDismiss }) {
  return (
    <div className="app-banner">
      <ShoppingBag size={20} />
      <div style={{ flex: 1, fontSize: 12.5 }}>Get the Nwin Shoppers app for a faster experience.</div>
      <button className="store-btn" onClick={() => alert("App isn't published yet — coming soon to Play Store & App Store!")}>Get app</button>
      <button className="dismiss" onClick={onDismiss}><X size={16} /></button>
    </div>
  );
}

/* ---------------- APP SHELL ---------------- */

export default function App() {
  const [checkingSession, setCheckingSession] = useState(true);
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [productReviews, setProductReviews] = useState({});
  const [seller, setSeller] = useState(null);
  const [myProducts, setMyProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [myOrders, setMyOrders] = useState([]);
  const [pendingSellers, setPendingSellers] = useState([]);
  const [pendingProducts, setPendingProducts] = useState([]);
  const [adminStats, setAdminStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [ratedOrderIds, setRatedOrderIds] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [cart, setCart] = useState([]);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);
  const [addBusy, setAddBusy] = useState(false);
  const [pendingVerifyEmail, setPendingVerifyEmail] = useState(null);
  const [showAppBanner, setShowAppBanner] = useState(false);

  const [restaurants, setRestaurants] = useState([]);
  const [myRestaurant, setMyRestaurant] = useState(null);
  const [pendingRestaurants, setPendingRestaurants] = useState([]);
  const [pendingMenuItems, setPendingMenuItems] = useState([]);
  const [foodCart, setFoodCart] = useState([]);
  const [activeRestaurantId, setActiveRestaurantId] = useState(null);
  const [activeFoodOrderId, setActiveFoodOrderId] = useState(null);
  const [adminManagingRestaurant, setAdminManagingRestaurant] = useState(null);
  const [restaurantApplyBusy, setRestaurantApplyBusy] = useState(false);
  const [addRestaurantBusy, setAddRestaurantBusy] = useState(false);
  const [foodOrderBusy, setFoodOrderBusy] = useState(false);

  const [page, setPage] = useState("home");
  const [filterDeal, setFilterDeal] = useState(false);
  const [activeCat, setActiveCat] = useState(null);
  const [activeProduct, setActiveProduct] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2600); };

  useEffect(() => {
    setAuthChangeListener(setUser);
    api.fetchMe().finally(() => setCheckingSession(false));
  }, []);

  useEffect(() => {
    api.listProducts().then((rows) => setProducts(rows.map(toUiProduct))).catch((e) => flash(e.message));
  }, []);

  useEffect(() => {
    if (!user) { setWishlist([]); return; }
    api.getWishlist().then((rows) => setWishlist(rows.map((r) => r.id))).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!user) return;
    api.myOrders().then(setOrders).catch(() => {});
  }, [user, page]);

  useEffect(() => {
    if (!user) { setSeller(null); return; }
    api.getMySeller().then(setSeller).catch(() => setSeller(null));
  }, [user, page]);

  useEffect(() => {
    if (!user || user.role !== "seller") return;
    api.sellerMine().then((rows) => setMyProducts(rows.map(toUiProduct))).catch(() => setMyProducts([]));
    api.myOrders().then(setMyOrders).catch(() => {});
  }, [user, seller, page]);

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    api.adminPendingSellers().then(setPendingSellers).catch(() => {});
    api.adminPendingProducts().then(setPendingProducts).catch(() => {});
    api.adminStats().then(setAdminStats).catch(() => {});
    api.adminPendingRestaurants().then(setPendingRestaurants).catch(() => {});
    api.adminPendingMenuItems().then(setPendingMenuItems).catch(() => {});
  }, [user, page]);

  useEffect(() => {
    api.listRestaurants().then(setRestaurants).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) { setMyRestaurant(null); return; }
    api.myRestaurant()
      .then(setMyRestaurant)
      .catch(() => {
        // No restaurant yet — check whether an admin invited this email to
        // manage one they added directly, and link it automatically.
        api.claimRestaurant().then(setMyRestaurant).catch(() => setMyRestaurant(null));
      });
  }, [user, page]);

  // Smart app banner: only on small screens, only once per session, and
  // never a hard redirect — the app doesn't exist yet, so forcing a jump
  // to a dead store link would just break the experience for mobile visitors.
  useEffect(() => {
    const isMobile = window.matchMedia("(max-width: 640px)").matches;
    const dismissed = sessionStorage.getItem("nwin_app_banner_dismissed");
    if (isMobile && !dismissed) setShowAppBanner(true);
  }, []);
  const dismissAppBanner = () => {
    sessionStorage.setItem("nwin_app_banner_dismissed", "1");
    setShowAppBanner(false);
  };

  const nav = (p, opts = {}) => {
    setPage(p);
    setFilterDeal(!!opts.deal);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const requireVerified = () => {
    if (user && !user.email_verified) {
      setPendingVerifyEmail(user.email);
      nav("verify-otp");
      return false;
    }
    return true;
  };

  const toggleWish = async (id) => {
    if (!user) { flash("Log in to save items to your wishlist"); nav("auth"); return; }
    const already = wishlist.includes(id);
    setWishlist((w) => (already ? w.filter((x) => x !== id) : [...w, id]));
    try {
      if (already) await api.removeWishlist(id); else await api.addWishlist(id);
    } catch (e) {
      flash(e.message);
      setWishlist((w) => (already ? [...w, id] : w.filter((x) => x !== id)));
    }
  };

  const openProduct = async (p) => {
    setActiveProduct(p);
    nav("product");
    try {
      const { reviews } = await api.getProduct(p.id);
      setProductReviews((r) => ({ ...r, [p.id]: reviews }));
    } catch { /* ignore */ }
  };

  const addToCart = (product, qty) => {
    setCart((c) => {
      const existing = c.find((i) => i.id === product.id);
      if (existing) return c.map((i) => i.id === product.id ? { ...i, qty: i.qty + qty } : i);
      return [...c, { id: product.id, qty }];
    });
    flash(`Added ${product.name} to cart`);
  };

  const buyNow = (product, qty) => {
    addToCart(product, qty);
    nav("checkout");
  };

  const placeOrder = async ({ address, phone, payment, couponInput, latitude, longitude }) => {
    if (!user) { flash("Log in to place an order"); nav("auth"); return; }
    if (!requireVerified()) { flash("Please verify your email before checking out"); return; }
    setBusy(true);
    try {
      const { order } = await api.placeOrder({
        items: cart.map((c) => ({ product_id: c.id, quantity: c.qty })),
        payment_method: payment, delivery_address: address, delivery_phone: phone,
        coupon_code: couponInput || undefined,
        delivery_latitude: latitude, delivery_longitude: longitude,
      });
      setCart([]);
      setActiveOrder(order);
      setOrders((o) => [order, ...o]);
      const me = await api.fetchMe();
      setUser(me);
      flash("Order placed!");
      nav("tracking");
    } catch (e) {
      flash(e.message);
    } finally {
      setBusy(false);
    }
  };

  const rateOrder = async (order, stars) => {
    try {
      const full = await api.getOrder(order.id);
      await Promise.all(full.items.map((it) => api.submitReview({ product_id: it.product_id, order_id: order.id, rating: stars })));
      setRatedOrderIds((r) => [...r, order.id]);
      flash("Thanks for rating your order!");
    } catch (e) { flash(e.message); }
  };

  const applySeller = async (form) => {
    if (!requireVerified()) { flash("Please verify your email before applying to sell"); return; }
    setBusy(true);
    try {
      const s = await api.applySeller(form);
      setSeller(s);
      const me = await api.fetchMe();
      setUser(me);
      flash("Application submitted for review");
    } catch (e) { flash(e.message); } finally { setBusy(false); }
  };

  // Shared by add and edit: uploads any newly-picked files, keeps any
  // existing remote URLs, and returns the final images array in cover-first
  // order — cover is always whichever photo sits at index 0.
  const resolvePhotoUrls = async (photos) => {
    const newItems = photos.filter((p) => p.file);
    let uploadedUrls = [];
    if (newItems.length) uploadedUrls = await api.uploadProductImages(newItems.map((p) => p.file));
    let i = 0;
    return photos.map((p) => (p.file ? uploadedUrls[i++] : p.url));
  };

  const addSellerProduct = async (form, photos) => {
    setAddBusy(true);
    try {
      const images = await resolvePhotoUrls(photos);
      await api.createProduct({
        name: form.name, description: form.desc, price: Number(form.price),
        stock: Number(form.stock) || 0, category_id: undefined, images,
      });
      flash("Submitted for admin approval");
      nav("seller-home");
    } catch (e) { flash(e.message); } finally { setAddBusy(false); }
  };

  const editSellerProduct = async (form, photos) => {
    if (!editingProduct) return;
    setAddBusy(true);
    try {
      const images = await resolvePhotoUrls(photos);
      await api.updateProduct(editingProduct.id, {
        name: form.name, description: form.desc, price: Number(form.price),
        stock: Number(form.stock) || 0, images,
      });
      flash("Changes saved — re-submitted for admin review");
      setEditingProduct(null);
      api.sellerMine().then((rows) => setMyProducts(rows.map(toUiProduct))).catch(() => {});
      nav("seller-home");
    } catch (e) { flash(e.message); } finally { setAddBusy(false); }
  };

  const updateOrderStatus = async (id, status) => {
    try {
      const order = await api.updateOrderStatus(id, status);
      setMyOrders((os) => os.map((o) => (o.id === id ? order : o)));
      flash(`Order marked ${status.replace(/_/g, " ")}`);
    } catch (e) { flash(e.message); }
  };

  const approveSeller = async (id) => {
    try {
      await api.adminSetSellerStatus(id, "approved");
      setPendingSellers((s) => s.filter((x) => x.id !== id));
      flash("Seller approved");
    } catch (e) { flash(e.message); }
  };
  const approveProduct = async (id) => {
    try {
      await api.adminSetProductStatus(id, "approved");
      setPendingProducts((p) => p.filter((x) => x.id !== id));
      flash("Product approved");
      api.listProducts().then((rows) => setProducts(rows.map(toUiProduct)));
    } catch (e) { flash(e.message); }
  };

  const openRestaurant = (r) => { setActiveRestaurantId(r.id); nav("restaurant"); };

  const placeFoodOrder = async ({ address, phone, payment, latitude, longitude }) => {
    if (!user) { flash("Log in to place an order"); nav("auth"); return; }
    if (!requireVerified()) { flash("Please verify your email before checking out"); return; }
    if (!foodCart.length) return;
    setFoodOrderBusy(true);
    try {
      const { order } = await api.placeFoodOrder({
        restaurant_id: foodCart[0].restaurant_id,
        items: foodCart.map((i) => ({ menu_item_id: i.menu_item_id, quantity: i.quantity })),
        payment_method: payment, delivery_address: address, delivery_phone: phone,
        delivery_latitude: latitude, delivery_longitude: longitude,
      });
      setFoodCart([]);
      setActiveFoodOrderId(order.id);
      flash("Food order placed!");
      nav("food-tracking");
    } catch (e) {
      flash(e.message);
    } finally {
      setFoodOrderBusy(false);
    }
  };

  const applyRestaurant = async (form) => {
    if (!requireVerified()) { flash("Please verify your email before applying"); return; }
    setRestaurantApplyBusy(true);
    try {
      const r = await api.applyRestaurant(form);
      setMyRestaurant(r);
      flash("Restaurant application submitted for review");
    } catch (e) { flash(e.message); } finally { setRestaurantApplyBusy(false); }
  };

  const addRestaurantDirect = async (form) => {
    setAddRestaurantBusy(true);
    try {
      const r = await api.adminCreateRestaurant(form);
      setRestaurants((rs) => [r, ...rs]);
      flash(`${r.name} added and live`);
    } catch (e) { flash(e.message); } finally { setAddRestaurantBusy(false); }
  };

  const approveRestaurant = async (id) => {
    try {
      await api.adminSetRestaurantStatus(id, "approved");
      setPendingRestaurants((rs) => rs.filter((x) => x.id !== id));
      api.listRestaurants().then(setRestaurants);
      flash("Restaurant approved");
    } catch (e) { flash(e.message); }
  };

  const approveMenuItem = async (id) => {
    try {
      await api.adminSetMenuItemStatus(id, "approved");
      setPendingMenuItems((ms) => ms.filter((x) => x.id !== id));
      flash("Menu item approved");
    } catch (e) { flash(e.message); }
  };

  const doRegister = async (payload) => {
    const data = await api.register(payload);
    setPendingVerifyEmail(data.user.email);
    nav("verify-otp");
  };

  const doGoogle = async (idToken) => {
    await api.googleSignIn(idToken);
    nav("home");
  };

  const doLogout = async () => {
    disconnectSocket();
    await api.logout();
  };

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  if (checkingSession) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#EDE7D6" }}><SiteStyles /></div>;
  }

  let body;
  if (page === "home") body = <Home products={products} onOpen={openProduct} onCat={(c) => { setActiveCat(c); nav("category"); }} wishlist={wishlist} onToggleWish={toggleWish} query={query} filterDeal={filterDeal} />;
  else if (page === "categories") body = <AllCategoriesPage onCat={(c) => { setActiveCat(c); nav("category"); }} />;
  else if (page === "category") body = <CategoryPage catId={activeCat} products={products} onOpen={openProduct} wishlist={wishlist} onToggleWish={toggleWish} />;
  else if (page === "wishlist") body = <WishlistPage products={products} wishlist={wishlist} onOpen={openProduct} onToggleWish={toggleWish} />;
  else if (page === "product") body = <ProductPage product={activeProduct} onBack={() => nav(activeCat ? "category" : "home")} onAddToCart={addToCart} onBuyNow={buyNow} wishlist={wishlist} onToggleWish={toggleWish} flash={flash} reviews={productReviews[activeProduct?.id]} />;
  else if (page === "cart") body = <CartPage cart={cart} products={products} setCart={setCart} onCheckout={() => user ? nav("checkout") : (flash("Log in to checkout"), nav("auth"))} />;
  else if (page === "checkout") body = <CheckoutPage cart={cart} products={products} points={user?.points || 0} onPlace={placeOrder} busy={busy} flash={flash} />;
  else if (page === "tracking") body = <TrackingPage order={activeOrder} onRate={rateOrder} ratedIds={ratedOrderIds} />;
  else if (page === "orders") body = user ? <OrdersPage user={user} orders={orders} onTrack={(o) => { setActiveOrder(o); nav("tracking"); }} points={user.points || 0} /> : <AuthPage onLogin={api.login} onRegister={doRegister} onGoogle={doGoogle} flash={flash} />;
  else if (page === "sell") body = <SellPage user={user} seller={seller} onApply={applySeller} busy={busy} flash={flash} />;
  else if (page === "seller-home" || page === "seller-add" || page === "seller-orders" || page === "seller-edit") {
    const tab = page === "seller-add" ? "add" : page === "seller-orders" ? "orders" : page === "seller-edit" ? "edit" : "overview";
    body = <SellerDashboard seller={seller} myProducts={myProducts} myOrders={myOrders} tab={tab} onNav={nav} flash={flash} onAddProduct={addSellerProduct} onUpdateOrderStatus={updateOrderStatus} addBusy={addBusy} onEditProduct={(p) => { setEditingProduct(p); nav("seller-edit"); }} editingProduct={editingProduct} onEditSubmit={editSellerProduct} />;
  }
  else if (page === "admin-home") body = <AdminConsole pendingSellers={pendingSellers} pendingProducts={pendingProducts} stats={adminStats} onApproveSeller={approveSeller} onApproveProduct={approveProduct} pendingRestaurants={pendingRestaurants} pendingMenuItems={pendingMenuItems} onApproveRestaurant={approveRestaurant} onApproveMenuItem={approveMenuItem} onAddRestaurantDirect={addRestaurantDirect} addRestaurantBusy={addRestaurantBusy} flash={flash} allRestaurants={restaurants} onManageMenu={(r) => { setAdminManagingRestaurant(r); nav("admin-manage-menu"); }} />;
  else if (page === "admin-manage-menu") body = <AdminManageMenuPage restaurantId={adminManagingRestaurant?.id} restaurantName={adminManagingRestaurant?.name} flash={flash} onBack={() => nav("admin-home")} />;
  else if (page === "verify-otp") body = <OtpPage email={pendingVerifyEmail || user?.email} flash={flash} onVerified={async () => { const me = await api.fetchMe(); setUser(me); nav("home"); }} />;
  else if (page === "auth") body = user ? <OrdersPage user={user} orders={orders} onTrack={(o) => { setActiveOrder(o); nav("tracking"); }} points={user.points || 0} /> : <AuthPage onLogin={api.login} onRegister={doRegister} onGoogle={doGoogle} flash={flash} />;
  else if (page === "food-home") body = <FoodHome restaurants={restaurants} onOpen={openRestaurant} />;
  else if (page === "restaurant") body = <RestaurantPage restaurantId={activeRestaurantId} onBack={() => nav("food-home")} foodCart={foodCart} setFoodCart={setFoodCart} flash={flash} />;
  else if (page === "food-cart") body = <FoodCartPage foodCart={foodCart} setFoodCart={setFoodCart} onCheckout={() => user ? nav("food-checkout") : (flash("Log in to checkout"), nav("auth"))} />;
  else if (page === "food-checkout") body = <FoodCheckoutPage foodCart={foodCart} onPlace={placeFoodOrder} busy={foodOrderBusy} flash={flash} />;
  else if (page === "food-tracking") body = <FoodTrackingPage orderId={activeFoodOrderId} flash={flash} />;
  else if (page === "restaurant-dashboard") body = <RestaurantDashboard restaurant={myRestaurant} onApply={applyRestaurant} applyBusy={restaurantApplyBusy} flash={flash} />;
  else if (page === "rider-dashboard") body = user?.role === "rider" ? <RiderDashboard flash={flash} /> : <div className="container" style={{ padding: 40 }}>Rider access only.</div>;

  return (
    <div className="site">
      <SiteStyles />
      <Toast msg={toast} />
      {showAppBanner && <AppBanner onDismiss={dismissAppBanner} />}
      {user && !user.email_verified && page !== "verify-otp" && (
        <div className="verify-banner">
          <span>Please verify your email to unlock checkout and selling.</span>
          <button onClick={() => { setPendingVerifyEmail(user.email); nav("verify-otp"); }}>Verify now</button>
        </div>
      )}
      <Header
        user={user} cartCount={cartCount} wishlistCount={wishlist.length}
        query={query} setQuery={setQuery}
        onNav={nav} onLogout={doLogout}
        onSearch={() => nav("home")}
      />
      <main>{body}</main>
      <Footer onNav={nav} />
    </div>
  );
}

function SiteStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700;800&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;700&display=swap');
      * { box-sizing: border-box; }
      body { margin: 0; }

      /* ---------------------------------------------------------------
         DESIGN TOKENS — Nwin Shoppers brand system
         Direction: warm off-white base (not stark white), one dominant
         accent instead of several competing colors, a deep jade/teal
         primary for trust, oversized confident typography. Grounded in
         2026 e-commerce research: "Cloud Dancer" neutral bases, single
         intense accent for CTAs, teal/jade as the trust color for
         platforms that move money.
      --------------------------------------------------------------- */
      :root {
        --primary: #0F4A46;        /* deep jade/teal — trust, brand */
        --primary-dark: #0A332F;
        --primary-light: #E3EFEC;
        --secondary: #14181A;       /* near-black warm ink — structure/text */
        --accent: #FF5A3C;          /* single dominant CTA color */
        --accent-dark: #E0442A;
        --sale: #FF3D6E;            /* distinct from accent — used ONLY for discount/sale badges */
        --bg: #FAF7F1;              /* warm off-white base, not stark white */
        --surface: #FFFFFF;
        --border: #ECE5D6;
        --text: #14181A;
        --text-soft: #3A362E;
        --muted: #8B8478;
        --muted-light: #B0A996;
        --success: #1F7A5C;
        --success-bg: #E5F3ED;
        --warning: #E8A93B;
        --warning-bg: #FBF1DE;
        --error: #E0483E;
        --error-bg: #FCE9E7;
        --gold: #C9962A;
      }

      .site { font-family:'Inter',sans-serif; color:var(--text); background:var(--bg); min-height:100vh; display:flex; flex-direction:column; }
      main { flex: 1; }
      .container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }

      .site-header { position: sticky; top: 0; z-index: 30; background: rgba(250,247,241,0.92); backdrop-filter: blur(10px); border-bottom: 1px solid var(--border); box-shadow: 0 1px 0 rgba(20,24,26,0.02); }
      .header-inner { max-width: 1200px; margin: 0 auto; padding: 14px 24px; display: flex; align-items: center; gap: 24px; }
      .brand { display: flex; align-items: center; gap: 10px; background: none; border: none; cursor: pointer; font-family:'Space Grotesk',sans-serif; font-weight: 700; font-size: 17px; color: #1C2B22; }
      .brand b { color: var(--primary); }
      .brand-mark { width: 38px; height: 38px; border-radius: 11px; background: linear-gradient(135deg, var(--primary), var(--primary-dark)); display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 3px 10px rgba(27,94,58,0.3); }
      .header-search { flex: 1; max-width: 480px; display: flex; align-items: center; gap: 8px; background: #F2EFE4; border: 1.5px solid transparent; border-radius: 12px; padding: 10px 14px; transition: border-color .15s ease, background .15s ease; }
      .header-search:focus-within { border-color: var(--primary); background: #fff; }
      .header-search input { border: none; background: none; outline: none; font-size: 13.5px; flex: 1; font-family: inherit; }
      .header-nav { display: flex; gap: 6px; }
      .header-nav button { background: none; border: none; font-size: 13.5px; font-weight: 600; color: #3A362E; padding: 8px 12px; border-radius: 8px; cursor: pointer; }
      .header-nav button:hover { background: #F2EFE4; }
      .header-actions { display: flex; align-items: center; gap: 8px; }
      .icon-pill { position: relative; background: #F2EFE4; border: 1px solid #E4DCC6; border-radius: 10px; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
      .pill-badge { position: absolute; top: -5px; right: -5px; background: var(--accent); color: #fff; font-size: 9.5px; font-weight: 700; border-radius: 8px; padding: 1px 5px; }
      .account-menu { position: relative; }
      .dropdown { position: absolute; right: 0; top: 46px; background: #fff; border: 1px solid #EFE9D9; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.08); min-width: 180px; padding: 6px; z-index: 40; }
      .dropdown button { display: flex; align-items: center; gap: 8px; width: 100%; text-align: left; background: none; border: none; padding: 9px 10px; font-size: 13px; border-radius: 8px; cursor: pointer; color: #1C2B22; }
      .dropdown button:hover { background: #F2EFE4; }
      .header-mobile-search { display: none; padding: 0 16px 12px; }

      .hero {
        position: relative; overflow: hidden;
        background: linear-gradient(135deg, var(--primary) 0%, #0d3d39 55%, var(--primary-dark) 100%);
        color: #fff; padding: 80px 24px 0;
      }
      .hero-blob { position: absolute; border-radius: 50%; filter: blur(2px); pointer-events: none; }
      .hero-blob-1 { width: 460px; height: 460px; background: radial-gradient(circle, rgba(255,90,60,0.24), transparent 70%); top: -180px; right: -120px; }
      .hero-blob-2 { width: 320px; height: 320px; background: radial-gradient(circle, rgba(255,61,110,0.16), transparent 70%); bottom: -150px; left: -60px; }
      .hero-inner { max-width: 1200px; margin: 0 auto; position: relative; z-index: 1; }
      .hero-grid { display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 40px; align-items: center; }
      .hero-text { max-width: 620px; }
      .eyebrow { font-size: 12px; letter-spacing: 0.1em; font-weight: 700; opacity: 0.95; background: rgba(255,255,255,0.12); display: inline-block; padding: 6px 14px; border-radius: 20px; }
      .hero-text h1 { font-family: 'Space Grotesk',sans-serif; font-weight: 800; font-size: 68px; line-height: 0.98; margin: 20px 0 18px; letter-spacing: -0.03em; }
      .hero-accent-word { color: var(--accent); }
      .hero-text p { font-size: 16px; opacity: 0.92; line-height: 1.65; max-width: 480px; }
      .hero-visual { position: relative; height: 340px; display: none; }
      .hero-tile {
        position: absolute; border-radius: 24px; display: flex; align-items: center; justify-content: center;
        font-size: 42px; background: rgba(255,255,255,0.94); box-shadow: 0 20px 40px rgba(0,0,0,0.25);
      }
      .hero-tile-1 { width: 130px; height: 130px; top: 0; right: 60px; transform: rotate(-6deg); }
      .hero-tile-2 { width: 100px; height: 100px; top: 130px; right: 0; transform: rotate(8deg); background: var(--primary-light); }
      .hero-tile-3 { width: 110px; height: 110px; top: 60px; right: 190px; transform: rotate(4deg); background: #FFE9E3; }
      .hero-tile-4 { width: 90px; height: 90px; bottom: 30px; right: 150px; transform: rotate(-8deg); }
      .hero-tile-5 { width: 80px; height: 80px; bottom: 0; right: 30px; transform: rotate(10deg); background: #FFF3D9; }
      @media (min-width: 860px) { .hero-visual { display: block; } }
      .btn-cta {
        background: var(--accent); color: #fff; border: none; border-radius: 14px; padding: 16px 28px;
        font-weight: 700; font-size: 15px; display: inline-flex; align-items: center; gap: 6px; cursor: pointer;
        box-shadow: 0 8px 20px rgba(255,90,60,0.4); transition: transform .15s ease, box-shadow .15s ease;
      }
      .btn-cta:hover { transform: translateY(-2px); box-shadow: 0 12px 26px rgba(255,90,60,0.5); }
      .btn-cta-ghost {
        background: rgba(255,255,255,0.1); color: #fff; border: 1.5px solid rgba(255,255,255,0.35); border-radius: 14px;
        padding: 16px 28px; font-weight: 700; font-size: 15px; cursor: pointer; backdrop-filter: blur(4px);
        transition: background .15s ease;
      }
      .btn-cta-ghost:hover { background: rgba(255,255,255,0.18); }
      .trust-bar {
        position: relative; z-index: 1; max-width: 1200px; margin: 48px auto 0; display: flex; flex-wrap: wrap;
        gap: 10px; padding: 0 24px 28px; border-top: 1px solid rgba(255,255,255,0.12); padding-top: 22px;
      }
      .trust-item { display: flex; align-items: center; gap: 8px; font-size: 12.5px; font-weight: 600; opacity: 0.9; flex: 1; min-width: 140px; }
      @media (max-width: 859px) { .hero-grid { grid-template-columns: 1fr; } .hero-text h1 { font-size: 44px; } }

      .cat-strip { display: flex; gap: 20px; overflow-x: auto; padding: 28px 0 10px; }
      .catchip { display: flex; flex-direction: column; align-items: center; gap: 8px; background: none; border: none; cursor: pointer; flex: 0 0 auto; width: 78px; transition: transform .15s ease; }
      .catchip:hover { transform: translateY(-3px); }
      .catchip-icon { width: 60px; height: 60px; border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 27px; transition: box-shadow .15s ease; box-shadow: 0 2px 8px rgba(28,43,34,0.06); }
      .catchip:hover .catchip-icon { box-shadow: 0 8px 18px rgba(28,43,34,0.12); }
      .catchip span { font-size: 11.5px; text-align: center; color: #3A362E; font-weight: 600; line-height: 1.25; }

      .section-head { display: flex; align-items: center; gap: 8px; font-family: 'Space Grotesk',sans-serif; font-weight: 800; font-size: 17px; padding: 26px 0 14px; letter-spacing: -0.01em; color: #1C2B22; }
      .section-head.accent { color: var(--primary); }
      .flash-row { display: flex; align-items: center; justify-content: space-between; }
      .flash-clock { display: flex; align-items: center; font-family: 'IBM Plex Mono',monospace; font-weight: 700; font-size: 12px; background: #1C2B22; color: #fff; padding: 5px 10px; border-radius: 8px; }

      .grid-products { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
      @media (min-width: 640px) { .grid-products { grid-template-columns: repeat(3, 1fr); } }
      @media (min-width: 900px) { .grid-products { grid-template-columns: repeat(4, 1fr); } }
      @media (min-width: 1150px) { .grid-products { grid-template-columns: repeat(5, 1fr); } }

      .pcard { background: #fff; border: 1px solid #EFE9D9; border-radius: 14px; overflow: hidden; text-align: left; cursor: pointer; padding: 0; display: flex; flex-direction: column; transition: box-shadow .18s ease, transform .18s ease, border-color .18s ease; box-shadow: 0 1px 2px rgba(28,43,34,0.04); }
      .pcard:hover { box-shadow: 0 14px 28px rgba(28,43,34,0.10); transform: translateY(-3px); border-color: #E4DCC6; }
      .pcard-img { position: relative; aspect-ratio: 1 / 1; display: flex; align-items: center; justify-content: center; background: #F7F4EA; }
      .pcard-img img { display: block; }
      .pcard-name { font-size: 13px; font-weight: 600; color: #1C2B22; line-height: 1.35; min-height: 36px; letter-spacing: -0.01em; }
      .card-heart { position: absolute; top: 10px; right: 10px; background: rgba(255,255,255,0.92); backdrop-filter: blur(2px); border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border: none; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,0.08); }
      .discount-badge { position: absolute; bottom: 10px; right: 10px; background: var(--sale); color: #fff; font-size: 10.5px; font-weight: 800; padding: 3px 8px; border-radius: 6px; font-family: 'Space Grotesk',sans-serif; box-shadow: 0 2px 6px rgba(255,61,110,0.35); }
      .stamp { display: inline-block; border: 1.5px solid var(--primary); color: var(--primary); font-family: 'Space Grotesk',sans-serif; font-weight: 700; font-size: 10px; letter-spacing: 0.06em; text-transform: uppercase; padding: 2px 7px; border-radius: 4px; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }

      .empty { grid-column: 1 / -1; text-align: center; color: #A69B87; font-size: 13.5px; padding: 40px 0; display: flex; flex-direction: column; align-items: center; gap: 8px; }

      .product-layout { display: flex; gap: 40px; flex-wrap: wrap; padding-bottom: 40px; }
      .pd-img { flex: 1; min-width: 320px; height: 420px; border-radius: 20px; display: flex; align-items: center; justify-content: center; position: relative; }
      .pd-info { flex: 1; min-width: 320px; }
      .verified-tag { display: inline-flex; align-items: center; gap: 3px; color: #2F3E8C; font-size: 12px; font-weight: 600; }
      .review-item { border-top: 1px solid #EFE9D9; padding: 12px 0; }
      .review-head { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; }
      .review-text { font-size: 13px; color: #3A362E; margin-top: 4px; line-height: 1.6; }

      .qty-ctrl { display: flex; align-items: center; gap: 10px; background: #F2EFE4; border-radius: 10px; padding: 6px 12px; width: fit-content; }
      .qty-ctrl button { background: #fff; border: 1px solid #E4DCC6; border-radius: 6px; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
      .qty-ctrl span { font-weight: 700; font-size: 14px; min-width: 18px; text-align: center; }

      .btn-primary { background: var(--accent); color: #fff; border: none; border-radius: 12px; padding: 13px 22px; font-weight: 700; font-size: 14px; display: flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer; box-shadow: 0 4px 12px rgba(226,84,45,0.28); transition: transform .12s ease, box-shadow .12s ease; }
      .btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(226,84,45,0.36); }
      .btn-primary:active:not(:disabled) { transform: translateY(0); }
      .btn-primary.small { padding: 9px 16px; font-size: 13px; }
      .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }
      .btn-secondary { background: #fff; border: 1.5px solid var(--primary); color: var(--primary); border-radius: 12px; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; transition: background .12s ease; }
      .btn-secondary:hover { background: #F0F6F1; }
      .linkbtn { background: none; border: none; color: #A69B87; cursor: pointer; }
      .mini-btn { display: inline-flex; align-items: center; gap: 4px; background: #F2EFE4; border: 1px solid #E4DCC6; border-radius: 9px; padding: 8px 13px; font-size: 12px; font-weight: 700; cursor: pointer; color: #1C2B22; transition: background .12s ease, border-color .12s ease; }
      .mini-btn:hover { background: #EAE3D2; }
      .mini-btn.approve { background: var(--primary); color: #fff; border: none; box-shadow: 0 2px 8px rgba(27,94,58,0.25); }
      .mini-btn.approve:hover { background: #164a2e; }

      .cart-layout { display: flex; gap: 24px; flex-wrap: wrap; padding-bottom: 40px; }
      .cart-row { display: flex; align-items: center; gap: 12px; background: #fff; border: 1px solid #EFE9D9; border-radius: 14px; padding: 12px; box-shadow: 0 1px 3px rgba(28,43,34,0.03); }
      .cart-thumb { width: 50px; height: 50px; border-radius: 12px; background: #F2EFE4; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; }
      .summary { background: #fff; border: 1px solid var(--border); border-top: 3px solid var(--accent); border-radius: 16px; padding: 20px; height: fit-content; box-shadow: 0 4px 16px rgba(20,24,26,0.05); }
      .sumrow { display: flex; justify-content: space-between; font-size: 13.5px; color: #3A362E; padding: 5px 0; }
      .sumrow.total { font-weight: 800; font-size: 15px; border-top: 1px dashed #E4DCC6; margin-top: 6px; padding-top: 10px; color: #1C2B22; }

      .checkout-layout { display: flex; gap: 32px; flex-wrap: wrap; padding-bottom: 40px; }
      .addr-input, .text-input { width: 100%; border: 1px solid #E4DCC6; background: #fff; border-radius: 10px; padding: 11px 13px; font-size: 13.5px; font-family: inherit; margin-top: 6px; resize: none; }
      .field-label { display: flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: #8A8578; margin-top: 16px; }

      .form-card { background: #fff; border: 1px solid #EFE9D9; border-radius: 18px; padding: 22px; margin: 14px 0 20px; box-shadow: 0 2px 12px rgba(28,43,34,0.05); }
      .form-card-head { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 18px; }
      .form-card-icon { width: 38px; height: 38px; border-radius: 11px; background: linear-gradient(135deg, var(--primary), var(--primary-dark)); color: #fff; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
      .form-card-title { font-family: 'Space Grotesk',sans-serif; font-weight: 700; font-size: 15.5px; color: #1C2B22; }
      .form-card-sub { font-size: 12px; color: #8A8578; margin-top: 2px; }
      .dropzone {
        display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px;
        border: 2px dashed #E4DCC6; border-radius: 14px; height: 110px; cursor: pointer; background: #FBF9F3;
        transition: border-color .15s ease, background .15s ease; overflow: hidden; position: relative;
      }
      .dropzone:hover { border-color: var(--primary); background: #F5F9F6; }
      .dropzone-icon { font-size: 24px; }
      .dropzone-text { font-size: 12px; color: #8A8578; font-weight: 600; }
      .dropzone-preview { width: 100%; height: 100%; object-fit: cover; }
      .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0 16px; margin-top: 14px; }
      .form-field .text-input { margin-top: 6px; }
      .invite-box { background: #F0F6F1; border: 1px solid #D9EADD; border-radius: 12px; padding: 14px 16px; margin-top: 18px; }
      .invite-box .field-label { margin-top: 0; color: var(--primary); }
      .invite-hint { font-size: 11px; color: #5A7A63; margin-top: 6px; line-height: 1.5; }
      @media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } }

      .photo-grid { display: flex; flex-wrap: wrap; gap: 10px; margin: 4px 0 6px; }
      .photo-tile { position: relative; width: 76px; height: 76px; border-radius: 12px; overflow: hidden; border: 2px solid var(--primary); }
      .photo-tile:nth-child(n+2) { border-color: #EFE9D9; }
      .photo-tile img { width: 100%; height: 100%; object-fit: cover; display: block; }
      .photo-cover-badge { position: absolute; bottom: 3px; left: 3px; background: var(--primary); color: #fff; font-size: 8px; font-weight: 800; padding: 2px 5px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.03em; }
      .photo-remove { position: absolute; top: -6px; right: -6px; background: var(--accent); color: #fff; border: 2px solid #fff; border-radius: 50%; width: 20px; height: 20px; font-size: 12px; line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center; }
      .photo-setcover { position: absolute; bottom: 3px; right: 3px; background: rgba(255,255,255,0.92); border: none; border-radius: 4px; font-size: 8px; font-weight: 700; padding: 2px 5px; cursor: pointer; color: #1C2B22; }
      .photo-add { width: 76px; height: 76px; border-radius: 12px; border: 2px dashed #E4DCC6; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #A69B87; transition: border-color .15s ease; }
      .photo-add:hover { border-color: var(--primary); color: var(--primary); }
      .label-eyebrow { display: flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: #8A8578; }
      .paymethod { display: flex; align-items: center; gap: 10px; background: #fff; border: 1.5px solid #EFE9D9; border-radius: 12px; padding: 13px; cursor: pointer; font-size: 13.5px; font-weight: 600; color: #1C2B22; width: 100%; }
      .paymethod.active { border-color: var(--primary); background: #F0F6F1; }
      .radio { width: 16px; height: 16px; border-radius: 50%; border: 2px solid #C9C2AF; display: inline-block; }
      .radio.on { border-color: var(--primary); background: radial-gradient(var(--primary) 45%, transparent 50%); }

      .rider-card { background: #2F3E8C; color: #fff; border-radius: 16px; padding: 18px; display: flex; align-items: center; gap: 14px; margin-top: 16px; }
      .step-row { display: flex; align-items: flex-start; position: relative; }
      .step-dot { width: 28px; height: 28px; border-radius: 50%; background: #F2EFE4; color: #A69B87; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
      .step-dot.on { background: var(--primary); color: #fff; }
      .step-line { position: absolute; left: 13px; top: 28px; width: 2px; height: calc(100% - 28px); background: #E4DCC6; }
      .step-line.on { background: var(--primary); }
      .rate-card { background: #fff; border: 1px solid #EFE9D9; border-radius: 16px; padding: 20px; text-align: center; margin-top: 20px; }
      .rate-stars { display: flex; justify-content: center; gap: 8px; margin: 12px 0; }
      .rate-stars button { background: none; border: none; cursor: pointer; padding: 0; }
      .rate-thanks { background: #E6F2E9; color: var(--primary); border-radius: 14px; padding: 16px; text-align: center; font-size: 14px; font-weight: 600; margin-top: 20px; }

      .avatar { width: 54px; height: 54px; border-radius: 50%; background: var(--primary); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 20px; font-family: 'Space Grotesk',sans-serif; }
      .points-card { background: linear-gradient(120deg,var(--accent),#c9481f); color: #fff; border-radius: 18px; padding: 18px; margin: 10px 0; }
      .referral-card { background: #2F3E8C; color: #fff; border-radius: 18px; padding: 18px; margin: 10px 0 20px; }
      .withdraw-btn { background: #fff; color: var(--primary); border: none; border-radius: 10px; padding: 9px 14px; font-weight: 700; font-size: 12.5px; display: flex; align-items: center; gap: 5px; cursor: pointer; }
      .order-row { display: flex; align-items: center; gap: 12px; background: #fff; border: 1px solid #EFE9D9; border-radius: 14px; padding: 12px; width: 100%; cursor: pointer; }
      .order-badge { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: #F2EFE4; color: #8A8578; flex-shrink: 0; }
      .order-badge.delivered { background: #E6F2E9; color: var(--primary); }
      .status-pill { font-size: 10.5px; font-weight: 700; text-transform: uppercase; padding: 4px 9px; border-radius: 8px; }
      .status-pill.approved { background: #E6F2E9; color: var(--primary); }
      .status-pill.pending { background: #FFF3DC; color: #B8862B; }
      .status-pill.rejected { background: #FBE7E4; color: #B23A22; }
      .stat-tile { flex: 1; background: #fff; border: 1px solid var(--border); border-top: 3px solid var(--primary); border-radius: 14px; padding: 18px 16px; text-align: center; min-width: 110px; box-shadow: 0 2px 10px rgba(20,24,26,0.04); }
      .stat-n { font-family: 'Space Grotesk',sans-serif; font-weight: 800; font-size: 26px; margin-top: 6px; letter-spacing: -0.02em; }
      .stat-l { font-size: 11px; color: #8A8578; text-transform: uppercase; letter-spacing: 0.04em; }
      .earn-card { background: linear-gradient(120deg,var(--primary),var(--primary-dark)); color: #fff; border-radius: 18px; padding: 20px; display: flex; align-items: center; justify-content: space-between; margin: 16px 0; }
      .banner-notice { background: #FFF3DC; color: #8A6A1E; border-radius: 14px; padding: 14px 16px; font-size: 13px; margin: 16px 0; }
      .verify-banner { background: #2F3E8C; color: #fff; padding: 10px 16px; text-align: center; font-size: 12.5px; display: flex; align-items: center; justify-content: center; gap: 10px; flex-wrap: wrap; }
      .verify-banner button { background: #fff; color: #2F3E8C; border: none; border-radius: 8px; padding: 5px 12px; font-weight: 700; font-size: 12px; cursor: pointer; }
      .app-banner { background: #1C2B22; color: #fff; padding: 12px 16px; display: flex; align-items: center; gap: 12px; }
      .app-banner .store-btn { background: var(--primary); border: none; color: #fff; border-radius: 8px; padding: 7px 12px; font-size: 12px; font-weight: 700; cursor: pointer; white-space: nowrap; }
      .app-banner .dismiss { background: none; border: none; color: #A69B87; cursor: pointer; }
      .otp-input { display: flex; gap: 8px; justify-content: center; margin: 20px 0; }
      .otp-input input { width: 44px; height: 52px; text-align: center; font-size: 20px; font-weight: 700; border: 1.5px solid #E4DCC6; border-radius: 10px; font-family: 'IBM Plex Mono',monospace; }
      .google-btn-wrap { margin-top: 14px; }
      .apple-btn { width: 100%; margin-top: 8px; background: #000; color: #fff; border: none; border-radius: 10px; padding: 12px; font-weight: 600; font-size: 13.5px; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: not-allowed; opacity: 0.55; }
      .divider { display: flex; align-items: center; gap: 10px; margin: 18px 0; color: #A69B87; font-size: 11.5px; }
      .divider::before, .divider::after { content: ""; flex: 1; height: 1px; background: #E4DCC6; }
      .dash-tabs { display: flex; gap: 8px; margin: 16px 0; border-bottom: 1px solid #EAE3D2; }
      .dash-tabs button { background: none; border: none; padding: 10px 4px; font-size: 13.5px; font-weight: 600; color: #8A8578; cursor: pointer; border-bottom: 2px solid transparent; margin-right: 16px; }
      .dash-tabs button.active { color: var(--primary); border-color: var(--primary); }

      .auth-wrap { display: flex; align-items: center; justify-content: center; min-height: calc(100vh - 200px); padding: 40px 16px; }
      .auth-card { width: 100%; max-width: 380px; background: #fff; border: 1px solid #EFE9D9; border-radius: 20px; padding: 32px; }

      .toast { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #1C2B22; color: #fff; padding: 11px 18px; border-radius: 10px; font-size: 13px; z-index: 100; max-width: 90%; text-align: center; }

      .site-footer { background: linear-gradient(180deg, #1C2B22, #16211a); color: #fff; margin-top: 60px; }
      .footer-inner { max-width: 1200px; margin: 0 auto; padding: 48px 24px 36px; display: flex; gap: 50px; flex-wrap: wrap; }
      .footer-col { min-width: 140px; }
      .footer-head { font-family: 'Space Grotesk',sans-serif; font-weight: 700; font-size: 12.5px; text-transform: uppercase; letter-spacing: 0.05em; color: #C9C2AF; margin-bottom: 14px; }
      .footer-col button { display: block; background: none; border: none; color: #EDE7D6; font-size: 13px; padding: 6px 0; cursor: pointer; text-align: left; opacity: 0.85; transition: opacity .12s ease, transform .12s ease; }
      .footer-col button:hover { opacity: 1; transform: translateX(2px); }
      .footer-social { width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: center; transition: background .15s ease; }
      .footer-social:hover { background: rgba(255,255,255,0.16); }
      .footer-bottom { text-align: center; font-size: 11.5px; color: #8A8578; padding: 18px; border-top: 1px solid rgba(255,255,255,0.08); }

      @media (max-width: 860px) {
        .header-search { display: none; }
        .header-nav { display: none; }
        .header-mobile-search { display: block; }
        .hero-text h1 { font-size: 30px; }
        .container { padding: 0 16px; }
      }
    `}</style>
  );
}
