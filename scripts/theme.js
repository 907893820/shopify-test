
import UIkit from 'uikit';
import Icons from 'uikit/dist/js/uikit-icons';

// loads the Icon plugin
UIkit.use(Icons);

window.UIkit = UIkit || {};

/*
 * Shopify Common JS
 *
 */
if ((typeof window.Shopify) == 'undefined') {
  window.Shopify = {};
}

Shopify.debounce = function (fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

Shopify.serializeForm = form => {
  const obj = {};
  const formData = new FormData(form);
  for (const key of formData.keys()) {
    obj[key] = formData.get(key);
  }
  return JSON.stringify(obj);
};

Shopify.fetchConfig = function (type = 'json') {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': `application/${type}` }
  };
}

Shopify.bind = function (fn, scope) {
  return function () {
    return fn.apply(scope, arguments);
  }
};

Shopify.setSelectorByValue = function (selector, value) {
  let i = 0, count = selector.options.length;
  for (; i < count; i++) {
    const option = selector.options[i];
    if (value == option.value || value == option.innerHTML) {
      selector.selectedIndex = i;
      return i;
    }
  }
};

Shopify.addListener = function (target, eventName, callback) {
  target.addEventListener ? target.addEventListener(eventName, callback, false) : target.attachEvent('on' + eventName, callback);
};

Shopify.postLink = function (path, options) {
  options = options || {};
  const method = options['method'] || 'post';
  const params = options['parameters'] || {};

  const form = document.createElement("form");
  form.setAttribute("method", method);
  form.setAttribute("action", path);

  for (const key in params) {
    const hiddenField = document.createElement("input");
    hiddenField.setAttribute("type", "hidden");
    hiddenField.setAttribute("name", key);
    hiddenField.setAttribute("value", params[key]);
    form.appendChild(hiddenField);
  }
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
};

Shopify.CountryProvinceSelector = function (country_domid, province_domid, options) {
  this.countryEl = document.getElementById(country_domid);
  this.provinceEl = document.getElementById(province_domid);
  this.provinceContainer = document.getElementById(options['hideElement'] || province_domid);

  Shopify.addListener(this.countryEl, 'change', Shopify.bind(this.countryHandler, this));

  this.initCountry();
  this.initProvince();
};

Shopify.CountryProvinceSelector.prototype = {
  initCountry: function () {
    const value = this.countryEl.getAttribute('data-default');
    Shopify.setSelectorByValue(this.countryEl, value);
    this.countryHandler();
  },

  initProvince: function () {
    const value = this.provinceEl.getAttribute('data-default');
    if (value && this.provinceEl.options.length > 0) {
      Shopify.setSelectorByValue(this.provinceEl, value);
    }
  },

  countryHandler: function (e) {
    let opt = this.countryEl.options[this.countryEl.selectedIndex];
    const raw = opt.getAttribute('data-provinces');
    const provinces = JSON.parse(raw);

    this.clearOptions(this.provinceEl);
    if (provinces && provinces.length == 0) {
      this.provinceContainer.style.display = 'none';
    } else {
      for (let i = 0; i < provinces.length; i++) {
        opt = document.createElement('option');
        opt.value = provinces[i][0];
        opt.innerHTML = provinces[i][1];
        this.provinceEl.appendChild(opt);
      }

      this.provinceContainer.style.display = "";
    }
  },

  clearOptions: function (selector) {
    while (selector.firstChild) {
      selector.removeChild(selector.firstChild);
    }
  },

  setOptions: function (selector, values) {
    let count = values.length;
    for (let i = 0; i < count; i++) {
      const opt = document.createElement('option');
      opt.value = values[i];
      opt.innerHTML = values[i];
      selector.appendChild(opt);
    }
  }
};

/**
 * 数量增减
 */
class QuantityInput extends HTMLElement {
  constructor() {
    super();
    this.input = this.querySelector('input');
    this.changeEvent = new Event('change', { bubbles: true })
    this.querySelectorAll('button').forEach(
      (button) => button.addEventListener('click', this.onButtonClick.bind(this))
    );
  }

  onButtonClick(event) {
    event.preventDefault();
    const previousValue = this.input.value;
    event.target.name === 'plus' ? this.input.stepUp() : this.input.stepDown();
    if (previousValue !== this.input.value) this.input.dispatchEvent(this.changeEvent);
  }
}

customElements.define('quantity-input', QuantityInput);

/**
 * 折扣码组件
 */
