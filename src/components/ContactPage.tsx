import React, { useState } from 'react';
import { Phone, Mail, MapPin, Clock, MessageCircle, Send, CheckCircle2 } from 'lucide-react';
import { BUSINESS_CONFIG } from '../data/bakeryData.ts';
import { getWhatsAppInquiryUrl } from '../utils/whatsapp.ts';

export const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    subject: 'Cake Inquiry',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="bg-[#FFF9F9] min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#9F1239]">
            We'd Love to Hear From You
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#881337]">
            Contact Sweet Bliss
          </h1>
          <p className="text-xs sm:text-sm text-stone-600">
            Have a question regarding custom orders, dietary specifications, or same-day delivery slots? Reach out to our bakery team.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Store Info Cards (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-rose-100 shadow-2xs space-y-6">
              <h3 className="font-serif text-lg font-bold text-[#881337] border-b border-rose-100 pb-3">
                Flagship Patisserie
              </h3>

              <div className="space-y-4 text-xs sm:text-sm text-stone-700">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#881337] shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-stone-900 font-semibold">Store Address</strong>
                    <span>{BUSINESS_CONFIG.address}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-[#881337] shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-stone-900 font-semibold">Baking & Pickup Hours</strong>
                    <span>{BUSINESS_CONFIG.bakingHours}</span>
                    <span className="text-emerald-700 font-semibold block text-xs mt-0.5">Open 7 days a week</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-[#881337] shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-stone-900 font-semibold">Customer Helpline</strong>
                    <span>{BUSINESS_CONFIG.phone}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-[#881337] shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-stone-900 font-semibold">Email Orders</strong>
                    <span>{BUSINESS_CONFIG.email}</span>
                  </div>
                </div>
              </div>

              {/* Direct WhatsApp Action */}
              <div className="pt-2">
                <a
                  href={getWhatsAppInquiryUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-stone-900 font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Instant WhatsApp Chat</span>
                </a>
              </div>
            </div>

            {/* Same-day Pincodes Card */}
            <div className="bg-rose-50/70 rounded-3xl p-6 border border-rose-100 text-xs text-stone-700 space-y-2">
              <strong className="text-stone-900 font-bold block">Active Express Delivery Pincodes:</strong>
              <p className="text-stone-500 text-[11px] leading-relaxed">
                {BUSINESS_CONFIG.deliveryPincodes.join(', ')} and surrounding Hyderabad metropolitan zones.
              </p>
            </div>
          </div>

          {/* Contact Message Form (7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-rose-100 shadow-2xs">
            {submitted ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="font-serif text-2xl font-bold text-stone-900">Message Received!</h3>
                <p className="text-xs sm:text-sm text-stone-600 max-w-sm mx-auto">
                  Thank you for reaching out. Our customer concierge will respond within 2 hours.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="px-6 py-2 rounded-full bg-[#881337] text-white text-xs font-semibold cursor-pointer"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="font-serif text-lg font-bold text-[#881337] border-b border-rose-100 pb-3">
                  Send a Message to the Kitchen
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Your Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Ananya Rao"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g. 9876543210"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. ananya@example.com"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Subject</label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400 bg-white"
                    >
                      <option value="Cake Inquiry">Celebration Cake Inquiry</option>
                      <option value="Custom Design">Wedding / Grand Event Tier</option>
                      <option value="Order Tracking">Existing Order Tracking</option>
                      <option value="Corporate Hampers">Corporate Bulk Gift Hampers</option>
                      <option value="Dietary Question">Allergen & Eggless Question</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Your Message *</label>
                  <textarea
                    rows={4}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Tell us about your celebration date, guest count, or flavour questions..."
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-[#881337] hover:bg-[#9F1239] text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Message to Sweet Bliss</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
