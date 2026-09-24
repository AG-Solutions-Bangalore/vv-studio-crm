import React, { useEffect, useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { getEnquiryReport } from '../services/reportApi';
import {
  Download,
  MessageSquareText,
  RefreshCw,
  Search,
  ArrowDownToLine,
  CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';

function downloadCsvString(csvContent, filename) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function convertEnquiriesToCsv(items) {
  const headers = [
    'Sl.No',
    'Full Name',
    'Mobile',
    'Email',
    'Service',
    'Enquiry From',
    'Message',
    'Status',
  ];
  const rows = items.map((item, idx) => {
    const fullName = item.enquiryFullName || item.full_name || item.fullName || item.name || '';
    const mobile = item.enquiryMobile || item.mobile || item.phone || '';
    const email = item.enquiryEmail || item.email || '';
    const service = item.enquiryService || item.service || item.service_name || '';
    const enquiryFrom = item.enquiryFrom || item.enquiry_from || '';
    const message = (item.enquiryMessage || item.message || item.description || '').replace(/"/g, '""');
    const status = item.enquiryStatus || item.enquiry_status || item.status || 'Pending';

    return [
      idx + 1,
      `"${String(fullName).replace(/"/g, '""')}"`,
      `"${String(mobile).replace(/"/g, '""')}"`,
      `"${String(email).replace(/"/g, '""')}"`,
      `"${String(service).replace(/"/g, '""')}"`,
      `"${String(enquiryFrom).replace(/"/g, '""')}"`,
      `"${String(message).replace(/"/g, '""')}"`,
      `"${String(status).replace(/"/g, '""')}"`,
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

export default function DownloadsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [exporting, setExporting] = useState(false);

  const fetchReportData = async (isManual = false) => {
    setLoading(true);
    try {
      const res = await getEnquiryReport();
      const list = res?.data?.data || res?.data || res?.enquiries || res?.report || (Array.isArray(res) ? res : []);
      const dataArray = Array.isArray(list) ? list : [];
      setItems(dataArray);
      if (isManual) {
        toast.success(`Loaded ${dataArray.length} enquiry records.`);
      }
    } catch (err) {
      console.error('Failed to fetch enquiry report:', err);
      toast.error('Failed to fetch enquiry report data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData(false);
  }, []);

  const handleExportCsv = () => {
    if (items.length === 0) {
      toast.error('No enquiry data to export.');
      return;
    }

    setExporting(true);
    try {
      const now = new Date().toISOString().split('T')[0];
      const csvText = convertEnquiriesToCsv(items);
      downloadCsvString(csvText, `enquiry_report_${now}.csv`);
      toast.success(`Exported ${items.length} records successfully!`);
    } catch (err) {
      toast.error('Failed to generate CSV export.');
    } finally {
      setExporting(false);
    }
  };

  const filteredItems = items.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = String(item.enquiryFullName || '').toLowerCase();
    const phone = String(item.enquiryMobile || '').toLowerCase();
    const email = String(item.enquiryEmail || '').toLowerCase();
    const service = String(item.enquiryService || '').toLowerCase();
    const from = String(item.enquiryFrom || '').toLowerCase();
    const msg = String(item.enquiryMessage || '').toLowerCase();
    const status = String(item.enquiryStatus || '').toLowerCase();
    const utmS = String(item.utm_source || '').toLowerCase();
    const utmM = String(item.utm_medium || '').toLowerCase();
    const utmC = String(item.utm_campaign || '').toLowerCase();

    return (
      name.includes(q) ||
      phone.includes(q) ||
      email.includes(q) ||
      service.includes(q) ||
      from.includes(q) ||
      msg.includes(q) ||
      status.includes(q) ||
      utmS.includes(q) ||
      utmM.includes(q) ||
      utmC.includes(q)
    );
  });

  const getStatusBadge = (status) => {
    const s = String(status || '').toLowerCase();
    if (s === 'completed') return 'bg-[#EDF7EE] text-[#1E6B34] border-[#C6E6CC]';
    if (s === 'processing') return 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]';
    if (s === 'cancel' || s === 'cancelled') return 'bg-[#FDF0F0] text-[#9A2D2D] border-[#F6C8C8]';
    return 'bg-[#FEF6E9] text-[#9A6218] border-[#FAD8A5]';
  };

  return (
    <div className="flex min-h-screen bg-[#F8F6F0] text-[#1A1817]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Reports & Downloads" />

        <main className="flex-1 p-5 md:p-8 max-w-7xl w-full mx-auto space-y-5">
          
          {/* Top Banner */}
          <div className="bg-white rounded-2xl border border-[#E8E3DA] p-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="h-11 w-11 rounded-2xl bg-[#FBF4E8] text-[#9E7432] border border-[#F2E4C9] flex items-center justify-center flex-shrink-0 shadow-2xs">
                  <ArrowDownToLine className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-base sm:text-lg font-bold text-[#1A1817] tracking-tight">
                    Customer Enquiry Report
                  </h1>
                  <p className="text-xs text-[#78716C] mt-0.5">
                    Live data from <code className="bg-[#FAF8F5] px-1.5 py-0.5 rounded border border-[#E8E3DA] text-[11px] font-mono text-[#9E7432]">getEnquiryReport</code>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EDF7EE] text-[#1E6B34] border border-[#C6E6CC]">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{items.length} Records Found</span>
                </span>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="bg-white px-4 py-3 rounded-xl border border-[#E8E3DA] shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex items-center w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9C9488] pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search enquiry report..."
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition-all shadow-2xs placeholder-[#9C9488]"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fetchReportData(true)}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E2DDD5] bg-white hover:bg-[#FAF8F5] text-xs font-medium text-[#4A443D] transition cursor-pointer shadow-2xs"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-[#9E7432]' : 'text-[#78716C]'}`} />
                <span>Refresh</span>
              </button>

              <button
                type="button"
                onClick={handleExportCsv}
                disabled={loading || items.length === 0 || exporting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1A1817] hover:bg-[#2C2825] text-[#FAF8F5] text-xs font-semibold shadow-xs transition active:scale-95 disabled:bg-[#A39C91] cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 text-[#C99C4B]" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-2xl border border-[#E8E3DA] shadow-2xs overflow-hidden">
            {loading ? (
              <div className="py-16 text-center text-[#78716C]">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#1A1817] border-t-transparent mx-auto mb-2" />
                <p className="text-xs font-medium">Fetching enquiry report from API...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="py-14 text-center text-[#78716C]">
                <div className="h-10 w-10 rounded-xl bg-[#F7F4EE] flex items-center justify-center mx-auto mb-2.5 text-[#9C9488]">
                  <MessageSquareText className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold text-[#1A1817]">No enquiries found</p>
                <p className="text-xs text-[#8C8275] mt-0.5">
                  {searchQuery ? 'No records match your search filter' : 'No enquiry data returned by getEnquiryReport'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#3D372E]">
                  <thead className="bg-[#F7F4EE] border-b border-[#E8E3DA] text-xs uppercase font-semibold text-[#78716C] tracking-wider whitespace-nowrap">
                    <tr>
                      <th className="px-4 py-3 w-14 text-center">Sl.no</th>
                      <th className="px-4 py-3">Full Name</th>
                      <th className="px-4 py-3">Mobile</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Service</th>
                      <th className="px-4 py-3">Enquiry From</th>
                      <th className="px-4 py-3">Message</th>
                      <th className="px-4 py-3 whitespace-nowrap">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0ECE3]">
                    {filteredItems.map((item, index) => {
                      const id = item.id;
                      const fullName = item.enquiryFullName || item.full_name || item.fullName || item.name || '—';
                      const mobile = item.enquiryMobile || item.mobile || item.phone || '—';
                      const email = item.enquiryEmail || item.email || '—';
                      const service = item.enquiryService || item.service || item.service_name || '—';
                      const enquiryFrom = item.enquiryFrom || item.enquiry_from || '—';
                      const message = item.enquiryMessage || item.message || item.description || '—';
                      const currentStatus = item.enquiryStatus || item.enquiry_status || item.status || 'Pending';

                      return (
                        <tr key={id || index} className="hover:bg-[#FAF8F5] transition-colors">
                          {/* 1. Sl.no */}
                          <td className="px-4 py-3 font-mono text-xs text-[#9C9488] text-center">
                            {index + 1}
                          </td>

                          {/* 2. Full Name */}
                          <td className="px-4 py-3 font-medium text-xs text-[#1A1817] whitespace-nowrap">
                            {fullName}
                          </td>

                          {/* 3. Mobile */}
                          <td className="px-4 py-3 text-xs text-[#3D372E] whitespace-nowrap font-mono">
                            {mobile}
                          </td>

                          {/* 4. Email */}
                          <td className="px-4 py-3 text-xs text-[#5C554B] whitespace-nowrap">
                            {email}
                          </td>

                          {/* 5. Service */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#E8E3DA] text-[11px] text-[#4A443D] font-medium">
                              {service}
                            </span>
                          </td>

                          {/* 6. Enquiry From */}
                          <td className="px-4 py-3 text-xs text-[#6B655B] max-w-[220px]">
                            <span className="block truncate" title={enquiryFrom}>
                              {enquiryFrom}
                            </span>
                          </td>

                          {/* 7. Message */}
                          <td className="px-4 py-3 text-xs text-[#78716C] max-w-[260px]">
                            <span className="block truncate" title={message}>
                              {message}
                            </span>
                          </td>

                          {/* 8. Status */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center text-xs font-medium py-0.5 px-2.5 rounded-full border shadow-2xs ${getStatusBadge(currentStatus)}`}>
                              {currentStatus}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  );
}
