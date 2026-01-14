/**
 * DOM Selector Constants
 *
 * Centralized DOM selectors used throughout the extension.
 * This makes it easier to update selectors when Coupang changes their UI.
 */

export const SELECTORS = {
  // Product List Selectors
  PRODUCT_LIST: '#product-list',
  PRODUCT_UNIT: '.ProductUnit_productUnit__Qd6sv',
  PRODUCT_NAME: '.ProductUnit_productName__gre7e',
  AD_MARK: '.AdMark_adMark__KPMsC',

  // Product Detail Page Selectors
  PRODUCT_DETAIL_CONTAINER: '.prod-atf-contents',

  // Custom Extension Elements
  CT_METRICS: '.ct-metrics',
  CT_HELLO: '.ct-hello',
  CT_PRODINFO: '.ct-prodinfo',
  CT_TOAST: '#ct-toast',
} as const;

export const STYLE_IDS = {
  METRICS: 'ct-metrics-style',
  HELLO: 'ct-hello-style',
  TOAST: 'ct-toast-style',
} as const;

export const URL_PATTERNS = {
  PRODUCT_DETAIL: /\/products\/(\d+)/,
  CATEGORY: 'https://www.coupang.com/np/categories/',
  WING_BASE: 'https://wing.coupang.com',
} as const;
