import React, { useState } from 'react';
import { Sparkles, Upload, Calendar, Clock, Heart, CheckCircle2, MessageCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { getCustomCakeWhatsAppUrl } from '../utils/whatsapp.ts';
import { BUSINESS_CONFIG } from '../data/bakeryData.ts';

export const CustomCakeOrderPage: React.FC = () => {
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    email: '',
    occasion: 'Birthday',
    flavour: 'Rich Belgian Chocolate Ganache',
    guestCount: 15,
    themeDescription: '',
    colorPalette: 'Blush Pink, Ivory & Gold',
    dietary: '100% Eggless',
    deliveryDate: '',
    deliverySlot: 'evening',
    messageOnCake: '',
    budget: '₹2,000 - ₹3,000',
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiRefining, setIsAiRefining] = useState(false);
  const [aiBrief, setAiBrief] = useState<any | null>(null);
  const [submittedOrder, setSubmittedOrder] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Calculate recommended weight based on guest count
  const guestNum = Number(formData.guestCount);
  const recommendedWeightKg =
    guestNum <= 6 ? 0.5 :
    guestNum <= 12 ? 1.0 :
    guestNum <= 20 ? 1.5 :
    guestNum <= 30 ? 2.5 : 3.5;

  const estimatedBasePrice = Math.round(recommendedWeightKg * 1250);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('Image size should be under 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setErrorMsg('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAiRefine = async () => {
    setIsAiRefining(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/ai/cake-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          occasion: formData.occasion,
          flavour: formData.flavour,
          guestCount: formData.guestCount,
          themeDescription: formData.themeDescription || 'Pastel elegant celebration cake',
          dietary: formData.dietary,
        }),
      });
      const data = await res.json();
      if (data.brief) {
        setAiBrief(data.brief);
        if (data.brief.colorPalette && !formData.themeDescription) {
          setFormData((prev) => ({
            ...prev,
            colorPalette: data.brief.colorPalette,
            themeDescription: data.brief.designNotes,
          }));
        }
      }
    } catch (err) {
      console.error('Error generating AI cake brief:', err);
      setErrorMsg('AI Chef brief preview generated from catalogue guidelines.');
    } finally {
      setIsAiRefining(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.customerName.trim() || !formData.phone.trim() || !formData.deliveryDate) {
      setErrorMsg('Please enter your Name, Phone Number, and Required Delivery Date.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/custom-cakes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          weightKg: recommendedWeightKg,
          hasImage: Boolean(imagePreview),
        }),
      });
      const data = await res.json();
      if (data.success && data.customOrder) {
        setSubmittedOrder(data.customOrder);
      } else {
        setErrorMsg(data.error || 'Failed to submit custom cake order');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Network error. You can also send this brief directly via WhatsApp!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#FFF9F9] min-h-screen py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Banner */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#9F1239] bg-rose-100/70 px-3 py-1 rounded-full mb-3">
            <Sparkles className="w-3.5 h-3.5 text-rose-600" />
            <span>Bespoke Confectionery Studio</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#881337] tracking-tight">
            Design Your Dream Cake
          </h1>
          <p className="text-sm sm:text-base text-stone-600 mt-2 leading-relaxed">
            From whimsical birthday cascades to lavish floral wedding tiers, our master pastry artists bring your imagination to life.
          </p>
        </div>

        {submittedOrder ? (
          /* Confirmation State */
          <div className="max-w-xl mx-auto bg-white rounded-3xl p-8 sm:p-10 border border-rose-200 shadow-xl text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h2 className="font-serif text-2xl font-bold text-stone-900">
                Custom Cake Request Received!
              </h2>
              <p className="text-xs font-semibold text-[#9F1239] mt-1">
                Reference ID: {submittedOrder.id}
              </p>
              <p className="text-xs sm:text-sm text-stone-600 mt-2">
                Thank you, <strong>{submittedOrder.customerName}</strong>! Our Head Cake Designer will review your {submittedOrder.occasion} design and call you within 2 business hours at <strong>{submittedOrder.phone}</strong> to finalize textures, flavours, and delivery.
              </p>
            </div>

            <div className="bg-rose-50/70 rounded-2xl p-4 text-left text-xs text-stone-700 space-y-1.5 border border-rose-100">
              <div><strong>Estimated Size:</strong> ~{submittedOrder.weightKg} kg (Serves {submittedOrder.guestCount} guests)</div>
              <div><strong>Flavour:</strong> {submittedOrder.flavour}</div>
              <div><strong>Target Delivery:</strong> {submittedOrder.deliveryDate} ({formData.deliverySlot})</div>
              <div><strong>Estimated Quote:</strong> ~₹{submittedOrder.estimatedPrice}</div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={getCustomCakeWhatsAppUrl({
                  customerName: formData.customerName,
                  occasion: formData.occasion,
                  guestCount: formData.guestCount,
                  weightKg: recommendedWeightKg,
                  flavour: formData.flavour,
                  themeDescription: formData.themeDescription || 'Custom design',
                  colorPalette: formData.colorPalette,
                  deliveryDate: formData.deliveryDate,
                  messageOnCake: formData.messageOnCake,
                  estimatedPrice: estimatedBasePrice,
                })}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 px-6 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-stone-900 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat Directly on WhatsApp</span>
              </a>

              <button
                onClick={() => setSubmittedOrder(null)}
                className="py-3 px-6 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs sm:text-sm cursor-pointer"
              >
                Submit Another Inquiry
              </button>
            </div>
          </div>
        ) : (
          /* Custom Form & Live Summary */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left 7 Columns: Interactive Form */}
            <form onSubmit={handleSubmit} className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-rose-100 shadow-sm space-y-6">
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Step 1: Customer Contact Info */}
              <div className="space-y-4">
                <h3 className="font-serif text-lg font-bold text-[#881337] border-b border-rose-100 pb-2">
                  1. Contact Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      placeholder="e.g. Priya Sharma"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Phone Number (WhatsApp) *</label>
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
              </div>

              {/* Step 2: Occasion & Guest Count */}
              <div className="space-y-4">
                <h3 className="font-serif text-lg font-bold text-[#881337] border-b border-rose-100 pb-2">
                  2. Occasion & Servings
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Celebration Occasion</label>
                    <select
                      value={formData.occasion}
                      onChange={(e) => setFormData({ ...formData, occasion: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400 bg-white"
                    >
                      <option value="Birthday">Birthday Milestone</option>
                      <option value="Anniversary">Wedding Anniversary</option>
                      <option value="Wedding">Wedding Reception / Engagement</option>
                      <option value="Baby Shower">Baby Shower / Gender Reveal</option>
                      <option value="Kids Celebration">Kids Themed Party</option>
                      <option value="Corporate Event">Corporate Event / Launch</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-semibold text-stone-700">Number of Guests</label>
                      <span className="text-xs font-bold text-[#881337]">{formData.guestCount} guests (~{recommendedWeightKg} kg)</span>
                    </div>
                    <input
                      type="range"
                      min={4}
                      max={50}
                      step={2}
                      value={formData.guestCount}
                      onChange={(e) => setFormData({ ...formData, guestCount: Number(e.target.value) })}
                      className="w-full accent-[#881337] cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-stone-400 mt-0.5">
                      <span>4 (Intimate)</span>
                      <span>20 (Party)</span>
                      <span>50+ (Grand)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Flavours & Dietary Requirements */}
              <div className="space-y-4">
                <h3 className="font-serif text-lg font-bold text-[#881337] border-b border-rose-100 pb-2">
                  3. Flavour & Dietary Preference
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Preferred Flavour Profile</label>
                    <select
                      value={formData.flavour}
                      onChange={(e) => setFormData({ ...formData, flavour: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400 bg-white"
                    >
                      <option value="Belgian Dark Truffle & Berry">Belgian Dark Truffle & Berry</option>
                      <option value="Classic Red Velvet Cream Cheese">Classic Red Velvet Cream Cheese</option>
                      <option value="Exotic Fresh Fruit Vanilla">Exotic Fresh Fruit Vanilla</option>
                      <option value="Butterscotch Cashew Praline">Butterscotch Cashew Praline</option>
                      <option value="Blueberry New York Cheesecake">Blueberry New York Cheesecake</option>
                      <option value="Rose Water & Pistachio Gateau">Rose Water & Pistachio Gateau</option>
                      <option value="Lotus Biscoff Crunch">Lotus Biscoff Crunch</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Dietary Requirement</label>
                    <select
                      value={formData.dietary}
                      onChange={(e) => setFormData({ ...formData, dietary: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400 bg-white"
                    >
                      <option value="100% Eggless (Pure Veg)">100% Eggless (Pure Veg)</option>
                      <option value="Contains Egg">Contains Egg</option>
                      <option value="Vegan (Dairy-Free)">Vegan (Dairy-Free)</option>
                      <option value="Gluten-Friendly">Gluten-Friendly</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Step 4: Design Theme & Color Palette */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-rose-100 pb-2">
                  <h3 className="font-serif text-lg font-bold text-[#881337]">
                    4. Theme & Design Vision
                  </h3>
                  <button
                    type="button"
                    onClick={handleAiRefine}
                    disabled={isAiRefining}
                    className="text-xs font-semibold text-[#881337] hover:text-[#9F1239] flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-rose-600" />
                    <span>{isAiRefining ? 'Consulting Chef...' : 'AI Chef Polish'}</span>
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Describe Your Theme, Figurines, or Textures
                  </label>
                  <textarea
                    rows={3}
                    value={formData.themeDescription}
                    onChange={(e) => setFormData({ ...formData, themeDescription: e.target.value })}
                    placeholder="e.g. Elegant 2-tier pastel pink cake with fresh blush garden roses, macarons, edible gold foil accents, and soft watercolor buttercream texture..."
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Color Palette</label>
                    <input
                      type="text"
                      value={formData.colorPalette}
                      onChange={(e) => setFormData({ ...formData, colorPalette: e.target.value })}
                      placeholder="e.g. Blush Pink, Ivory, Gold"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Message on Cake Topper / Plaque</label>
                    <input
                      type="text"
                      value={formData.messageOnCake}
                      onChange={(e) => setFormData({ ...formData, messageOnCake: e.target.value })}
                      placeholder="e.g. Happy 1st Birthday Ayaan!"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400"
                    />
                  </div>
                </div>

                {/* Reference Photo Upload */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Optional Reference Photo (Pinterest / Sketch)
                  </label>
                  <div className="border-2 border-dashed border-rose-200 hover:border-rose-300 rounded-2xl p-4 text-center cursor-pointer transition-colors relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    {imagePreview ? (
                      <div className="flex items-center justify-center gap-4">
                        <img src={imagePreview} alt="Reference Preview" className="w-16 h-16 rounded-xl object-cover shadow-xs border border-rose-100" />
                        <span className="text-xs text-emerald-700 font-semibold">Reference Image Attached ✓</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Upload className="w-6 h-6 text-rose-400 mx-auto" />
                        <p className="text-xs text-stone-600">Click to upload reference image (PNG, JPG up to 5MB)</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 5: Delivery Date & Slot */}
              <div className="space-y-4">
                <h3 className="font-serif text-lg font-bold text-[#881337] border-b border-rose-100 pb-2">
                  5. Delivery Schedule
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Required Delivery Date *</label>
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={formData.deliveryDate}
                      onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Preferred Time Slot</label>
                    <select
                      value={formData.deliverySlot}
                      onChange={(e) => setFormData({ ...formData, deliverySlot: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400 bg-white"
                    >
                      {BUSINESS_CONFIG.slots.map((s) => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 rounded-2xl bg-[#881337] hover:bg-[#9F1239] text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>Submitting to Pastry Team...</span>
                  ) : (
                    <>
                      <span>Submit Custom Cake Inquiry</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Right 5 Columns: Live Summary & AI Brief Card */}
            <div className="lg:col-span-5 space-y-6">
              {/* Live Estimate Card */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-rose-100 shadow-sm sticky top-28 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-rose-100">
                  <h3 className="font-serif text-lg font-bold text-[#881337]">
                    Live Custom Cake Estimate
                  </h3>
                  <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full">
                    Artisan Quote
                  </span>
                </div>

                {/* Visual Preview Placeholder */}
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-rose-50 border border-rose-100">
                  <img
                    src={imagePreview || '/src/assets/images/custom_cake_artisan_1791733249561.jpg'}
                    alt="Cake Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-4 text-white">
                    <div>
                      <p className="text-xs font-bold leading-tight">{formData.occasion} Bespoke Cake</p>
                      <p className="text-[10px] text-rose-200">~{recommendedWeightKg} kg • {recommendedWeightKg >= 2.5 ? '2 Tiers' : 'Single Tier'}</p>
                    </div>
                  </div>
                </div>

                {/* Summary Table */}
                <div className="space-y-2 text-xs text-stone-600 divide-y divide-rose-50">
                  <div className="flex justify-between pt-1">
                    <span>Occasion:</span>
                    <strong className="text-stone-800">{formData.occasion}</strong>
                  </div>
                  <div className="flex justify-between pt-1.5">
                    <span>Guest Count:</span>
                    <strong className="text-stone-800">{formData.guestCount} People</strong>
                  </div>
                  <div className="flex justify-between pt-1.5">
                    <span>Recommended Size:</span>
                    <strong className="text-stone-800">~{recommendedWeightKg} kg</strong>
                  </div>
                  <div className="flex justify-between pt-1.5">
                    <span>Flavour Profile:</span>
                    <strong className="text-stone-800 text-right truncate max-w-[180px]">{formData.flavour}</strong>
                  </div>
                  <div className="flex justify-between pt-1.5">
                    <span>Dietary:</span>
                    <strong className="text-emerald-700">{formData.dietary}</strong>
                  </div>
                  <div className="flex justify-between pt-1.5">
                    <span>Palette:</span>
                    <strong className="text-stone-800">{formData.colorPalette}</strong>
                  </div>
                </div>

                {/* Estimated Price Range */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-100 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-stone-500 uppercase tracking-wider font-semibold block">
                      Estimated Pricing
                    </span>
                    <span className="text-2xl font-bold text-[#881337] tabular-nums">
                      ~₹{estimatedBasePrice}
                    </span>
                  </div>
                  <span className="text-[10px] text-stone-500 text-right max-w-[110px] leading-tight">
                    Final price based on fondant complexity
                  </span>
                </div>

                {/* AI Brief Box if Generated */}
                {aiBrief && (
                  <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100 space-y-2 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-purple-900">
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      <span>AI Pastry Chef Brief:</span>
                    </div>
                    <p className="text-purple-950 font-medium">{aiBrief.title}</p>
                    <p className="text-stone-600 text-[11px] leading-relaxed">{aiBrief.designNotes}</p>
                  </div>
                )}

                {/* Instant WhatsApp Inquiry Option */}
                <a
                  href={getCustomCakeWhatsAppUrl({
                    customerName: formData.customerName || 'Celebration Customer',
                    occasion: formData.occasion,
                    guestCount: formData.guestCount,
                    weightKg: recommendedWeightKg,
                    flavour: formData.flavour,
                    themeDescription: formData.themeDescription || 'Custom celebration cake',
                    colorPalette: formData.colorPalette,
                    deliveryDate: formData.deliveryDate || 'Flexible',
                    messageOnCake: formData.messageOnCake,
                    estimatedPrice: estimatedBasePrice,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl border border-emerald-500 text-emerald-800 hover:bg-emerald-50 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>Send this Brief via WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
