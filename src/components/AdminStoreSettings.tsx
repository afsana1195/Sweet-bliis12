import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2, AlertCircle, RefreshCw, Store, Phone, MapPin, Truck, QrCode } from 'lucide-react';

interface StoreSettings {
  storeName: string;
  ownerName: string;
  phone: string;
  whatsappNumber: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  deliveryPincodes: string[];
  freeDeliveryThreshold: number;
  isOpen: boolean;
  closureNotice?: string;
  upiId?: string;
}

interface AdminStoreSettingsProps {
  adminKey: string;
}

export const AdminStoreSettings: React.FC<AdminStoreSettingsProps> = ({ adminKey }) => {
  const [settings, setSettings] = useState<StoreSettings>({
    storeName: 'Sweet Bliss by Jyoti Tanti',
    ownerName: 'Jyoti Tanti',
    phone: '6297201943',
    whatsappNumber: '916297201943',
    email: 'ansariwazid1995@gmail.com',
    address: 'Sweet Bliss Patisserie by Jyoti Tanti, Main Road, Chandapura, Bangalore, Karnataka - 562162',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '562162',
    deliveryPincodes: ['562162', '560100', '560099', '560068', '560076', '560105', '560034', '562106', '560066', '560037'],
    freeDeliveryThreshold: 0,
    isOpen: true,
    closureNotice: '',
    upiId: '6297201943@upi',
  });

  const [pincodesInput, setPincodesInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/admin/settings', {
        headers: {
          'x-admin-key': adminKey,
        },
      });
      if (!res.ok) throw new Error('Failed to load store settings');
      const data = await res.json();
      if (data.settings) {
        setSettings(data.settings);
        setPincodesInput(
          Array.isArray(data.settings.deliveryPincodes)
            ? data.settings.deliveryPincodes.join(', ')
            : '562162, 560100, 560099, 560068'
        );
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error loading store settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [adminKey]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    const parsedPincodes = pincodesInput
      .split(',')
      .map((p) => p.trim())
      .filter((p) => /^\d{6}$/.test(p));

    const payload: StoreSettings = {
      ...settings,
      deliveryPincodes: parsedPincodes.length > 0 ? parsedPincodes : settings.deliveryPincodes,
      freeDeliveryThreshold: Number(settings.freeDeliveryThreshold) || 0,
    };

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to save settings');
      setSuccessMsg('Store settings and Bangalore operational parameters saved successfully! ✨');
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-100 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-rose-100">
          <div>
            <h2 className="font-serif text-2xl font-bold text-[#881337] flex items-center gap-2">
              <Settings className="w-6 h-6 text-rose-600" />
              <span>Bakery Business Configuration</span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Configure owner details, WhatsApp contact, delivery radius, and store status for Jyoti Tanti's bakery.
            </p>
          </div>

          <button
            onClick={fetchSettings}
            className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Reload</span>
          </button>
        </div>

        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="font-bold cursor-pointer">×</button>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6 text-xs text-stone-700">
          {/* Section 1: Store & Owner Identity */}
          <div className="space-y-4">
            <h3 className="font-serif text-sm font-bold text-[#881337] uppercase tracking-wider flex items-center gap-2">
              <Store className="w-4 h-4 text-rose-600" />
              <span>Owner & Bakery Branding</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  Bakery Brand Name *
                </label>
                <input
                  type="text"
                  required
                  value={settings.storeName}
                  onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400 bg-stone-50 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  Master Baker / Client Name *
                </label>
                <input
                  type="text"
                  required
                  value={settings.ownerName}
                  onChange={(e) => setSettings({ ...settings, ownerName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400 bg-stone-50 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Contact & Instant WhatsApp */}
          <div className="space-y-4 pt-4 border-t border-rose-100">
            <h3 className="font-serif text-sm font-bold text-[#881337] uppercase tracking-wider flex items-center gap-2">
              <Phone className="w-4 h-4 text-rose-600" />
              <span>Phone & Instant WhatsApp Notification</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  Phone Number (Calling) *
                </label>
                <input
                  type="tel"
                  required
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400 bg-stone-50 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  WhatsApp Number (with Country Code 91) *
                </label>
                <input
                  type="text"
                  required
                  value={settings.whatsappNumber}
                  onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400 bg-stone-50 font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-stone-800 mb-1">
                  Bakery Notification Email
                </label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400 bg-stone-50"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Location & Pincodes */}
          <div className="space-y-4 pt-4 border-t border-rose-100">
            <h3 className="font-serif text-sm font-bold text-[#881337] uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-rose-600" />
              <span>Bakery Kitchen Address & Delivery Pincodes</span>
            </h3>

            <div>
              <label className="block font-bold text-stone-800 mb-1">
                Full Physical Address *
              </label>
              <input
                type="text"
                required
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400 bg-stone-50"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  required
                  value={settings.city}
                  onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400 bg-stone-50"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  State *
                </label>
                <input
                  type="text"
                  required
                  value={settings.state}
                  onChange={(e) => setSettings({ ...settings, state: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400 bg-stone-50"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  Primary Pincode *
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={settings.pincode}
                  onChange={(e) => setSettings({ ...settings, pincode: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400 bg-stone-50 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-stone-800 mb-1">
                Serviceable Delivery Pincodes (comma-separated 6-digit codes)
              </label>
              <textarea
                rows={2}
                value={pincodesInput}
                onChange={(e) => setPincodesInput(e.target.value)}
                placeholder="562162, 560100, 560099, 560068, 560076, 560105"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400 bg-stone-50 font-mono text-xs"
              />
              <span className="text-[11px] text-stone-500 mt-1 block">
                Customers entering these Bangalore pincodes will be validated for delivery.
              </span>
            </div>
          </div>

          {/* Section 4: Delivery Fees & Payment UPI */}
          <div className="space-y-4 pt-4 border-t border-rose-100">
            <h3 className="font-serif text-sm font-bold text-[#881337] uppercase tracking-wider flex items-center gap-2">
              <Truck className="w-4 h-4 text-rose-600" />
              <span>Delivery Pricing & Direct UPI Payment</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  Free Delivery Threshold (₹) *
                </label>
                <input
                  type="number"
                  required
                  value={settings.freeDeliveryThreshold}
                  onChange={(e) => setSettings({ ...settings, freeDeliveryThreshold: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400 bg-stone-50 font-mono"
                />
                <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
                  Set to 0 for 100% Free Delivery on all celebration orders!
                </span>
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  Direct Bakery UPI ID (for QR Code & GPay/PhonePe)
                </label>
                <input
                  type="text"
                  value={settings.upiId || ''}
                  onChange={(e) => setSettings({ ...settings, upiId: e.target.value })}
                  placeholder="6297201943@upi"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400 bg-stone-50 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Store Open/Closed Toggle */}
          <div className="space-y-4 pt-4 border-t border-rose-100">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-rose-50/60 border border-rose-100">
              <div>
                <strong className="block font-bold text-stone-900">
                  Store Order Acceptance Status
                </strong>
                <span className="text-xs text-stone-600">
                  {settings.isOpen ? '🟢 Open — Kitchen accepting online orders.' : '🔴 Closed — Temporarily pausing incoming orders.'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSettings({ ...settings, isOpen: !settings.isOpen })}
                className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                  settings.isOpen
                    ? 'bg-[#065f46] text-white hover:bg-emerald-700'
                    : 'bg-rose-700 text-white hover:bg-rose-800'
                }`}
              >
                {settings.isOpen ? 'Switch to Closed' : 'Open Store'}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-[#881337] hover:bg-[#9F1239] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all hover:scale-[1.01]"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Changes...' : 'Save Bakery Configuration'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
