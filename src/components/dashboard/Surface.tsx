'use client';

import { cn } from '@/lib/cn';

/**
 * The single card surface for every dashboard. One border colour, one radius,
 * one shadow — the thing 58 pages each reinvented with a different combination
 * of rounded-2xl/3xl, shadow-xs/sm and gray-100/200 borders.
 */
export function Card({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      className={cn('rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]', className)}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5',
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="truncate text-sm font-semibold text-slate-900 sm:text-base">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
    </div>
  );
}

export function CardBody({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('p-4 sm:p-5', className)}>{children}</div>;
}

/**
 * Standard page container. `max-w-screen-2xl` stops dashboards from becoming
 * unreadable 3000px-wide line lengths on a desktop monitor, and the padding
 * ramp keeps a phone at a comfortable 16px gutter.
 */
export function PageShell({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('mx-auto w-full max-w-screen-2xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8', className)}>
      <div className="space-y-4 sm:space-y-6">{children}</div>
    </div>
  );
}
