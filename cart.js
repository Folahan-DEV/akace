// ===================================================================
// AKACEMED — SHARED CART, SESSION & UI LOGIC
// Loaded on every page, after products.js.
// Storage keys: akacemed_cart, akacemed_session, akacemed_accounts
// ===================================================================

// ── SESSION ──
function getSession() {
  return JSON.parse(localStorage.getItem("akacemed_session") || "null");
}

function initAuthNav() {
  const session = getSession();
  const authLink = document.getElementById("authLink");
  if (!authLink) return;
  if (session) {
    authLink.textContent = `👤 ${session.name.split(" ")[0]}`;
    authLink.href = "#";
    authLink.onclick = (e) => {
      e.preventDefault();
      if (confirm("Log out of AkaceMed?")) {
        localStorage.removeItem("akacemed_session");
        location.reload();
      }
    };
  }
}

// ── CART STATE ──
let cart = JSON.parse(localStorage.getItem("akacemed_cart") || "[]");

function saveCart() {
  localStorage.setItem("akacemed_cart", JSON.stringify(cart));
}

function getCartCount() {
  return cart.reduce((sum, i) => sum + i.qty, 0);
}

function getCartTotal() {
  return cart.reduce((sum, i) => sum + i.price * i.qty, 0);
}

function resetCart() {
  cart = [];
  saveCart();
  updateCartBadge();
  renderCartItems();
}

function updateCartBadge() {
  const count = getCartCount();
  const badge = document.getElementById("cartBadge");
  if (!badge) return;
  badge.textContent = count;
  badge.style.display = count === 0 ? "none" : "flex";
}

function addToCart(id, event) {
  const p = products.find((x) => x.id === id);
  if (!p) return;
  const existing = cart.find((i) => i.id === id);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({
      id: p.id,
      image: p.image,
      icon: p.icon,
      cat: p.cat,
      name: p.name,
      price: p.price,
      qty: 1,
    });
  }
  saveCart();
  updateCartBadge();
  renderCartItems();
  if (event) flyToCart(event);

  const btn = document.getElementById(`btn-${id}`);
  if (btn) {
    const orig = btn.textContent;
    btn.textContent = "✓ Added!";
    btn.style.background = "var(--brand)";
    btn.style.color = "#fff";
    setTimeout(() => {
      btn.textContent = orig;
      btn.style.background = "";
      btn.style.color = "";
    }, 1100);
  }

  showToast(`✓ ${p.name} added to cart`);
  const badge = document.getElementById("cartBadge");
  if (badge) {
    badge.classList.remove("bump");
    void badge.offsetWidth;
    badge.classList.add("bump");
  }
}

function flyToCart(event) {
  const cartIconEl = document.getElementById("cartIcon");
  if (!cartIconEl) return;
  const rect = cartIconEl.getBoundingClientRect();
  const ghost = document.createElement("div");
  ghost.textContent = "💊";
  ghost.style.cssText = `position:fixed;font-size:1.4rem;z-index:2000;pointer-events:none;transition:all .6s cubic-bezier(.2,.8,.2,1);left:${event.clientX}px;top:${event.clientY}px;`;
  document.body.appendChild(ghost);
  requestAnimationFrame(() => {
    ghost.style.left = rect.left + rect.width / 2 + "px";
    ghost.style.top = rect.top + rect.height / 2 + "px";
    ghost.style.opacity = "0";
    ghost.style.transform = "scale(0.2)";
  });
  setTimeout(() => ghost.remove(), 650);
}

function toggleCart() {
  const drawer = document.getElementById("cartDrawer");
  const overlay = document.getElementById("cartOverlay");
  if (!drawer || !overlay) return;
  const isOpen = drawer.classList.contains("open");
  drawer.classList.toggle("open");
  overlay.classList.toggle("open");
  if (!isOpen) renderCartItems();
}

function renderCartItems() {
  const el = document.getElementById("cartItems");
  const footer = document.getElementById("cartFooter");
  if (!el || !footer) return;

  if (cart.length === 0) {
    el.innerHTML = `
      <div class="cart-empty">
        <span class="cart-empty-icon">🛒</span>
        <p style="font-weight:700;margin-bottom:6px;">Your cart is empty</p>
        <p style="font-size:0.82rem;">Browse products and tap "Add" to get started</p>
      </div>`;
    footer.style.display = "none";
    return;
  }

  footer.style.display = "block";
  const totalEl = document.getElementById("cartTotal");
  if (totalEl) totalEl.textContent = `₦${getCartTotal().toLocaleString()}`;

  el.innerHTML = cart
    .map(
      (item) => `
    <div class="cart-item">
      <div class="cart-item-icon">
        <img src="${resolveProductImage(item)}" alt="${item.name}" />
      </div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-cond">${item.cat}</div>
        <div class="cart-item-row">
          <div class="qty-control">
            <button class="qty-btn" onclick="changeQty(${item.id},-1)">−</button>
            <span class="qty-num">${item.qty}</span>
            <button class="qty-btn" onclick="changeQty(${item.id},1)">+</button>
          </div>
          <span class="cart-item-price">₦${(item.price * item.qty).toLocaleString()}</span>
        </div>
        <button class="remove-item" onclick="removeItem(${item.id})">Remove</button>
      </div>
    </div>`,
    )
    .join("");
}

function changeQty(id, delta) {
  const item = cart.find((i) => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter((i) => i.id !== id);
  saveCart();
  updateCartBadge();
  renderCartItems();
}

function removeItem(id) {
  cart = cart.filter((i) => i.id !== id);
  saveCart();
  updateCartBadge();
  renderCartItems();
  showToast("Item removed from cart");
}

// ── GO TO CHECKOUT (from any page) ──
function goToCheckout() {
  if (cart.length === 0) {
    showToast("Your cart is empty");
    return;
  }
  const session = getSession();
  if (!session) {
    if (confirm("Please log in to checkout.\n\nGo to login page now?")) {
      window.location.href = "login.html?redirect=checkout";
    }
    return;
  }
  window.location.href = "checkout.html";
}

// ── TOAST ──
function showToast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => t.classList.remove("show"), 3000);
}

// ── INIT ON EVERY PAGE ──
document.addEventListener("DOMContentLoaded", () => {
  initAuthNav();
  updateCartBadge();
  const overlay = document.getElementById("cartOverlay");
  if (overlay) overlay.addEventListener("click", toggleCart);
});
