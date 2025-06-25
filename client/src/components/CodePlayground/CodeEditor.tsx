import React, { useState, useRef } from 'react';
import Editor from '@monaco-editor/react';

interface CodeEditorProps {
  defaultLanguage?: string;
  defaultValue?: string;
  height?: string;
  onChange?: (value: string | undefined) => void;
  readOnly?: boolean;
  theme?: 'vs-dark' | 'light';
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  defaultLanguage = 'javascript',
  defaultValue = '// Write your code here\n',
  height = '400px',
  onChange,
  readOnly = false,
  theme = 'vs-dark',
}) => {
  const editorRef = useRef<any>(null);
  const [value, setValue] = useState(defaultValue);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  const handleChange = (value: string | undefined) => {
    setValue(value || '');
    if (onChange) {
      onChange(value);
    }
  };

  return (
    <div className="border rounded-md overflow-hidden">
      <Editor
        height={height}
        defaultLanguage={defaultLanguage}
        defaultValue={defaultValue}
        value={value}
        onChange={handleChange}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 14,
          readOnly,
          wordWrap: 'on',
          automaticLayout: true,
        }}
        theme={theme}
      />
    </div>
  );
};

export default CodeEditor;
