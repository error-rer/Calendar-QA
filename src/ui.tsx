import {
  useState,
  type CSSProperties,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type HTMLAttributes,
} from 'react';

/**
 * Parse a CSS declaration string ("a:b;c:d") into a React style object.
 * Lets us keep the design prototype's literal inline-style strings verbatim,
 * which keeps the port pixel-accurate.
 */
export function css(s: string): CSSProperties {
  const out: Record<string, string> = {};
  for (const decl of s.split(';')) {
    const i = decl.indexOf(':');
    if (i < 0) continue;
    const prop = decl.slice(0, i).trim();
    if (!prop) continue;
    const val = decl.slice(i + 1).trim();
    const key = prop.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    out[key] = val;
  }
  return out as CSSProperties;
}

type HoverProps = { hover?: CSSProperties; focus?: CSSProperties };

/** <button> with style-hover / style-focus support. */
export function HButton({
  hover,
  focus,
  style,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & HoverProps) {
  const [h, setH] = useState(false);
  const [f, setF] = useState(false);
  return (
    <button
      {...rest}
      style={{ ...style, ...(h ? hover : null), ...(f ? focus : null) }}
      onMouseEnter={(e) => { setH(true); onMouseEnter?.(e); }}
      onMouseLeave={(e) => { setH(false); onMouseLeave?.(e); }}
      onFocus={(e) => { setF(true); onFocus?.(e); }}
      onBlur={(e) => { setF(false); onBlur?.(e); }}
    />
  );
}

/** <input> with style-focus support. */
export function HInput({
  focus,
  hover,
  style,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & HoverProps) {
  const [h, setH] = useState(false);
  const [f, setF] = useState(false);
  return (
    <input
      {...rest}
      style={{ ...style, ...(h ? hover : null), ...(f ? focus : null) }}
      onMouseEnter={(e) => { setH(true); onMouseEnter?.(e); }}
      onMouseLeave={(e) => { setH(false); onMouseLeave?.(e); }}
      onFocus={(e) => { setF(true); onFocus?.(e); }}
      onBlur={(e) => { setF(false); onBlur?.(e); }}
    />
  );
}

/** <div> (or any block) with style-hover support. */
export function HDiv({
  hover,
  focus,
  style,
  onMouseEnter,
  onMouseLeave,
  ...rest
}: HTMLAttributes<HTMLDivElement> & HoverProps) {
  const [h, setH] = useState(false);
  return (
    <div
      {...rest}
      style={{ ...style, ...(h ? hover : null), ...(focus ?? null) }}
      onMouseEnter={(e) => { setH(true); onMouseEnter?.(e); }}
      onMouseLeave={(e) => { setH(false); onMouseLeave?.(e); }}
    />
  );
}
