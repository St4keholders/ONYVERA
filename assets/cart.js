class CartRemoveButton extends HTMLElement {
  constructor() {
    super();

    this.addEventListener('click', (event) => {
      event.preventDefault();
      const cartItems = this.closest('cart-items') || this.closest('cart-drawer-items');
      cartItems.updateQuantity(this.dataset.index, 0, event);
    });
  }
}

customElements.define('cart-remove-button', CartRemoveButton);

class CartItems extends window.StandardEvents.createViewEventElement(HTMLElement) {
  constructor() {
    super();
    this.lineItemStatusElement =
      document.getElementById('shopping-cart-line-item-status') || document.getElementById('CartDrawer-LineItemStatus');

    const debouncedOnChange = debounce((event) => {
      this.onChange(event);
    }, ON_CHANGE_DEBOUNCE_TIMER);

    this.addEventListener('change', debouncedOnChange.bind(this));
  }

  cartUpdateUnsubscriber = undefined;

  static pendingCartDataPromise = null;

  connectedCallback() {
    // The factory base class auto-dispatches cart:view from the
    // `view-event-payload` attribute (Liquid filter output). The drawer
    // sets `view-event-trigger="manual"` to skip auto-dispatch.
    super.connectedCallback();

    this.cartUpdateUnsubscriber = subscribe(PUB_SUB_EVENTS.cartUpdate, (event) => {
      if (event.cartData) {
        syncCartBusinessRules(event.cartData);
      }
      if (event.source === 'cart-items') return;
      const updatePromise = this.onCartUpdate();
      if (updatePromise && typeof updatePromise.then === 'function') {
        return updatePromise.then(() => syncCartBusinessRules(event.cartData));
      }
      syncCartBusinessRules(event.cartData);
    });

    syncCartBusinessRules();
  }

  // Fetches the full cart shape (used to resolve the cart:lines-update event
  // promise after /cart/add.js, which only returns the added line — not the
  // post-mutation cart aggregates). De-duplicated across concurrent callers.
  static fetchCartData() {
    if (!CartItems.pendingCartDataPromise) {
      const pendingCartDataPromise = fetch(`${routes.cart_url}.json`)
        .then((response) => response.json())
        .catch(() => null)
        .finally(() => {
          if (CartItems.pendingCartDataPromise === pendingCartDataPromise) CartItems.pendingCartDataPromise = null;
        });

      CartItems.pendingCartDataPromise = pendingCartDataPromise;
    }
    return CartItems.pendingCartDataPromise;
  }

  disconnectedCallback() {
    if (this.cartUpdateUnsubscriber) {
      this.cartUpdateUnsubscriber();
    }
  }

  resetQuantityInput(id) {
    const input = this.querySelector(`#Quantity-${id}`);
    input.value = input.getAttribute('value');
    this.isEnterPressed = false;
  }

  setValidity(event, index, message) {
    event.target.setCustomValidity(message);
    event.target.reportValidity();
    this.resetQuantityInput(index);
    event.target.select();
  }

  validateQuantity(event) {
    const inputValue = parseInt(event.target.value);
    const index = event.target.dataset.index;
    let message = '';

    if (inputValue < event.target.dataset.min) {
      message = window.quickOrderListStrings.min_error.replace('[min]', event.target.dataset.min);
    } else if (inputValue > parseInt(event.target.max)) {
      message = window.quickOrderListStrings.max_error.replace('[max]', event.target.max);
    } else if (inputValue % parseInt(event.target.step) !== 0) {
      message = window.quickOrderListStrings.step_error.replace('[step]', event.target.step);
    }

    if (message) {
      this.setValidity(event, index, message);
    } else {
      event.target.setCustomValidity('');
      event.target.reportValidity();
      this.updateQuantity(
        index,
        inputValue,
        event,
        document.activeElement.getAttribute('name'),
        event.target.dataset.quantityVariantId
      );
    }
  }

  onChange(event) {
    this.validateQuantity(event);
  }

