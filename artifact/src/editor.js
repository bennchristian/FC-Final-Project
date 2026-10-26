// Owner copy editor: an owner-only authoring aid (PRD §4.11, ARCHITECTURE.md AD-12).
// Shift+E shows a floating bar. With "Edit text" on, text in the intro letter and every tab,
// including the Review results, can be rewritten in place, moved and restyled. "Save edits" hands the
// viewer copy-edits.json (downloads, or the clipboard). Bennett drops that file at
// artifact/copy-edits.json; build.mjs checks and inlines it as COPY_EDITS, and this file
// applies it on load. The page still keeps nothing: no storage, no network.
//
// Runs in the same scope as ui.js (concatenated by build.mjs, after intro.js): it uses
// `state.downloads`, `$` and `el` from there, and `COPY_EDITS` from the build.

import { STYLE_KEYS, FONT_CHOICES, COPY_EDITS_VERSION, normalizeText, matchCopyEdits } from './copy-edits.js';

(function () {
  'use strict';

  // ---------- Which boxes are editable ----------

  // A box is the outermost element with text of its own. How it works is a display-only overlay:
  // Claude still scores with the locked rubric and Persona text (Bennett, 2026-10-26).
  // The Review results are re-rendered by ui.js, so their boxes are found again after each render.
  const LIVE = '#posts, #outreach-slot';
  // Status and error lines, the versions label, the lists ui.js re-renders outside the results
  // (the send page's Posts, the overall summary, Past Reviews) and the editor itself are never editable.
  const EXCLUDED = '#availability, #images-hint, #post-count, #versions, #post-list, #overall, #past-list, #past-state, [aria-live], .error, #ce-bar, #ce-handle';
  const SKIPPED_TAGS = new Set(['SCRIPT', 'STYLE', 'TEMPLATE', 'SVG', 'SELECT', 'OPTION', 'TEXTAREA', 'INPUT']);

  function hasOwnText(node) {
    return Array.from(node.childNodes).some((child) => child.nodeType === Node.TEXT_NODE && child.data.trim());
  }

  // The boxes under `root` in page order, leaving out `skip` subtrees.
  function findBoxes(root, skip) {
    const found = [];
    (function walk(node) {
      for (const child of node.children) {
        if (SKIPPED_TAGS.has(child.tagName.toUpperCase()) || child.matches(EXCLUDED) || (skip && child.matches(skip))) continue;
        if (!hasOwnText(child)) walk(child);
        // Replacing its HTML would recreate an id ui.js looks up.
        else if (!child.querySelector(EXCLUDED) && !child.querySelector('[id]')) found.push(child);
      }
    })(root);
    return found;
  }

  function record(node, fields) {
    const original = Array.from(node.childNodes, (child) => child.cloneNode(true));
    return Object.assign({ node, text: normalizeText(node.textContent), original, cleanHtml: '', styles: {} }, fields);
  }

  function collectBoxes() {
    // A hidden intro (after Start here, until Go back) is skipped, as when it was removed.
    const roots = [document.getElementById('ll-intro'), document.querySelector('main')].filter((r) => r && !r.hidden);
    const list = [];
    const counts = new Map();
    for (const root of roots) {
      for (const node of findBoxes(root, LIVE)) {
        const b = record(node, { live: false });
        b.n = counts.get(b.text) || 0;
        counts.set(b.text, b.n + 1);
        list.push(b);
      }
    }
    return list;
  }

  // ---------- Sanitizer: applied edit HTML keeps only simple inline formatting ----------

  const ALLOWED_TAGS = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'S', 'BR', 'SUP', 'SUB', 'SPAN', 'SMALL']);
  // Removed with their contents. Any other unknown element is unwrapped and its text kept.
  const DROPPED_TAGS = new Set(['SCRIPT', 'STYLE', 'TEMPLATE', 'IFRAME', 'FRAME', 'OBJECT', 'EMBED', 'SVG', 'MATH', 'NOSCRIPT',
    'LINK', 'META', 'BASE', 'IMG', 'PICTURE', 'VIDEO', 'AUDIO', 'SOURCE', 'CANVAS', 'INPUT', 'SELECT', 'TEXTAREA']);
  const SPAN_CSS = ['font-family', 'font-size', 'font-weight', 'font-style', 'text-decoration-line'];
  const probe = document.createElement('span');

  function cleanCss(value) {
    probe.style.cssText = value;
    const parts = [];
    for (const prop of SPAN_CSS) {
      const v = probe.style.getPropertyValue(prop);
      if (v && !/url\(|expression|[<>\\]/i.test(v)) parts.push(`${prop}: ${v};`);
    }
    probe.style.cssText = '';
    return parts.join(' ');
  }

  function cleanAttributes(node) {
    for (const attr of Array.from(node.attributes)) {
      const name = attr.name.toLowerCase();
      if (name === 'class') {
        const tokens = attr.value.split(/\s+/).filter((t) => /^[A-Za-z][\w-]*$/.test(t) && !t.startsWith('ce-'));
        if (tokens.length) node.setAttribute('class', tokens.join(' '));
        else node.removeAttribute('class');
      } else if (name === 'style') {
        const css = cleanCss(attr.value);
        if (css) node.setAttribute('style', css);
        else node.removeAttribute('style');
      } else {
        node.removeAttribute(attr.name);
      }
    }
  }

  function cleanChildren(parent) {
    for (const node of Array.from(parent.childNodes)) {
      if (node.nodeType === Node.TEXT_NODE) continue;
      if (node.nodeType !== Node.ELEMENT_NODE) {
        node.remove();
        continue;
      }
      const tag = node.tagName.toUpperCase();
      if (DROPPED_TAGS.has(tag)) {
        node.remove();
        continue;
      }
      cleanChildren(node);
      if (ALLOWED_TAGS.has(tag)) cleanAttributes(node);
      else node.replaceWith(...Array.from(node.childNodes));
    }
  }

  // Parsed in an inert <template>, so nothing in it runs or loads. This is the only place
  // the editor parses markup (guard.test.mjs checks it); live boxes only get the cleaned nodes.
  function cleanTemplate(html) {
    const tpl = document.createElement('template');
    tpl.innerHTML = String(html);
    cleanChildren(tpl.content);
    return tpl;
  }

  function sanitizeHtml(html) {
    return cleanTemplate(html).innerHTML;
  }

  function markupOf(node) {
    const tpl = document.createElement('template');
    tpl.content.append(...Array.from(node.childNodes, (child) => child.cloneNode(true)));
    return tpl.innerHTML;
  }

  function restoreOriginal(b) {
    b.node.replaceChildren(...b.original.map((child) => child.cloneNode(true)));
  }

  // ---------- Applying edits ----------

  function applyStyles(box) {
    for (const key of STYLE_KEYS) box.node.style[key] = box.styles[key] || '';
  }

  const boxes = collectBoxes();
  const boxByNode = new Map(boxes.map((b) => [b.node, b]));
  for (const b of boxes) b.cleanHtml = sanitizeHtml(markupOf(b.node));

  // An edit without html puts the original text back, so a label reset reaches every Post.
  function applyEdit(b, edit) {
    if (typeof edit.html === 'string') b.node.replaceChildren(cleanTemplate(edit.html).content);
    else restoreOriginal(b);
    b.styles = {};
    for (const key of STYLE_KEYS) {
      if (edit.style && typeof edit.style[key] === 'string' && edit.style[key]) b.styles[key] = edit.style[key];
    }
    applyStyles(b);
  }

  const saved = (typeof COPY_EDITS !== 'undefined' && COPY_EDITS && COPY_EDITS.edits) || [];
  const { matches, stale } = matchCopyEdits(boxes.map((b) => b.text), saved);
  for (const { box, edit } of matches) applyEdit(boxes[box], edit);
  if (stale.length) console.warn(`Copy editor: ${stale.length} saved edit(s) no longer match the page text.`);

  // Saved label edits for the Review results, by original text. Results come and go, so these
  // are never stale. Claude's text and pasted Posts (`.said`, from ui.js) are never saved.
  const liveEdits = new Map(saved.filter((e) => e.live).map((e) => [e.text, e]));
  let liveBoxes = [];

  // The edit a box needs to reproduce its current state, or null when it is unchanged.
  function editFor(b) {
    const edit = b.live ? { text: b.text, live: true } : { text: b.text, n: b.n };
    const html = sanitizeHtml(markupOf(b.node));
    if (html !== b.cleanHtml) edit.html = html;
    const style = {};
    for (const key of STYLE_KEYS) if (b.styles[key]) style[key] = b.styles[key];
    if (Object.keys(style).length) edit.style = style;
    return edit.html !== undefined || edit.style ? edit : null;
  }

  function exportJson() {
    const edits = [...boxes.map(editFor).filter(Boolean), ...liveEdits.values(), ...stale];
    return `${JSON.stringify({ version: COPY_EDITS_VERSION, edits }, null, 2)}\n`;
  }

  // ---------- Editor state ----------

  let editing = false;
  let active = null;
  let savedRange = null;
  let dirty = false;
  let frame = 0;
  let resetAllArmed = 0;

  // ---------- The bar (hidden until Shift+E) ----------

  const editToggle = el('button', { type: 'button', 'aria-pressed': 'false' }, 'Edit text');
  const countText = el('span', { className: 'ce-count' });
  const closeButton = el('button', { type: 'button', 'aria-label': 'Close the copy editor' }, 'Close');
  // The bar can cover the text you want; this moves it to the other edge of the screen.
  const dockButton = el('button', { type: 'button' }, 'Bar to top');
  const fontSelect = el('select', { 'aria-label': 'Font' },
    el('option', { value: '' }, 'Page font'),
    FONT_CHOICES.map((f) => el('option', { value: f.value }, f.label)));
  const sizeInput = el('input', { type: 'number', min: 6, max: 400, step: 1, 'aria-label': 'Font size in pixels', placeholder: 'size' });
  const boldButton = el('button', { type: 'button', 'aria-label': 'Bold' }, el('b', {}, 'B'));
  const italicButton = el('button', { type: 'button', 'aria-label': 'Italic' }, el('i', {}, 'I'));
  const underlineButton = el('button', { type: 'button', 'aria-label': 'Underline' }, el('u', {}, 'U'));
  const resetBoxButton = el('button', { type: 'button' }, 'Reset box');
  const resetAllButton = el('button', { type: 'button' }, 'Reset all');
  const saveButton = el('button', { type: 'button' }, 'Save edits');
  const copyButton = el('button', { type: 'button' }, 'Copy');
  const statusText = el('span', { className: 'ce-status', role: 'status' });
  const fallback = el('textarea', { rows: 6, readonly: true, hidden: true, 'aria-label': 'Copy edits as JSON' });
  const styleControls = [fontSelect, sizeInput, boldButton, italicButton, underlineButton, resetBoxButton];

  const bar = el('div', { id: 'ce-bar', role: 'region', 'aria-label': 'Copy editor', hidden: true },
    el('div', { className: 'ce-row' }, el('strong', {}, 'Copy editor'), editToggle, countText, el('span', { className: 'ce-spacer' }), dockButton, closeButton),
    el('div', { className: 'ce-row' }, fontSelect, sizeInput, el('span', {}, 'px'), boldButton, italicButton, underlineButton, resetBoxButton, resetAllButton),
    el('div', { className: 'ce-row' }, saveButton, copyButton, statusText),
    fallback,
  );
  const handle = el('button', { type: 'button', id: 'ce-handle', hidden: true, title: 'Drag to move', 'aria-label': 'Drag to move this text' }, 'Move');
  document.body.append(bar, handle);

  function inEditorUi(node) {
    return bar.contains(node) || handle.contains(node);
  }

  function setStatus(text) {
    statusText.textContent = text;
  }

  function plural(n, one, many) {
    return n === 1 ? one : many;
  }

  function updateCount() {
    const edited = boxes.filter((b) => editFor(b)).length + liveEdits.size;
    countText.replaceChildren(`${edited} ${plural(edited, 'edit', 'edits')}${dirty ? ', not saved' : ''}`);
    if (stale.length) {
      countText.append(' · ', el('span', { className: 'ce-stale' },
        `${stale.length} saved ${plural(stale.length, 'edit no longer matches', 'edits no longer match')}`));
    }
  }

  // A Review label edit is kept by its text and copied to the same label on every other Post.
  function changed() {
    if (active && active.said) return; // never saved
    dirty = true;
    if (active && active.live) {
      const edit = editFor(active);
      if (edit) liveEdits.set(active.text, edit);
      else liveEdits.delete(active.text);
      for (const b of liveBoxes) {
        if (b !== active && !b.said && b.text === active.text) applyEdit(b, edit || {});
      }
    }
    updateCount();
  }

  function syncControls() {
    const on = editing && Boolean(active);
    for (const control of styleControls) control.disabled = !on;
    fontSelect.value = on && active.styles.fontFamily && FONT_CHOICES.some((f) => f.value === active.styles.fontFamily) ? active.styles.fontFamily : '';
    sizeInput.value = on && active.styles.fontSize ? String(parseFloat(active.styles.fontSize)) : '';
    sizeInput.placeholder = on ? String(Math.round(parseFloat(getComputedStyle(active.node).fontSize))) : 'size';
  }

  // ---------- Opening, closing and edit mode ----------

  function setBarOpen(open) {
    bar.hidden = !open;
    if (!open) setEditing(false);
    else {
      updateCount();
      syncControls();
    }
  }

  function setEditing(on) {
    if (editing === on) return;
    editing = on;
    editToggle.setAttribute('aria-pressed', String(on));
    document.documentElement.classList.toggle('ce-editing', on);
    for (const b of [...boxes, ...liveBoxes]) b.node.classList.toggle('ce-box', on);
    if (on) openDetails();
    else {
      deactivate();
      closeDetails();
    }
    syncControls();
  }

  // While editing, every <details> is open so its text can be reached; the editor closes the ones it opened.
  function openDetails() {
    for (const d of document.querySelectorAll('main details:not([open])')) {
      d.open = true;
      d.setAttribute('data-ce-opened', '');
    }
  }

  function closeDetails() {
    for (const d of document.querySelectorAll('main details[data-ce-opened]')) {
      d.open = false;
      d.removeAttribute('data-ce-opened');
    }
  }

  function activate(b) {
    if (active === b) return;
    deactivate();
    active = b;
    b.node.contentEditable = 'true';
    b.node.classList.add('ce-active');
    handle.hidden = false;
    frame = requestAnimationFrame(placeHandle);
    if (b.said) setStatus('Claude’s text or a pasted Post: you can retype it here, but it is not saved and resets when the Review updates.');
    else if (b.live) setStatus('A Review label: your change applies to every Post and is saved.');
    else setStatus('');
    syncControls();
  }

  function deactivate() {
    if (!active) return;
    active.node.removeAttribute('contenteditable');
    active.node.classList.remove('ce-active');
    active = null;
    savedRange = null;
    handle.hidden = true;
    cancelAnimationFrame(frame);
    syncControls();
    updateCount();
  }

  // The handle follows the active box (it can move, scroll or animate).
  function placeHandle() {
    if (!active) return;
    const rect = active.node.getBoundingClientRect();
    const size = handle.getBoundingClientRect();
    handle.style.left = `${Math.max(4, Math.min(window.innerWidth - size.width - 4, rect.left))}px`;
    handle.style.top = `${Math.max(4, rect.top - size.height - 6)}px`;
    frame = requestAnimationFrame(placeHandle);
  }

  function boxFor(node) {
    for (let n = node; n && n !== document; n = n.parentNode) {
      if (boxByNode.has(n)) return boxByNode.get(n);
    }
    return null;
  }

  // ---------- Moving ----------

  // How much the box is scaled on screen (the intro stage is scaled by --s).
  function renderScale(node) {
    const scale = node.offsetWidth ? node.getBoundingClientRect().width / node.offsetWidth : 1;
    return Number.isFinite(scale) && scale > 0 ? scale : 1;
  }

  function parseTranslate(value) {
    const [x, y] = String(value || '').split(' ').map(parseFloat);
    return [x || 0, y || 0];
  }

  function round1(v) {
    return Math.round(v * 10) / 10 || 0;
  }

  handle.addEventListener('pointerdown', (event) => {
    if (!active) return;
    event.preventDefault();
    const b = active;
    const scale = renderScale(b.node);
    const [x0, y0] = parseTranslate(b.styles.translate);
    const startX = event.clientX;
    const startY = event.clientY;
    handle.setPointerCapture(event.pointerId);
    const move = (e) => {
      const x = round1(x0 + (e.clientX - startX) / scale);
      const y = round1(y0 + (e.clientY - startY) / scale);
      if (x || y) b.styles.translate = `${x}px ${y}px`;
      else delete b.styles.translate;
      applyStyles(b);
    };
    const end = () => {
      handle.removeEventListener('pointermove', move);
      handle.removeEventListener('pointerup', end);
      handle.removeEventListener('pointercancel', end);
      changed();
    };
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
  });

  // ---------- Restyling: the selection inside the active box, else the whole box ----------

  function selectionInActive() {
    if (!active || !savedRange || savedRange.collapsed) return null;
    return active.node.contains(savedRange.commonAncestorContainer) ? savedRange : null;
  }

  function selectRange(range) {
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    savedRange = range.cloneRange();
  }

  function wrapRange(range, prop, value) {
    const span = document.createElement('span');
    span.style.setProperty(prop, value);
    span.append(range.extractContents());
    range.insertNode(span);
    const next = document.createRange();
    next.selectNodeContents(span);
    selectRange(next);
  }

  // B, I and U: execCommand on the saved selection, or a whole-box toggle.
  function toggleFormat(command, key, isOn, on, off) {
    if (!active) return;
    const range = selectionInActive();
    if (range) {
      active.node.focus({ preventScroll: true });
      selectRange(range);
      document.execCommand('styleWithCSS', false, false);
      document.execCommand(command);
      const selection = window.getSelection();
      if (selection.rangeCount) savedRange = selection.getRangeAt(0).cloneRange();
    } else {
      const b = active;
      const wasOn = isOn(getComputedStyle(b.node));
      delete b.styles[key];
      applyStyles(b);
      if (isOn(getComputedStyle(b.node)) === wasOn) b.styles[key] = wasOn ? off : on;
      applyStyles(b);
    }
    changed();
  }

  // Bar buttons keep the text selection in the box.
  for (const button of [boldButton, italicButton, underlineButton, resetBoxButton]) {
    button.addEventListener('mousedown', (event) => event.preventDefault());
  }
  boldButton.addEventListener('click', () => toggleFormat('bold', 'fontWeight', (cs) => parseInt(cs.fontWeight, 10) >= 600, 'bold', 'normal'));
  italicButton.addEventListener('click', () => toggleFormat('italic', 'fontStyle', (cs) => cs.fontStyle !== 'normal', 'italic', 'normal'));
  underlineButton.addEventListener('click', () => toggleFormat('underline', 'textDecoration', (cs) => cs.textDecorationLine.includes('underline'), 'underline', 'none'));

  fontSelect.addEventListener('change', () => {
    if (!active) return;
    const value = fontSelect.value;
    const range = selectionInActive();
    if (range) wrapRange(range, 'font-family', value || 'inherit');
    else {
      if (value) active.styles.fontFamily = value;
      else delete active.styles.fontFamily;
      applyStyles(active);
    }
    changed();
  });

  sizeInput.addEventListener('change', () => {
    if (!active) return;
    const px = Math.round(Number(sizeInput.value));
    const valid = sizeInput.value !== '' && px >= 6 && px <= 400;
    const range = selectionInActive();
    if (range) {
      if (valid) wrapRange(range, 'font-size', `${px}px`);
    } else {
      if (valid) active.styles.fontSize = `${px}px`;
      else delete active.styles.fontSize;
      applyStyles(active);
    }
    syncControls();
    changed();
  });

  resetBoxButton.addEventListener('click', () => {
    if (!active) return;
    restoreOriginal(active);
    active.styles = {};
    applyStyles(active);
    savedRange = null;
    syncControls();
    changed();
  });

  // Two clicks, since window.confirm may be blocked in the artifact frame.
  resetAllButton.addEventListener('click', () => {
    if (Date.now() - resetAllArmed > 4000) {
      resetAllArmed = Date.now();
      setStatus('Click Reset all again to undo every edit on this page.');
      return;
    }
    resetAllArmed = 0;
    liveEdits.clear();
    for (const b of [...boxes, ...liveBoxes]) applyEdit(b, {});
    savedRange = null;
    setStatus(stale.length ? 'All edits on this page were reset. Edits that no longer match are kept.' : 'All edits were reset.');
    syncControls();
    dirty = true;
    updateCount();
  });

  // ---------- Save and copy ----------

  async function copyJson(prefix) {
    const data = exportJson();
    try {
      await navigator.clipboard.writeText(data);
      fallback.hidden = true;
      dirty = false;
      setStatus(`${prefix}Copied. Save it as artifact/copy-edits.json and rebuild.`);
    } catch {
      fallback.value = data;
      fallback.hidden = false;
      fallback.focus();
      fallback.select();
      setStatus(`${prefix}Copying is blocked here. The edits are selected below: press Ctrl+C or ⌘C.`);
    }
    updateCount();
  }

  saveButton.addEventListener('click', async () => {
    if (state.downloads) {
      try {
        await state.downloads.save({ filename: 'copy-edits.json', data: exportJson() });
        dirty = false;
        fallback.hidden = true;
        setStatus('Saved. Put copy-edits.json at artifact/copy-edits.json and rebuild.');
        updateCount();
        return;
      } catch (e) {
        const code = e && e.code;
        if (code === 'declined') return setStatus('Not saved.');
        if (code === 'rate_limited') return setStatus('A save is already waiting for your answer.');
      }
    }
    await copyJson('Saving files is not available here. ');
  });
  copyButton.addEventListener('click', () => copyJson(''));

  editToggle.addEventListener('click', () => setEditing(!editing));
  closeButton.addEventListener('click', () => setBarOpen(false));
  dockButton.addEventListener('click', () => {
    const top = bar.classList.toggle('ce-top');
    dockButton.textContent = top ? 'Bar to bottom' : 'Bar to top';
  });

  // ---------- Page events ----------

  function isTyping(node) {
    return Boolean(node && (node.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(node.tagName)));
  }

  window.addEventListener('keydown', (event) => {
    if (event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey && !event.repeat
      && (event.key === 'E' || event.key === 'e')
      && !isTyping(event.target) && !isTyping(document.activeElement)) {
      event.preventDefault();
      setBarOpen(bar.hidden);
      return;
    }
    if (!editing) return;
    // Escape leaves the box instead of closing the intro.
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      deactivate();
      return;
    }
    // Enter is a line break, never a new block or a button press.
    if (event.key === 'Enter' && active && active.node.contains(event.target)) {
      event.preventDefault();
      if (!document.execCommand('insertLineBreak')) document.execCommand('insertHTML', false, '<br>');
      changed();
    }
  }, true);

  // While editing, nothing on the page reacts to clicks (buttons, labels, summaries, links),
  // except the page navigation ([data-nav]; not Start reviewing, whose label is copy), so every page's copy can be reached.
  window.addEventListener('pointerdown', (event) => {
    if (!editing || inEditorUi(event.target)) return;
    const b = boxFor(event.target);
    if (b) activate(b);
    else deactivate();
  }, true);
  window.addEventListener('click', (event) => {
    if (!editing || inEditorUi(event.target)) return;
    if (event.target.closest('[data-nav]:not(#start-reviewing)')) return;
    event.preventDefault();
    event.stopPropagation();
  }, true);
  window.addEventListener('submit', (event) => {
    if (!editing) return;
    event.preventDefault();
    event.stopPropagation();
  }, true);

  document.addEventListener('selectionchange', () => {
    if (!active) return;
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    if (active.node.contains(range.commonAncestorContainer)) savedRange = range.cloneRange();
  });

  document.addEventListener('input', (event) => {
    if (active && active.node.contains(event.target)) changed();
  }, true);

  // Pasted text arrives as plain text.
  document.addEventListener('paste', (event) => {
    if (!active || !active.node.contains(event.target)) return;
    event.preventDefault();
    const text = (event.clipboardData && event.clipboardData.getData('text/plain')) || '';
    document.execCommand('insertText', false, text);
  }, true);
  document.addEventListener('drop', (event) => {
    if (editing) event.preventDefault();
  }, true);

  window.addEventListener('beforeunload', (event) => {
    if (!dirty) return;
    event.preventDefault();
    event.returnValue = '';
  });

  // ---------- Review results: found again, and label edits applied again, after each render ----------

  function scanLive() {
    liveBoxes = liveBoxes.filter((b) => {
      if (b.node.isConnected) return true;
      boxByNode.delete(b.node);
      if (active === b) deactivate();
      return false;
    });
    for (const region of document.querySelectorAll(LIVE)) {
      for (const node of findBoxes(region)) {
        if (boxByNode.has(node)) continue;
        const b = record(node, { live: true, said: node.matches('.said') || Boolean(node.querySelector('.said')) });
        b.cleanHtml = sanitizeHtml(markupOf(node));
        if (!b.said && liveEdits.has(b.text)) applyEdit(b, liveEdits.get(b.text));
        if (editing) node.classList.add('ce-box');
        boxByNode.set(node, b);
        liveBoxes.push(b);
      }
    }
    if (editing) openDetails();
  }

  // Typing in the active box is not a render. Applying edits only touches known boxes, so a
  // second pass finds nothing new and stops.
  const observer = new MutationObserver((mutations) => {
    if (active && mutations.every((m) => active.node.contains(m.target))) return;
    scanLive();
  });
  for (const region of document.querySelectorAll(LIVE)) observer.observe(region, { childList: true, subtree: true });
  scanLive();
})();
