'use client'
import React from 'react';
import Widget from '@/components/Widget';
import FileDropZone from './FileDropZone';
import ColumnMapper from './ColumnMapper';
import { autoMapColumns, parseWithMapping, readFileAsRows } from '@/lib/portfolio/parser';
import { ColumnMapping, ParsedRow, Transaction } from '@/lib/portfolio/types';
import { putTransactions, getAllTransactions } from '@/lib/portfolio/indexedDb';
import { computeDailyPortfolioValue, computeAllocation, computePerformanceByAsset } from '@/lib/portfolio/compute';
import TimeSeriesChart from './TimeSeriesChart';
import AllocationPie from './AllocationPie';
import PerformanceBar from './PerformanceBar';

export default function ImportWizard() {
  const [headers, setHeaders] = React.useState<string[]>([]);
  const [rawRows, setRawRows] = React.useState<Record<string, any>[]>([]);
  const [mapping, setMapping] = React.useState<ColumnMapping | null>(null);
  const [mapValid, setMapValid] = React.useState(false);
  const [preview, setPreview] = React.useState<ParsedRow[]>([]);
  const [importedChart, setImportedChart] = React.useState<{date:string; value:number}[]>([]);
  const [allocation, setAllocation] = React.useState<{name:string; value:number}[]>([]);
  const [performance, setPerformance] = React.useState<{name:string; value:number}[]>([]);

  async function handleFiles(files: FileList) {
    const file = files[0];
    const rows = await readFileAsRows(file);
    setRawRows(rows);
    const hdrs = rows.length ? Object.keys(rows[0]) : [];
    setHeaders(hdrs);
    const auto = autoMapColumns(hdrs);
    setMapping({
      date: auto.date || '',
      assetId: auto.assetId || '',
      type: auto.type || '',
      quantity: auto.quantity || '',
      price: auto.price || '',
      currency: auto.currency || '',
      fees: auto.fees || '',
      tag: auto.tag || '',
      notes: auto.notes || '',
    });
    setPreview([]);
    setImportedChart([]);
  }

  function onMappingChange(m: ColumnMapping, valid: boolean) {
    setMapping(m);
    setMapValid(valid);
  }

  function validateNow() {
    if (!mapping) return;
    const parsed = parseWithMapping(rawRows, mapping);
    setPreview(parsed);
  }

  async function importRows() {
    const valid = preview.filter(p => p.tx).map(p => p.tx!) as Transaction[];
    if (!valid.length) return;
    await putTransactions(valid);
    const all = await getAllTransactions();
    const series = computeDailyPortfolioValue(all as Transaction[]);
    setImportedChart(series);
    setAllocation(computeAllocation(all as Transaction[]));
    setPerformance(computePerformanceByAsset(all as Transaction[]));
  }

  return (
    <div className="space-y-6">
      <Widget title="Upload">
        <FileDropZone onFiles={handleFiles} />
      </Widget>

      {headers.length > 0 && mapping && (
        <Widget title="Map Columns">
          <ColumnMapper headers={headers} initial={mapping} onChange={onMappingChange} />
          <div className="mt-4 flex gap-3">
            <button
              disabled={!mapValid}
              className={`btn-primary ${!mapValid ? 'opacity-60 cursor-not-allowed' : ''}`}
              onClick={validateNow}
            >
              Validate & Preview
            </button>
          </div>
        </Widget>
      )}

      {preview.length > 0 && (
        <Widget title="Preview & Import">
          <div className="overflow-auto border border-primary rounded-md">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-primary">
                  {headers.map(h => <th key={h} className="text-left p-2 text-secondary">{h}</th>)}
                  <th className="text-left p-2 text-secondary">Validation</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} className="border-b border-primary">
                    {headers.map(h => <td key={h} className="p-2 text-primary">{String(row.raw[h] ?? '')}</td>)}
                    <td className="p-2">
                      {row.errors.length ? (
                        <span className="text-red-500">{row.errors.join('; ')}</span>
                      ) : (
                        <span className="text-green-500">OK</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between mt-4">
            <div className="text-secondary text-sm">
              {preview.length} rows • {preview.filter(r => r.errors.length).length} invalid
            </div>
            <button
              className="btn-primary"
              onClick={importRows}
              disabled={!preview.some(p => p.tx)}
              title={preview.some(p => p.tx) ? 'Import valid rows' : 'Nothing to import'}
            >
              Import Valid Rows
            </button>
          </div>
        </Widget>
      )}

      {importedChart.length > 0 && (
        <Widget title="Portfolio Value (Daily)">
          <TimeSeriesChart data={importedChart} />
        </Widget>
      )}

      {allocation.length > 0 && (
        <Widget title="Asset Allocation">
          <AllocationPie data={allocation} />
        </Widget>
      )}

      {performance.length > 0 && (
        <Widget title="Performance by Asset">
          <PerformanceBar data={performance} />
        </Widget>
      )}
    </div>
  );
}


