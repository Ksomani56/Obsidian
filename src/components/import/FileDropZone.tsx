'use client'
import React from 'react';

interface Props {
  onFiles: (files: FileList) => void;
}
export default function FileDropZone({ onFiles }: Props) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div
      className="border-primary bg-primary rounded-md p-6 text-center cursor-pointer hover:bg-light-hover dark:hover:bg-dark-hover"
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        if (e.dataTransfer.files?.length) onFiles(e.dataTransfer.files);
      }}
      title="Upload CSV or Excel"
    >
      <p className="text-primary font-medium">Drop .csv / .xlsx / .xls here or click to browse</p>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
        className="hidden"
        onChange={(e) => e.target.files && onFiles(e.target.files)}
      />
    </div>
  );
}