  onCartUpdate() {
    if (this.tagName === 'CART-DRAWER-ITEMS') {
      return fetch(`${routes.cart_url}?section_id=cart-drawer`)
        .then((response) => response.text())
        .then((responseText) => {
          const html = new DOMParser().parseFromString(responseText, 'text/html');
          const selectors = ['cart-drawer-items', '.cart-drawer__footer'];
          for (const selector of selectors) {
            const targetElement = document.querySelector(selector);
            const sourceElement = html.querySelector(selector);
            if (targetElement && sourceElement) {
              targetElement.replaceWith(sourceElement);
            }
          }
        })
        .catch((e) => {
          console.error(e);
        });
    } else {
      return fetch(`${routes.cart_url}?section_id=main-cart-items`)
        .then((response) => response.text())
        .then((responseText) => {
          const html = new DOMParser().parseFromString(responseText, 'text/html');
          const sourceQty = html.querySelector('cart-items');
          this.innerHTML = sourceQty.innerHTML;
        })
        .catch((e) => {
          console.error(e);
        });
    }
  }

  getSectionsToRender() {
    return [
      {
        id: 'main-cart-items',
        section: document.getElementById('main-cart-items').dataset.id,
        selector: '.js-contents',
      },
      {
        id: 'cart-icon-bubble',
        section: 'cart-icon-bubble',
        selector: '.shopify-section',
      },
      {
        id: 'cart-live-region-text',
        section: 'cart-live-region-text',
        selector: '.shopify-section',
      },
      {
        id: 'main-cart-footer',
        section: document.getElementById('main-cart-footer').dataset.id,
        selector: '.js-contents',
      },
    ];
  }

  updateQuantity(line, quantity, event, name, variantId) {
    const eventTarget = event.currentTarget instanceof CartRemoveButton ? 'clear' : 'change';
    const cartPerformanceUpdateMarker = CartPerformance.createStartingMarker(`${eventTarget}:user-action`);

    this.enableLoading(line);

    const action = quantity === 0 ? 'remove' : 'update';
    const quantityInput = this.querySelector(`#Quantity-${line}`) || this.querySelector(`#Drawer-quantity-${line}`);
    const lineVariantId = variantId || quantityInput?.dataset.quantityVariantId;
    const lineKey = quantityInput?.dataset.quantityLineKey;
    const linesUpdateDeferred = this.createCartLinesUpdateEvent(action, lineVariantId, quantity, lineKey);

    // Cache sections before the fetch so we read dataset.id while elements still exist in the DOM
    const sectionsToRender = this.getSectionsToRender();

    const body = JSON.stringify({
      line,
      quantity,
      sections: sectionsToRender.map((section) => section.section),
      sections_url: window.location.pathname,
    });

    fetch(`${routes.cart_change_url}`, { ...fetchConfig(), ...{ body } })
      .then((response) => {
        return response.text();
      })
      .then((state) => {
        const parsedState = JSON.parse(state);

        if (parsedState.errors) {
          this.dispatchCartErrorEvent(parsedState.errors, 'INVALID');
          linesUpdateDeferred?.reject(new Error(parsedState.errors));
        } else {
          this.resolveCartLinesUpdate(linesUpdateDeferred, parsedState);
        }

        CartPerformance.measure(`${eventTarget}:paint-updated-sections`, () => {
          const quantityElement =
            document.getElementById(`Quantity-${line}`) || document.getElementById(`Drawer-quantity-${line}`);
          const items = document.querySelectorAll('.cart-item');

          if (parsedState.errors) {
            quantityElement.value = quantityElement.getAttribute('value');
            this.updateLiveRegions(line, parsedState.errors);
            return;
          }

          this.classList.toggle('is-empty', parsedState.item_count === 0);
          const cartDrawerWrapper = document.querySelector('cart-drawer');
          const cartFooter = document.getElementById('main-cart-footer');

          if (cartFooter) cartFooter.classList.toggle('is-empty', parsedState.item_count === 0);
          if (cartDrawerWrapper) cartDrawerWrapper.classList.toggle('is-empty', parsedState.item_count === 0);

          sectionsToRender.forEach((section) => {
            const elementToReplace =
              document.getElementById(section.id).querySelector(section.selector) ||
              document.getElementById(section.id);
            elementToReplace.innerHTML = this.getSectionInnerHTML(
              parsedState.sections[section.section],
              section.selector
            );
          });
          syncCartBusinessRules(parsedState);
          const updatedValue = parsedState.items[line - 1] ? parsedState.items[line - 1].quantity : undefined;
          let message = '';
          if (items.length === parsedState.items.length && updatedValue !== parseInt(quantityElement.value)) {
            if (typeof updatedValue === 'undefined') {
              message = window.cartStrings.error;
            } else {
              message = window.cartStrings.quantityError.replace('[quantity]', updatedValue);
            }
          }
          this.updateLiveRegions(line, message);

          const lineItem =
            document.getElementById(`CartItem-${line}`) || document.getElementById(`CartDrawer-Item-${line}`);
          if (lineItem && lineItem.querySelector(`[name="${name}"]`)) {
            cartDrawerWrapper
              ? trapFocus(cartDrawerWrapper, lineItem.querySelector(`[name="${name}"]`))
              : lineItem.querySelector(`[name="${name}"]`).focus();
          } else if (parsedState.item_count === 0 && cartDrawerWrapper?.querySelector('.drawer__inner-empty')) {
            trapFocus(cartDrawerWrapper.querySelector('.drawer__inner-empty'), cartDrawerWrapper.querySelector('a'));
          } else if (document.querySelector('.cart-item') && cartDrawerWrapper) {
            trapFocus(cartDrawerWrapper, document.querySelector('.cart-item__name'));
          }
        });

        publish(PUB_SUB_EVENTS.cartUpdate, { source: 'cart-items', cartData: parsedState, variantId: variantId });
      })
      .catch((e) => {
        this.querySelectorAll('.loading__spinner').forEach((overlay) => overlay.classList.add('hidden'));
        const errors = document.getElementById('cart-errors') || document.getElementById('CartDrawer-CartErrors');
        if (errors) errors.textContent = window.cartStrings.error;
        this.dispatchCartErrorEvent(window.cartStrings.error, 'SERVICE_UNAVAILABLE');
        linesUpdateDeferred?.reject(e);
      })
      .finally(() => {
        this.disableLoading(line);
        CartPerformance.measureFromMarker(`${eventTarget}:user-action`, cartPerformanceUpdateMarker);
      });
  }

