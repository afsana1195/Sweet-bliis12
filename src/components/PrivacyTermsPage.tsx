import React, { useState } from 'react';

export const PrivacyTermsPage: React.FC<{ initialTab?: 'privacy' | 'terms' }> = ({
  initialTab = 'privacy',
}) => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>(initialTab);

  return (
    <div className="bg-[#FFF9F9] min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Tab Switcher */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'privacy'
                ? 'bg-[#881337] text-white shadow-xs'
                : 'bg-white text-stone-700 hover:bg-rose-50 border border-stone-200'
            }`}
          >
            Privacy Policy
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'terms'
                ? 'bg-[#881337] text-white shadow-xs'
                : 'bg-white text-stone-700 hover:bg-rose-50 border border-stone-200'
            }`}
          >
            Terms & Conditions
          </button>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-rose-100 shadow-sm text-stone-700 text-xs sm:text-sm leading-relaxed space-y-6">
          {activeTab === 'privacy' ? (
            <>
              <div>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#881337] mb-2">
                  Sweet Bliss Privacy Policy
                </h1>
                <p className="text-stone-400 text-xs">Last updated: October 2026</p>
              </div>

              <section className="space-y-2">
                <h2 className="font-serif text-base font-bold text-stone-900">1. Information We Collect</h2>
                <p>
                  At Sweet Bliss, we collect customer names, phone numbers, email addresses, and delivery addresses solely to facilitate fresh cake preparation, logistics dispatch, and delivery updates. We do not sell or monetize personal customer details.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="font-serif text-base font-bold text-stone-900">2. AI Assistant & Untrusted Input</h2>
                <p>
                  Conversations with Chef Bliss (our AI assistant) are processed server-side through Google Gemini to help you choose cake flavours, sizes, and design concepts. No sensitive payment information or credentials are ever provided to or processed by the AI model.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="font-serif text-base font-bold text-stone-900">3. Payment Security</h2>
                <p>
                  Payment processing is handled through PCI-DSS compliant payment gateways (UPI, Cards, and Net Banking). Sweet Bliss never stores raw credit or debit card numbers on our servers.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="font-serif text-base font-bold text-stone-900">4. Contacting Data Protection</h2>
                <p>
                  For any questions regarding your data or to request deletion of your order records, please email orders@sweetblissbakery.com.
                </p>
              </section>
            </>
          ) : (
            <>
              <div>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#881337] mb-2">
                  Sweet Bliss Terms & Conditions
                </h1>
                <p className="text-stone-400 text-xs">Last updated: October 2026</p>
              </div>

              <section className="space-y-2">
                <h2 className="font-serif text-base font-bold text-stone-900">1. Cake Freshness & Shelf Life</h2>
                <p>
                  All Sweet Bliss cakes and pastries are baked fresh daily with perishable dairy cream and pure butter. They should be stored refrigerated at 4°C - 8°C and consumed within 48 hours for optimal flavor.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="font-serif text-base font-bold text-stone-900">2. Delivery Slots & Perishable Logistics</h2>
                <p>
                  We offer scheduled delivery slots: Morning, Afternoon, Evening, and Midnight Special. Because custom celebration cakes are delicate, customers or their authorized representatives must be available at the designated delivery address to receive the cake.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="font-serif text-base font-bold text-stone-900">3. Custom Cake Order Confirmation</h2>
                <p>
                  Custom tiered orders require at least 24 hours advance notice for structural floral arrangements and intricate hand-sculpting. Orders placed via the custom inquiry form or WhatsApp are confirmed once reviewed by the pastry kitchen.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="font-serif text-base font-bold text-stone-900">4. Cancellations & Modifications</h2>
                <p>
                  Standard cake orders can be modified or cancelled up to 6 hours before the delivery slot. Custom tiered cakes can be cancelled up to 24 hours prior to dispatch.
                </p>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
