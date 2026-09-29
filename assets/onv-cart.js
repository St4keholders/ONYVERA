/**
 * ONYVERA — Ajax Cart Controller & Toast Integration
 * Maneja adición asíncrona, actualización de badges y feedback de compra.
 */

import { animate } from './motion.min.js';

class OnvCartManager {
  constructor() {
    this.toastEl = document.getElementById('onv-toast');
    this.toastTitle = document.getElementById('onv-toast-title');
    this.toastVariant = document.getElementById('onv-toast-variant');
    this.toastStatus = document.getElementById('onv-toast-status');
    this.toastImg = document.getElementById('onv-toast-img');
    this.toastError = document.getElementById('onv-toast-error');
    this.toastClose = document.getElementById('onv-toast-close');
    this.toastContinue = document.getElementById('onv-toast-continue');
    this.toastTimerBar = document.getElementById('onv-toast-timer-bar');
    this.toastUpsell = document.getElementById('onv-toast-upsell');
    this.toastUpsellBtn = document.getElementById('onv-toast-upsell-btn');

    this.timer = null;
    this.timerStartTime = null;
    this.timerRemaining = 5000;
    this.timerAnimation = null;
    this.isOpen = false;

    this.initEvents();
  }

  handleCardAddClick(btn) {
    if (!btn) return;
    const variantId = btn.dataset.variantId;
    const quantity = parseInt(btn.dataset.quantity || btn.dataset.qty || 1, 10);
    this.addToCart(variantId, quantity, btn);
  }

  initEvents() {
    // Delegación de eventos para todos los botones data-onv-add
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-onv-add]');
      if (!btn) return;
      e.preventDefault();

