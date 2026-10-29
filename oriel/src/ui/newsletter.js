// Newsletter form: validates the address and answers honestly. ORIEL is a concept; nothing is sent.
const EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;
const MESSAGES = {
  error: 'Enter an email address like name@example.com',
  success: 'Thank you. ORIEL is a concept, so nothing was sent or stored.',
};

/**
 * @param {Document|HTMLElement} [root]
 * @returns {() => void} destroy
 */
export function initNewsletter(root = document) {
  const cleanups = [...root.querySelectorAll('[data-newsletter]')].map(bindForm);
  return function destroy() {
    cleanups.forEach((fn) => fn());
  };
}

function bindForm(form) {
  const input = form.querySelector('input[type="email"], input[name="email"]');
  const message = form.querySelector('[data-newsletter-msg]');
  if (!input || !message) return () => {};

  let timer = 0;
  const show = (tone, text) => {
    clearTimeout(timer);
    if (tone) message.dataset.tone = tone;
    else delete message.dataset.tone;
    // The same text twice is not re-announced by the live region; blank it for a beat first.
    if (text && message.textContent === text) {
      message.textContent = '';
      timer = setTimeout(() => (message.textContent = text), 80);
    } else {
      message.textContent = text;
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const value = input.value.trim();
    if (!EMAIL.test(value)) {
      input.setAttribute('aria-invalid', 'true');
      show('error', MESSAGES.error);
      input.focus();
      return;
    }
    input.removeAttribute('aria-invalid');
    input.value = '';
    show('success', MESSAGES.success);
  };

  // Clear a stale message once the visitor edits; an error clears as soon as the address is valid.
  const onInput = () => {
    if (input.getAttribute('aria-invalid') === 'true') {
      if (EMAIL.test(input.value.trim())) {
        input.removeAttribute('aria-invalid');
        show('', '');
      }
    } else if (message.dataset.tone === 'success') {
      show('', '');
    }
  };

  form.addEventListener('submit', onSubmit);
  input.addEventListener('input', onInput);

  return () => {
    clearTimeout(timer);
    form.removeEventListener('submit', onSubmit);
    input.removeEventListener('input', onInput);
    input.removeAttribute('aria-invalid');
    show('', '');
  };
}
