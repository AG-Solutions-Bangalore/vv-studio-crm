import React, { useEffect, useState, useMemo } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import HolidayModal from '../components/holiday/HolidayModal';
import DeleteConfirmModal from '../components/common/DeleteConfirmModal';
import Pagination from '../components/common/Pagination';
import useDebounce from '../hooks/useDebounce';
import {
  getHolidays,
  getHolidayById,
  createHoliday,
  updateHoliday,
  deleteHoliday,
} from '../services/holidayApi';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  RefreshCw,
  CalendarDays,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';

function extractList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.holidays?.data)) return response.holidays.data;
  if (Array.isArray(response?.holidays)) return response.holidays;
  if (Array.isArray(response?.holiday)) return response.holiday;
  return [];
}

function parseHolidayDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

function formatHolidayDate(dateStr) {
  const d = parseHolidayDate(dateStr);
  if (!d) return String(dateStr || '—');
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

function formatDDMMYYYY(dateStr) {
  return formatHolidayDate(dateStr);
}

function getDayOfWeek(dateStr) {
  const d = parseHolidayDate(dateStr);
  if (!d) return '—';
  return d.toLocaleDateString('en-IN', { weekday: 'long' });
}

function getDateStatus(dateStr) {
  const d = parseHolidayDate(dateStr);
  if (!d) return 'upcoming';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);

  if (target.getTime() === today.getTime()) return 'today';
  if (target.getTime() > today.getTime()) return 'upcoming';
  return 'past';
}

const initialForm = {
  holiday_date: new Date().toISOString().split('T')[0],
  holiday_name: '',
};