      this.handleCardAddClick(btn);
    });

    // Cierre manual del toast
    if (this.toastClose) {
      this.toastClose.addEventListener('click', () => this.hideToast());
    }
    if (this.toastContinue) {
      this.toastContinue.addEventListener('click', () => this.hideToast());
    }

    // Cerrar con Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.hideToast();
      }
    });

    // Pausar y reanudar temporizador con hover
    if (this.toastEl) {
      this.toastEl.addEventListener('mouseenter', () => this.pauseTimer());
      this.toastEl.addEventListener('mouseleave', () => this.resumeTimer());
    }
  }

  async addToCart(variantId, quantity = 1, sourceBtn = null) {
    if (!variantId) {
      // Si el botón no tiene variantId explícito, buscar la primera variante disponible en la tienda
      try {
        let res = await fetch('/products/onyvera.js');
        if (res.ok) {
          const product = await res.json();
          variantId = product.variants[0]?.id;
        } else {
          res = await fetch('/products.json?limit=1');
          if (res.ok) {
            const data = await res.json();
            variantId = data.products?.[0]?.variants?.[0]?.id;
          }
        }
      } catch (err) {
        console.warn('Error resolviendo variante por defecto:', err);
      }
    }

    if (!variantId) {
      this.showToastError('Please select an available option.');
      return;
    }

    const cleanQty = Math.max(1, parseInt(quantity, 10) || 1);

    // Estado de carga en el botón
    if (sourceBtn) {
      sourceBtn.classList.add('is-loading');
      sourceBtn.disabled = true;
    }

    try {
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          items: [{
            id: parseInt(variantId, 10),
            quantity: cleanQty
          }]
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.description || data.message || 'Could not add product to order.');
      }

      // Sincronizar estado del carrito
      const fullCart = await this.updateCartCount();
      if (typeof publish === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
        publish(PUB_SUB_EVENTS.cartUpdate, { source: 'onv-cart', cartData: fullCart || data });
      }

      // Extraer datos del producto añadido
      const addedItem = data.items ? data.items[0] : data;
      this.showToastSuccess(addedItem, fullCart);

    } catch (error) {
      this.showToastError(error.message);
    } finally {
      if (sourceBtn) {
        sourceBtn.classList.remove('is-loading');
        sourceBtn.disabled = false;
      }
    }
  }

  async updateCartCount() {
    try {
      const res = await fetch('/cart.js');
      if (!res.ok) return null;
      const cart = await res.json();

      // Actualizar selectores estándar de Dawn y personalizados
      const countElements = document.querySelectorAll(
        '.cart-count-bubble span:first-child, [data-cart-count], .onv-cart-count'
      );
      countElements.forEach(el => {
        el.textContent = cart.item_count;
      });

      const bubbleContainers = document.querySelectorAll('.cart-count-bubble');
      bubbleContainers.forEach(container => {
        if (cart.item_count > 0) {
          container.classList.remove('hidden');
        }
      });
      return cart;
    } catch (e) {
      console.warn('Error updating cart count:', e);
      return null;
    }
  }

  showToastSuccess(item, fullCart = null) {
    if (!this.toastEl) return;

    this.toastError.hidden = true;
    this.toastError.textContent = '';
    const qty = item.quantity || 1;
    this.toastStatus.textContent = qty > 1 ? `${qty} bottles added to your order` : 'Added to your order';
    this.toastTitle.textContent = item.product_title || item.title || 'ONYVERA Botanical Serum';
    var rawTitle = item.variant_title || '';
    this.toastVariant.textContent = rawTitle || `${qty} ${qty > 1 ? 'Bottles' : 'Bottle'} (16 ml each)`;

    if (item.image && this.toastImg) {
      this.toastImg.src = item.image;
    }

    // Dynamic Free Shipping Progress Bar
    const shippingEl = document.getElementById('onv-toast-shipping');
    const shippingFill = document.getElementById('onv-toast-shipping-fill');
    const shippingText = document.getElementById('onv-toast-shipping-text');
    if (shippingEl && shippingFill && shippingText) {
      const totalCents = fullCart && typeof fullCart.total_price === 'number'
        ? fullCart.total_price
        : (qty >= 3 ? 6000 : (qty === 2 ? 5000 : 2500));
      const thresholdCents = 5000;

      if (totalCents >= thresholdCents) {
        shippingFill.style.width = '100%';
        shippingText.innerHTML = '🎉 You’ve unlocked <strong>FREE U.S. Shipping!</strong>';
      } else {
        const diffDollars = ((thresholdCents - totalCents) / 100).toFixed(2);
        const percent = Math.min(100, Math.max(15, Math.round((totalCents / thresholdCents) * 100)));
        shippingFill.style.width = `${percent}%`;
        shippingText.innerHTML = `Add <strong>$${diffDollars}</strong> more for <strong>FREE U.S. Shipping</strong>`;
      }
    }

    // Upsell logic: show upgrade offer if total items < 3
    if (this.toastUpsell) {
      const totalUnits = fullCart ? fullCart.item_count : qty;
      if (totalUnits < 3) {
        this.toastUpsell.style.display = 'flex';
      } else {
        this.toastUpsell.style.display = 'none';
      }
    }

    this.openToast();
  }

  showToastError(message) {
    if (!this.toastEl) return;

    this.toastStatus.textContent = 'Notice';
    this.toastTitle.textContent = 'Could not complete order';
    this.toastVariant.textContent = '';
    this.toastError.hidden = false;
    this.toastError.textContent = message;

    if (this.toastUpsell) {
      this.toastUpsell.style.display = 'none';
    }

    this.openToast();
  }

  openToast() {
    this.toastEl.hidden = false;
    this.toastEl.classList.add('is-visible');
    this.isOpen = true;

    const isMobile = window.innerWidth < 760;
    const initialTransform = isMobile ? 'translateY(100%)' : 'translateY(20px)';
    const targetTransform = 'translateY(0px)';

    animate(this.toastEl, {
      opacity: [0, 1],
      transform: [initialTransform, targetTransform]
    }, {
      duration: 0.24,
      ease: [0.22, 0.9, 0.3, 1]
    });

    this.startTimer(5000);
  }

  hideToast() {
    if (!this.toastEl || !this.isOpen) return;

    this.clearTimer();
    const isMobile = window.innerWidth < 760;
    const exitTransform = isMobile ? 'translateY(100%)' : 'translateY(20px)';

    animate(this.toastEl, {
      opacity: [1, 0],
      transform: ['translateY(0px)', exitTransform]
    }, {
      duration: 0.20,
      ease: 'easeIn'
    }).finished.then(() => {
      this.toastEl.hidden = true;
      this.toastEl.classList.remove('is-visible');
      this.isOpen = false;
    });
  }

  startTimer(durationMs) {
    this.clearTimer();
    this.timerRemaining = durationMs;
    this.timerStartTime = Date.now();

    if (this.toastTimerBar) {
      this.toastTimerBar.style.transform = 'scaleX(1)';
      this.timerAnimation = animate(this.toastTimerBar, {
        transform: ['scaleX(1)', 'scaleX(0)']
      }, {
        duration: durationMs / 1000,
        ease: 'linear'
      });
    }

    this.timer = setTimeout(() => {
      this.hideToast();
    }, durationMs);
  }

  pauseTimer() {
    if (!this.timer) return;
    clearTimeout(this.timer);
    this.timer = null;
    const elapsed = Date.now() - this.timerStartTime;
    this.timerRemaining = Math.max(0, this.timerRemaining - elapsed);

    if (this.timerAnimation) {
      this.timerAnimation.pause();
    }
  }

  resumeTimer() {
    if (this.timer || this.timerRemaining <= 0 || !this.isOpen) return;
    this.timerStartTime = Date.now();

    if (this.timerAnimation) {
      this.timerAnimation.play();
    }

    this.timer = setTimeout(() => {
      this.hideToast();
    }, this.timerRemaining);
  }

  clearTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.timerAnimation) {
      this.timerAnimation.stop();
      this.timerAnimation = null;
    }
  }
}

function initOnvCart() {
  if (!window.onvCart) {
    window.onvCart = new OnvCartManager();
    window.dispatchEvent(new CustomEvent('onvCartReady'));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initOnvCart);
} else {
  initOnvCart();
}
