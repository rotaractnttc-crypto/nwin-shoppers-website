import React, { useState, useEffect } from "react";
import {
  Search, Star, ShoppingCart, Heart, User, X, Plus, Minus, ChevronRight,
  MapPin, CreditCard, Smartphone, Banknote, ShieldCheck, Store, Globe,
  Percent, MessageCircle, Flag, ShoppingBag, LogOut, Menu, Clock,
  CheckCircle2, Truck, PackageCheck, Bike, Gift, Copy, Sparkles, Facebook,
  Instagram, Twitter, Users,
} from "lucide-react";
import { api, setAuthChangeListener } from "./api";

/* ---------------------------------------------------------------
   NWIN SHOPPERS — buyer website
   Responsive storefront (not a phone-frame mock). Sellers/admins
   still get a full shopping experience here if they log in, but
   listing management lives in the separate seller dashboard.
--------------------------------------------------------------- */

const CATS = [
  { id: "electronics", name: "Electronics", icon: "📱", color: "#2F3E8C" },
  { id: "fashion", name: "Fashion", icon: "👗", color: "#E2542D" },
  { id: "home", name: "Home & Living", icon: "🏠", color: "#1B5E3A" },
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
  { id: "b1", title: "Nwin Specials", sub: "Homegrown sellers, front row", color: "#1B5E3A" },
  { id: "b2", title: "Payday Deals", sub: "Up to 30% off electronics", color: "#E2542D" },
  { id: "b3", title: "Pay on delivery", sub: "No card? No problem.", color: "#2F3E8C" },
];

const FLASH_END = Date.now() + 3 * 60 * 60 * 1000;
const money = (n) => "UGX " + Math.round(Number(n) || 0).toLocaleString();

function toUiProduct(p) {
  const cat = CATS.find((c) => c.id === p.category) || CATS[0];
  return {
    id: p.id, name: p.name, price: Number(p.price),
    was: p.was_price ? Number(p.was_price) : undefined,
    cat: p.category || cat.id, sellerId: p.seller_id, sellerName: p.seller_name,
    nwin: !!p.made_in_nwin, special: !!p.is_special, deal: !!p.is_deal,
    rating: Number(p.rating_avg) || 0, revCount: Number(p.rating_count) || 0,
    emoji: cat.icon, desc: p.description || "No description provided.",
    stock: p.stock, status: p.status,
  };
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
    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
      <span style={{ fontWeight: 700, fontSize: big ? 24 : 16, color: "#1C2B22", fontFamily: "'IBM Plex Mono',monospace" }}>{money(price)}</span>
      {was && <span style={{ fontSize: big ? 14 : 12, color: "#A69B87", textDecoration: "line-through" }}>{money(was)}</span>}
    </div>
  );
}

