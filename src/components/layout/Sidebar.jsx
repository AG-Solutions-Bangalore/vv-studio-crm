import React, { useState, useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { useAuthContext } from '../../context/AuthContext';
import LogoutConfirmModal from '../common/LogoutConfirmModal';
import {
  LayoutDashboard,
  Layers,
  Image as ImageIcon,
  Building2,
  HelpCircle,
  Quote,
  FileText,
  MessageSquareText,
  Mail,
  Boxes,
  Users,
  LayoutTemplate,
  Workflow,
  MailCheck,
  Send,
  LogOut,
  PanelLeft,
  Download,
} from 'lucide-react';
import toast from 'react-hot-toast';

const dashboardItem = { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard };

const websiteNavItems = [
  { label: 'Category', to: '/category', icon: Layers },
  { label: 'Blogs Gallery', to: '/gallery', icon: ImageIcon },
  { label: 'Blogs', to: '/blog', icon: FileText },
  { label: 'Client', to: '/client', icon: Building2 },
  { label: 'FAQ', to: '/faq', icon: HelpCircle },
  { label: 'Testimonial', to: '/testimonial', icon: Quote },
  { label: 'Enquiries', to: '/enquiry', icon: MessageSquareText },
  { label: 'Newsletter', to: '/newsletter', icon: Mail },
];

const marketingNavItems = [
  { label: 'Groups', to: '/group', icon: Boxes, requires: 'any' },
  { label: 'Contact', to: '/contact', icon: Users, requires: 'any' },
  { label: 'Template', to: '/template', icon: LayoutTemplate, requires: 'any' },
  { label: 'Pipeline', to: '/pipeline', icon: Workflow, requires: 'whatsapp' },
  { label: 'Email Campaign', to: '/email-campaign', icon: MailCheck, requires: 'email' },
  { label: 'WhatsApp Campaign', to: '/whatsapp-campaign', icon: Send, requires: 'whatsapp' },
];

const reportsNavItems = [
  { label: 'Downloads', to: '/downloads', icon: Download },
];

export const Sidebar = () => {
  const navigate = useNavigate();
  const { companyInfo, companyLogoUrl, isSidebarCollapsed, toggleSidebar } = useAppContext();
  const { user, logout, hasEmail, hasWhatsApp, isAdmin } = useAuthContext();
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Filter marketing items according to user role and channel permissions
  // If user_type === 1 (standard user), marketing is completely hidden
  const visibleMarketingItems = useMemo(() => {
    if (!isAdmin) return [];
    return marketingNavItems.filter((item) => {
      if (item.requires === 'email') return hasEmail;
      if (item.requires === 'whatsapp') return hasWhatsApp;
      if (item.requires === 'any') return hasEmail || hasWhatsApp;
      return true;
    });
  }, [isAdmin, hasEmail, hasWhatsApp]);

  const handleConfirmLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      toast.success('Logged out successfully.');
      navigate('/login');
    } catch (err) {
      toast.error('Logout completed.');
      navigate('/login');
    } finally {
      setLoggingOut(false);
      setLogoutModalOpen(false);
    }
  };

  const renderNavLink = ({ label, to, icon: Icon }) => (
    <NavLink
      key={to}
      to={to}
      title={isSidebarCollapsed ? label : undefined}
      className={({ isActive }) =>
        `flex items-center ${isSidebarCollapsed ? 'justify-center px-2 py-2' : 'gap-3 px-3 py-2'
        } rounded-xl text-sm font-medium transition-all duration-150 ${isActive
          ? 'bg-[#1A1817] text-[#FAF8F5] shadow-2xs font-semibold'
          : 'text-[#5C554B] hover:bg-[#EDE8DE] hover:text-[#1A1817]'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-[#C99C4B]' : 'text-[#8C8275]'}`} />
          {!isSidebarCollapsed && (
            <>
              <span className="flex-1 tracking-tight text-[13px]">{label}</span>
              {isActive && (
                <span className="h-1.5 w-1.5 rounded-full bg-[#C99C4B]" />
              )}
            </>
          )}
        </>
      )}
    </NavLink>
  );

  return (
    <>
      <aside
        className={`sticky top-0 flex h-screen ${isSidebarCollapsed ? 'w-20 px-2' : 'w-64 px-4'
          } flex-col justify-between border-r border-[#E8E3DA] bg-[#F7F4EE] py-4 text-[#1A1817] select-none flex-shrink-0 z-30 transition-all duration-300`}
      >
        {/* Brand Header */}
        <div>
          {isSidebarCollapsed ? (
            <div className="flex flex-col items-center gap-2 pb-3.5 border-b border-[#E8E3DA]">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-[#E8E3DA] shadow-2xs overflow-hidden p-1">
                <img
                  src={companyLogoUrl || '/no_image.jpg'}
                  alt={companyInfo?.company_name || 'Logo'}
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    if (e.currentTarget.src !== window.location.origin + '/no_image.jpg') {
                      e.currentTarget.src = '/no_image.jpg';
                    }
                  }}
                />
              </div>
              <button
                type="button"
                onClick={toggleSidebar}
                title="Expand Sidebar"
                className="p-1.5 rounded-lg text-[#78716C] hover:text-[#1A1817] hover:bg-[#EDE8DE] transition cursor-pointer"
              >
                <PanelLeft className="h-4.5 w-4.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 px-1 pb-4 border-b border-[#E8E3DA]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-[#E8E3DA] shadow-2xs overflow-hidden p-1 shrink-0">
                  <img
                    src={companyLogoUrl || '/no_image.jpg'}
                    alt={companyInfo?.company_name || 'Logo'}
                    className="h-full w-full object-contain"
                    onError={(e) => {
                      if (e.currentTarget.src !== window.location.origin + '/no_image.jpg') {
                        e.currentTarget.src = '/no_image.jpg';
                      }
                    }}
                  />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xs font-bold text-[#1A1817] truncate tracking-tight">
                    {companyInfo?.company_name || 'Admin Portal'}
                  </h1>
                  <p className="text-[11px] font-medium tracking-wide text-[#8C8275]">
                    {companyInfo?.company_short ? `${companyInfo.company_short} Portal` : 'Admin Portal'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={toggleSidebar}
                title="Collapse Sidebar"
                className="p-1.5 rounded-lg text-[#78716C] hover:text-[#1A1817] hover:bg-[#EDE8DE] transition cursor-pointer shrink-0"
              >
                <PanelLeft className="h-4.5 w-4.5" />
              </button>
            </div>
          )}

          {/* Navigation Links with Section Headings */}
          <nav className="mt-3 space-y-1 max-h-[calc(100vh-165px)] overflow-y-auto pr-0.5 custom-scrollbar">

            {/* 1. Dashboard (Top-level) */}
            {renderNavLink(dashboardItem)}

            {/* 2. WEBSITE Section */}
            <div className="pt-2">
              {!isSidebarCollapsed ? (
                <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#9C9488]">
                  Website
                </div>
              ) : (
                <div className="my-1.5 border-t border-[#E8E3DA]" />
              )}
              <div className="space-y-0.5">
                {websiteNavItems.map(renderNavLink)}
              </div>
            </div>

            {/* 3. MARKETING Section (Conditional based on isEmail / isWhatsApp) */}
            {visibleMarketingItems.length > 0 && (
              <div className="pt-2">
                {!isSidebarCollapsed ? (
                  <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#9C9488]">
                    Marketing
                  </div>
                ) : (
                  <div className="my-1.5 border-t border-[#E8E3DA]" />
                )}
                <div className="space-y-0.5">
                  {visibleMarketingItems.map(renderNavLink)}
                </div>
              </div>
            )}

            {/* 4. REPORTS Section */}
            <div className="pt-2">
              {!isSidebarCollapsed ? (
                <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#9C9488]">
                  Reports
                </div>
              ) : (
                <div className="my-1.5 border-t border-[#E8E3DA]" />
              )}
              <div className="space-y-0.5">
                {reportsNavItems.map(renderNavLink)}
              </div>
            </div>

          </nav>
        </div>

        {/* Clickable Admin Profile Footer & Logout Button */}
        <div
          className={`border-t border-[#E8E3DA] pt-3 px-1 flex items-center ${isSidebarCollapsed ? 'flex-col gap-2' : 'justify-between'
            }`}
        >
          <div
            onClick={() => navigate('/profile')}
            title={`View & Edit Profile (${user?.name || 'Admin'})`}
            className={`flex items-center ${isSidebarCollapsed ? 'justify-center p-1' : 'gap-2.5 min-w-0 flex-1 p-1'
              } rounded-xl hover:bg-[#EDE8DE] transition cursor-pointer group`}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E5DFD5] group-hover:bg-[#1A1817] group-hover:text-[#FAF8F5] text-sm font-semibold text-[#1A1817] transition shadow-2xs shrink-0">
              {user?.name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'A'}
            </div>
            {!isSidebarCollapsed && (
              <div className="min-w-0">
                <div className="text-sm font-semibold text-[#1A1817] truncate transition">
                  {user?.name || user?.username || 'admin'}
                </div>
                {companyInfo?.company_place && (
                  <div className="text-xs text-[#8C8275] truncate">
                    {companyInfo.company_place}
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => setLogoutModalOpen(true)}
            title="Logout"
            className="p-2 text-[#8C8275] hover:text-[#9A2D2D] hover:bg-[#FBEAEA] rounded-xl transition-colors cursor-pointer shrink-0"
          >
            <LogOut className="h-4.5 w-4.5" />
          </button>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
        submitting={loggingOut}
      />
    </>
  );
};

export default Sidebar;
