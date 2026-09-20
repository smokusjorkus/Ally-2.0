import { test } from 'node:test';
import assert from 'node:assert/strict';
import { transformSync } from 'esbuild';
import { readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const source = readFileSync(new URL('./RetrievedCases.jsx', import.meta.url), 'utf8');
const code = transformSync(source.replace("import React from 'react';", '').replace('export const ', 'const ').replace('export default function ', 'function '), { loader: 'jsx', format: 'cjs' }).code;
const { RetrievedCases, VALIDATION_WARNING } = new Function('React', `${code}; return { RetrievedCases, VALIDATION_WARNING };`)(React);
test('renders unverified excerpts, exact warning, and no empty source link', () => {
  const html = renderToStaticMarkup(React.createElement(RetrievedCases, { message: { relevantCases: [{ title: 'Isican', content: 'Quoted lower court text', section: 'verdict', source_url: '' }] } }));
  assert.ok(html.includes(VALIDATION_WARNING));
  assert.ok(html.includes('Quoted lower court text'));
  assert.ok(html.includes('Retrieved case text'));
  assert.ok(!html.includes('<a '));
});
test('caps cases and blocks unsafe links', () => {
  const html = renderToStaticMarkup(React.createElement(RetrievedCases, { message: { relevantCases: Array(5).fill({ title: 'Case', source_url: 'javascript:alert(1)' }) } }));
  assert.equal((html.match(/<article/g) || []).length, 3);
  assert.ok(!html.includes('<a '));
});
test('distinguishes unavailable and empty retrieval', () => {
  const render = message => renderToStaticMarkup(React.createElement(RetrievedCases, { message }));
  assert.ok(render({ relevantCases: [] }).includes('No relevant cases found'));
  assert.ok(!render({ confidence: 'Service unavailable' }).includes('No relevant cases found'));
});
test('shows decision date and explicit fallback for missing dates', () => {
  const render = item => renderToStaticMarkup(React.createElement(RetrievedCases, { message: { relevantCases: [item] } }));
  assert.ok(render({ decision_date: '2023-01-18' }).includes('2023-01-18'));
  for (const item of [{}, { decision_date: '' }, { decision_date: null }, { source_year: 2023 }]) {
    const html = render(item);
    assert.ok(html.includes('Decision date:'));
    assert.ok(html.includes('Not available'));
  }
});