  createCartLinesUpdateEvent(action, variantId, quantity, lineKey) {
    const { CartLinesUpdateEvent } = window.StandardEvents || {};
    if (!CartLinesUpdateEvent || !variantId) return null;
    // No AJAX line key on the row — likely cached HTML rendered before this
    // attribute landed. Skip dispatch rather than emit an event with id: ''.
    if (!lineKey) return null;

    const deferred = CartLinesUpdateEvent.createPromise();
    this.dispatchEvent(
      new CartLinesUpdateEvent({
        action,
        context: 'cart',
        lines: [{ id: lineKey, quantity }],
        promise: deferred.promise,
      })
    );
    return deferred;
  }

  resolveCartLinesUpdate(deferred, parsedState) {
    if (!deferred) return;
    const { CartLinesUpdateEvent } = window.StandardEvents || {};
    if (!CartLinesUpdateEvent) return;

    deferred.resolve({ cart: CartLinesUpdateEvent.createCartFromAjaxResponse(parsedState) });
  }

  dispatchCartErrorEvent(message, code) {
    const { CartErrorEvent } = window.StandardEvents || {};
    if (!CartErrorEvent) return;
    this.dispatchEvent(new CartErrorEvent({ error: message, code }));
  }

  updateLiveRegions(line, message) {
    const lineItemError =
      document.getElementById(`Line-item-error-${line}`) || document.getElementById(`CartDrawer-LineItemError-${line}`);
    if (lineItemError) lineItemError.querySelector('.cart-item__error-text').textContent = message;

    this.lineItemStatusElement.setAttribute('aria-hidden', true);

    const cartStatus =
      document.getElementById('cart-live-region-text') || document.getElementById('CartDrawer-LiveRegionText');
    cartStatus.setAttribute('aria-hidden', false);

    setTimeout(() => {
      cartStatus.setAttribute('aria-hidden', true);
    }, 1000);
  }

