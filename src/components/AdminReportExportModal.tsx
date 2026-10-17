import React, { useState, useMemo } from 'react';
import {
  Download,
  FileSpreadsheet,
  Calendar,
  Filter,
  CheckCircle2,
  Copy,
  X,
  Sparkles,
  Cake,
  TrendingUp,
  Package,
  Layers,
  ChefHat,
  Receipt,
  Server,
} from 'lucide-react';
import { PlacedOrder } from '../types.ts';
import {
  CSVReportType,
  generateAccountingCSV,
  generateInventoryCSV,
  generateMasterCSV,
  downloadCSVFile,
  calculateReportSummary,
} from '../utils/csvExport.ts';

interface AdminReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: PlacedOrder[];
  currentStatusFilter: string;
  adminKey: string;
}

export const AdminReportExportModal: React.FC<AdminReportExportModalProps> = ({
  isOpen,
  onClose,
  orders,
  currentStatusFilter,
  adminKey,
}) => {
  const [reportType, setReportType] = useState<CSVReportType>('accounting');
  const [scope, setScope] = useState<'all' | 'filtered' | 'date'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7days' | '30days'>('all');
  const [copied, setCopied] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [apiDownloading, setApiDownloading] = useState(false);

  // Filter orders according to user selections
  const filteredOrders = useMemo(() => {
    let result = [...orders];

    if (scope === 'filtered' && currentStatusFilter !== 'all') {
      result = result.filter(
        (o) => o.status.toLowerCase() === currentStatusFilter.toLowerCase()
      );
    }

    if (scope === 'date' || dateFilter !== 'all') {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      if (dateFilter === 'today') {
        result = result.filter((o) => {
          const oDate = new Date(o.createdAt || Date.now()).toISOString().split('T')[0];
          return oDate === todayStr || o.deliveryDate === todayStr;
        });
      } else if (dateFilter === '7days') {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        result = result.filter((o) => new Date(o.createdAt || Date.now()) >= sevenDaysAgo);
      } else if (dateFilter === '30days') {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        result = result.filter((o) => new Date(o.createdAt || Date.now()) >= thirtyDaysAgo);
      }
    }

    return result;
  }, [orders, scope, currentStatusFilter, dateFilter]);

  // Generate preview CSV content
  const generatedCSV = useMemo(() => {
    switch (reportType) {
      case 'inventory':
        return generateInventoryCSV(filteredOrders);
      case 'master':
        return generateMasterCSV(filteredOrders);
      case 'accounting':
      default:
        return generateAccountingCSV(filteredOrders);
    }
  }, [reportType, filteredOrders]);

  // Preview parsing for first few lines
  const previewRows = useMemo(() => {
    if (!generatedCSV) return [];
    // remove BOM if present
    const cleanCSV = generatedCSV.replace(/^\uFEFF/, '');
    const lines = cleanCSV.split(/\r?\n/).filter(Boolean);
    return lines.slice(0, 4).map((line) => {
      // Basic CSV splitter respecting quotes
      const regex = /(?:^|,)(?:"([^"]*(?:""[^"]*)*)"|([^,]*))/g;
      const values: string[] = [];
      let match;
      while ((match = regex.exec(line)) !== null) {
        let val = match[1] !== undefined ? match[1].replace(/""/g, '"') : match[2];
        values.push(val);
      }
      return values;
    });
  }, [generatedCSV]);

  const summary = useMemo(() => calculateReportSummary(filteredOrders), [filteredOrders]);

  const handleDownload = () => {
    const today = new Date().toISOString().split('T')[0];
    const fileName = `sweetbliss_${reportType}_report_${today}.csv`;
    downloadCSVFile(generatedCSV, fileName);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handleCopyClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedCSV.replace(/^\uFEFF/, ''));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleServerApiDownload = async () => {
    setApiDownloading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(
        `/api/admin/orders/export-csv?type=${reportType}&status=${
          scope === 'filtered' ? currentStatusFilter : 'all'
        }`,
        {
          headers: {
            Authorization: `Bearer ${adminKey}`,
            'x-admin-key': adminKey,
          },
        }
      );
      if (!res.ok) {
        throw new Error('Server returned error during export');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sweetbliss_server_${reportType}_${today}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Server CSV download failed. Using browser export.');
      handleDownload();
    } finally {
      setApiDownloading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border border-rose-100 overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-rose-50/80 via-white to-amber-50/50 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#881337] text-white flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#881337]">
                  Order Reports & CSV Export
                </h3>
                <span className="bg-rose-100 text-[#881337] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Store Accounting & Kitchen Ops
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Download structured spreadsheets for GST books, sales audits, and kitchen baking batches.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-stone-800">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-rose-50/50 p-3.5 rounded-2xl border border-rose-100">
            <div>
              <span className="text-[11px] text-stone-500 block">Orders Selected</span>
              <span className="text-lg font-bold text-[#881337] tabular-nums">
                {summary.totalOrders} <span className="text-xs font-normal text-stone-500">orders</span>
              </span>
            </div>
            <div>
              <span className="text-[11px] text-stone-500 block">Total Revenue</span>
              <span className="text-lg font-bold text-emerald-700 tabular-nums">
                ₹{summary.totalRevenue.toLocaleString('en-IN')}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-stone-500 block">Total Cake Weight</span>
              <span className="text-lg font-bold text-amber-700 tabular-nums">
                {summary.totalWeightKg} <span className="text-xs font-normal text-stone-500">kg</span>
              </span>
            </div>
            <div>
              <span className="text-[11px] text-stone-500 block">Dietary Mix</span>
              <span className="text-xs font-semibold text-stone-700 block mt-1">
                <span className="text-emerald-700 font-bold">{summary.totalEgglessCakes} Eggless</span> •{' '}
                <span className="text-stone-600">{summary.totalRegularCakes} Regular</span>
              </span>
            </div>
          </div>

          {/* 1. Select Report Type Cards */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
              1. Choose Report Format
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Option A: Accounting */}
              <div
                onClick={() => setReportType('accounting')}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                  reportType === 'accounting'
                    ? 'border-[#881337] bg-rose-50/40 shadow-xs'
                    : 'border-stone-200 hover:border-rose-200 bg-white'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      reportType === 'accounting'
                        ? 'bg-[#881337] text-white'
                        : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    <Receipt className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-xs text-stone-900">
                    Accounting & Financials
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  1 row per order. Financial breakdown: Subtotal, Delivery Fees, Discounts, Net Value, UPI / Razorpay refs, and GST billing fields.
                </p>
                <div className="mt-2.5 pt-2 border-t border-rose-100/60 flex items-center gap-1.5 text-[10px] text-rose-800 font-semibold">
                  <span>Excel / Tally / Zoho Books Ready</span>
                </div>
              </div>

              {/* Option B: Kitchen & Inventory */}
              <div
                onClick={() => setReportType('inventory')}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                  reportType === 'inventory'
                    ? 'border-[#881337] bg-rose-50/40 shadow-xs'
                    : 'border-stone-200 hover:border-rose-200 bg-white'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      reportType === 'inventory'
                        ? 'bg-[#881337] text-white'
                        : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    <ChefHat className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-xs text-stone-900">
                    Kitchen & Inventory Plan
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  Item-level breakdown for head chefs. Lists cake flavours, weights (kg), eggless flags, written messages, and estimated raw ingredients.
                </p>
                <div className="mt-2.5 pt-2 border-t border-rose-100/60 flex items-center gap-1.5 text-[10px] text-amber-800 font-semibold">
                  <span>Batch Baking & Flour/Cream Forecast</span>
                </div>
              </div>

              {/* Option C: Master Audit */}
              <div
                onClick={() => setReportType('master')}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                  reportType === 'master'
                    ? 'border-[#881337] bg-rose-50/40 shadow-xs'
                    : 'border-stone-200 hover:border-rose-200 bg-white'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      reportType === 'master'
                        ? 'bg-[#881337] text-white'
                        : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-xs text-stone-900">
                    Master Complete Database
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  Complete 24-column dataset combining customer profiles, delivery addresses, timeline history, and order financials.
                </p>
                <div className="mt-2.5 pt-2 border-t border-rose-100/60 flex items-center gap-1.5 text-[10px] text-stone-600 font-semibold">
                  <span>Full Backup & Management Archive</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Filter Scope & Date Presets */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
                2. Order Scope
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setScope('all')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all border ${
                    scope === 'all'
                      ? 'bg-[#881337] text-white border-[#881337]'
                      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  All Orders ({orders.length})
                </button>
                <button
                  type="button"
                  onClick={() => setScope('filtered')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all border ${
                    scope === 'filtered'
                      ? 'bg-[#881337] text-white border-[#881337]'
                      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  Current Filter ({currentStatusFilter === 'all' ? 'All' : currentStatusFilter})
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
                3. Date Timeline
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'all', label: 'All Time' },
                  { id: 'today', label: 'Today Only' },
                  { id: '7days', label: 'Past 7 Days' },
                  { id: '30days', label: 'Past 30 Days' },
                ].map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => {
                      setDateFilter(d.id as any);
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all border ${
                      dateFilter === d.id
                        ? 'bg-stone-900 text-white border-stone-900'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Live CSV Data Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                Sample Spreadsheet Preview ({filteredOrders.length} records ready)
              </label>
              <span className="text-[11px] text-stone-400">
                UTF-8 Encoded • Includes ₹ Currency & Inscriptions
              </span>
            </div>

            <div className="border border-stone-200 rounded-2xl overflow-hidden bg-stone-50/50">
              <div className="overflow-x-auto max-h-48 text-[11px]">
                {previewRows.length === 0 ? (
                  <div className="p-6 text-center text-stone-400">
                    No orders matching selected criteria.
                  </div>
                ) : (
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-stone-200/70 text-stone-800 text-left font-semibold">
                        {previewRows[0]?.slice(0, 7).map((col, idx) => (
                          <th key={idx} className="p-2 border-b border-stone-300 whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                        {(previewRows[0]?.length || 0) > 7 && (
                          <th className="p-2 border-b border-stone-300 whitespace-nowrap text-stone-500">
                            +{(previewRows[0]?.length || 0) - 7} more columns
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200 bg-white">
                      {previewRows.slice(1).map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-rose-50/30">
                          {row.slice(0, 7).map((cell, cIdx) => (
                            <td
                              key={cIdx}
                              className="p-2 border-r border-stone-100 whitespace-nowrap text-stone-700 font-mono text-[10px]"
                            >
                              {cell || '—'}
                            </td>
                          ))}
                          {row.length > 7 && (
                            <td className="p-2 text-stone-400 text-[10px] italic">
                              ...
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          {/* Baking Material Estimator callout for Inventory planning */}
          {reportType === 'inventory' && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold text-amber-950">
                <ChefHat className="w-4 h-4 text-amber-700" />
                <span>Bakery Production Ingredient Forecast</span>
              </div>
              <p className="text-[11px] text-amber-800">
                Based on <span className="font-bold">{summary.totalWeightKg} kg</span> total cakes ordered: approx.{' '}
                <span className="font-bold">{Math.round(summary.totalWeightKg * 300)}g flour</span>,{' '}
                <span className="font-bold">{Math.round(summary.totalWeightKg * 200)}g fine sugar</span>, and{' '}
                <span className="font-bold">{Math.round(summary.totalWeightKg * 250)}g dairy cream/butter</span> will be needed for today's batches.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-stone-50 border-t border-rose-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-stone-500">
            {downloadSuccess && (
              <span className="text-emerald-700 font-bold flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                CSV Report downloaded successfully!
              </span>
            )}
            {!downloadSuccess && (
              <span>
                Ready to export <span className="font-bold text-stone-800">{filteredOrders.length}</span> order records.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleCopyClipboard}
              className="px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-stone-500" />
                  <span>Copy CSV</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleServerApiDownload}
              disabled={apiDownloading}
              title="Download via Server REST API"
              className="px-3.5 py-2.5 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-xs font-semibold text-[#881337] flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Server className="w-3.5 h-3.5 text-[#881337]" />
              <span>{apiDownloading ? 'Generating...' : 'Server Export'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="px-5 py-2.5 rounded-xl bg-[#881337] hover:bg-[#9F1239] text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Download .CSV Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
