import React, { useEffect, useState, useMemo } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { useAppContext } from '../context/AppContext';
import { getCompanyDetails, updateCompanyDetails } from '../services/companyApi';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  Edit2,
  RefreshCw,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Send,
  Share2,
  Save,
  X,
  Upload,
  Calendar,
  Layers
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function CompanyPage() {
  const { companyInfo, setCompanyInfo, companyLogoUrl, appVersion } = useAppContext();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [details, setDetails] = useState(companyInfo || null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state for editing company info
  const [form, setForm] = useState({
    company_name: '',
    company_short: '',
    company_email: '',
    company_mobile_no: '',
    company_phone: '',
    company_address: '',
    company_place: '',
    company_website: '',
    company_about: '',
    company_logo: null,
  });

  const [logoPreview, setLogoPreview] = useState(null);

  const fetchCompany = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await getCompanyDetails();
      const extracted = res?.company_detils || res?.company_details || res?.data || res;
      if (extracted && typeof extracted === 'object') {
        setDetails(extracted);
        if (setCompanyInfo) {
          setCompanyInfo(extracted);
        }
      }
      if (isManual) {
        toast.success('Company details synchronized.');
      }
    } catch (err) {
      console.error('Failed to load company details:', err);
      if (companyInfo) {
        setDetails(companyInfo);
      } else {
        toast.error('Unable to fetch live company details.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCompany();
  }, []);

  const handleOpenEdit = () => {
    const current = details || companyInfo || {};
    setForm({
      company_name: current.company_name || '',
      company_short: current.company_short || '',
      company_email: current.company_email || '',
      company_mobile_no: current.company_mobile_no || current.mobile || '',
      company_phone: current.company_phone || current.phone || '',
      company_address: current.company_address || '',
      company_place: current.company_place || '',
      company_website: current.company_website || '',
      company_about: current.company_about || '',
      company_logo: null,
    });
    setLogoPreview(companyLogoUrl || '/no_image.jpg');
    setIsEditModalOpen(true);
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm((prev) => ({ ...prev, company_logo: file }));
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setSubmitting(true);

    try {
      const res = await updateCompanyDetails(form);
      toast.success(res?.message || 'Company details updated successfully.');
      
      const updated = {
        ...details,
        ...form,
        ...(res?.company_detils || res?.company_details || res?.data || {}),
      };
      setDetails(updated);
      if (setCompanyInfo) {
        setCompanyInfo(updated);
      }
      setIsEditModalOpen(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update company details.');
    } finally {
      setSubmitting(false);
    }
  };

  // Summary stats for company overview
  const companyStats = useMemo(() => [
    {
      label: 'ORGANIZATION STATUS',
      value: 'Verified',
      icon: ShieldCheck,
      color: 'emerald',
    },
    {
      label: 'BASE LOCATION',
      value: details?.company_place || companyInfo?.company_place || '—',
      icon: MapPin,
      color: 'amber',
    },
    {
      label: 'PORTAL VERSION',
      value: `v${appVersion || '2.0'}`,
      icon: Sparkles,
      color: 'rose',
    },
  ], [details, companyInfo, appVersion]);

  const current = details || companyInfo || {};

  return (
    <div className="flex min-h-screen bg-[#F8F6F0] text-[#1A1817]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Company Profile" />

        <main className="flex-1 p-5 md:p-6 max-w-7xl w-full space-y-4">
          
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-sm md:text-base font-semibold text-[#1A1817] tracking-tight">
                Company Profile & Settings
              </h1>
              <p className="text-xs text-[#78716C] mt-0.5">
                Manage enterprise identity, address, branding, and contact channels
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchCompany(true)}
                disabled={refreshing || loading}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#E2DDD5] bg-white hover:bg-[#F7F4EE] text-[11px] font-medium text-[#4A443D] shadow-2xs transition-all cursor-pointer"
              >
                <RefreshCw className={`h-3 w-3 ${refreshing || loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              <button
                onClick={handleOpenEdit}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#1A1817] hover:bg-[#2C2825] text-[#FAF8F5] text-[11px] font-medium shadow-2xs transition-all active:scale-95 cursor-pointer"
              >
                <Edit2 className="h-3.5 w-3.5 text-[#C99C4B]" />
                <span>Edit Company Details</span>
              </button>
            </div>
          </div>

          {/* Company Profile Main Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            {/* Left Card: Brand Badge & Key Identity */}
            <div className="bg-white rounded-xl border border-[#E8E3DA] p-5 shadow-2xs flex flex-col items-center text-center justify-between">
              <div className="w-full flex flex-col items-center">
                {/* Logo Badge */}
                <div className="h-20 w-20 rounded-2xl bg-[#FAF8F5] border border-[#E8E3DA] p-2.5 flex items-center justify-center shadow-xs mb-3.5 overflow-hidden">
                  <img
                    src={companyLogoUrl || '/no_image.jpg'}
                    alt={current.company_name || 'Logo'}
                    className="h-full w-full object-contain"
                    onError={(e) => { e.currentTarget.src = '/no_image.jpg'; }}
                  />
                </div>

                <h2 className="text-base font-bold text-[#1A1817] tracking-tight">
                  {current.company_name || '—'}
                </h2>
                {current.company_short && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FAF4EA] border border-[#EADDC5] text-[#9E7432] text-[11px] font-semibold mt-1">
                    <span>{current.company_short}</span>
                  </div>
                )}

                {current.company_about && (
                  <p className="text-xs text-[#78716C] mt-3 leading-relaxed max-w-xs">
                    {current.company_about}
                  </p>
                )}
              </div>

              {/* Quick Status Bar */}
              <div className="w-full pt-4 mt-4 border-t border-[#F0ECE3] flex items-center justify-between text-xs">
                <span className="text-[#8C8275]">Portal Status</span>
                <span className="inline-flex items-center gap-1 text-[#1E7E34] font-semibold">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Active
                </span>
              </div>
            </div>

            {/* Right Card: Full Organization Details */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-[#E8E3DA] p-5 shadow-2xs flex flex-col justify-between">
              <div>
                <h3 className="text-xs uppercase font-bold text-[#78716C] tracking-wider mb-4 flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 text-[#C99C4B]" />
                  <span>Corporate Details & Contact Coordinates</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  
                  {/* Company Name */}
                  <div className="p-3 rounded-lg border border-[#E8E3DA] bg-[#FAF8F5]">
                    <span className="text-[10.5px] uppercase font-bold text-[#8C8275] block mb-1">
                      Organization Name
                    </span>
                    <span className="font-semibold text-[#1A1817] text-xs">
                      {current.company_name || '—'}
                    </span>
                  </div>

                  {/* Company Short Code */}
                  <div className="p-3 rounded-lg border border-[#E8E3DA] bg-[#FAF8F5]">
                    <span className="text-[10.5px] uppercase font-bold text-[#8C8275] block mb-1">
                      Short Code / Acronym
                    </span>
                    <span className="font-semibold text-[#1A1817] text-xs font-mono">
                      {current.company_short || '—'}
                    </span>
                  </div>

                  {/* Official Email */}
                  <div className="p-3 rounded-lg border border-[#E8E3DA] bg-[#FAF8F5]">
                    <span className="text-[10.5px] uppercase font-bold text-[#8C8275] block mb-1 flex items-center gap-1.5">
                      <Mail className="h-3 w-3 text-[#9E7432]" />
                      Official Email
                    </span>
                    {current.company_email ? (
                      <a
                        href={`mailto:${current.company_email}`}
                        className="font-semibold text-[#1A1817] text-xs hover:text-[#9E7432] transition"
                      >
                        {current.company_email}
                      </a>
                    ) : (
                      <span className="text-[#8C8275]">—</span>
                    )}
                  </div>

                  {/* Phone / Mobile */}
                  <div className="p-3 rounded-lg border border-[#E8E3DA] bg-[#FAF8F5]">
                    <span className="text-[10.5px] uppercase font-bold text-[#8C8275] block mb-1 flex items-center gap-1.5">
                      <Phone className="h-3 w-3 text-[#9E7432]" />
                      Phone / Mobile
                    </span>
                    <span className="font-semibold text-[#1A1817] text-xs">
                      {current.company_mobile_no || current.company_phone || current.mobile || '—'}
                    </span>
                  </div>

                  {/* Corporate Address */}
                  <div className="sm:col-span-2 p-3 rounded-lg border border-[#E8E3DA] bg-[#FAF8F5]">
                    <span className="text-[10.5px] uppercase font-bold text-[#8C8275] block mb-1 flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 text-[#9E7432]" />
                      Registered Business Address
                    </span>
                    <span className="font-medium text-[#1A1817] text-xs leading-relaxed">
                      {current.company_address || current.company_place || '—'}
                    </span>
                  </div>

                  {/* Website */}
                  <div className="sm:col-span-2 p-3 rounded-lg border border-[#E8E3DA] bg-[#FAF8F5]">
                    <span className="text-[10.5px] uppercase font-bold text-[#8C8275] block mb-1 flex items-center gap-1.5">
                      <Globe className="h-3 w-3 text-[#9E7432]" />
                      Official Website
                    </span>
                    {current.company_website ? (
                      <a
                        href={current.company_website.startsWith('http') ? current.company_website : `https://${current.company_website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-[#9E7432] text-xs hover:underline"
                      >
                        {current.company_website}
                      </a>
                    ) : (
                      <span className="text-[#8C8275]">—</span>
                    )}
                  </div>

                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-[#F0ECE3] flex items-center justify-between text-xs text-[#8C8275]">
                <span>Last Synchronized: {(() => {
                  const d = new Date();
                  const day = String(d.getDate()).padStart(2, '0');
                  const month = String(d.getMonth() + 1).padStart(2, '0');
                  return `${day}/${month}/${d.getFullYear()}`;
                })()}</span>
                <span className="font-mono text-[11px] text-[#9E7432]">API Connected</span>
              </div>
            </div>

          </div>

        </main>
      </div>

      {/* Edit Company Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl border border-[#E8E3DA] bg-[#FCFBFA] p-6 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-[#E8E3DA] pb-3.5 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FAF4EA] text-[#9E7432]">
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1A1817]">Edit Company Details</h3>
                  <p className="text-[11px] text-[#8C8275]">Update enterprise branding and contact information</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-lg text-[#8C8275] hover:text-[#1A1817] hover:bg-[#F0ECE3] transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              
              {/* Logo Preview and Upload */}
              <div className="p-3 rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl bg-white border border-[#E8E3DA] p-1.5 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                  <img
                    src={logoPreview || '/ag-logo-icon.png'}
                    alt="Preview"
                    className="h-full w-full object-contain"
                    onError={(e) => {
                      e.currentTarget.src = '/ag-logo-icon.png';
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="text-[11px] font-bold text-[#1A1817] block mb-1">Company Logo</label>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-[#E2DDD5] bg-white text-[11px] font-medium text-[#4A443D] hover:bg-[#F7F4EE] transition cursor-pointer shadow-2xs">
                    <Upload className="h-3 w-3" />
                    <span>Upload New Logo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Company Name */}
                <div>
                  <label className="block text-[11px] font-semibold text-[#5C554B] mb-1">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.company_name}
                    onChange={(e) => setForm((prev) => ({ ...prev, company_name: e.target.value }))}
                    placeholder="Enter company name"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#E2DDD5] bg-white text-[#1A1817] focus:outline-none focus:border-[#C99C4B]"
                  />
                </div>

                {/* Company Short Code */}
                <div>
                  <label className="block text-[11px] font-semibold text-[#5C554B] mb-1">
                    Short Code / Acronym
                  </label>
                  <input
                    type="text"
                    value={form.company_short}
                    onChange={(e) => setForm((prev) => ({ ...prev, company_short: e.target.value }))}
                    placeholder="Enter short code"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#E2DDD5] bg-white text-[#1A1817] focus:outline-none focus:border-[#C99C4B]"
                  />
                </div>

                {/* Official Email */}
                <div>
                  <label className="block text-[11px] font-semibold text-[#5C554B] mb-1">
                    Official Email
                  </label>
                  <input
                    type="email"
                    value={form.company_email}
                    onChange={(e) => setForm((prev) => ({ ...prev, company_email: e.target.value }))}
                    placeholder="company@domain.com"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#E2DDD5] bg-white text-[#1A1817] focus:outline-none focus:border-[#C99C4B]"
                  />
                </div>

                {/* Phone / Mobile */}
                <div>
                  <label className="block text-[11px] font-semibold text-[#5C554B] mb-1">
                    Phone / Mobile
                  </label>
                  <input
                    type="text"
                    value={form.company_mobile_no}
                    onChange={(e) => setForm((prev) => ({ ...prev, company_mobile_no: e.target.value }))}
                    placeholder="Phone or mobile number"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#E2DDD5] bg-white text-[#1A1817] focus:outline-none focus:border-[#C99C4B]"
                  />
                </div>

                {/* City / Place */}
                <div>
                  <label className="block text-[11px] font-semibold text-[#5C554B] mb-1">
                    City / Location
                  </label>
                  <input
                    type="text"
                    value={form.company_place}
                    onChange={(e) => setForm((prev) => ({ ...prev, company_place: e.target.value }))}
                    placeholder="City or location"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#E2DDD5] bg-white text-[#1A1817] focus:outline-none focus:border-[#C99C4B]"
                  />
                </div>

                {/* Website */}
                <div>
                  <label className="block text-[11px] font-semibold text-[#5C554B] mb-1">
                    Official Website URL
                  </label>
                  <input
                    type="url"
                    value={form.company_website}
                    onChange={(e) => setForm((prev) => ({ ...prev, company_website: e.target.value }))}
                    placeholder="https://company.com"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#E2DDD5] bg-white text-[#1A1817] focus:outline-none focus:border-[#C99C4B]"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-[11px] font-semibold text-[#5C554B] mb-1">
                  Registered Address
                </label>
                <textarea
                  rows={2}
                  value={form.company_address}
                  onChange={(e) => setForm((prev) => ({ ...prev, company_address: e.target.value }))}
                  placeholder="Enter full company address..."
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#E2DDD5] bg-white text-[#1A1817] focus:outline-none focus:border-[#C99C4B]"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E8E3DA]">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-[#E2DDD5] bg-white text-[11px] font-medium text-[#5C554B] hover:bg-[#F7F4EE] transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#1A1817] text-[#FAF8F5] text-[11px] font-semibold hover:bg-[#2C2825] transition shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  <Save className="h-3.5 w-3.5 text-[#C99C4B]" />
                  <span>{submitting ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
