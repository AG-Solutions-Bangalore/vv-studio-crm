import React from 'react';
import { CKEditor } from 'ckeditor4-react';

export default function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'Write content here...',
  minHeight = '220px',
  height = 250,
}) {
  return (
    <div
      className="ckeditor4-wrapper rounded-xl border border-[#E2DDD5] bg-white overflow-hidden text-[#1A1817] shadow-2xs"
      style={{ '--ck-min-height': minHeight }}
    >
      <CKEditor
        initData={value || ''}
        data={value || ''}
        onBeforeLoad={(CKEDITOR) => {
          if (CKEDITOR && CKEDITOR.config) {
            CKEDITOR.config.versionCheck = false;
          }
        }}
        onChange={(event) => {
          const data = event.editor.getData();
          if (onChange) {
            onChange(data);
          }
        }}
        config={{
          versionCheck: false,
          extraPlugins: 'colorbutton,font,justify',
          placeholder: placeholder,
          height: height || 250,
          toolbar: [
            { name: 'document', items: ['Source', '-', 'Preview'] },
            { name: 'clipboard', items: ['Cut', 'Copy', 'Paste', 'PasteText', 'PasteFromWord', '-', 'Undo', 'Redo'] },
            { name: 'editing', items: ['Find', 'Replace', '-', 'SelectAll'] },
            '/',
            { name: 'basicstyles', items: ['Bold', 'Italic', 'Underline', 'Strike', 'Subscript', 'Superscript', '-', 'CopyFormatting', 'RemoveFormat'] },
            { name: 'paragraph', items: ['NumberedList', 'BulletedList', '-', 'Outdent', 'Indent', '-', 'Blockquote', '-', 'JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock'] },
            { name: 'links', items: ['Link', 'Unlink', 'Anchor'] },
            { name: 'insert', items: ['Image', 'Table', 'HorizontalRule', 'SpecialChar'] },
            '/',
            { name: 'styles', items: ['Styles', 'Format', 'Font', 'FontSize'] },
            { name: 'colors', items: ['TextColor', 'BGColor'] },
            { name: 'tools', items: ['Maximize', 'ShowBlocks'] },
          ],
          removeButtons: '',
        }}
      />
    </div>
  );
}

