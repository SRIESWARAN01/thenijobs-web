'use client';

import { useState } from 'react';
import { Bell, BellOff, Check, Loader2, Smartphone, AlertTriangle } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

/**
 * Notification settings panel — can be embedded in any user settings page.
 * Handles push notification permission + FCM token registration.
 */
export default function NotificationSettings() {
  const {
    permission,
    token,
    loading,
    error,
    requestPermission,
    isSupported,
  } = usePushNotifications();

  const [justEnabled, setJustEnabled] = useState(false);

  const handleEnable = async () => {
    const result = await requestPermission();
    if (result) setJustEnabled(true);
  };

  if (!isSupported) {
    return (
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gray-500/10 flex items-center justify-center">
            <BellOff size={18} className="text-gray-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Push Notifications</h3>
            <p className="text-xs text-gray-500">Not supported in this browser</p>
          </div>
        </div>
        <p className="text-xs text-gray-400">
          Push notifications are not available in this browser. Please try using Chrome, Firefox, or Edge on a desktop or Android device.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            permission === 'granted' ? 'bg-emerald-500/10' : 'bg-violet-500/10'
          }`}>
            {permission === 'granted'
              ? <Bell size={18} className="text-emerald-400" />
              : <BellOff size={18} className="text-violet-400" />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Push Notifications</h3>
            <p className="text-xs text-gray-500">
              {permission === 'granted'
                ? 'Notifications are enabled'
                : permission === 'denied'
                ? 'Notifications are blocked'
                : 'Enable to receive job alerts & updates'}
            </p>
          </div>
        </div>

        {permission === 'granted' ? (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold">
            <Check size={12} /> Enabled
          </span>
        ) : permission === 'denied' ? (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 text-xs font-bold">
            <AlertTriangle size={12} /> Blocked
          </span>
        ) : (
          <button
            onClick={handleEnable}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-500/15 text-violet-300 hover:bg-violet-500/25 text-xs font-bold transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Smartphone size={14} />}
            {loading ? 'Enabling...' : 'Enable'}
          </button>
        )}
      </div>

      {/* Success message */}
      {justEnabled && permission === 'granted' && (
        <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/15 p-3 mb-3">
          <p className="text-xs text-emerald-400 font-semibold">
            ✅ Push notifications enabled! You'll receive alerts for new jobs, application updates, and subscription reminders.
          </p>
        </div>
      )}

      {/* Denied instructions */}
      {permission === 'denied' && (
        <div className="rounded-xl bg-amber-500/5 border border-amber-500/15 p-3 mb-3">
          <p className="text-xs text-amber-400 font-semibold mb-1">
            Notifications are blocked by your browser.
          </p>
          <p className="text-[11px] text-gray-400">
            To enable: Click the 🔒 lock icon in the address bar → Site settings → Allow notifications → Refresh this page.
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-rose-500/5 border border-rose-500/15 p-3 mb-3">
          <p className="text-xs text-rose-400">{error}</p>
        </div>
      )}

      {/* What you'll receive */}
      <div className="space-y-2 mt-3">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">You&apos;ll receive alerts for:</p>
        {[
          'New job postings matching your preferences',
          'Application status updates',
          'Subscription expiry reminders',
          'New leads & inquiries (Business)',
        ].map((item) => (
          <div key={item} className="flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-violet-400" />
            <span className="text-xs text-gray-400">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
