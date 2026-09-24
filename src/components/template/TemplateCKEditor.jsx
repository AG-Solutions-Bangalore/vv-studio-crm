import React from 'react';
import RichTextEditor from '../common/RichTextEditor';

export default function TemplateCKEditor({ value, onChange, placeholder = 'Design your email template...' }) {
  return (
    <RichTextEditor
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      minHeight="220px"
    />
  );
}
