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

  initConfirmModal() {
    if (document.getElementById('onv-confirm-modal')) return;

    if (!document.getElementById('onv-confirm-modal-style')) {
      const style = document.createElement('style');
      style.id = 'onv-confirm-modal-style';
      style.textContent = `
        .onv-confirm-modal {
          position: fixed;
          inset: 0;
          z-index: 100000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          box-sizing: border-box;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.22s;
        }
        .onv-confirm-modal.is-active {
          opacity: 1;
          visibility: visible;
        }
        .onv-confirm-modal__backdrop {
          position: absolute;
          inset: 0;
          background: rgba(19, 46, 35, 0.52);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
        }
        .onv-confirm-modal__dialog {
          position: relative;
          z-index: 2;
          background: #ffffff;
          border-radius: 20px;
          padding: 28px 22px 22px;
          max-width: 380px;
          width: 100%;
          box-sizing: border-box;
          box-shadow: 0 20px 50px rgba(19, 46, 35, 0.22);
          border: 1px solid rgba(19, 46, 35, 0.08);
          text-align: center;
          transform: scale(0.93) translateY(8px);
          transition: transform 0.24s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .onv-confirm-modal.is-active .onv-confirm-modal__dialog {
          transform: scale(1) translateY(0);
        }
        .onv-confirm-modal__icon {
          width: 50px;
          height: 50px;
          margin: 0 auto 14px;
          border-radius: 50%;
          background: rgba(44, 110, 86, 0.1);
          color: #2C6E56;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .onv-confirm-modal__title {
          font-family: var(--font-ui, 'Karla', sans-serif) !important;
          font-size: 17.5px !important;
          font-weight: 700 !important;
          color: var(--ink, #1B3A2F) !important;
          line-height: 1.35 !important;
          margin: 0 0 8px !important;
        }
        .onv-confirm-modal__subtitle {
          font-family: var(--font-ui, 'Karla', sans-serif) !important;
          font-size: 13.5px !important;
          color: var(--ink-soft, #4A5A52) !important;
          line-height: 1.4 !important;
          margin: 0 0 20px !important;
        }
        .onv-confirm-modal__actions {
          display: flex;
          gap: 10px;
          justify-content: center;
        }
        .onv-confirm-modal__btn {
          flex: 1;
          padding: 12px 16px;
          border-radius: 999px;
          font-family: var(--font-ui, 'Karla', sans-serif);
          font-size: 13.5px;
          font-weight: 700;
          letter-spacing: 0.02em;
          cursor: pointer;
          border: none;
          outline: none;
          box-shadow: none;
          transition: background 0.18s ease, transform 0.15s ease;
        }
        .onv-confirm-modal__btn--cancel {
          background: #F0F3F1;
          color: #4A5A52;
        }
        .onv-confirm-modal__btn--cancel:hover {
          background: #E4EAE6;
          color: #1B3A2F;
        }
        .onv-confirm-modal__btn--confirm {
          background: #132E23;
          color: #ffffff;
        }
        .onv-confirm-modal__btn--confirm:hover {
          background: #2C6E56;
        }
        .onv-confirm-modal__btn:active {
          transform: scale(0.97);
        }
      `;
      document.head.appendChild(style);
    }

    const modalEl = document.createElement('div');
    modalEl.id = 'onv-confirm-modal';
    modalEl.className = 'onv-confirm-modal';
    modalEl.setAttribute('role', 'dialog');
    modalEl.setAttribute('aria-modal', 'true');
    modalEl.setAttribute('aria-labelledby', 'onv-confirm-title');
    modalEl.hidden = true;
    modalEl.innerHTML = `
      <div class="onv-confirm-modal__backdrop" id="onv-confirm-backdrop"></div>
      <div class="onv-confirm-modal__dialog">
        <div class="onv-confirm-modal__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
        </div>
        <h3 class="onv-confirm-modal__title" id="onv-confirm-title">¿Seguro que quieres agregar 2 unidades al carrito?</h3>
        <p class="onv-confirm-modal__subtitle" id="onv-confirm-subtitle">Se agregarán 2 frascos de ONYVERA a tu pedido.</p>
        <div class="onv-confirm-modal__actions">
          <button type="button" class="onv-confirm-modal__btn onv-confirm-modal__btn--cancel" id="onv-confirm-cancel">Cancelar</button>
          <button type="button" class="onv-confirm-modal__btn onv-confirm-modal__btn--confirm" id="onv-confirm-submit">Confirmar</button>
        </div>
      </div>
    `;
    document.body.appendChild(modalEl);
  }

  promptConfirmModal(quantity, onConfirm, onCancel = null) {
    this.initConfirmModal();
    const modal = document.getElementById('onv-confirm-modal');
    const title = document.getElementById('onv-confirm-title');
    const subtitle = document.getElementById('onv-confirm-subtitle');
    const btnCancel = document.getElementById('onv-confirm-cancel');
    const btnConfirm = document.getElementById('onv-confirm-submit');
    const backdrop = document.getElementById('onv-confirm-backdrop');

    const cleanQty = Math.max(1, parseInt(quantity, 10) || 1);
    const unitWord = cleanQty === 1 ? 'unidad' : 'unidades';
    const frascoWord = cleanQty === 1 ? 'frasco' : 'frascos';

    if (title) {
      title.textContent = `¿Seguro que quieres agregar ${cleanQty} ${unitWord} al carrito?`;
    }
    if (subtitle) {
      subtitle.textContent = cleanQty === 1
        ? 'Se agregará 1 frasco de ONYVERA a tu pedido.'
        : `Se agregarán ${cleanQty} ${frascoWord} de ONYVERA a tu pedido.`;
    }

    const closeModal = () => {
      modal.classList.remove('is-active');
      setTimeout(() => {
        modal.hidden = true;
      }, 220);
      document.removeEventListener('keydown', handleKey);
    };

    const handleKey = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        if (typeof onCancel === 'function') onCancel();
      }
    };

    btnCancel.onclick = (e) => {
      e.preventDefault();
      closeModal();
      if (typeof onCancel === 'function') onCancel();
    };

    backdrop.onclick = (e) => {
      e.preventDefault();
      closeModal();
      if (typeof onCancel === 'function') onCancel();
    };

    btnConfirm.onclick = (e) => {
      e.preventDefault();
      closeModal();
      if (typeof onConfirm === 'function') onConfirm();
    };

    document.addEventListener('keydown', handleKey);

    modal.hidden = false;
    void modal.offsetWidth;
    modal.classList.add('is-active');
    btnConfirm.focus();
  }

  handleCardAddClick(btn) {
    if (!btn) return;
    const variantId = btn.dataset.variantId;
    const quantity = parseInt(btn.dataset.quantity || btn.dataset.qty || 1, 10);

    // Cuando la cantidad corresponde a 2 o 3 frascos (o más de 1), solicitar confirmación previa
    if (quantity === 2 || quantity === 3) {
      this.promptConfirmModal(
        quantity,
        () => {
          this.addToCart(variantId, quantity, btn);
        },
        () => {
          // Si cancela, no se añade nada y se permanece exactamente en la misma posición
        }
      );
    } else {
      this.addToCart(variantId, quantity, btn);
    }
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
      this.showToastError('Por favor selecciona una variante disponible.');
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
        throw new Error(data.description || data.message || 'No se pudo añadir el producto al pedido.');
      }

      // Éxito: sincronizar estado del carrito
      const fullCart = await this.updateCartCount();
      if (typeof publish === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
        publish(PUB_SUB_EVENTS.cartUpdate, { source: 'onv-cart', cartData: fullCart || data });
      }

      // Extraer datos del producto añadido
      const addedItem = data.items ? data.items[0] : data;
      this.showToastSuccess(addedItem);

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
      console.warn('Error actualizando contador del carrito:', e);
      return null;
    }
  }

  showToastSuccess(item) {
    if (!this.toastEl) return;

    this.toastError.hidden = true;
    this.toastError.textContent = '';
    const qty = item.quantity || 1;
    this.toastStatus.textContent = qty > 1 ? `${qty} unidades añadidas a tu pedido` : 'Añadido a tu pedido';
    this.toastTitle.textContent = item.product_title || item.title || 'ONYVERA Sérum';
    var rawTitle = item.variant_title || '';
    this.toastVariant.textContent = rawTitle.replace(/Bottles/gi, 'Frascos').replace(/Bottle/gi, 'Frasco') || '16 ml';

    if (item.image && this.toastImg) {
      this.toastImg.src = item.image;
    }

    // Configurar variante de upsell si aplica
    if (this.toastUpsell && this.toastUpsellBtn) {
      this.toastUpsell.style.display = 'flex';
      // Asignar ID si es conocido
      if (item.variant_id) {
        // Enlazar lógica de upsell
      }
    }

    this.openToast();
  }

  showToastError(message) {
    if (!this.toastEl) return;

    this.toastStatus.textContent = 'Aviso';
    this.toastTitle.textContent = 'No se pudo completar';
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
