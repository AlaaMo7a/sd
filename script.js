/* ============================================================
   جنيهنا — script.js
   Edit exchangeRates below → entire app updates automatically.
   ============================================================ */

// ── 1. RATE DATA ─────────────────────────────────────────────
// ⚡ Only edit here. Everything on the page reads from this object.
const exchangeRates = {
  USD: 4500,
  SAR: 747,
  EGP: 56
};

// ── 2. CURRENCY METADATA ─────────────────────────────────────
// Flags, names, and codes — extend here if you add currencies.
const currencyMeta = {
  USD: { name: 'US Dollar',       flag: '🇺🇸' },
  SAR: { name: 'Saudi Riyal',     flag: '🇸🇦' },
  EGP: { name: 'Egyptian Pound',  flag: '🇪🇬' }
};

// ── 3. STATE ─────────────────────────────────────────────────
// Tracks which card is open and the conversion direction per card.
const state = {
  openCard: null,                  // currently expanded code (e.g. 'USD')
  direction: { USD: 'to-sdg', SAR: 'to-sdg', EGP: 'to-sdg' }
};

// ── 4. UTILITIES ─────────────────────────────────────────────

/** Format number with comma thousands separator, up to `dec` decimals */
function fmt(n, dec = 2) {
  if (!isFinite(n) || isNaN(n)) return '—';
  return Number(n).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: dec
  });
}

/** Pad single digits */
function pad(n) { return String(n).padStart(2, '0'); }

/** Current HH:MM string */
function timeStr() {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Current friendly date string */
function dateStr() {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
  });
}

/** Get element by id (shorthand) */
const $ = (id) => document.getElementById(id);

// ── 5. LOADING SCREEN ────────────────────────────────────────
window.addEventListener('load', () => {
  // Let the bar finish its CSS animation (1.6 s) then hide
  setTimeout(() => {
    const loader = $('loader');
    if (loader) loader.classList.add('gone');
  }, 1900);
});

// ── 6. CLOCK & DATE ──────────────────────────────────────────
function initClock() {
  function tick() {
    const dateEl    = $('hdr-date');
    const updatedEl = $('updated-time');
    if (dateEl)    dateEl.textContent    = dateStr();
    if (updatedEl) updatedEl.textContent = timeStr();
  }
  tick();
  setInterval(tick, 1000);
}

// ── 7. RENDER RATES ──────────────────────────────────────────
// Reads from exchangeRates and writes to the DOM.
function renderRates() {
  Object.keys(exchangeRates).forEach(code => {
    const el = $(`rate-${code}`);
    if (el) el.textContent = fmt(exchangeRates[code], 0);
  });
}

// ── 8. CALCULATOR LOGIC ──────────────────────────────────────

/**
 * Compute and display conversion result for a given currency code.
 * Reads the input value and current direction from state.
 */
function calculate(code) {
  const input     = $(`calc-input-${code}`);
  const resultNum = $(`result-num-${code}`);
  const resultUnit= $(`result-unit-${code}`);
  if (!input || !resultNum || !resultUnit) return;

  const amount = parseFloat(input.value);
  const rate   = exchangeRates[code];
  const dir    = state.direction[code];

  if (!amount || amount <= 0 || !isFinite(amount)) {
    resultNum.textContent  = '—';
    resultUnit.textContent = dir === 'to-sdg' ? 'SDG' : code;
    return;
  }

  if (dir === 'to-sdg') {
    // e.g. 5 USD × 2800 = 14,000 SDG
    resultNum.textContent  = fmt(amount * rate, 2);
    resultUnit.textContent = 'SDG';
  } else {
    // e.g. 10000 SDG ÷ 2800 ≈ 3.57 USD
    resultNum.textContent  = fmt(amount / rate, 4);
    resultUnit.textContent = code;
  }
}

/**
 * Update the calculator UI when direction changes.
 */
function applyDirection(code) {
  const dir        = state.direction[code];
  const labelEl    = $(`calc-label-${code}`);
  const prefixEl   = $(`calc-prefix-${code}`);
  const inputEl    = $(`calc-input-${code}`);

  if (dir === 'to-sdg') {
    if (labelEl)  labelEl.textContent  = `Amount in ${code}`;
    if (prefixEl) prefixEl.textContent = code;
  } else {
    if (labelEl)  labelEl.textContent  = 'Amount in SDG';
    if (prefixEl) prefixEl.textContent = 'SDG';
  }

  // Clear input and result on direction switch
  if (inputEl) inputEl.value = '';
  calculate(code);
}

// ── 9. CARD ACCORDION ────────────────────────────────────────

/**
 * Toggle a card open/closed.
 * Closes any previously open card first.
 */
function toggleCard(code) {
  const card = $(`card-${code}`);
  if (!card) return;

  const isOpen = state.openCard === code;

  // Close whatever's open
  if (state.openCard) {
    const prev = $(`card-${state.openCard}`);
    if (prev) prev.classList.remove('open');
    state.openCard = null;
  }

  // Open new card (if not closing same one)
  if (!isOpen) {
    card.classList.add('open');
    state.openCard = code;

    // Focus input for UX
    setTimeout(() => {
      const input = $(`calc-input-${code}`);
      if (input) input.focus();
    }, 350);
  }
}

// ── 10. RIPPLE EFFECT ────────────────────────────────────────
function createRipple(card, event) {
  const rect   = card.getBoundingClientRect();
  const size   = Math.max(rect.width, rect.height);
  const x      = (event.clientX || event.touches?.[0]?.clientX || rect.left + rect.width / 2)  - rect.left - size / 2;
  const y      = (event.clientY || event.touches?.[0]?.clientY || rect.top  + rect.height / 2) - rect.top  - size / 2;

  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  ripple.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px`;
  card.appendChild(ripple);

  // Clean up after animation
  ripple.addEventListener('animationend', () => ripple.remove());
}

// ── 11. BIND CARD EVENTS ─────────────────────────────────────
function bindCards() {
  Object.keys(exchangeRates).forEach(code => {
    const card = $(`card-${code}`);
    if (!card) return;

    // Click on card face → toggle
    const face = card.querySelector('.card-face');
    if (face) {
      face.addEventListener('click', (e) => {
        createRipple(card, e);
        toggleCard(code);
      });
    }

    // Direction buttons
    const dirBtns = card.querySelectorAll('.dir-btn');
    dirBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        // Update active styling
        dirBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Update state and refresh
        state.direction[code] = btn.dataset.dir;
        applyDirection(code);
      });
    });

    // Live calculation on input
    const input = $(`calc-input-${code}`);
    if (input) {
      input.addEventListener('input', () => calculate(code));
    }
  });
}

// ── 12. DARK MODE ────────────────────────────────────────────
function initDarkMode() {
  const btn  = $('darkBtn');
  const icon = $('darkIcon');

  // Restore preference
  if (localStorage.getItem('jnyna-dark') === 'true') {
    document.body.classList.add('dark');
    if (icon) { icon.className = 'fa-solid fa-sun'; }
  }

  if (btn) {
    btn.addEventListener('click', () => {
      document.body.classList.toggle('dark');
      const isDark = document.body.classList.contains('dark');
      if (icon) icon.className = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
      localStorage.setItem('jnyna-dark', isDark);
    });
  }
}

// ── 13. BACK TO TOP ──────────────────────────────────────────
function initBackToTop() {
  const btn = $('btt');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('show', window.scrollY > 300);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ── 14. BOOT ─────────────────────────────────────────────────
(function init() {
  initClock();
  renderRates();
  bindCards();
  initDarkMode();
  initBackToTop();
})();
