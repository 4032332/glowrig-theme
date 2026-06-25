/* GlowRig Theme - Main JavaScript */

(function() {
  'use strict';

  // ============================================
  // CART DRAWER
  // ============================================
  const cartDrawer = {
    overlay: null,
    drawer: null,

    init() {
      this.overlay = document.querySelector('.cart-drawer-overlay');
      this.drawer = document.querySelector('.cart-drawer');
      const openBtns = document.querySelectorAll('[data-cart-open]');
      const closeBtn = document.querySelector('[data-cart-close]');

      openBtns.forEach(btn => btn.addEventListener('click', () => this.open()));
      if (closeBtn) closeBtn.addEventListener('click', () => this.close());
      if (this.overlay) this.overlay.addEventListener('click', () => this.close());

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') this.close();
      });
    },

    open() {
      if (this.overlay) this.overlay.classList.add('open');
      if (this.drawer) this.drawer.classList.add('open');
      document.body.style.overflow = 'hidden';
    },

    close() {
      if (this.overlay) this.overlay.classList.remove('open');
      if (this.drawer) this.drawer.classList.remove('open');
      document.body.style.overflow = '';
    }
  };

  // ============================================
  // SEARCH OVERLAY
  // ============================================
  const searchOverlay = {
    overlay: null,

    init() {
      this.overlay = document.querySelector('.search-overlay');
      const openBtn = document.querySelector('[data-search-open]');
      const closeBtn = document.querySelector('[data-search-close]');

      if (openBtn) openBtn.addEventListener('click', () => this.open());
      if (closeBtn) closeBtn.addEventListener('click', () => this.close());

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') this.close();
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
          e.preventDefault();
          this.open();
        }
      });
    },

    open() {
      if (this.overlay) {
        this.overlay.classList.add('open');
        const input = this.overlay.querySelector('.search-input');
        if (input) setTimeout(() => input.focus(), 100);
      }
    },

    close() {
      if (this.overlay) this.overlay.classList.remove('open');
    }
  };

  // ============================================
  // MOBILE MENU
  // ============================================
  const mobileMenu = {
    init() {
      const toggleBtn = document.querySelector('.mobile-menu-btn');
      const nav = document.querySelector('.site-nav');

      if (toggleBtn && nav) {
        toggleBtn.addEventListener('click', () => {
          nav.classList.toggle('mobile-open');
          toggleBtn.classList.toggle('active');
        });
      }
    }
  };

  // ============================================
  // PRODUCT GALLERY
  // ============================================
  const productGallery = {
    init() {
      const thumbs = document.querySelectorAll('.product-thumb');
      const mainImg = document.querySelector('.product-main-image img');

      thumbs.forEach(thumb => {
        thumb.addEventListener('click', () => {
          thumbs.forEach(t => t.classList.remove('active'));
          thumb.classList.add('active');
          if (mainImg) {
            mainImg.style.opacity = '0';
            setTimeout(() => {
              mainImg.src = thumb.querySelector('img')?.src || thumb.dataset.src;
              mainImg.style.opacity = '1';
            }, 150);
          }
        });
      });
    }
  };

  // ============================================
  // PRODUCT OPTIONS
  // ============================================
  const productOptions = {
    init() {
      const optionBtns = document.querySelectorAll('.option-btn');
      optionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const group = btn.closest('.product-options');
          if (group) {
            group.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
          }
          btn.classList.add('selected');
        });
      });
    }
  };

  // ============================================
  // SCROLL ANIMATIONS
  // ============================================
  const scrollAnimations = {
    init() {
      if (!('IntersectionObserver' in window)) return;

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

      document.querySelectorAll('.product-card, .collection-card, .why-card, .showcase-card').forEach(el => {
        el.style.opacity = '0';
        observer.observe(el);
      });
    }
  };

  // ============================================
  // HEADER SCROLL BEHAVIOUR
  // ============================================
  const headerScroll = {
    header: null,
    lastScroll: 0,

    init() {
      this.header = document.querySelector('.site-header');
      if (!this.header) return;

      window.addEventListener('scroll', () => {
        const currentScroll = window.scrollY;
        if (currentScroll > 100) {
          this.header.style.boxShadow = '0 4px 30px rgba(0,0,0,0.5)';
        } else {
          this.header.style.boxShadow = 'none';
        }
        this.lastScroll = currentScroll;
      }, { passive: true });
    }
  };

  // ============================================
  // QUICK ADD TO CART
  // ============================================
  const quickAdd = {
    init() {
      document.querySelectorAll('[data-quick-add]').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.preventDefault();
          const variantId = btn.dataset.variantId;
          if (!variantId) return;

          btn.textContent = 'Adding...';
          btn.disabled = true;

          try {
            const res = await fetch('/cart/add.js', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: variantId, quantity: 1 })
            });

            if (res.ok) {
              btn.textContent = 'Added ✓';
              btn.style.background = 'rgba(0,245,255,0.2)';
              btn.style.borderColor = 'var(--accent-cyan)';
              cartDrawer.open();
              quickAdd.updateCartCount();
              setTimeout(() => {
                btn.textContent = 'Add to Cart';
                btn.style.background = '';
                btn.style.borderColor = '';
                btn.disabled = false;
              }, 2000);
            }
          } catch (err) {
            btn.textContent = 'Add to Cart';
            btn.disabled = false;
          }
        });
      });
    },

    async updateCartCount() {
      try {
        const res = await fetch('/cart.js');
        const cart = await res.json();
        const badge = document.querySelector('.cart-badge');
        if (badge) {
          badge.textContent = cart.item_count;
          badge.style.display = cart.item_count > 0 ? 'flex' : 'none';
        }
      } catch {}
    }
  };

  // ============================================
  // ADD TO CART (PRODUCT PAGE)
  // ============================================
  const addToCart = {
    init() {
      const form = document.querySelector('[data-product-form]');
      if (!form) return;

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('[data-add-to-cart]');
        const variantSelect = form.querySelector('[name="id"]');
        if (!btn || !variantSelect) return;

        const originalText = btn.textContent;
        btn.textContent = 'Adding...';
        btn.disabled = true;

        try {
          const res = await fetch('/cart/add.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: variantSelect.value, quantity: 1 })
          });

          if (res.ok) {
            btn.textContent = 'Added to Cart ✓';
            cartDrawer.open();
            quickAdd.updateCartCount();
            setTimeout(() => {
              btn.textContent = originalText;
              btn.disabled = false;
            }, 2500);
          }
        } catch {
          btn.textContent = originalText;
          btn.disabled = false;
        }
      });
    }
  };

  // ============================================
  // ANNOUNCEMENT BAR TICKER
  // ============================================
  const announcementTicker = {
    messages: [
      '⚡ Free shipping on orders over $75',
      '🎮 New arrivals: Cosmic Desk Mat Series',
      '🌟 Bundle & save — Starter Rig Kit from $109.95',
      '🚀 Fast AU shipping on all orders'
    ],
    current: 0,

    init() {
      const el = document.querySelector('.announcement-text');
      if (!el || this.messages.length <= 1) return;

      setInterval(() => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(6px)';
        setTimeout(() => {
          this.current = (this.current + 1) % this.messages.length;
          el.textContent = this.messages[this.current];
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
        }, 300);
      }, 4000);

      el.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    }
  };

  // ============================================
  // NEON CURSOR TRAIL (DESKTOP ONLY)
  // ============================================
  const cursorTrail = {
    init() {
      if (window.innerWidth < 1024) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      const trail = document.createElement('div');
      trail.style.cssText = `
        position: fixed;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--accent-purple);
        pointer-events: none;
        z-index: 9999;
        filter: blur(2px);
        opacity: 0;
        transition: opacity 0.3s;
        box-shadow: 0 0 12px var(--accent-purple);
      `;
      document.body.appendChild(trail);

      let mouseX = 0, mouseY = 0;
      let trailX = 0, trailY = 0;
      let visible = false;

      document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        if (!visible) {
          visible = true;
          trail.style.opacity = '0.7';
        }
      });

      document.addEventListener('mouseleave', () => {
        visible = false;
        trail.style.opacity = '0';
      });

      const animate = () => {
        trailX += (mouseX - trailX) * 0.15;
        trailY += (mouseY - trailY) * 0.15;
        trail.style.left = (trailX - 4) + 'px';
        trail.style.top = (trailY - 4) + 'px';
        requestAnimationFrame(animate);
      };
      animate();
    }
  };

  // ============================================
  // INIT ALL
  // ============================================
  document.addEventListener('DOMContentLoaded', () => {
    cartDrawer.init();
    searchOverlay.init();
    mobileMenu.init();
    productGallery.init();
    productOptions.init();
    scrollAnimations.init();
    headerScroll.init();
    quickAdd.init();
    addToCart.init();
    announcementTicker.init();
    cursorTrail.init();
  });

})();
