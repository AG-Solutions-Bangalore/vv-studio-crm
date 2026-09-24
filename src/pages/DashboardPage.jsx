import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import StatsSummaryBar from '../components/common/StatsSummaryBar';
import { getDashboardData } from '../services/dashboardApi';
import { useAuthContext } from '../context/AuthContext';
import {
  LayoutTemplate,
  MessageSquareText,
  Mail,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { hasEmail, isAdmin } = useAuthContext();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await getDashboardData();
      const payload = res?.data || res || {};
      setData(payload);
      if (isManual) {
        toast.success('Dashboard data refreshed.');
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      toast.error('Failed to load real-time dashboard data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // Helper to safely extract metric counts from varied backend response structures
  const getCount = (keys, fallback = 0) => {
    if (!data) return fallback;
    for (const k of keys) {
      if (data[k] !== undefined && data[k] !== null) {
        if (typeof data[k] === 'number') return data[k];
        if (typeof data[k] === 'string' && !isNaN(Number(data[k]))) return Number(data[k]);
        if (Array.isArray(data[k])) return data[k].length;
        if (typeof data[k] === 'object' && data[k]?.count !== undefined) return data[k].count;
        if (typeof data[k] === 'object' && data[k]?.total !== undefined) return data[k].total;
      }
    }
    return fallback;
  };

  // Primary Metrics parsed from GET /dashboard
  const templateCount = getCount(['template_count', 'templates_count', 'templates', 'total_templates']);
  const enquiryCount = getCount(['enquiry_count', 'enquiries_count', 'enquiries', 'total_enquiries']);
  const newsletterCount = getCount(['newsletter_count', 'newsletters_count', 'newsletters', 'newsletter', 'total_newsletters']);

  // Stats Summary Bar Cards matching the CRM system design
  const dashboardStats = useMemo(() => {
    const stats = [];

    // Message Templates belongs to Marketing -> Admin only
    if (isAdmin) {
      stats.push({
        label: 'Message Templates',
        value: templateCount,
        icon: LayoutTemplate,
        color: 'emerald',
        filterValue: 'template',
      });
    }

    stats.push({
      label: 'Customer Enquiries',
      value: enquiryCount,
      icon: MessageSquareText,
      color: 'amber',
      filterValue: 'enquiry',
    });

    if (hasEmail) {
      stats.push({
        label: 'Newsletter Subscribers',
        value: newsletterCount,
        icon: Mail,
        color: 'rose',
        filterValue: 'newsletter',
      });
    }

    return stats;
  }, [templateCount, enquiryCount, newsletterCount, hasEmail, isAdmin]);

  return (
    <div className="flex min-h-screen bg-[#F8F6F0] text-[#1A1817]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Dashboard" />

        <main className="flex-1 p-4 sm:p-5 max-w-7xl w-full flex flex-col justify-start gap-3">
          {/* Header Bar */}
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-sm md:text-base font-semibold text-[#1A1817] tracking-tight">
                Dashboard
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchDashboard(true)}
                disabled={refreshing || loading}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#E2DDD5] bg-white hover:bg-[#F7F4EE] text-[11px] font-medium text-[#4A443D] shadow-2xs transition-all cursor-pointer"
              >
                <RefreshCw className={`h-3 w-3 ${refreshing || loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Live API Stats Summary Cards */}
          <StatsSummaryBar
            stats={dashboardStats}
            onSelectFilter={(filter) => {
              if (filter === 'template') navigate('/template');
              else if (filter === 'enquiry') navigate('/enquiry');
              else if (filter === 'newsletter') navigate('/newsletter');
            }}
          />
        </main>
      </div>
    </div>
  );
}
