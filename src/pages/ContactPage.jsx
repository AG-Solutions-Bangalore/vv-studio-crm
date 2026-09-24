import React, { useEffect, useState, useMemo } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import ContactModal from '../components/contact/ContactModal';
import ContactImportModal from '../components/contact/ContactImportModal';
import ContactViewModal from '../components/contact/ContactViewModal';
import Pagination from '../components/common/Pagination';
import useDebounce from '../hooks/useDebounce';
import {
  getContacts,
  getContactById,
  createContact,
  updateContact,
  updateContactStatus,
} from '../services/contactApi';
import { useAuthContext } from '../context/AuthContext';
import {
  Plus,
  Search,
  Edit2,
  RefreshCw,
  User,
  Users,
  Mail,
  Phone,
  MapPin,
  Boxes,
  Eye,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Download,
} from 'lucide-react';
import toast from 'react-hot-toast';

function extractList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.contacts?.data)) return response.contacts.data;
  if (Array.isArray(response?.contacts)) return response.contacts;
  if (Array.isArray(response?.contact)) return response.contact;
  return [];
}

const initialForm = {
  contact_name: '',
  contact_email: '',
  contact_mobile: '',
  contact_address: '',
  group_ids: [],
  contact_status: 'Active',
};

export default function ContactPage() {
  const { hasEmail, hasWhatsApp } = useAuthContext();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const debouncedSearch = useDebounce(searchQuery, 350);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);

  // Modal State (Create / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(initialForm);

  // Import Modal State
  const [importModalOpen, setImportModalOpen] = useState(false);

  // Preview Modal State
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);

  /* ── 1. GET /contact with pagination ── */
  const fetchContactList = async (page = currentPage, query = debouncedSearch, status = statusFilter) => {
    setLoading(true);
    try {
      const params = {
        page,
        ...(query.trim() ? { search: query.trim(), q: query.trim() } : {}),
        ...(status !== 'All' ? { status, contact_status: status } : {}),
      };

      const res = await getContacts(params);
      const list = extractList(res);
      setItems(list);

      // Pagination metadata
      const paginationObj = res?.data?.data ? res?.data : res;
      const total = paginationObj?.total ?? list.length;
      const lastPage = paginationObj?.last_page ?? Math.max(1, Math.ceil(total / (paginationObj?.per_page || 10)));
      const curr = paginationObj?.current_page ?? page;
      const per = paginationObj?.per_page ?? 10;

      setTotalCount(total);
      setTotalPages(lastPage);
      setCurrentPage(curr);
      setPerPage(per);
      setFrom(paginationObj?.from ?? (total > 0 ? (curr - 1) * per + 1 : 0));
      setTo(paginationObj?.to ?? Math.min(curr * per, total));
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to fetch contacts.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContactList(currentPage, debouncedSearch, statusFilter);
  }, [currentPage, debouncedSearch, statusFilter]);

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    setCurrentPage(1);
    fetchContactList(1, searchQuery, statusFilter);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
      fetchContactList(newPage, debouncedSearch, statusFilter);
    }
  };

  /* ── 2. CREATE (POST /contact) & UPDATE (PUT /contact/{id}) ── */
  const handleOpenCreateModal = () => {
    setEditingId(null);
    setForm(initialForm);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = async (item) => {
    setEditingId(item.id);
    setIsModalOpen(true);

    // Extract group IDs from item
    let rawGroups = item.group_ids || item.groups || item.group || [];
    let groupIds = [];
    if (Array.isArray(rawGroups)) {
      groupIds = rawGroups.map((g) => (typeof g === 'object' && g !== null ? (g.id || g.group_id) : Number(g) || g));
    }

    setForm({
      contact_name: item.contact_name || item.name || '',
      contact_email: item.contact_email || item.email || '',
      contact_mobile: item.contact_mobile || item.mobile || item.phone || '',
      contact_address: item.contact_address || item.address || '',
      group_ids: groupIds,
      contact_status: item.contact_status || item.status || 'Active',
    });

    try {
      const res = await getContactById(item.id);
      const freshData = res?.data || res?.contact || res;
      if (freshData) {
        let freshRawGroups = freshData.group_ids || freshData.groups || freshData.group || rawGroups;
        let freshGroupIds = [];
        if (Array.isArray(freshRawGroups)) {
          freshGroupIds = freshRawGroups.map((g) => (typeof g === 'object' && g !== null ? (g.id || g.group_id) : Number(g) || g));
        }

        setForm({
          contact_name: freshData.contact_name || freshData.name || item.contact_name || '',
          contact_email: freshData.contact_email || freshData.email || '',
          contact_mobile: freshData.contact_mobile || freshData.mobile || freshData.phone || '',
          contact_address: freshData.contact_address || freshData.address || '',
          group_ids: freshGroupIds,
          contact_status: freshData.contact_status || freshData.status || 'Active',
        });
      }
    } catch (err) {
      // Use existing values
    }
  };

  const handleFormSubmit = async (e) => {
    e?.preventDefault();
    if (!form.contact_name?.trim()) {
      toast.error('Please enter a contact name.');
      return;
    }
    if (!form.contact_mobile?.trim()) {
      toast.error('Please enter a mobile phone number.');
      return;
    }
    if (!Array.isArray(form.group_ids) || form.group_ids.length === 0) {
      toast.error('Please select at least one product group.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        // PUT /contact/{id}
        await updateContact(editingId, form);
        toast.success('Contact updated successfully.');
      } else {
        // POST /contact
        await createContact(form);
        toast.success('Contact created successfully.');
      }

      setIsModalOpen(false);
      setForm(initialForm);
      fetchContactList(currentPage, searchQuery, statusFilter);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save contact.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── 3. PATCH /contacts/{id}/status ── */
  const handleToggleStatus = async (item) => {
    const id = item.id;
    const currentStatus = item.contact_status || item.status || 'Active';
    const nextStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';

    // Optimistic UI update
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, contact_status: nextStatus, status: nextStatus } : it))
    );

    try {
      await updateContactStatus(id, nextStatus);
      toast.success(`Contact #${id} status changed to ${nextStatus}.`);
    } catch (err) {
      // Rollback
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, contact_status: currentStatus, status: currentStatus } : it))
      );
      const msg = err?.response?.data?.message || err?.message || 'Failed to update contact status.';
      toast.error(msg);
    }
  };

  // Filter contacts by status
  const displayedItems = useMemo(() => {
    return items.filter((it) => {
      const status = it.contact_status || it.status || 'Active';
      if (statusFilter !== 'All' && status.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      return true;
    });
  }, [items, statusFilter]);

  /* ── 4. Preview Modal ── */
  const handleOpenPreview = (item) => {
    setPreviewItem(item);
    setPreviewModalOpen(true);
  };

  // Metrics
  const contactStats = useMemo(() => {
    const total = totalCount || items.length;
    const active = items.filter((it) => (it.contact_status || it.status || 'Active').toLowerCase() === 'active' || (it.contact_status || it.status) === '1').length;
    const inactive = items.filter((it) => (it.contact_status || it.status || '').toLowerCase() === 'inactive' || (it.contact_status || it.status) === '0').length;
    return [
      {
        label: 'Total Contacts',
        value: total,
        icon: Users,
        color: 'emerald',
        filterValue: 'All',
        subtext: 'Registered CRM contacts & leads',
      },
      {
        label: 'Active Contacts',
        value: active,
        icon: CheckCircle2,
        color: 'amber',
        filterValue: 'Active',
        subtext: 'Subscribed & reachable',
      },
      {
        label: 'Inactive Contacts',
        value: inactive,
        icon: XCircle,
        color: 'rose',
        filterValue: 'Inactive',
        subtext: 'Unsubscribed / inactive',
      },
    ];
  }, [items, totalCount]);

  return (
    <div className="flex min-h-screen bg-[#F8F6F0] text-[#1A1817]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Contact Management" />

        <main className="flex-1 p-5 md:p-6 max-w-7xl w-full">
          
          {/* Header Bar */}
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-sm md:text-base font-semibold text-[#1A1817] tracking-tight">
                Contacts & Leads
              </h1>
              <p className="text-xs text-[#78716C] mt-0.5">
                Maintain client contact details, phone numbers, email lists, and product group assignments
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchContactList(currentPage, searchQuery, statusFilter)}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#E2DDD5] bg-white hover:bg-[#F7F4EE] text-[11px] font-medium text-[#4A443D] shadow-2xs transition-all cursor-pointer"
              >
                <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              <button
                onClick={() => setImportModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#C6E6CC] bg-[#EBF7EE] hover:bg-[#DDF2E2] text-[#1E7E34] text-[11px] font-medium shadow-2xs transition-all active:scale-95 cursor-pointer"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-[#1E7E34]" />
                <span>Import Excel</span>
              </button>

              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#1A1817] hover:bg-[#2C2825] text-[#FAF8F5] text-[11px] font-medium shadow-2xs transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 text-[#C99C4B]" />
                <span>Add Contact</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="bg-white px-3.5 py-2.5 rounded-xl border border-[#E8E3DA] shadow-2xs mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            
            <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full sm:w-72">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9C9488] pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, mobile..."
                className="w-full pl-8 pr-3 py-1.5 text-[11px] rounded-lg border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition-all shadow-2xs placeholder-[#9C9488]"
              />
            </form>
          </div>

          {/* Table List View */}
          {loading ? (
            <div className="bg-white rounded-2xl border border-[#E8E3DA] p-12 text-center shadow-2xs">
              <RefreshCw className="h-7 w-7 animate-spin text-[#9E7432] mx-auto mb-3" />
              <p className="text-xs font-medium text-[#78716C]">Loading contacts list...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E8E3DA] p-14 text-center shadow-2xs">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FBF4E8] text-[#9E7432] border border-[#F2E4C9] mb-4">
                <Users className="h-7 w-7" />
              </div>
              <h3 className="font-display text-base font-bold text-[#1A1817]">No contacts found</h3>
              <p className="text-xs text-[#8C8275] max-w-sm mx-auto mt-1 mb-5">
                {searchQuery || statusFilter !== 'All'
                  ? 'No contacts match your current search or status filter.'
                  : 'Start growing your customer relationship base by adding your first contact.'}
              </p>
              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1A1817] text-[#FAF8F5] text-xs font-semibold shadow-xs hover:bg-[#2C2825] transition cursor-pointer"
              >
                <Plus className="h-4 w-4 text-[#C99C4B]" />
                <span>Add Contact</span>
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E8E3DA] overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#3D372E]">
                  <thead className="bg-[#F7F4EE] border-b border-[#E8E3DA] text-xs uppercase font-semibold text-[#78716C] tracking-wider">
                    <tr>
                      <th className="px-4 py-2.5 w-16">Sl.No</th>
                      <th className="px-4 py-2.5">Contact</th>
                      {hasWhatsApp && <th className="px-4 py-2.5">Mobile</th>}
                      <th className="px-4 py-2.5">Address</th>
                      <th className="px-4 py-2.5">Groups</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-4 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0ECE3]">
                    {items.map((item, index) => {
                      const id = item.id;
                      const name = item.contact_name || item.name || 'Unnamed Contact';
                      const email = item.contact_email || item.email || '';
                      const mobile = item.contact_mobile || item.mobile || item.phone || '';
                      const address = item.contact_address || item.address || '';
                      const status = item.contact_status || item.status || 'Active';
                      const isActive = status === 'Active';
                      const groups = item.groups || item.group || [];
                      const rowNumber = (currentPage - 1) * perPage + index + 1;

                      return (
                        <tr key={id || index} className="hover:bg-[#FAF8F5] transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-[#9C9488]">{rowNumber}</td>
                          
                          {/* Name & Email */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1A1817] text-[#FAF8F5] text-xs font-semibold flex-shrink-0">
                                {name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <span className="font-semibold text-xs text-[#1A1817] block truncate">{name}</span>
                                {hasEmail && email && (
                                  <span className="text-[11px] text-[#78716C] block truncate">{email}</span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Mobile */}
                          {hasWhatsApp && (
                            <td className="px-4 py-3">
                              {mobile ? (
                                <div className="flex items-center gap-1.5 text-xs text-[#3D372E]">
                                  <Phone className="h-3 w-3 text-[#9E7432]" />
                                  <span className="font-mono text-xs">{mobile}</span>
                                </div>
                              ) : (
                                <span className="text-[#8C8275] text-[11px]">—</span>
                              )}
                            </td>
                          )}

                          {/* Address */}
                          <td className="px-4 py-3 max-w-xs truncate text-[#5C554B]">
                            {address || <span className="text-[#8C8275] text-[11px]">—</span>}
                          </td>

                          {/* Groups */}
                          <td className="px-4 py-3">
                            {Array.isArray(groups) && groups.length > 0 ? (
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {groups.map((g, gi) => (
                                  <span
                                    key={g.id || gi}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#E8E3DA] text-[10px] font-medium text-[#4A443D]"
                                  >
                                    <Boxes className="h-2.5 w-2.5 text-[#9E7432]" />
                                    <span>{g.group_name || g.name}</span>
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[#8C8275] text-[11px]">Unassigned</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(item)}
                              title="Click to toggle status"
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition cursor-pointer ${
                                isActive
                                  ? 'bg-[#EBF7EE] text-[#1E7E34] border border-[#C3E6CB] hover:bg-[#D4EDDA]'
                                  : 'bg-[#FBEAEA] text-[#9A2D2D] border border-[#F5C6CB] hover:bg-[#F8D7DA]'
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-[#1E7E34]' : 'bg-[#9A2D2D]'}`}
                              />
                              {status}
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenPreview(item)}
                                title="View Contact Details"
                                className="p-1.5 rounded-lg border border-[#DDD7CD] bg-white hover:bg-[#EFECE6] text-[#4A443D] transition shadow-2xs cursor-pointer"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(item)}
                                title="Edit Contact"
                                className="p-1.5 rounded-lg border border-[#DDD7CD] bg-white hover:bg-[#EFECE6] text-[#4A443D] transition shadow-2xs cursor-pointer"
                              >
                                <Edit2 className="h-3.5 w-3.5 text-[#9E7432]" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalCount={totalCount}
                perPage={perPage}
                onPageChange={handlePageChange}
                from={from}
                to={to}
              />
            </div>
          )}

        </main>
      </div>

      {/* Add / Edit Contact Modal */}
      <ContactModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        form={form}
        setForm={setForm}
        editingId={editingId}
        submitting={submitting}
      />

      {/* Import Excel Modal */}
      <ContactImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={() => fetchContactList(currentPage, searchQuery, statusFilter)}
      />

      {/* View Contact Modal */}
      <ContactViewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        item={previewItem}
        onEdit={(it) => handleOpenEditModal(it)}
      />
    </div>
  );
}
