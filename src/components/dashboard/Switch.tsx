'use client';

import { cn } from '@/lib/cn';

/**
 * An accessible switch with a real 44px touch target.
 *
 * The track itself must opt out of the global coarse-pointer minimum: a 44px
 * `min-height` applied to a 24px-tall track stretches it and leaves the knob
 * floating at the top. The padding on the button supplies the touch area
 * instead, so the control stays reachable without deforming.
 */
export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
  className,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'tap-target-auto -m-2 shrink-0 cursor-pointer rounded-full p-2 transition-opacity',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
      title={description}
    >
      <span
        className={cn(
          'tap-target-auto relative block h-6 w-11 rounded-full transition-colors',
          checked ? 'bg-emerald-600' : 'bg-slate-300',
        )}
      >
        <span
          className={cn(
            'absolute top-1 block h-4 w-4 rounded-full bg-white shadow-sm transition-all',
            checked ? 'left-6' : 'left-1',
          )}
        />
      </span>
    </button>
  );
}

/** A labelled settings row: text on the left, control on the right. */
export function SettingRow({
  title,
  description,
  control,
  className,
}: {
  title: string;
  description?: string;
  control: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3',
        className,
      )}
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}
