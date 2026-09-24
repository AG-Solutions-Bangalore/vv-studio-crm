import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import {
  LayoutTemplate,
  Mail,
  MessageSquare,
  Link as LinkIcon,
  Save,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Eye,
  Layers,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import {
  createTemplate,
  updateTemplate,
  getTemplateById,
} from '../services/templateApi';
import { useAuthContext } from '../context/AuthContext';
import TemplateCKEditor from '../components/template/TemplateCKEditor';
import toast from 'react-hot-toast';

export default function TemplateFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const { hasEmail, hasWhatsApp } = useAuthContext();

  const defaultFormType = !hasEmail && hasWhatsApp ? 'WhatsApp' : 'Email';

  const [form, setForm] = useState({
    template_name: '',
    template_type: defaultFormType,
    template_id: '',
    template_url: '',
    template_design: '',
    template_status: 'Active',
  });

  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [errors, setErrors] = useState({});
  const [previewTab, setPreviewTab] = useState('editor'); // 'editor' | 'preview'

  useEffect(() => {
    if (isEditing) {
      loadTemplateDetails(id);
    } else {
      if (!hasEmail && hasWhatsApp) {
        setForm((prev) => ({
          ...prev,
          template_type: 'WhatsApp',
          template_url: '',
          template_design: '',
        }));
      } else if (hasEmail && !hasWhatsApp) {
        setForm((prev) => ({
          ...prev,
          template_type: 'Email',
        }));
      }
    }
  }, [id, isEditing, hasEmail, hasWhatsApp]);

  const loadTemplateDetails = async (templateId) => {
    setFetchingData(true);
    try {
      const res = await getTemplateById(templateId);
      const data = res?.data?.data || res?.data || res?.template || res || {};

      const type = data.template_type || (data.template_design || data.template_url ? 'Email' : 'WhatsApp');
      const name = data.template_name || data.name || '';
      const tId = type === 'Email' ? name : (data.template_id || data.id || name);

      setForm({
        template_name: name,
        template_type: type,
        template_id: tId,
        template_url: data.template_url || '',
        template_design: data.template_design || data.design || '',
        template_status: data.template_status || data.status || 'Active',
      });
    } catch (err) {
      console.error('Failed to load template:', err);
      toast.error('Could not load template details.');
      navigate('/template');
    } finally {
      setFetchingData(false);
    }
  };

  const isEmail = form.template_type === 'Email';

  const handleTypeChange = (type) => {
    setForm((prev) => ({
      ...prev,
      template_type: type,
      template_id: type === 'Email' ? prev.template_name : prev.template_id,
      template_url: type === 'WhatsApp' ? '' : (prev.template_url || ''),
      template_design: type === 'WhatsApp' ? '' : (prev.template_design || ''),
    }));
    setErrors({});
  };

  const handleNameChange = (e) => {
    const val = e.target.value;
    if (errors.template_name) {
      setErrors((prev) => ({ ...prev, template_name: null }));
    }
    setForm((prev) => ({
      ...prev,
      template_name: val,
      template_id: prev.template_type === 'Email' ? val : prev.template_id,
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const newErrors = {};

    if (!form.template_name?.trim()) {
      newErrors.template_name = 'Template name is required.';
    }

    if (isEmail) {
      if (!form.template_url?.trim()) {
        newErrors.template_url = 'Template Preview / Webview URL is required for Email templates.';
      }
      if (!form.template_design?.trim()) {
        newErrors.template_design = 'Template HTML design content is required for Email templates.';
      }
    } else {
      if (!form.template_id?.trim()) {
        newErrors.template_id = 'WhatsApp Template ID is required.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validate()) {
      toast.error('Please complete all required fields.');
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        await updateTemplate(id, form);
        toast.success('Template updated successfully!');
      } else {
        await createTemplate(form);
        toast.success('Template created successfully!');
      }
      navigate('/template');
    } catch (err) {
      console.error('Failed to save template:', err);
      const msg = err?.response?.data?.message || err?.message || 'Failed to save template.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <div className="flex min-h-screen bg-[#F8F6F0] text-[#1A1817]">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header title={isEditing ? 'Edit Template' : 'New Template'} />
          <main className="flex-1 p-6 flex items-center justify-center">
            <div className="text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-[#9E7432] mx-auto" />
              <p className="text-sm font-medium text-[#78716C]">Loading template details...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8F6F0] text-[#1A1817]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header title={isEditing ? 'Edit Template' : 'New Template'} />

        <main className="flex-1 p-5 md:p-8 max-w-5xl w-full mx-auto space-y-6">
          
          {/* Breadcrumb & Navigation Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <Link
                to="/template"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E2DDD5] bg-white hover:bg-[#F7F4EE] text-xs font-semibold text-[#4A443D] shadow-2xs transition"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Templates</span>
              </Link>
              <div className="flex items-center gap-1.5 text-xs text-[#9C9488]">
                <span>/</span>
                <Link to="/template" className="hover:text-[#1A1817]">Templates</Link>
                <span>/</span>
                <span className="text-[#1A1817] font-medium truncate max-w-[200px]">
                  {isEditing ? (form.template_name || 'Edit Template') : 'Create Template'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/template')}
                className="px-4 py-2 rounded-xl border border-[#DDD7CD] bg-white hover:bg-[#F2EFEB] text-xs font-medium text-[#4A443D] transition shadow-2xs cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#1A1817] hover:bg-[#2C2825] text-[#FAF8F5] text-xs font-semibold shadow-xs transition active:scale-95 disabled:bg-[#A39C91] cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-[#C99C4B]" />
                ) : (
                  <Save className="h-4 w-4 text-[#C99C4B]" />
                )}
                <span>{loading ? 'Saving...' : isEditing ? 'Update Template' : 'Create Template'}</span>
              </button>
            </div>
          </div>

          {/* Form Header Card */}
          <div className="bg-white rounded-2xl border border-[#E8E3DA] p-6 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="h-12 w-12 rounded-2xl bg-[#FBF4E8] text-[#9E7432] border border-[#F2E4C9] flex items-center justify-center flex-shrink-0 shadow-2xs">
                  <LayoutTemplate className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-[#1A1817] tracking-tight">
                    {isEditing ? 'Edit Message Template' : 'Create Message Template'}
                  </h1>
                  <p className="text-xs text-[#78716C] mt-0.5">
                    {isEditing
                      ? 'Update template layout, variables, and delivery formatting.'
                      : hasEmail && hasWhatsApp
                      ? 'Design reusable Email and WhatsApp templates for marketing campaigns.'
                      : hasEmail
                      ? 'Design reusable Email campaign templates.'
                      : 'Create reusable WhatsApp marketing templates.'}
                  </p>
                </div>
              </div>

              {/* Status pill preview */}
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                  form.template_status === 'Active'
                    ? 'bg-[#EDF7EE] text-[#1E6B34] border-[#C6E6CC]'
                    : 'bg-[#FDF0F0] text-[#9A2D2D] border-[#F6C8C8]'
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${form.template_status === 'Active' ? 'bg-[#1E6B34]' : 'bg-[#9A2D2D]'}`} />
                  <span>{form.template_status === 'Active' ? 'Active' : 'Inactive'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Form Body Card */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-2xl border border-[#E8E3DA] p-6 shadow-2xs space-y-5">
              
              {/* Template Type Selector (If user has both Email & WhatsApp) */}
              {hasEmail && hasWhatsApp && (
                <div>
                  <label className="block text-xs font-semibold text-[#3D372E] mb-2">
                    Template Type <span className="text-[#9A2D2D]">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <button
                      type="button"
                      onClick={() => handleTypeChange('Email')}
                      className={`flex items-center gap-3 p-4 rounded-xl border text-xs font-semibold transition cursor-pointer text-left ${
                        isEmail
                          ? 'bg-[#1A1817] text-[#FAF8F5] border-[#1A1817] shadow-xs'
                          : 'bg-[#FAF8F5] text-[#5C554B] border-[#E2DDD5] hover:bg-[#F5EFE3]'
                      }`}
                    >
                      <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${isEmail ? 'bg-white/15 text-[#C99C4B]' : 'bg-white text-[#8C8275] border border-[#E2DDD5]'}`}>
                        <Mail className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="block font-bold">Email Template</span>
                        <span className={`text-[11px] block mt-0.5 font-normal ${isEmail ? 'text-[#FAF8F5]/80' : 'text-[#8C8275]'}`}>
                          HTML rich formatted newsletter and broadcast layouts
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTypeChange('WhatsApp')}
                      className={`flex items-center gap-3 p-4 rounded-xl border text-xs font-semibold transition cursor-pointer text-left ${
                        !isEmail
                          ? 'bg-[#1A1817] text-[#FAF8F5] border-[#1A1817] shadow-xs'
                          : 'bg-[#FAF8F5] text-[#5C554B] border-[#E2DDD5] hover:bg-[#F5EFE3]'
                      }`}
                    >
                      <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${!isEmail ? 'bg-white/15 text-[#25D366]' : 'bg-white text-[#8C8275] border border-[#E2DDD5]'}`}>
                        <MessageSquare className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="block font-bold">WhatsApp Template</span>
                        <span className={`text-[11px] block mt-0.5 font-normal ${!isEmail ? 'text-[#FAF8F5]/80' : 'text-[#8C8275]'}`}>
                          Meta approved WhatsApp message templates
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Template Name and ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
                    Template Name <span className="text-[#9A2D2D]">*</span>
                  </label>
                  <input
                    type="text"
                    name="template_name"
                    value={form.template_name}
                    onChange={handleNameChange}
                    placeholder={isEmail ? 'e.g. Wedding Welcome Newsletter' : 'e.g. order_delivery_update'}
                    className={`w-full px-4 py-2.5 text-sm rounded-xl border ${
                      errors.template_name ? 'border-[#E05252] bg-[#FFF5F5] ring-1 ring-[#E05252]' : 'border-[#E2DDD5] bg-[#FAF8F5]'
                    } text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition shadow-2xs`}
                  />
                  {errors.template_name && (
                    <p className="mt-1 text-xs text-[#E05252] flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.template_name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
                    Template ID {isEmail ? <span className="text-[11px] text-[#8C8275] font-normal">• Auto-synced with name</span> : <span className="text-[#9A2D2D]">*</span>}
                  </label>
                  <input
                    type="text"
                    name="template_id"
                    value={isEmail ? form.template_name : form.template_id}
                    onChange={handleInputChange}
                    readOnly={isEmail}
                    placeholder={isEmail ? 'Auto-synced with template name' : 'e.g. invitation_followup_v1'}
                    className={`w-full px-4 py-2.5 text-sm rounded-xl border transition shadow-2xs font-mono ${
                      isEmail
                        ? 'border-[#E8E3DA] bg-[#F0ECE3]/60 text-[#78716C] cursor-not-allowed'
                        : errors.template_id
                        ? 'border-[#E05252] bg-[#FFF5F5] ring-1 ring-[#E05252]'
                        : 'border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white'
                    }`}
                  />
                  {errors.template_id && (
                    <p className="mt-1 text-xs text-[#E05252] flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.template_id}
                    </p>
                  )}
                </div>
              </div>

              {/* Email-Only Details: URL & Design Editor */}
              {isEmail && (
                <>
                  {/* Template URL */}
                  <div>
                    <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
                      Template Preview / Webview URL <span className="text-[#9A2D2D]">*</span>
                    </label>
                    <div className="relative">
                      <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9C9488]" />
                      <input
                        type="url"
                        name="template_url"
                        value={form.template_url}
                        onChange={handleInputChange}
                        placeholder="https://easemarketing.in/templates/sample-preview.html"
                        className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border ${
                          errors.template_url ? 'border-[#E05252] bg-[#FFF5F5] ring-1 ring-[#E05252]' : 'border-[#E2DDD5] bg-[#FAF8F5]'
                        } text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition shadow-2xs`}
                      />
                    </div>
                    {errors.template_url && (
                      <p className="mt-1 text-xs text-[#E05252] flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.template_url}
                      </p>
                    )}
                  </div>

                  {/* Template Design CKEditor & Live Preview */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-semibold text-[#3D372E]">
                        Template Design & HTML Content <span className="text-[#9A2D2D]">*</span>
                      </label>
                      <div className="flex items-center gap-1 bg-[#FAF8F5] border border-[#E2DDD5] p-0.5 rounded-lg">
                        <button
                          type="button"
                          onClick={() => setPreviewTab('editor')}
                          className={`px-2.5 py-1 text-xs font-medium rounded-md transition cursor-pointer ${
                            previewTab === 'editor'
                              ? 'bg-white text-[#1A1817] shadow-2xs font-semibold'
                              : 'text-[#78716C] hover:text-[#1A1817]'
                          }`}
                        >
                          Editor
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewTab('preview')}
                          className={`px-2.5 py-1 text-xs font-medium rounded-md transition cursor-pointer flex items-center gap-1 ${
                            previewTab === 'preview'
                              ? 'bg-white text-[#1A1817] shadow-2xs font-semibold'
                              : 'text-[#78716C] hover:text-[#1A1817]'
                          }`}
                        >
                          <Eye className="h-3 w-3" />
                          <span>Preview</span>
                        </button>
                      </div>
                    </div>

                    {previewTab === 'editor' ? (
                      <div className="space-y-1">
                        <TemplateCKEditor
                          value={form.template_design || ''}
                          onChange={(htmlContent) => {
                            if (errors.template_design) {
                              setErrors((prev) => ({ ...prev, template_design: null }));
                            }
                            setForm((prev) => ({ ...prev, template_design: htmlContent }));
                          }}
                          placeholder="Design and format your rich email campaign template here..."
                        />
                      </div>
                    ) : (
                      <div className="border border-[#E8E3DA] rounded-xl p-6 bg-white min-h-[300px] overflow-y-auto">
                        {form.template_design ? (
                          <div
                            className="prose prose-sm max-w-none text-[#2C2825]"
                            dangerouslySetInnerHTML={{ __html: form.template_design }}
                          />
                        ) : (
                          <p className="text-xs text-[#9C9488] text-center py-12 italic">
                            No design content entered yet. Switch back to Editor to write content.
                          </p>
                        )}
                      </div>
                    )}

                    {errors.template_design && (
                      <p className="mt-1.5 text-xs text-[#E05252] flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.template_design}
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* WhatsApp Instructions */}
              {!isEmail && (
                <div className="bg-[#FAF8F5] border border-[#E8E3DA] rounded-xl p-4 flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-[#E6F8EE] text-[#1E7E34] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#1A1817]">WhatsApp Cloud API Template</h4>
                    <p className="text-xs text-[#78716C] mt-0.5 leading-relaxed">
                      Ensure the template ID matches exactly with your registered template in Meta Business Manager. Dynamic parameters will be populated automatically during broadcast.
                    </p>
                  </div>
                </div>
              )}

              {/* Status Selector (Editing Mode) */}
              {isEditing && (
                <div className="pt-2 border-t border-[#F0ECE3]">
                  <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
                    Template Status
                  </label>
                  <select
                    name="template_status"
                    value={form.template_status}
                    onChange={handleInputChange}
                    className="w-full sm:w-64 px-4 py-2.5 text-sm rounded-xl border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition shadow-2xs cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              )}

              {/* Form Bottom Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-[#F0ECE3]">
                <button
                  type="button"
                  onClick={() => navigate('/template')}
                  className="px-4 py-2 rounded-xl border border-[#DDD7CD] bg-white hover:bg-[#F2EFEB] text-xs font-medium text-[#4A443D] transition cursor-pointer shadow-2xs"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#1A1817] hover:bg-[#2C2825] text-[#FAF8F5] text-xs font-semibold shadow-xs transition active:scale-95 disabled:bg-[#A39C91] cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-[#C99C4B]" />
                  ) : (
                    <Save className="h-4 w-4 text-[#C99C4B]" />
                  )}
                  <span>{loading ? 'Saving...' : isEditing ? 'Update Template' : 'Create Template'}</span>
                </button>
              </div>

            </div>
          </form>

        </main>
      </div>
    </div>
  );
}
