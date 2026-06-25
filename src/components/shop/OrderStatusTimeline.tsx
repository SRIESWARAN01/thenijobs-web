import React from 'react';
import { Package, Settings, Truck, CheckCircle, X, Check } from 'lucide-react';

// ─────────────────────────────────── Types ───────────────────────────────────

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

interface OrderStatusTimelineProps {
  status: OrderStatus;
}

// ─────────────────────── Step definitions ────────────────────────────────────

interface Step {
  key: OrderStatus;
  label: string;
  description: string;
  Icon: React.FC<{ className?: string }>;
}

const STEPS: Step[] = [
  {
    key: 'pending',
    label: 'Order Placed',
    description: 'Your order has been received',
    Icon: Package,
  },
  {
    key: 'processing',
    label: 'Processing',
    description: "We're preparing your items",
    Icon: Settings,
  },
  {
    key: 'shipped',
    label: 'Shipped',
    description: 'Your order is on its way',
    Icon: Truck,
  },
  {
    key: 'delivered',
    label: 'Delivered',
    description: 'Package has been delivered',
    Icon: CheckCircle,
  },
];

const STATUS_ORDER: Record<OrderStatus, number> = {
  pending: 0,
  processing: 1,
  shipped: 2,
  delivered: 3,
  cancelled: -1,
};

// ─────────────────── Step state helper ───────────────────────────────────────

type StepState = 'completed' | 'active' | 'future' | 'cancelled';

function getStepState(stepKey: OrderStatus, currentStatus: OrderStatus): StepState {
  if (currentStatus === 'cancelled') return 'cancelled';
  const stepIdx = STATUS_ORDER[stepKey];
  const curIdx = STATUS_ORDER[currentStatus];
  if (stepIdx < curIdx) return 'completed';
  if (stepIdx === curIdx) return 'active';
  return 'future';
}

// ─────────────────────── Circle component ────────────────────────────────────

interface StepCircleProps {
  state: StepState;
  isFirst: boolean;
  Icon: React.FC<{ className?: string }>;
}

function StepCircle({ state, isFirst, Icon }: StepCircleProps) {
  if (state === 'completed') {
    return (
      <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex-shrink-0">
        <Check className="w-5 h-5 text-emerald-400" strokeWidth={3} />
      </div>
    );
  }

  if (state === 'active') {
    return (
      <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-violet-500/20 border-2 border-violet-400 flex-shrink-0">
        <span className="absolute inset-0 rounded-full bg-violet-400/20 animate-ping" />
        <Icon className="w-5 h-5 text-violet-400 relative z-10" />
      </div>
    );
  }

  if (state === 'cancelled') {
    return (
      <div
        className={`flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0 ${
          isFirst
            ? 'bg-rose-500/20 border-2 border-rose-500'
            : 'bg-white/5 border-2 border-white/10'
        }`}
      >
        {isFirst ? (
          <X className="w-5 h-5 text-rose-400" strokeWidth={2.5} />
        ) : (
          <Icon className="w-5 h-5 text-white/20" />
        )}
      </div>
    );
  }

  // future
  return (
    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border-2 border-white/10 flex-shrink-0">
      <Icon className="w-5 h-5 text-white/30" />
    </div>
  );
}

// ──────────────────────────────── Component ──────────────────────────────────

export default function OrderStatusTimeline({ status }: OrderStatusTimelineProps) {
  const isCancelled = status === 'cancelled';

  return (
    <div className="glass-card rounded-2xl p-5">
      {/* Header */}
      <div className="mb-5">
        <h3 className="text-base font-bold text-white font-outfit">Order Status</h3>
        {isCancelled && (
          <p className="text-rose-400 text-xs mt-0.5">This order has been cancelled.</p>
        )}
      </div>

      {/* Steps */}
      <ol className="relative flex flex-col gap-0">
        {STEPS.map((step, idx) => {
          const state = getStepState(step.key, status);
          const isLast = idx === STEPS.length - 1;

          const labelColor =
            state === 'completed'
              ? 'text-emerald-400'
              : state === 'active'
              ? 'text-violet-300'
              : isCancelled && idx === 0
              ? 'text-rose-400'
              : 'text-white/30';

          const descColor =
            state === 'completed'
              ? 'text-emerald-500/70'
              : state === 'active'
              ? 'text-violet-400/70'
              : 'text-white/20';

          return (
            <li key={step.key} className="flex gap-4">
              {/* Circle + connector column */}
              <div className="flex flex-col items-center">
                <StepCircle state={state} isFirst={idx === 0} Icon={step.Icon} />
                {/* Connector line */}
                {!isLast && (
                  <div
                    className="w-0.5 flex-1 my-1.5 rounded-full"
                    style={{
                      background:
                        state === 'completed'
                          ? 'rgba(52, 211, 153, 0.4)'
                          : isCancelled
                          ? 'rgba(255,255,255,0.07)'
                          : state === 'active'
                          ? 'linear-gradient(to bottom, rgba(139,92,246,0.4), rgba(255,255,255,0.07))'
                          : 'rgba(255,255,255,0.07)',
                      minHeight: '2rem',
                    }}
                  />
                )}
              </div>

              {/* Text content */}
              <div className={`pt-1.5 ${!isLast ? 'pb-5' : 'pb-0'}`}>
                <p className={`text-sm font-semibold leading-tight font-outfit ${labelColor}`}>
                  {step.label}
                </p>
                <p className={`text-xs mt-0.5 leading-snug ${descColor}`}>
                  {step.description}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
