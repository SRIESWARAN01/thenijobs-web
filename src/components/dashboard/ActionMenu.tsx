'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface ActionItem {
  label: string;
  icon?: LucideIcon;
  onClick?: () => void;
  /** Renders an anchor instead of a button. */
  href?: string;
  /** Opens in a new tab; only meaningful with `href`. */
  external?: boolean;
  tone?: 'default' | 'danger' | 'success';
  disabled?: boolean;
  /** Draws a divider above this item. */
  separatorBefore?: boolean;
}

const TONE: Record<NonNullable<ActionItem['tone']>, string> = {
  default: 'text-slate-700 hover:bg-slate-100',
  danger: 'text-rose-700 hover:bg-rose-50',
  success: 'text-emerald-700 hover:bg-emerald-50',
};

const MENU_WIDTH = 208;
const MARGIN = 8;

/**
 * Row action menu.
 *
 * The panel is portalled to <body> with fixed positioning rather than absolutely
 * positioned next to the trigger. A table row lives inside the DataTable's
 * `overflow-x-auto` container, and an absolutely positioned panel inside a
 * scroll container is clipped at its edge — the menu for the last row would be
 * cut in half. Fixed + portal escapes that entirely; the trade-off is that the
 * position must be recomputed on scroll and resize, which is what the effect
 * below does.
 */
export function ActionMenu({
  items,
  label = 'Row actions',
  className,
}: {
  items: ActionItem[];
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [pos, setPos] = React.useState<{ top: number; left: number } | null>(null);
  const btnRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const place = React.useCallback(() => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const estHeight = Math.min(items.length * 38 + 12, 320);
    const openUp = r.bottom + estHeight + MARGIN > window.innerHeight && r.top > estHeight;
    const left = Math.max(MARGIN, Math.min(r.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - MARGIN));
    setPos({ top: openUp ? r.top - estHeight - 4 : r.bottom + 4, left });
  }, [items.length]);

  React.useLayoutEffect(() => {
    if (!open) return;
    place();
    const onScroll = () => place();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!menuRef.current?.contains(t) && !btnRef.current?.contains(t)) setOpen(false);
    };
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [open, place]);

  // Move focus into the panel once it exists, so the menu is keyboard-usable.
  React.useEffect(() => {
    if (open && pos) menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
  }, [open, pos]);

  const visible = items.filter(Boolean);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        title={label}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(o => !o);
        }}
        className={cn(
          'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-colors',
          'hover:bg-slate-100 hover:text-slate-800',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
          open && 'bg-slate-100 text-slate-800',
          className,
        )}
      >
        <MoreVertical size={16} aria-hidden />
      </button>

      {open && pos && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          role="menu"
          aria-label={label}
          style={{ top: pos.top, left: pos.left, width: MENU_WIDTH }}
          className="fixed z-[200] max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg shadow-slate-900/10"
          onClick={(e) => e.stopPropagation()}
        >
          {visible.map((item, i) => {
            const Icon = item.icon;
            const cls = cn(
              'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-medium transition-colors',
              'focus:outline-none focus-visible:bg-slate-100',
              item.disabled ? 'cursor-not-allowed text-slate-300' : TONE[item.tone ?? 'default'],
            );
            const inner = (
              <>
                {Icon && <Icon size={14} className="shrink-0" aria-hidden />}
                <span className="truncate">{item.label}</span>
              </>
            );
            return (
              <React.Fragment key={`${item.label}-${i}`}>
                {item.separatorBefore && <div className="my-1 h-px bg-slate-100" role="separator" />}
                {item.href && !item.disabled ? (
                  <a
                    role="menuitem"
                    tabIndex={0}
                    href={item.href}
                    target={item.external ? '_blank' : undefined}
                    rel={item.external ? 'noreferrer' : undefined}
                    className={cls}
                    onClick={() => setOpen(false)}
                  >
                    {inner}
                  </a>
                ) : (
                  <button
                    role="menuitem"
                    tabIndex={0}
                    type="button"
                    disabled={item.disabled}
                    className={cls}
                    onClick={() => {
                      setOpen(false);
                      item.onClick?.();
                    }}
                  >
                    {inner}
                  </button>
                )}
              </React.Fragment>
            );
          })}
        </div>,
        document.body,
      )}
    </>
  );
}