  getSectionInnerHTML(html, selector) {
    return new DOMParser().parseFromString(html, 'text/html').querySelector(selector).innerHTML;
  }

  enableLoading(line) {
    const mainCartItems = document.getElementById('main-cart-items') || document.getElementById('CartDrawer-CartItems');
    mainCartItems.classList.add('cart__items--disabled');

    const cartItemElements = this.querySelectorAll(`#CartItem-${line} .loading__spinner`);
    const cartDrawerItemElements = this.querySelectorAll(`#CartDrawer-Item-${line} .loading__spinner`);

    [...cartItemElements, ...cartDrawerItemElements].forEach((overlay) => overlay.classList.remove('hidden'));

    document.activeElement.blur();
    this.lineItemStatusElement.setAttribute('aria-hidden', false);
  }

  disableLoading(line) {
    const mainCartItems = document.getElementById('main-cart-items') || document.getElementById('CartDrawer-CartItems');
    mainCartItems.classList.remove('cart__items--disabled');

    const cartItemElements = this.querySelectorAll(`#CartItem-${line} .loading__spinner`);
    const cartDrawerItemElements = this.querySelectorAll(`#CartDrawer-Item-${line} .loading__spinner`);

    cartItemElements.forEach((overlay) => overlay.classList.add('hidden'));
    cartDrawerItemElements.forEach((overlay) => overlay.classList.add('hidden'));
  }
}

customElements.define('cart-items', CartItems);

if (!customElements.get('cart-note')) {
  customElements.define(
    'cart-note',
    class CartNote extends HTMLElement {
      constructor() {
        super();

        this.addEventListener(
          'input',
          debounce((event) => {
            const newNote = event.target.value;
            const noteDeferred = this.dispatchNoteUpdateEvent(newNote);

            const body = JSON.stringify({ note: newNote });
            fetch(`${routes.cart_update_url}`, { ...fetchConfig(), ...{ body } })
              .then((r) => r.json())
              .then((cart) => {
                if (!cart || cart.errors) {
                  throw Object.assign(new Error(cart?.errors), { code: 'INVALID' });
                }

                if (noteDeferred) {
                  const { CartNoteUpdateEvent } = window.StandardEvents || {};
                  if (CartNoteUpdateEvent) {
                    noteDeferred.resolve({ cart: CartNoteUpdateEvent.createCartFromAjaxResponse(cart) });
                  }
                }
                CartPerformance.measureFromEvent('note-update:user-action', event);
              })
              .catch((e) => {
                noteDeferred?.reject(e);
                const { CartErrorEvent } = window.StandardEvents || {};
                if (CartErrorEvent) {
                  this.dispatchEvent(
                    new CartErrorEvent({
                      error: e.message || 'Note update failed',
                      code: e.code || 'SERVICE_UNAVAILABLE',
                    })
                  );
                }
              });
          }, ON_CHANGE_DEBOUNCE_TIMER)
        );
      }

      dispatchNoteUpdateEvent(newNote) {
        const { CartNoteUpdateEvent } = window.StandardEvents || {};
        if (!CartNoteUpdateEvent) return null;

        const context = this.closest('dialog') || this.closest('cart-drawer') ? 'dialog' : 'cart';
        const deferred = CartNoteUpdateEvent.createPromise();

        this.dispatchEvent(
          new CartNoteUpdateEvent({
            context,
            note: newNote,
            promise: deferred.promise,
          })
        );

        return deferred;
      }
    }
  );
}

// ========================================================
// ONYVERA — REGLAS COMERCIALES, PRECIOS Y MAYOREO EN CARRITO
// ========================================================
const ONV_WHATSAPP_PHONE = '1234567890';