export default function HolidayPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('All'); // 'All' | 'Upcoming' | 'Past'

  const debouncedSearch = useDebounce(searchQuery, 350);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [perPage, setPerPage] = useState(12);
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(initialForm);

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  /* ── 1. GET /holiday with pagination ── */
  const fetchHolidayList = async (page = currentPage, query = debouncedSearch) => {
    setLoading(true);
    try {
      const params = {
        page,
        ...(query.trim() ? { search: query.trim(), q: query.trim() } : {}),
      };

      const res = await getHolidays(params);
      const list = extractList(res);
      setItems(list);

      // Pagination metadata
      const paginationObj = res?.data?.data ? res?.data : res;
      const total = paginationObj?.total ?? list.length;
      const lastPage = paginationObj?.last_page ?? Math.max(1, Math.ceil(total / (paginationObj?.per_page || 12)));
      const curr = paginationObj?.current_page ?? page;
      const per = paginationObj?.per_page ?? 12;

      setTotalCount(total);
      setTotalPages(lastPage);
      setCurrentPage(curr);
      setPerPage(per);
      setFrom(paginationObj?.from ?? (total > 0 ? (curr - 1) * per + 1 : 0));
      setTo(paginationObj?.to ?? Math.min(curr * per, total));
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to fetch holiday calendar.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidayList(currentPage, debouncedSearch);
  }, [currentPage, debouncedSearch]);

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    setCurrentPage(1);
    fetchHolidayList(1, searchQuery);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
      fetchHolidayList(newPage, searchQuery);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  /* ── 2. CREATE (POST /holiday) & UPDATE (PUT /holiday/{id}) ── */
  const handleOpenCreateModal = () => {
    setEditingId(null);
    setForm(initialForm);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = async (item) => {
    setEditingId(item.id);
    setIsModalOpen(true);

    const date = item.holiday_date || item.date || '';
    const name = item.holiday_name || item.name || '';

    setForm({
      holiday_date: date,
      holiday_name: name,
    });

    try {
      const res = await getHolidayById(item.id);
      const freshData = res?.data || res?.holiday || res;
      if (freshData) {
        setForm({
          holiday_date: freshData.holiday_date || freshData.date || date,
          holiday_name: freshData.holiday_name || freshData.name || name,
        });
      }
    } catch (err) {
      // Use existing values
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!form.holiday_date) {
      toast.error('Please select a holiday date.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        // PUT /holiday/{id}
        await updateHoliday(editingId, form);
        toast.success('Holiday updated successfully.');
      } else {
        // POST /holiday
        await createHoliday(form);
        toast.success('Holiday added to calendar.');
      }

      setIsModalOpen(false);
      setForm(initialForm);
      fetchHolidayList(currentPage, searchQuery);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save holiday.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── 3. DELETE /holiday/{id} ── */
  const handleOpenDeleteModal = (id) => {
    setDeletingId(id);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    setDeleting(true);
    try {
      await deleteHoliday(deletingId);
      toast.success('Holiday deleted successfully.');
      setDeleteModalOpen(false);
      setDeletingId(null);
      fetchHolidayList(currentPage, searchQuery);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to delete holiday.';
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  // Metrics
  const holidayStats = useMemo(() => {
    const total = totalCount || items.length;
    let upcoming = 0;
    let past = 0;

    items.forEach((it) => {
      const status = getDateStatus(it.holiday_date || it.date);
      if (status === 'upcoming' || status === 'today') upcoming++;
      else past++;
    });

    return [
      {
        label: 'Total Holidays',
        value: total,
        icon: CalendarDays,
        color: 'amber',
        filterValue: 'All',
        subtext: 'Calendar scheduled leaves',
      },
      {
        label: 'Upcoming Holidays',
        value: upcoming,
        icon: CheckCircle2,
        color: 'emerald',
        filterValue: 'Upcoming',
        subtext: 'Approaching non-working dates',
      },
      {
        label: 'Past Holidays',
        value: past,
        icon: Clock,
        color: 'blue',
        filterValue: 'Past',
        subtext: 'Completed holiday events',
      },
    ];
  }, [items, totalCount]);

  // Client-side period filtering if desired
  const filteredItems = useMemo(() => {
    if (filterPeriod === 'All') return items;
    return items.filter((it) => {
      const st = getDateStatus(it.holiday_date || it.date);
      if (filterPeriod === 'Upcoming') return st === 'upcoming' || st === 'today';
      if (filterPeriod === 'Past') return st === 'past';
      return true;
    });
  }, [items, filterPeriod]);

  return (
    <div className="flex min-h-screen bg-[#F8F6F0] text-[#1A1817]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Holiday Schedule" />

        <main className="flex-1 p-5 md:p-6 max-w-7xl w-full">
          
          {/* Header Bar */}
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-sm md:text-base font-semibold text-[#1A1817] tracking-tight">
                Official Holidays & Leaves
              </h1>
              <p className="text-xs text-[#78716C] mt-0.5">
                Configure calendar holidays, non-working days, and delivery blackout dates
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchHolidayList(currentPage, searchQuery)}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#E2DDD5] bg-white hover:bg-[#F7F4EE] text-[11px] font-medium text-[#4A443D] shadow-2xs transition-all cursor-pointer"
              >
                <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#1A1817] hover:bg-[#2C2825] text-[#FAF8F5] text-[11px] font-medium shadow-2xs transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 text-[#C99C4B]" />
                <span>Add Holiday</span>
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
                placeholder="Search holiday date or reason..."
                className="w-full pl-8 pr-3 py-1.5 text-[11px] rounded-lg border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition-all shadow-2xs placeholder-[#9C9488]"
              />
            </form>
          </div>

          {/* Holidays Table View */}
          {loading ? (
            <div className="bg-white rounded-2xl border border-[#E8E3DA] p-12 text-center shadow-2xs">
              <RefreshCw className="h-7 w-7 animate-spin text-[#9E7432] mx-auto mb-3" />
              <p className="text-xs font-medium text-[#78716C]">Loading holiday schedule...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E8E3DA] p-14 text-center shadow-2xs">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FBF4E8] text-[#9E7432] border border-[#F2E4C9] mb-4">
                <CalendarDays className="h-7 w-7" />
              </div>
              <h3 className="font-display text-base font-bold text-[#1A1817]">No holidays found</h3>
              <p className="text-xs text-[#8C8275] max-w-sm mx-auto mt-1 mb-5">
                {searchQuery || filterPeriod !== 'All'
                  ? 'No holidays match your filter criteria.'
                  : 'Your calendar has no official holidays added. Mark dates off to keep delivery schedules accurate.'}
              </p>
              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1A1817] text-[#FAF8F5] text-xs font-semibold shadow-xs hover:bg-[#2C2825] transition cursor-pointer"
              >
                <Plus className="h-4 w-4 text-[#C99C4B]" />
                <span>Add First Holiday</span>
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E8E3DA] overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E8E3DA] bg-[#FAF8F5] font-semibold text-[#5C554B]">
                      <th className="px-5 py-3 w-16">Sl.No</th>
                      <th className="px-5 py-3">Holiday Date</th>
                      <th className="px-5 py-3">Day of Week</th>
                      <th className="px-5 py-3">Occasion / Reason</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0ECE3]">
                    {filteredItems.map((item, index) => {
                      const id = item.id;
                      const date = item.holiday_date || item.date;
                      const name = item.holiday_name || item.name || 'Official Non-Working Holiday';
                      const rowNumber = (currentPage - 1) * perPage + index + 1;
                      const dateStatus = getDateStatus(date);

                      return (
                        <tr key={id || index} className="hover:bg-[#FAF8F5] transition-colors">
                          <td className="px-5 py-3.5 font-mono text-xs text-[#9C9488]">{rowNumber}</td>
                          
                          {/* Holiday Date */}
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FBF4E8] text-[#9E7432] border border-[#F2E4C9] font-mono text-xs font-bold flex-shrink-0">
                                <Calendar className="h-4 w-4" />
                              </div>
                              <div>
                                <span className="font-semibold text-xs text-[#1A1817] block">
                                  {formatHolidayDate(date)}
                                </span>
                                <span className="font-mono text-[10px] text-[#8C8275]">
                                  {formatDDMMYYYY(date)}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Day of Week */}
                          <td className="px-5 py-3.5 font-medium text-[#5C554B]">
                            {getDayOfWeek(date)}
                          </td>

                          {/* Occasion / Reason */}
                          <td className="px-5 py-3.5 font-medium text-[#1A1817]">
                            {name}
                          </td>

                          {/* Status Badge */}
                          <td className="px-5 py-3.5">
                            {dateStatus === 'today' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FBF4E8] text-[#9E7432] border border-[#F2E4C9]">
                                <Sparkles className="h-3 w-3" />
                                Today
                              </span>
                            ) : dateStatus === 'upcoming' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#EBF7EE] text-[#1E7E34] border border-[#C3E6CB]">
                                <Clock className="h-3 w-3" />
                                Upcoming
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#FAF8F5] text-[#8C8275] border border-[#E2DDD5]">
                                Past
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-3.5 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(item)}
                                title="Edit Holiday"
                                className="p-1.5 rounded-lg border border-[#DDD7CD] bg-white hover:bg-[#EFECE6] text-[#4A443D] transition shadow-2xs cursor-pointer"
                              >
                                <Edit2 className="h-3.5 w-3.5 text-[#9E7432]" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenDeleteModal(id)}
                                title="Delete Holiday"
                                className="p-1.5 rounded-lg border border-[#F6C8C8] bg-[#FDF0F0] hover:bg-[#FBEAEA] text-[#9A2D2D] transition shadow-2xs cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
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

      {/* Add / Edit Holiday Modal */}
      <HolidayModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        form={form}
        onChange={handleFormChange}
        setForm={setForm}
        editingId={editingId}
        submitting={submitting}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Holiday"
        message="Are you sure you want to remove this holiday from the schedule?"
        submitting={deleting}
      />
    </div>
  );
}
