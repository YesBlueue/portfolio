import { Fragment } from "react";

/** Text with ordinals like "3rd" or "2nd" set properly: the suffix as a superscript. */
export function Ordinals({ text }: { text: string }) {
  // split() with two groups gives [text, number, suffix, text, number, suffix, ..., text].
  const parts = text.split(/\b(\d+)(st|nd|rd|th)\b/);
  return <>{parts.map((part, i) => (i % 3 === 2 ? <sup key={i}>{part}</sup> : <Fragment key={i}>{part}</Fragment>))}</>;
}
