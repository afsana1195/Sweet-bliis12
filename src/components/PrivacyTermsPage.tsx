import React, { useState } from 'react';
import { BUSINESS_CONFIG } from '../data/bakeryData';

export type PolicyTab = 'privacy' | 'terms' | 'delivery' | 'cancellation' | 'fssai';

export const PrivacyTermsPage: React.FC<{ initialTab?: PolicyTab }> = ({
  initialTab = 'privacy',
}) => {
  const [activeTab, setActiveTab] = useState<PolicyTab>(initialTab);

  return (
    <div className="bg-[#FFF9F9] min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'privacy'
                ? 'bg-[#881337] text-white shadow-xs'
                : 'bg-white text-stone-700 hover:bg-rose-50 border border-stone-200'
            }`}
          >
            Privacy Policy
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'terms'
                ? 'bg-[#881337] text-white shadow-xs'
                : 'bg-white text-stone-700 hover:bg-rose-50 border border-stone-200'
            }`}
          >
            Terms & Conditions
          </button>
          <button
            onClick={() => setActiveTab('delivery')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'delivery'
                ? 'bg-[#881337] text-white shadow-xs'
                : 'bg-white text-stone-700 hover:bg-rose-50 border border-stone-200'
            }`}
          >
            Delivery Policy
          </button>
          <button
            onClick={() => setActiveTab('cancellation')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'cancellation'
                ? 'bg-[#881337] text-white shadow-xs'
                : 'bg-white text-stone-700 hover:bg-rose-50 border border-stone-200'
            }`}
          >
            Cancellation & Refunds
          </button>
          <button
            onClick={() => setActiveTab('fssai')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'fssai'
                ? 'bg-[#881337] text-white shadow-xs'
                : 'bg-white text-stone-700 hover:bg-rose-50 border border-stone-200'
            }`}
          >
            FSSAI & Regulatory
          </button>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-rose-100 shadow-sm text-stone-700 text-xs sm:text-sm leading-relaxed space-y-6">
          {activeTab === 'privacy' && (
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
                  For any questions regarding your data or to request deletion of your order records, please email {BUSINESS_CONFIG.email}.
                </p>
              </section>
            </>
          )}

          {activeTab === 'terms' && (
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
                  Custom tiered orders require advance notice for structural floral arrangements and intricate hand-sculpting. Orders placed via the custom inquiry form or WhatsApp are confirmed once reviewed by the pastry kitchen.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="font-serif text-base font-bold text-stone-900">4. Acceptance of Terms</h2>
                <p>
                  By completing an order or inquiry on the Sweet Bliss platform, you agree to these Terms and confirm the accuracy of your delivery information.
                </p>
              </section>
            </>
          )}

          {activeTab === 'delivery' && (
            <>
              <div>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#881337] mb-2">
                  Delivery & Logistics Policy
                </h1>
                <p className="text-stone-400 text-xs">Last updated: October 2026</p>
              </div>

              <section className="space-y-2">
                <h2 className="font-serif text-base font-bold text-stone-900">1. Serviced Locations & Pincodes</h2>
                <p>
                  We currently hand-deliver to Bangalore pin codes: {BUSINESS_CONFIG.deliveryPincodes.join(', ')}. If your pincode is outside this coverage, please contact our kitchen prior to placing your order.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="font-serif text-base font-bold text-stone-900">2. Temperature-Controlled Handling</h2>
                <p>
                  All cakes and desserts are packed inside food-grade insulated boxes with dry gel coolers to preserve mousse stability and buttercream rosettes during transport.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="font-serif text-base font-bold text-stone-900">3. Recipient Unavailability</h2>
                <p>
                  Because fresh pastry products are perishable, if the recipient is unreachable after multiple attempts, the driver will hold the cake at the nearest pickup location or return it to the bakery kitchen. Re-dispatch charges may apply.
                </p>
              </section>
            </>
          )}

          {activeTab === 'cancellation' && (
            <>
              <div>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#881337] mb-2">
                  Cancellation & Refund Policy
                </h1>
                <p className="text-stone-400 text-xs">Last updated: October 2026</p>
              </div>

              <section className="space-y-2">
                <h2 className="font-serif text-base font-bold text-stone-900">1. Standard Order Cancellations</h2>
                <p>
                  Standard catalogue cakes can be cancelled up to 6 hours before the start of the scheduled delivery slot for a 100% refund.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="font-serif text-base font-bold text-stone-900">2. Custom & Bespoke Orders</h2>
                <p>
                  Custom tiered cakes, bespoke sculpts, and photo cakes require specialty ingredients and custom toppers; cancellations must be requested at least 24 hours prior to dispatch.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="font-serif text-base font-bold text-stone-900">3. Quality & Damage Guarantee</h2>
                <p>
                  If an order arrives damaged during transit or fails our quality standard, please notify us within 2 hours of receipt with a photo on WhatsApp (+91 {BUSINESS_CONFIG.phone}) or email ({BUSINESS_CONFIG.email}). We provide immediate replacement or a full refund processed back to the original payment method within 3–5 business days.
                </p>
              </section>
            </>
          )}

          {activeTab === 'fssai' && (
            <>
              <div>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#881337] mb-2">
                  Food Safety (FSSAI) & Legal Compliance Disclosure
                </h1>
                <p className="text-stone-400 text-xs">Statutory Business Disclosures</p>
              </div>

              <section className="space-y-2 p-4 bg-amber-50/70 border border-amber-200 rounded-2xl text-amber-900">
                <h2 className="font-serif text-base font-bold">Important Notice for Business Operations</h2>
                <p>
                  Sweet Bliss operates as an artisan cloud bakery and patisserie. In accordance with Food Safety and Standards Authority of India (FSSAI) guidelines, all commercial food operations must display their verified 14-digit FSSAI Registration or State/Central License number.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="font-serif text-base font-bold text-stone-900">1. Current Regulatory Status</h2>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>FSSAI Registration/License:</strong> <span className="font-mono text-[#881337]">{BUSINESS_CONFIG.fssaiLicence}</span></li>
                  <li><strong>GSTIN:</strong> <span className="font-mono text-stone-700">{BUSINESS_CONFIG.gstin}</span></li>
                  <li><strong>Registered Commercial Entity:</strong> {BUSINESS_CONFIG.name}</li>
                  <li><strong>Kitchen Operating Address:</strong> {BUSINESS_CONFIG.address}</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h2 className="font-serif text-base font-bold text-stone-900">2. Food Safety & Hygiene Standards</h2>
                <p>
                  Our kitchen follows standard Good Hygiene Practices (GHP) and Good Manufacturing Practices (GMP): daily temperature monitoring for cold storage, allergen segregation for eggless and nut-free preparations, and sterilized baking equipment.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="font-serif text-base font-bold text-stone-900">3. Grievance & Compliance Officer</h2>
                <p>
                  For food safety inquiries, compliance documentation, or ingredient verification, contact our kitchen manager at <a href={`mailto:${BUSINESS_CONFIG.email}`} className="text-[#881337] underline">{BUSINESS_CONFIG.email}</a> or phone +91 {BUSINESS_CONFIG.phone}.
                </p>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
