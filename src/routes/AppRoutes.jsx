import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import ChangePasswordPage from '../pages/ChangePasswordPage';
import ProfilePage from '../pages/ProfilePage';
import DashboardPage from '../pages/DashboardPage';
import CategoryPage from '../pages/CategoryPage';
import BlogPage from '../pages/BlogPage';
import BlogFormPage from '../pages/BlogFormPage';
import BlogViewPage from '../pages/BlogViewPage';
import EnquiryPage from '../pages/EnquiryPage';
import NewsletterPage from '../pages/NewsletterPage';
import GalleryPage from '../pages/GalleryPage';
import FaqPage from '../pages/FaqPage';
import FaqFormPage from '../pages/FaqFormPage';
import TestimonialPage from '../pages/TestimonialPage';
import TestimonialFormPage from '../pages/TestimonialFormPage';
import ClientPage from '../pages/ClientPage';
import GroupPage from '../pages/GroupPage';
import ContactPage from '../pages/ContactPage';
import HolidayPage from '../pages/HolidayPage';
import TemplatePage from '../pages/TemplatePage';
import TemplateFormPage from '../pages/TemplateFormPage';
import PipelinePage from '../pages/PipelinePage';
import PipelineFormPage from '../pages/PipelineFormPage';
import WhatsAppCampaignPage from '../pages/WhatsAppCampaignPage';
import EmailCampaignPage from '../pages/EmailCampaignPage';
import EmailCampaignFormPage from '../pages/EmailCampaignFormPage';
import EmailCampaignViewPage from '../pages/EmailCampaignViewPage';
import CompanyPage from '../pages/CompanyPage';
import DownloadsPage from '../pages/DownloadsPage';
import AuthRoute from './AuthRoute';
import ProtectedRoute from './ProtectedRoute';

import { useAuthContext } from '../context/AuthContext';

export default function AppRoutes() {
  const { hasEmail, hasWhatsApp, isAdmin } = useAuthContext();

  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<AuthRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      {/* Protected Routes (Require Token) */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/company" element={<CompanyPage />} />
        <Route path="/category" element={<CategoryPage />} />
        
        {/* Marketing Routes (Admin only: user_type === 2) */}
        <Route path="/group" element={isAdmin ? <GroupPage /> : <Navigate to="/dashboard" replace />} />
        <Route path="/contact" element={isAdmin ? <ContactPage /> : <Navigate to="/dashboard" replace />} />
        <Route path="/holiday" element={isAdmin ? <HolidayPage /> : <Navigate to="/dashboard" replace />} />
        <Route path="/template" element={isAdmin ? <TemplatePage /> : <Navigate to="/dashboard" replace />} />
        <Route path="/template/create" element={isAdmin ? <TemplateFormPage /> : <Navigate to="/dashboard" replace />} />
        <Route path="/template/add" element={isAdmin ? <TemplateFormPage /> : <Navigate to="/dashboard" replace />} />
        <Route path="/template/edit/:id" element={isAdmin ? <TemplateFormPage /> : <Navigate to="/dashboard" replace />} />
        
        {/* WhatsApp Marketing Routes (Admin + WhatsApp enabled) */}
        <Route
          path="/pipeline"
          element={isAdmin && hasWhatsApp ? <PipelinePage /> : <Navigate to="/dashboard" replace />}
        />
        <Route
          path="/pipeline/create"
          element={isAdmin && hasWhatsApp ? <PipelineFormPage /> : <Navigate to="/dashboard" replace />}
        />
        <Route
          path="/pipeline/add"
          element={isAdmin && hasWhatsApp ? <PipelineFormPage /> : <Navigate to="/dashboard" replace />}
        />
        <Route
          path="/pipeline/edit/:id"
          element={isAdmin && hasWhatsApp ? <PipelineFormPage /> : <Navigate to="/dashboard" replace />}
        />
        <Route
          path="/whatsapp-campaign"
          element={isAdmin && hasWhatsApp ? <WhatsAppCampaignPage /> : <Navigate to="/dashboard" replace />}
        />
        <Route
          path="/whatsappcampaign"
          element={isAdmin && hasWhatsApp ? <WhatsAppCampaignPage /> : <Navigate to="/dashboard" replace />}
        />

        {/* Email Marketing Routes (Admin + Email enabled) */}
        <Route
          path="/email-campaign"
          element={isAdmin && hasEmail ? <EmailCampaignPage /> : <Navigate to="/dashboard" replace />}
        />
        <Route
          path="/email-campaign/create"
          element={isAdmin && hasEmail ? <EmailCampaignFormPage /> : <Navigate to="/dashboard" replace />}
        />
        <Route
          path="/email-campaign/add"
          element={isAdmin && hasEmail ? <EmailCampaignFormPage /> : <Navigate to="/dashboard" replace />}
        />
        <Route
          path="/email-campaign/view/:id"
          element={isAdmin && hasEmail ? <EmailCampaignViewPage /> : <Navigate to="/dashboard" replace />}
        />
        <Route
          path="/emailcampaign"
          element={isAdmin && hasEmail ? <EmailCampaignPage /> : <Navigate to="/dashboard" replace />}
        />
        <Route
          path="/emailcampaign/create"
          element={isAdmin && hasEmail ? <EmailCampaignFormPage /> : <Navigate to="/dashboard" replace />}
        />
        <Route
          path="/emailcampaign/add"
          element={isAdmin && hasEmail ? <EmailCampaignFormPage /> : <Navigate to="/dashboard" replace />}
        />
        <Route
          path="/emailcampaign/view/:id"
          element={isAdmin && hasEmail ? <EmailCampaignViewPage /> : <Navigate to="/dashboard" replace />}
        />
        <Route
          path="/newsletter"
          element={hasEmail ? <NewsletterPage /> : <Navigate to="/dashboard" replace />}
        />

        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/create" element={<BlogFormPage />} />
        <Route path="/blog/add" element={<BlogFormPage />} />
        <Route path="/blog/edit/:id" element={<BlogFormPage />} />
        <Route path="/blog/view/:id" element={<BlogViewPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/faq/create" element={<FaqFormPage />} />
        <Route path="/faq/add" element={<FaqFormPage />} />
        <Route path="/faq/edit/:id" element={<FaqFormPage />} />
        <Route path="/testimonial" element={<TestimonialPage />} />
        <Route path="/testimonial/create" element={<TestimonialFormPage />} />
        <Route path="/testimonial/add" element={<TestimonialFormPage />} />
        <Route path="/testimonial/edit/:id" element={<TestimonialFormPage />} />
        <Route path="/client" element={<ClientPage />} />
        <Route path="/enquiry" element={<EnquiryPage />} />
        <Route path="/downloads" element={<DownloadsPage />} />
        <Route path="/download" element={<DownloadsPage />} />
        <Route path="/reports/downloads" element={<DownloadsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />
      </Route>

      {/* Fallback redirect */}
      <Route path="*" element={<Navigate to="/category" replace />} />
    </Routes>
  );
}
