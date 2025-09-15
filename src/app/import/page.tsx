'use client'
import Widget from '@/components/Widget';
import ImportWizard from '@/components/import/ImportWizard';

export default function ImportPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <Widget className="mb-6">
        <div className="text-primary text-2xl font-bold">Obsidian • Import Portfolio</div>
        <div className="text-secondary">Upload your CSV/Excel, map columns, validate, and import.</div>
      </Widget>
      <ImportWizard />
    </div>
  );
}