class DiscountComponent extends HTMLElement {
  constructor() {
    super();

    this.addEventListener('click', (e) => {
      const Input = document.createElement('input');
      Input.value = e.target.dataset.discount;
      document.body.appendChild(Input);
      Input.select();
      document.execCommand("Copy");
      Input.remove();
      UIkit.notification({ message: 'Copied', pos: 'center', status: 'success' })
    });
  }
}
customElements.define('discount-component', DiscountComponent)

class TabFilter extends HTMLElement {
  constructor() {
    super();
    this.updateSections();
    this.querySelectorAll('[data-filter-tab]').forEach((element) => {
      element.addEventListener('click', (event) => {
        event.target.closest('ul').querySelectorAll('li').forEach(e => e.classList.remove('tm-active'))
        event.target.closest('li').classList.add('tm-active');
        this.updateSections(event.target.dataset.filterTab);
      }, false);
    })
  }

  /**
   * update tabs state
   * @param activeSection
   */
  updateSections(activeSection) {
    const activeTab = activeSection ? activeSection : 'group_1';
    document.querySelectorAll('[data-filter]').forEach(elem => elem.classList.add('uk-hidden'));
    document.querySelectorAll(`[data-filter="${activeTab}"]`).forEach(elem => elem.classList.remove('uk-hidden'));
  }
}

customElements.define('tab-filter', TabFilter);

class backToTop extends HTMLElement {
  constructor() {
    super();
    document.addEventListener('scroll', () => {
      this.classList.toggle('uk-hidden', document.documentElement.scrollTop <= 600);
    });
  }
}
customElements.define('back-to-top', backToTop);

class Cookie extends HTMLElement {
  constructor() {
    super();
    const config = {
      name: 'consent-tracking-api',
      version: '0.1'
    }
    window.Shopify.loadFeatures([config],
      (error) => {
        if (error) {
          throw error;
        }
        setTimeout(() => {
          this.initCookieBanner();
        }, 3000)
      });

    this.addEventListener('hide', () => {
      this.handleAccept();
      console.log('hide')
    });

    // this.acceptBtn.addEventListener('click', this.handleAccept.bind(this));
    // this.declineBtn.addEventListener('click', this.handleDecline.bind(this));
  }

  toggleCookie(show = true) {
    this.classList.toggle('active', show)
  }

  handleAccept(e) {
    const { customerPrivacy } = window.Shopify;
    customerPrivacy.setTrackingConsent(true, this.toggleCookie.bind(this, false));
    document.addEventListener('trackingConsentAccepted', () => {
      console.log('trackingConsentAccepted event fired');
    });
  }

  handleDecline() {
    const { customerPrivacy } = window.Shopify;
    customerPrivacy.setTrackingConsent(false, this.toggleCookie.bind(this, false));
  }

  initCookieBanner() {
    const { customerPrivacy } = window.Shopify;
    const userCanBeTracked = customerPrivacy.userCanBeTracked();
    const userTrackingConsent = customerPrivacy.getTrackingConsent();
    if (userCanBeTracked && userTrackingConsent === 'no_interaction') {
      this.toggleCookie();
    } else {
      this.remove();
    }
  }
}

customElements.define('cookie-banner', Cookie);

class SectionRedirect extends HTMLElement {
  constructor() {
    super();
    this.time = this.dataset.time;
    this.timer = null;
    this.timeText = this.querySelector('[data-time]');
    this.redirectUrl = this.querySelector('[href]').getAttribute('href');
    this.init();
  }

  init() {
    clearInterval(this.timer);
    this.timeText.innerText = `${this.time}s`;
    this.timer = setInterval(() => {
      this.timeText.innerText = `${--this.time}s`;
      if (this.time <= 0) {
        clearInterval(this.timer);
        this.redirect(this.redirectUrl);
      }
    }, 1000)
  }

  redirect(url = '/') {
    if (!Shopify.designMode) {
      window.location.href = url;
    }
  }
}

customElements.define('section-redirect', SectionRedirect);

class CountdownTime extends HTMLElement {
  constructor() {
    super();
    let timer = null;
    const { time } = this.dataset;
    // Date.parse('2022-03-09T15:58:20+08:00'); 1646812700000
    const countdown = UIkit.countdown(this, { date: time });
    this.classList.toggle('uk-hidden', !countdown.timer);

    timer = setInterval(() => {
      if (Date.parse(time) - new Date().getTime() < 0) {
        this.remove();
        clearInterval(timer);
      }
    }, 100);
  }
}

customElements.define('countdown-time', CountdownTime);
