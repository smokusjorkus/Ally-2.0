import React from 'react';

export const VALIDATION_WARNING = 'ALLY found potentially relevant case records, but the final Supreme Court disposition could not be verified from the currently indexed metadata. The retrieved text may include rulings from lower courts. Please review the official Supreme Court or E-Library decision before relying on the legal outcome.';

function sourceLink(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

export default function RetrievedCases({ message }) {
  if (message.confidence === 'Service unavailable') return <div role="alert" className="mt-3 rounded-2xl bg-red-50 p-4 text-sm">Case retrieval is unavailable. Please try again later.</div>;
  const cases = (message.relevantCases || []).slice(0, 3);
  if (!cases.length) return <div className="mt-3 rounded-2xl bg-blue-50 p-4 text-sm">No relevant cases found.</div>;
  const verified = message.legal_validation_status === 'verified' && message.can_state_final_outcome === true;
  return <div className="mt-3 max-w-[min(42rem,85%)] space-y-3 rounded-2xl bg-blue-50 p-4 text-sm break-words">
    {!verified && <p role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-amber-950">{VALIDATION_WARNING}</p>}
    <h4 className="font-semibold text-blue-800">Retrieved case text ({cases.length})</h4>
    {cases.map((item, index) => <article key={index} className="space-y-2 rounded-xl bg-white p-3">
      <h5 className="font-semibold">{item.title || 'Untitled case record'}</h5>
      {(item.case_number || item.citation) && <p>{item.case_number || item.citation}</p>}
      <p>Decision date: {typeof item.decision_date === 'string' && item.decision_date.trim() ? item.decision_date.trim() : 'Not available'}</p>
      {typeof item.score === 'number' && <p>Similarity: {item.score.toFixed(1)}%</p>}
      {item.section && <p>Indexed section: {item.section}</p>}
      {item.content && <p className="whitespace-pre-wrap">{item.content}</p>}
      {sourceLink(item.source_url) && <a className="inline-block break-all text-blue-600 hover:underline" href={sourceLink(item.source_url)} target="_blank" rel="noopener noreferrer">View source decision</a>}
    </article>)}
  </div>;
}