function calculateCartPrice(qty) {
  if (qty <= 0) return 0;
  if (qty === 1) return 25;
  if (qty === 2) return 50;
  if (qty === 3) return 60;
  return 60 + (qty - 3) * 20;
}

function getCartWhatsAppUrl(qty) {
  const message =
    'Hola, quiero comprar ' +
    qty +
    ' unidades de ONYVERA. Me gustaría hablar con un asesor para consultar el precio al por mayor y realizar el pedido.';
  return 'https://wa.me/' + ONV_WHATSAPP_PHONE + '?text=' + encodeURIComponent(message);
}

function syncCartBusinessRules(cartData) {
  let totalUnits = 0;
  if (cartData && typeof cartData.item_count === 'number') {
    totalUnits = cartData.item_count;
  } else {
    const inputs = document.querySelectorAll('cart-items .quantity__input, cart-drawer-items .quantity__input');
    inputs.forEach((input) => {
      const val = parseInt(input.value, 10);
      if (!isNaN(val) && val >= 0) totalUnits += val;
    });
  }

  const isWholesale = totalUnits >= 10;
  const totalPrice = calculateCartPrice(totalUnits);
  const formattedPrice = '$' + totalPrice.toFixed(2);

  // 1. Actualizar textos de total / subtotal
  const totalElements = document.querySelectorAll('.totals__total-value, [data-cart-total-display]');
  totalElements.forEach((el) => {
    if (totalUnits === 0) {
      el.textContent = '$0.00';
    } else if (isWholesale) {
      el.textContent = 'Consultar con asesor';
    } else {
      el.textContent = formattedPrice;
    }
  });

  // 2. Actualizar precio en la fila del producto
  const linePriceElements = document.querySelectorAll(
    '.cart-item__totals .price--end, .cart-item__final-price, .cart-item__price-wrapper span.price'
  );
  linePriceElements.forEach((el) => {
    if (isWholesale) {
      el.textContent = 'Consultar con asesor';
    } else if (totalUnits > 0) {
      el.textContent = formattedPrice;
    }
  });

  // 3. Bloques de Mayoreo y botones de WhatsApp
  const wholesaleBlocks = document.querySelectorAll(
    '#CartFooterWholesaleBlock, #CartDrawerWholesaleBlock, .cart-wholesale-block'
  );
  wholesaleBlocks.forEach((block) => {
    if (isWholesale) {
      block.classList.remove('is-hidden');
      block.style.display = 'block';
    } else {
      block.classList.add('is-hidden');
      block.style.display = 'none';
    }
  });

  const whatsappButtons = document.querySelectorAll(
    '#CartFooterWhatsAppBtn, #CartDrawerWhatsAppBtn, .cart-wholesale-whatsapp-btn'
  );
  whatsappButtons.forEach((btn) => {
    btn.href = getCartWhatsAppUrl(totalUnits);
  });

  // 4. Bloquear / Deshabilitar Checkout Estándar
  const checkoutButtons = document.querySelectorAll('#checkout, #CartDrawer-Checkout, .cart__checkout-button');
  checkoutButtons.forEach((btn) => {
    if (isWholesale) {
      btn.disabled = true;
      btn.classList.add('is-wholesale-disabled');
    } else {
      btn.disabled = totalUnits === 0;
      btn.classList.remove('is-wholesale-disabled');
    }
  });

  // 5. Ocultar botones de pago dinámico (PayPal, Apple Pay, etc.)
  const dynamicCheckoutButtons = document.querySelectorAll(
    '.cart__dynamic-checkout-buttons, .additional-checkout-buttons'
  );
  dynamicCheckoutButtons.forEach((container) => {
    if (isWholesale) {
      container.classList.add('is-wholesale-disabled');
    } else {
      container.classList.remove('is-wholesale-disabled');
    }
  });
}

window.syncCartBusinessRules = syncCartBusinessRules;

document.addEventListener('input', (event) => {
  if (event.target && event.target.matches('.quantity__input')) {
    syncCartBusinessRules();
  }
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => syncCartBusinessRules());
} else {
  syncCartBusinessRules();
}
