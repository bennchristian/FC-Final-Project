// Owner copy edits (owner-only authoring aid, ARCHITECTURE.md AD-12): the shape of
// artifact/copy-edits.json, its check, and how an edit finds its text box. Pure, so the
// build, the tests and the page all share it. The page inlines it before editor.js.
//
// File shape: { "version": 1, "edits": [ { "text", "n" | "live", "html"?, "style"? } ] }
//   text   the box's original text, normalized (normalizeText)
//   n      0-based occurrence among boxes with that same original text, in page order
//   live   true for a label in the Review results: applied to every box with that text, after every render
//   html   the box's new inner HTML (sanitized again by the page before use)
//   style  inline styles for the whole box, keys from STYLE_KEYS

export const COPY_EDITS_VERSION = 1;

export const STYLE_KEYS = ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'textDecoration', 'translate'];

export const FONT_CHOICES = [
  { label: 'Instrument Serif', value: '"Instrument Serif", "Times New Roman", serif' },
  { label: 'Open Sans', value: '"Open Sans", "Segoe UI", Arial, sans-serif' },
  { label: 'Georgia', value: 'Georgia, "Times New Roman", serif' },
  { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
  { label: 'System sans', value: 'system-ui, -apple-system, "Segoe UI", sans-serif' },
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Monospace', value: 'ui-monospace, Menlo, Consolas, monospace' },
];

const PX = '-?\\d+(?:\\.\\d+)?px';
const STYLE_VALUE_RULES = {
  fontFamily: (v) => v.length > 0 && v.length <= 200 && !/[;{}<>\\]/.test(v),
  fontSize: (v) => /^\d+(?:\.\d+)?px$/.test(v),
  fontWeight: (v) => /^(?:normal|bold|[1-9]00)$/.test(v),
  fontStyle: (v) => /^(?:normal|italic)$/.test(v),
  textDecoration: (v) => /^(?:none|underline)$/.test(v),
  translate: (v) => new RegExp(`^${PX}(?: ${PX})?$`).test(v),
};

const EDIT_KEYS = ['text', 'n', 'live', 'html', 'style'];

// Whitespace runs (including no-break spaces) become one space; ends are trimmed.
export function normalizeText(text) {
  return String(text ?? '').replace(/[\s ]+/g, ' ').trim();
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

// Returns error strings, each naming the field. An empty list means the file is usable.
export function checkCopyEdits(json) {
  const errors = [];
  if (!isPlainObject(json)) return ['copy-edits.json: must be an object'];
  for (const key of Object.keys(json)) {
    if (key !== 'version' && key !== 'edits') errors.push(`copy-edits.json: unknown field "${key}"`);
  }
  if (json.version !== COPY_EDITS_VERSION) errors.push(`version: must be ${COPY_EDITS_VERSION}`);
  if (!Array.isArray(json.edits)) {
    errors.push('edits: must be a list');
    return errors;
  }
  const seen = new Set();
  json.edits.forEach((edit, i) => {
    const at = `edits[${i}]`;
    if (!isPlainObject(edit)) {
      errors.push(`${at}: must be an object`);
      return;
    }
    for (const key of Object.keys(edit)) {
      if (!EDIT_KEYS.includes(key)) errors.push(`${at}.${key}: unknown field`);
    }
    if (typeof edit.text !== 'string') errors.push(`${at}.text: must be a string`);
    else if (!normalizeText(edit.text)) errors.push(`${at}.text: must not be empty`);
    else if (normalizeText(edit.text) !== edit.text) errors.push(`${at}.text: must be normalized (single spaces, trimmed)`);
    if (edit.live !== undefined && edit.live !== true) errors.push(`${at}.live: must be true when present`);
    if (edit.live === true) {
      if (edit.n !== undefined) errors.push(`${at}.n: not used on a live edit`);
    } else if (!Number.isInteger(edit.n) || edit.n < 0) errors.push(`${at}.n: must be a whole number, 0 or more`);
    if (edit.html !== undefined && typeof edit.html !== 'string') errors.push(`${at}.html: must be a string`);
    if (edit.style !== undefined) {
      if (!isPlainObject(edit.style)) {
        errors.push(`${at}.style: must be an object`);
      } else {
        for (const [key, value] of Object.entries(edit.style)) {
          if (!STYLE_KEYS.includes(key)) errors.push(`${at}.style.${key}: unknown style key`);
          else if (typeof value !== 'string') errors.push(`${at}.style.${key}: must be a string`);
          else if (!STYLE_VALUE_RULES[key](value)) errors.push(`${at}.style.${key}: invalid value "${value}"`);
        }
      }
    }
    if (edit.html === undefined && (edit.style === undefined || (isPlainObject(edit.style) && Object.keys(edit.style).length === 0))) {
      errors.push(`${at}: needs html or style`);
    }
    const id = edit.live === true ? `live\u0000${edit.text}` : `${edit.text}\u0000${edit.n}`;
    if (seen.has(id)) errors.push(`${at}: duplicates an earlier edit of the same box`);
    seen.add(id);
  });
  return errors;
}

// Pairs edits with boxes. `boxTexts` are the boxes' original normalized texts in page order.
// Returns { matches: [{ box, edit }], stale: [edit] }; `box` is an index into boxTexts.
// Live edits are skipped: the Review results apply them by text (editor.js).
export function matchCopyEdits(boxTexts, edits) {
  const indexByKey = new Map();
  const counts = new Map();
  boxTexts.forEach((text, box) => {
    const n = counts.get(text) || 0;
    counts.set(text, n + 1);
    indexByKey.set(`${text}\u0000${n}`, box);
  });
  const matches = [];
  const stale = [];
  for (const edit of (edits || []).filter((e) => !e.live)) {
    const box = indexByKey.get(`${edit.text}\u0000${edit.n}`);
    if (box === undefined) stale.push(edit);
    else matches.push({ box, edit });
  }
  return { matches, stale };
}
