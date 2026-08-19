import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * Restructures the flat footer content into semantic regions.
 *
 * Authoring contract (single section of default content):
 *   - brand name heading + address paragraphs (before the first link list)
 *   - one heading + list per link column (Connect / Technology / Explore)
 *   - a legal paragraph (after the last list)
 *   - a final heading rendered as the oversized brand wordmark
 *
 * @param {Element} wrapper The element holding the footer's default content
 */
function buildFooterLayout(wrapper) {
  const children = [...wrapper.children];
  const firstListIndex = children.findIndex((el) => el.tagName === 'UL');
  if (firstListIndex === -1) return;

  const lastListIndex = children.reduce(
    (acc, el, i) => (el.tagName === 'UL' ? i : acc),
    -1,
  );

  // The heading immediately before the first list starts the columns region.
  const columnsStart = firstListIndex > 0
    && /^H[1-6]$/.test(children[firstListIndex - 1].tagName)
    ? firstListIndex - 1
    : firstListIndex;

  const brandEls = children.slice(0, columnsStart);
  const columnEls = children.slice(columnsStart, lastListIndex + 1);
  const bottomEls = children.slice(lastListIndex + 1);

  // Brand meta region
  const brand = document.createElement('div');
  brand.className = 'footer-brand';
  brandEls.forEach((el) => brand.append(el));

  // Link columns region — pair each heading with its following list
  const nav = document.createElement('nav');
  nav.className = 'footer-columns';
  nav.setAttribute('aria-label', 'Footer');
  let currentColumn = null;
  columnEls.forEach((el) => {
    if (/^H[1-6]$/.test(el.tagName)) {
      currentColumn = document.createElement('div');
      currentColumn.className = 'footer-column';
      currentColumn.append(el);
      nav.append(currentColumn);
    } else if (currentColumn) {
      currentColumn.append(el);
    }
  });

  // Top region: brand on the left, columns on the right
  const top = document.createElement('div');
  top.className = 'footer-top';
  top.append(brand, nav);

  // Bottom region: legal line, then the oversized wordmark
  const legal = document.createElement('div');
  legal.className = 'footer-legal';
  let wordmark = null;
  bottomEls.forEach((el) => {
    if (/^H[1-6]$/.test(el.tagName)) {
      wordmark = el;
    } else {
      legal.append(el);
    }
  });

  wrapper.textContent = '';
  wrapper.append(top);
  if (legal.childElementCount) wrapper.append(legal);
  if (wordmark) {
    const mark = document.createElement('div');
    mark.className = 'footer-wordmark';
    mark.setAttribute('aria-hidden', 'true');
    mark.textContent = wordmark.textContent;
    wrapper.append(mark);
  }
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  // reorganize the default content into semantic footer regions
  const wrapper = footer.querySelector('.default-content-wrapper') || footer;
  buildFooterLayout(wrapper);

  block.append(footer);
}
