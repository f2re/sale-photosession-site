declare global {
  interface Window {
    ym: any;
  }
}

const COUNTER_ID = import.meta.env.VITE_YANDEX_METRIKA_COUNTER_ID;

export const initMetrika = () => {
  if (!COUNTER_ID) return;

  (function(m: any, e: any, t: any, r: any, i: any, k: any, a: any) {
    m[i] = m[i] || function() {
      (m[i].a = m[i].a || []).push(arguments);
    };
    m[i].l = 1 * new Date().getTime();
    for (var j = 0; j < document.scripts.length; j++) {
      if (document.scripts[j].src === r) {
        return;
      }
    }
    k = e.createElement(t);
    a = e.getElementsByTagName(t)[0];
    k.async = 1;
    k.src = r;
    a.parentNode.insertBefore(k, a);
  })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');

  window.ym(COUNTER_ID, 'init', {
    clickmap: true,
    trackLinks: true,
    accurateTrackBounce: true,
    webvisor: true,
    ecommerce: 'dataLayer',
  });
};

export const trackEvent = (event: string, params?: Record<string, any>) => {
  if (!COUNTER_ID || typeof window.ym === 'undefined') return;
  window.ym(COUNTER_ID, 'reachGoal', event, params);
};

export const trackPageView = (url: string) => {
  if (!COUNTER_ID || typeof window.ym === 'undefined') return;
  window.ym(COUNTER_ID, 'hit', url);
};

export const trackPurchase = (orderId: number, amount: number, packageName: string) => {
  if (typeof window.dataLayer === 'undefined') {
    (window as any).dataLayer = [];
  }

  (window as any).dataLayer.push({
    ecommerce: {
      purchase: {
        actionField: {
          id: orderId,
          revenue: amount,
        },
        products: [
          {
            id: orderId,
            name: packageName,
            price: amount,
            quantity: 1,
            category: 'Packages',
          },
        ],
      },
    },
  });

  trackEvent('purchase', { order_id: orderId, amount });
};

export const MetrikaGoals = {
  SIGNUP: 'signup',
  GENERATION_START: 'generation_start',
  GENERATION_COMPLETE: 'generation_complete',
  VIEW_PACKAGES: 'view_packages',
  CLICK_BUY: 'click_buy',
  PAYMENT_START: 'payment_start',
  PAYMENT_SUCCESS: 'payment_success',
  DOWNLOAD_IMAGE: 'download_image',
};