function ProductCard({ p, onOpen, wishlist, onToggleWish }) {
  const cat = CATS.find((c) => c.id === p.cat) || CATS[0];
  const wished = wishlist.includes(p.id);
  return (
    <button className="pcard" onClick={() => onOpen(p)}>
      <div className="pcard-img" style={{ background: `linear-gradient(135deg, ${cat.color}22, ${cat.color}0d)` }}>
        <span style={{ fontSize: 46 }}>{p.emoji}</span>
        {p.nwin && <Stamp style={{ position: "absolute", top: 10, left: 10 }}>Nwin made</Stamp>}
        <button className="card-heart" onClick={(e) => { e.stopPropagation(); onToggleWish(p.id); }}>
          <Heart size={14} fill={wished ? "#E2542D" : "none"} color={wished ? "#E2542D" : "#8A8578"} />
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
                  {user.role === "shopper" && <button onClick={() => { onNav("sell"); setMenuOpen(false); }}>Sell on Nwin</button>}
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
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <Facebook size={16} color="#C9C2AF" />
            <Instagram size={16} color="#C9C2AF" />
            <Twitter size={16} color="#C9C2AF" />
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
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 20, color: "#1B5E3A" }}>
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
        <div className="hero-inner">
          <div className="hero-text">
            <div className="eyebrow">SHOP · SELL · SAVE · SMILE</div>
            <h1>Everything you need,<br />all in one place</h1>
            <p>Nwin Shoppers is Uganda's homegrown marketplace — buy from trusted local sellers, or start selling in minutes.</p>
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button className="btn-primary" onClick={() => document.getElementById("catalogue")?.scrollIntoView({ behavior: "smooth" })}>Start shopping</button>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="cat-strip">
          {CATS.map((c) => (
            <button key={c.id} className="catchip" onClick={() => onCat(c.id)}>
              <div className="catchip-icon" style={{ background: c.color + "1a" }}>{c.icon}</div>
              <span>{c.name}</span>
            </button>
          ))}
        </div>

        {!filterDeal && specials.length > 0 && (
          <>
            <div className="section-head accent"><Star size={15} fill="#1B5E3A" strokeWidth={0} /> Nwin Specials <Stamp style={{ marginLeft: 8 }}>Made in Nwin</Stamp></div>
            <div className="grid-products">
              {specials.map((p) => <ProductCard key={p.id} p={p} onOpen={onOpen} wishlist={wishlist} onToggleWish={onToggleWish} />)}
            </div>
          </>
        )}

        <div className="flash-row">
          <div className="section-head" style={{ padding: "10px 0 0" }}><Sparkles size={15} color="#E2542D" /> Flash Deals</div>
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
  const cat = CATS.find((c) => c.id === product.cat) || CATS[0];
  const wished = wishlist.includes(product.id);
  return (
    <div className="container">
      <button className="linkbtn" style={{ margin: "16px 0", display: "flex", alignItems: "center", gap: 4 }} onClick={onBack}>
        <ChevronRight size={14} style={{ transform: "rotate(180deg)" }} /> Back
      </button>
      <div className="product-layout">
        <div className="pd-img" style={{ background: `linear-gradient(135deg, ${cat.color}33, ${cat.color}11)` }}>
          <span style={{ fontSize: 130 }}>{product.emoji}</span>
          {product.nwin && <Stamp style={{ position: "absolute", top: 16, left: 16, fontSize: 12 }}>Made in Nwin</Stamp>}
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
              <Heart size={18} fill={wished ? "#E2542D" : "none"} color={wished ? "#E2542D" : "#1B5E3A"} />
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

function CheckoutPage({ cart, products, points, onPlace, busy }) {
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [payment, setPayment] = useState("cod");
  const [couponInput, setCouponInput] = useState("");

  const items = cart.map((c) => ({ ...c, product: products.find((p) => p.id === c.id) })).filter((i) => i.product);
  const subtotal = items.reduce((s, i) => s + i.product.price * i.qty, 0);
  const deliveryFee = subtotal > 100000 ? 0 : 5000;
  const methods = [
    { id: "cod", label: "Cash on Delivery", icon: Banknote, tag: "Most popular" },
    { id: "momo", label: "Mobile Money (MTN / Airtel)", icon: Smartphone },
    { id: "card", label: "Card", icon: CreditCard },
  ];
  const canSubmit = address.trim().length >= 5 && phone.trim().length >= 7 && !busy;

  return (
    <div className="container">
      <div className="section-head">Checkout</div>
      <div className="checkout-layout">
        <div style={{ flex: 1 }}>
          <label className="field-label"><MapPin size={12} /> Deliver to</label>
          <textarea className="addr-input" rows={2} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. Plot 12, Kigo Road, Nwin Town" />
          <label className="field-label">Delivery phone</label>
          <input className="text-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+2567..." />

          <label className="field-label" style={{ marginTop: 18 }}>Payment method</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
            {methods.map((m) => (
              <button key={m.id} className={"paymethod" + (payment === m.id ? " active" : "")} onClick={() => setPayment(m.id)}>
                <m.icon size={18} />
                <span style={{ flex: 1, textAlign: "left" }}>{m.label}</span>
                {m.tag && <Stamp style={{ borderColor: "#E2542D", color: "#E2542D" }}>{m.tag}</Stamp>}
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
          <div className="sumrow"><span>Delivery</span><span>{money(deliveryFee)}</span></div>
          <div className="sumrow total"><span>Total (before coupon)</span><span>{money(subtotal + deliveryFee)}</span></div>
          <button className="btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 12 }} disabled={!canSubmit}
            onClick={() => onPlace({ address, phone, payment, couponInput })}>
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
        <Store size={36} color="#1B5E3A" />
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
      <label className="field-label">Location</label>
      <input className="text-input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Nwin Central Market" />
      <button className="btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 18 }} disabled={!form.business_name || busy} onClick={() => onApply(form)}>
        {busy ? "Submitting..." : "Apply to sell"}
      </button>
    </div>
  );
}

/* ---------------- SELLER DASHBOARD ---------------- */

function SellerDashboard({ seller, myProducts, myOrders, onNav, tab, flash, onAddProduct, onUpdateOrderStatus, addBusy }) {
  if (!seller) {
    return (
      <div className="container" style={{ maxWidth: 560, padding: "60px 16px", textAlign: "center" }}>
        <Store size={36} color="#1B5E3A" />
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
                <div className="cart-thumb">{p.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                  <PriceTag price={p.price} />
                </div>
                <span className={"status-pill " + p.status}>{p.status}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "add" && <SellerAddProductForm onSubmit={onAddProduct} busy={addBusy} />}

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

function TrendingIcon() { return <Sparkles size={18} color="#1B5E3A" />; }

function SellerAddProductForm({ onSubmit, busy }) {
  const [form, setForm] = useState({ name: "", price: "", stock: "10", cat: "electronics", desc: "" });
  const [files, setFiles] = useState(null);
  return (
    <div style={{ maxWidth: 480 }}>
      <label className="field-label">Photos (optional)</label>
      <input type="file" accept="image/*" multiple onChange={(e) => setFiles(e.target.files)} style={{ marginTop: 6, display: "block" }} />
      <label className="field-label">Product name</label>
      <input className="text-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Ankara Print Dress" />
      <label className="field-label">Price (UGX)</label>
      <input className="text-input" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
      <label className="field-label">Stock quantity</label>
      <input className="text-input" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
      <label className="field-label">Category</label>
      <select className="text-input" value={form.cat} onChange={(e) => setForm({ ...form, cat: e.target.value })}>
        {CATS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <label className="field-label">Description</label>
      <textarea className="text-input" rows={3} value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} />
      <button className="btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 18 }} disabled={!form.name || !form.price || busy}
        onClick={() => onSubmit(form, files)}>
        {busy ? "Submitting..." : "Submit for approval"}
      </button>
    </div>
  );
}

/* ---------------- ADMIN CONSOLE ---------------- */

function AdminConsole({ pendingSellers, pendingProducts, stats, onApproveSeller, onApproveProduct }) {
  return (
    <div className="container" style={{ paddingBottom: 40 }}>
      <div style={{ paddingTop: 20 }}>
        <div style={{ fontSize: 12, color: "#8A8578" }}>Admin console</div>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 22 }}>Nwin Shoppers HQ</div>
      </div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", margin: "16px 0" }}>
        <div className="stat-tile"><Users size={18} color="#2F3E8C" /><div className="stat-n">{stats?.approvedSellers ?? "–"}</div><div className="stat-l">Sellers</div></div>
        <div className="stat-tile"><Store size={18} color="#1B5E3A" /><div className="stat-n">{stats?.liveProducts ?? "–"}</div><div className="stat-l">Products</div></div>
        <div className="stat-tile"><Truck size={18} color="#E2542D" /><div className="stat-n">{stats?.totalOrders ?? "–"}</div><div className="stat-l">Orders</div></div>
        <div className="stat-tile"><Gift size={18} color="#C9962A" /><div className="stat-n">{money(stats?.paidRevenue || 0)}</div><div className="stat-l">Paid revenue</div></div>
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

  const placeOrder = async ({ address, phone, payment, couponInput }) => {
    if (!user) { flash("Log in to place an order"); nav("auth"); return; }
    if (!requireVerified()) { flash("Please verify your email before checking out"); return; }
    setBusy(true);
    try {
      const { order } = await api.placeOrder({
        items: cart.map((c) => ({ product_id: c.id, quantity: c.qty })),
        payment_method: payment, delivery_address: address, delivery_phone: phone,
        coupon_code: couponInput || undefined,
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

  const addSellerProduct = async (form, files) => {
    setAddBusy(true);
    try {
      let images = [];
      if (files && files.length) images = await api.uploadProductImages(files);
      await api.createProduct({
        name: form.name, description: form.desc, price: Number(form.price),
        stock: Number(form.stock) || 0, images,
      });
      flash("Submitted for admin approval");
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

  const doRegister = async (payload) => {
    const data = await api.register(payload);
    setPendingVerifyEmail(data.user.email);
    nav("verify-otp");
  };

  const doGoogle = async (idToken) => {
    await api.googleSignIn(idToken);
    nav("home");
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
  else if (page === "checkout") body = <CheckoutPage cart={cart} products={products} points={user?.points || 0} onPlace={placeOrder} busy={busy} />;
  else if (page === "tracking") body = <TrackingPage order={activeOrder} onRate={rateOrder} ratedIds={ratedOrderIds} />;
  else if (page === "orders") body = user ? <OrdersPage user={user} orders={orders} onTrack={(o) => { setActiveOrder(o); nav("tracking"); }} points={user.points || 0} /> : <AuthPage onLogin={api.login} onRegister={doRegister} onGoogle={doGoogle} flash={flash} />;
  else if (page === "sell") body = <SellPage user={user} seller={seller} onApply={applySeller} busy={busy} flash={flash} />;
  else if (page === "seller-home" || page === "seller-add" || page === "seller-orders") {
    const tab = page === "seller-add" ? "add" : page === "seller-orders" ? "orders" : "overview";
    body = <SellerDashboard seller={seller} myProducts={myProducts} myOrders={myOrders} tab={tab} onNav={nav} flash={flash} onAddProduct={addSellerProduct} onUpdateOrderStatus={updateOrderStatus} addBusy={addBusy} />;
  }
  else if (page === "admin-home") body = <AdminConsole pendingSellers={pendingSellers} pendingProducts={pendingProducts} stats={adminStats} onApproveSeller={approveSeller} onApproveProduct={approveProduct} />;
  else if (page === "verify-otp") body = <OtpPage email={pendingVerifyEmail || user?.email} flash={flash} onVerified={async () => { const me = await api.fetchMe(); setUser(me); nav("home"); }} />;
  else if (page === "auth") body = user ? <OrdersPage user={user} orders={orders} onTrack={(o) => { setActiveOrder(o); nav("tracking"); }} points={user.points || 0} /> : <AuthPage onLogin={api.login} onRegister={doRegister} onGoogle={doGoogle} flash={flash} />;

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
        onNav={nav} onLogout={api.logout}
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
      .site { font-family:'Inter',sans-serif; color:#1C2B22; background:#FAF6EF; min-height:100vh; display:flex; flex-direction:column; }
      main { flex: 1; }
      .container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }

      .site-header { position: sticky; top: 0; z-index: 30; background: #FAF6EF; border-bottom: 1px solid #EAE3D2; }
      .header-inner { max-width: 1200px; margin: 0 auto; padding: 14px 24px; display: flex; align-items: center; gap: 24px; }
      .brand { display: flex; align-items: center; gap: 10px; background: none; border: none; cursor: pointer; font-family:'Space Grotesk',sans-serif; font-weight: 700; font-size: 17px; color: #1C2B22; }
      .brand b { color: #1B5E3A; }
      .brand-mark { width: 36px; height: 36px; border-radius: 10px; background: #1B5E3A; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
      .header-search { flex: 1; max-width: 480px; display: flex; align-items: center; gap: 8px; background: #F2EFE4; border: 1px solid #E4DCC6; border-radius: 12px; padding: 10px 14px; }
      .header-search input { border: none; background: none; outline: none; font-size: 13.5px; flex: 1; font-family: inherit; }
      .header-nav { display: flex; gap: 6px; }
      .header-nav button { background: none; border: none; font-size: 13.5px; font-weight: 600; color: #3A362E; padding: 8px 12px; border-radius: 8px; cursor: pointer; }
      .header-nav button:hover { background: #F2EFE4; }
      .header-actions { display: flex; align-items: center; gap: 8px; }
      .icon-pill { position: relative; background: #F2EFE4; border: 1px solid #E4DCC6; border-radius: 10px; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
      .pill-badge { position: absolute; top: -5px; right: -5px; background: #E2542D; color: #fff; font-size: 9.5px; font-weight: 700; border-radius: 8px; padding: 1px 5px; }
      .account-menu { position: relative; }
      .dropdown { position: absolute; right: 0; top: 46px; background: #fff; border: 1px solid #EFE9D9; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.08); min-width: 180px; padding: 6px; z-index: 40; }
      .dropdown button { display: flex; align-items: center; gap: 8px; width: 100%; text-align: left; background: none; border: none; padding: 9px 10px; font-size: 13px; border-radius: 8px; cursor: pointer; color: #1C2B22; }
      .dropdown button:hover { background: #F2EFE4; }
      .header-mobile-search { display: none; padding: 0 16px 12px; }

      .hero { background: linear-gradient(120deg, #1B5E3A, #134429); color: #fff; padding: 64px 24px; }
      .hero-inner { max-width: 1200px; margin: 0 auto; }
      .hero-text { max-width: 560px; }
      .eyebrow { font-size: 11px; letter-spacing: 0.12em; font-weight: 700; opacity: 0.8; }
      .hero-text h1 { font-family: 'Space Grotesk',sans-serif; font-weight: 800; font-size: 42px; line-height: 1.15; margin: 10px 0 14px; }
      .hero-text p { font-size: 14.5px; opacity: 0.9; line-height: 1.6; }

      .cat-strip { display: flex; gap: 18px; overflow-x: auto; padding: 24px 0 10px; }
      .catchip { display: flex; flex-direction: column; align-items: center; gap: 7px; background: none; border: none; cursor: pointer; flex: 0 0 auto; width: 76px; }
      .catchip-icon { width: 58px; height: 58px; border-radius: 18px; display: flex; align-items: center; justify-content: center; font-size: 26px; }
      .catchip span { font-size: 11.5px; text-align: center; color: #3A362E; font-weight: 600; line-height: 1.25; }

      .section-head { display: flex; align-items: center; gap: 7px; font-family: 'Space Grotesk',sans-serif; font-weight: 700; font-size: 15px; padding: 20px 0 12px; text-transform: uppercase; letter-spacing: 0.03em; }
      .section-head.accent { color: #1B5E3A; }
      .flash-row { display: flex; align-items: center; justify-content: space-between; }
      .flash-clock { display: flex; align-items: center; font-family: 'IBM Plex Mono',monospace; font-weight: 700; font-size: 12px; background: #1C2B22; color: #fff; padding: 5px 10px; border-radius: 8px; }

      .grid-products { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
      @media (min-width: 640px) { .grid-products { grid-template-columns: repeat(3, 1fr); } }
      @media (min-width: 900px) { .grid-products { grid-template-columns: repeat(4, 1fr); } }
      @media (min-width: 1150px) { .grid-products { grid-template-columns: repeat(5, 1fr); } }

      .pcard { background: #fff; border: 1px solid #EFE9D9; border-radius: 16px; overflow: hidden; text-align: left; cursor: pointer; padding: 0; display: flex; flex-direction: column; transition: box-shadow .15s, transform .15s; }
      .pcard:hover { box-shadow: 0 10px 24px rgba(0,0,0,0.06); transform: translateY(-2px); }
      .pcard-img { position: relative; height: 150px; display: flex; align-items: center; justify-content: center; }
      .pcard-name { font-size: 13.5px; font-weight: 600; color: #1C2B22; line-height: 1.3; min-height: 34px; }
      .card-heart { position: absolute; top: 10px; right: 10px; background: #fff; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border: none; cursor: pointer; }
      .discount-badge { position: absolute; bottom: 10px; right: 10px; background: #E2542D; color: #fff; font-size: 10.5px; font-weight: 700; padding: 2px 7px; border-radius: 5px; font-family: 'Space Grotesk',sans-serif; }
      .stamp { display: inline-block; border: 1.5px solid #1B5E3A; color: #1B5E3A; font-family: 'Space Grotesk',sans-serif; font-weight: 700; font-size: 10px; letter-spacing: 0.06em; text-transform: uppercase; padding: 2px 7px; border-radius: 4px; background: #fff; }

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

      .btn-primary { background: #E2542D; color: #fff; border: none; border-radius: 12px; padding: 13px 22px; font-weight: 700; font-size: 14px; display: flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer; }
      .btn-primary.small { padding: 9px 16px; font-size: 13px; }
      .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
      .btn-secondary { background: #fff; border: 1.5px solid #1B5E3A; color: #1B5E3A; border-radius: 12px; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
      .linkbtn { background: none; border: none; color: #A69B87; cursor: pointer; }
      .mini-btn { display: inline-flex; align-items: center; gap: 4px; background: #F2EFE4; border: 1px solid #E4DCC6; border-radius: 8px; padding: 8px 12px; font-size: 12px; font-weight: 700; cursor: pointer; color: #1C2B22; }
      .mini-btn.approve { background: #1B5E3A; color: #fff; border: none; }

      .cart-layout { display: flex; gap: 24px; flex-wrap: wrap; padding-bottom: 40px; }
      .cart-row { display: flex; align-items: center; gap: 12px; background: #fff; border: 1px solid #EFE9D9; border-radius: 14px; padding: 12px; }
      .cart-thumb { width: 50px; height: 50px; border-radius: 12px; background: #F2EFE4; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; }
      .summary { background: #fff; border: 1px solid #EFE9D9; border-radius: 16px; padding: 18px; height: fit-content; }
      .sumrow { display: flex; justify-content: space-between; font-size: 13.5px; color: #3A362E; padding: 5px 0; }
      .sumrow.total { font-weight: 800; font-size: 15px; border-top: 1px dashed #E4DCC6; margin-top: 6px; padding-top: 10px; color: #1C2B22; }

      .checkout-layout { display: flex; gap: 32px; flex-wrap: wrap; padding-bottom: 40px; }
      .addr-input, .text-input { width: 100%; border: 1px solid #E4DCC6; background: #fff; border-radius: 10px; padding: 11px 13px; font-size: 13.5px; font-family: inherit; margin-top: 6px; resize: none; }
      .field-label { display: flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: #8A8578; margin-top: 16px; }
      .label-eyebrow { display: flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: #8A8578; }
      .paymethod { display: flex; align-items: center; gap: 10px; background: #fff; border: 1.5px solid #EFE9D9; border-radius: 12px; padding: 13px; cursor: pointer; font-size: 13.5px; font-weight: 600; color: #1C2B22; width: 100%; }
      .paymethod.active { border-color: #1B5E3A; background: #F0F6F1; }
      .radio { width: 16px; height: 16px; border-radius: 50%; border: 2px solid #C9C2AF; display: inline-block; }
      .radio.on { border-color: #1B5E3A; background: radial-gradient(#1B5E3A 45%, transparent 50%); }

      .rider-card { background: #2F3E8C; color: #fff; border-radius: 16px; padding: 18px; display: flex; align-items: center; gap: 14px; margin-top: 16px; }
      .step-row { display: flex; align-items: flex-start; position: relative; }
      .step-dot { width: 28px; height: 28px; border-radius: 50%; background: #F2EFE4; color: #A69B87; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
      .step-dot.on { background: #1B5E3A; color: #fff; }
      .step-line { position: absolute; left: 13px; top: 28px; width: 2px; height: calc(100% - 28px); background: #E4DCC6; }
      .step-line.on { background: #1B5E3A; }
      .rate-card { background: #fff; border: 1px solid #EFE9D9; border-radius: 16px; padding: 20px; text-align: center; margin-top: 20px; }
      .rate-stars { display: flex; justify-content: center; gap: 8px; margin: 12px 0; }
      .rate-stars button { background: none; border: none; cursor: pointer; padding: 0; }
      .rate-thanks { background: #E6F2E9; color: #1B5E3A; border-radius: 14px; padding: 16px; text-align: center; font-size: 14px; font-weight: 600; margin-top: 20px; }

      .avatar { width: 54px; height: 54px; border-radius: 50%; background: #1B5E3A; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 20px; font-family: 'Space Grotesk',sans-serif; }
      .points-card { background: linear-gradient(120deg,#E2542D,#c9481f); color: #fff; border-radius: 18px; padding: 18px; margin: 10px 0; }
      .referral-card { background: #2F3E8C; color: #fff; border-radius: 18px; padding: 18px; margin: 10px 0 20px; }
      .withdraw-btn { background: #fff; color: #1B5E3A; border: none; border-radius: 10px; padding: 9px 14px; font-weight: 700; font-size: 12.5px; display: flex; align-items: center; gap: 5px; cursor: pointer; }
      .order-row { display: flex; align-items: center; gap: 12px; background: #fff; border: 1px solid #EFE9D9; border-radius: 14px; padding: 12px; width: 100%; cursor: pointer; }
      .order-badge { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: #F2EFE4; color: #8A8578; flex-shrink: 0; }
      .order-badge.delivered { background: #E6F2E9; color: #1B5E3A; }
      .status-pill { font-size: 10.5px; font-weight: 700; text-transform: uppercase; padding: 4px 9px; border-radius: 8px; }
      .status-pill.approved { background: #E6F2E9; color: #1B5E3A; }
      .status-pill.pending { background: #FFF3DC; color: #B8862B; }
      .status-pill.rejected { background: #FBE7E4; color: #B23A22; }
      .stat-tile { flex: 1; background: #fff; border: 1px solid #EFE9D9; border-radius: 14px; padding: 16px; text-align: center; min-width: 110px; }
      .stat-n { font-family: 'Space Grotesk',sans-serif; font-weight: 800; font-size: 22px; margin-top: 4px; }
      .stat-l { font-size: 11px; color: #8A8578; text-transform: uppercase; letter-spacing: 0.04em; }
      .earn-card { background: linear-gradient(120deg,#1B5E3A,#134429); color: #fff; border-radius: 18px; padding: 20px; display: flex; align-items: center; justify-content: space-between; margin: 16px 0; }
      .banner-notice { background: #FFF3DC; color: #8A6A1E; border-radius: 14px; padding: 14px 16px; font-size: 13px; margin: 16px 0; }
      .verify-banner { background: #2F3E8C; color: #fff; padding: 10px 16px; text-align: center; font-size: 12.5px; display: flex; align-items: center; justify-content: center; gap: 10px; flex-wrap: wrap; }
      .verify-banner button { background: #fff; color: #2F3E8C; border: none; border-radius: 8px; padding: 5px 12px; font-weight: 700; font-size: 12px; cursor: pointer; }
      .app-banner { background: #1C2B22; color: #fff; padding: 12px 16px; display: flex; align-items: center; gap: 12px; }
      .app-banner .store-btn { background: #1B5E3A; border: none; color: #fff; border-radius: 8px; padding: 7px 12px; font-size: 12px; font-weight: 700; cursor: pointer; white-space: nowrap; }
      .app-banner .dismiss { background: none; border: none; color: #A69B87; cursor: pointer; }
      .otp-input { display: flex; gap: 8px; justify-content: center; margin: 20px 0; }
      .otp-input input { width: 44px; height: 52px; text-align: center; font-size: 20px; font-weight: 700; border: 1.5px solid #E4DCC6; border-radius: 10px; font-family: 'IBM Plex Mono',monospace; }
      .google-btn-wrap { margin-top: 14px; }
      .apple-btn { width: 100%; margin-top: 8px; background: #000; color: #fff; border: none; border-radius: 10px; padding: 12px; font-weight: 600; font-size: 13.5px; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: not-allowed; opacity: 0.55; }
      .divider { display: flex; align-items: center; gap: 10px; margin: 18px 0; color: #A69B87; font-size: 11.5px; }
      .divider::before, .divider::after { content: ""; flex: 1; height: 1px; background: #E4DCC6; }
      .dash-tabs { display: flex; gap: 8px; margin: 16px 0; border-bottom: 1px solid #EAE3D2; }
      .dash-tabs button { background: none; border: none; padding: 10px 4px; font-size: 13.5px; font-weight: 600; color: #8A8578; cursor: pointer; border-bottom: 2px solid transparent; margin-right: 16px; }
      .dash-tabs button.active { color: #1B5E3A; border-color: #1B5E3A; }

      .auth-wrap { display: flex; align-items: center; justify-content: center; min-height: calc(100vh - 200px); padding: 40px 16px; }
      .auth-card { width: 100%; max-width: 380px; background: #fff; border: 1px solid #EFE9D9; border-radius: 20px; padding: 32px; }

      .toast { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #1C2B22; color: #fff; padding: 11px 18px; border-radius: 10px; font-size: 13px; z-index: 100; max-width: 90%; text-align: center; }

      .site-footer { background: #1C2B22; color: #fff; margin-top: 50px; }
      .footer-inner { max-width: 1200px; margin: 0 auto; padding: 40px 24px; display: flex; gap: 50px; flex-wrap: wrap; }
      .footer-col { min-width: 140px; }
      .footer-head { font-family: 'Space Grotesk',sans-serif; font-weight: 700; font-size: 12.5px; text-transform: uppercase; letter-spacing: 0.05em; color: #C9C2AF; margin-bottom: 12px; }
      .footer-col button { display: block; background: none; border: none; color: #EDE7D6; font-size: 13px; padding: 5px 0; cursor: pointer; text-align: left; opacity: 0.85; }
      .footer-col button:hover { opacity: 1; }
      .footer-bottom { text-align: center; font-size: 11.5px; color: #8A8578; padding: 16px; border-top: 1px solid #33413A; }

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
