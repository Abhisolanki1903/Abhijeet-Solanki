
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { LabRecord, SAMPLE_POINTS, ATTRIBUTES, DEFAULT_LIMITS, UserRole } from '../types';
import { getRecords, saveRecord, createRecord } from '../services/storage';
import { useAuth } from '../context/AuthContext';
import { Save, Lock, Loader2 } from 'lucide-react';

interface DailyDataGridProps {
  selectedDate: string;
}

// Helper to find a record
const findRecord = (records: LabRecord[], date: string, point: string, attr: string) => {
  return records.find(r => r.date === date && r.samplePoint === point && r.attribute === attr);
};

export const DailyDataGrid: React.FC<DailyDataGridProps> = ({ selectedDate }) => {
  const { user } = useAuth();
  const [gridData, setGridData] = useState<Record<string, Partial<LabRecord>>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Permissions
  const isDateInPast = new Date(selectedDate) < new Date(new Date().setHours(0,0,0,0));
  const canEdit = user?.role === UserRole.ADMIN || !isDateInPast;

  // Create an ordered list of keys to determine save order
  const orderedKeys = useMemo(() => {
    const keys: string[] = [];
    SAMPLE_POINTS.forEach(point => {
        ATTRIBUTES.forEach(attr => {
            keys.push(`${point}-${attr}`);
        });
    });
    return keys;
  }, []);

  // Load data for the view
  const loadData = useCallback(() => {
    setLoading(true);
    const allRecords = getRecords();
    const currentData: Record<string, Partial<LabRecord>> = {};

    SAMPLE_POINTS.forEach(point => {
      ATTRIBUTES.forEach(attr => {
        const key = `${point}-${attr}`;
        const existing = findRecord(allRecords, selectedDate, point, attr);
        
        if (existing) {
          currentData[key] = { ...existing };
        } else {
          // Init empty state
          currentData[key] = {
            samplePoint: point,
            attribute: attr,
            date: selectedDate,
            limit: DEFAULT_LIMITS[attr] || '',
            value: '',
            observation24h: '',
            observation48h: '',
            observation72h: '',
            negativeControl: '',
            remarks: ''
          };
        }
      });
    });

    setGridData(currentData);
    setLoading(false);
  }, [selectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleChange = (point: string, attr: string, field: keyof LabRecord, value: string) => {
    if (!canEdit) return;
    const key = `${point}-${attr}`;
    setGridData(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value }
    }));
  };

  const handleSaveAll = async () => {
    if (!canEdit) return;
    setSaving(true);

    let savedCount = 0;

    // Iterate through all grid entries
    orderedKeys.forEach((key) => {
        const data = gridData[key];
        if (!data) return;

        // Check if the row has any meaningful data to save (excluding default fields)
        // Note: 'value' is removed from UI but checked here just in case data exists from legacy
        const hasData = data.value || data.observation24h || data.observation48h || data.observation72h || data.negativeControl || data.remarks;
        
        if (data.id) {
            // It's an existing record, update it
             const updateData = {
                ...data,
                lastModifiedBy: user?.username,
                lastModifiedAt: new Date().toISOString(),
            } as LabRecord;
            saveRecord(updateData);
            savedCount++;
        } else if (hasData) {
            // New record with data, create it
            createRecord({
              ...data,
              date: selectedDate,
              samplePoint: data.samplePoint,
              attribute: data.attribute,
              value: data.value || '', // Value is now likely empty if not entered elsewhere
              limit: data.limit || '',
              observation24h: data.observation24h || '',
              observation48h: data.observation48h || '',
              observation72h: data.observation72h || '',
              negativeControl: data.negativeControl || '',
              remarks: data.remarks || '',
              createdBy: user?.username || 'Unknown',
              createdById: user?.id || 'unknown',
            } as any);
            savedCount++;
        }
    });

    // Simulate network delay for UX
    await new Promise(resolve => setTimeout(resolve, 600));
    
    setSaving(false);
    // Reload data to ensure we get the new IDs for created records
    loadData();
    
    alert(`Successfully saved ${savedCount} entries.`);
  };

  if (loading) return <div className="p-8 text-center text-slate-500 flex items-center justify-center"><Loader2 className="animate-spin w-6 h-6 mr-2"/> Loading data...</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Toolbar */}
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center">
                {!canEdit && (
                    <div className="text-amber-700 text-sm flex items-center font-medium px-3 py-1 bg-amber-50 rounded-lg border border-amber-200">
                        <Lock className="w-3.5 h-3.5 mr-2" />
                        Read Only: Past Date
                    </div>
                )}
            </div>
            
            <button
                onClick={handleSaveAll}
                disabled={!canEdit || saving}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-all
                    ${canEdit 
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow' 
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }
                    ${saving ? 'opacity-75 cursor-wait' : ''}
                `}
            >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {saving ? 'Saving...' : 'Save All Changes'}
            </button>
        </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-slate-50 text-slate-700 font-bold">
            <tr>
              <th className="px-4 py-3 border-b border-r border-slate-200 w-48">Sampling Location</th>
              <th className="px-4 py-3 border-b border-r border-slate-200 w-32">Attribute</th>
              <th className="px-4 py-3 border-b border-r border-slate-200 w-32">Limit</th>
              <th className="px-2 py-3 border-b border-slate-200 w-24 text-center">24 Hours</th>
              <th className="px-2 py-3 border-b border-slate-200 w-24 text-center">48 Hours</th>
              <th className="px-2 py-3 border-b border-slate-200 w-24 text-center">72 Hours</th>
              <th className="px-2 py-3 border-b border-slate-200 w-24 text-center">Neg. Control</th>
              <th className="px-4 py-3 border-b border-slate-200">Remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {SAMPLE_POINTS.map((point, pointIndex) => (
              <React.Fragment key={point}>
                {ATTRIBUTES.map((attr, index) => {
                  const key = `${point}-${attr}`;
                  const rowData = gridData[key] || {};

                  return (
                    <tr key={key} className="hover:bg-slate-50 transition-colors">
                      {/* Sampling Point Cell - Only render on first attribute */}
                      {index === 0 && (
                        <td 
                            className="px-4 py-3 border-r border-slate-200 font-medium text-slate-900 bg-white align-top" 
                            rowSpan={ATTRIBUTES.length}
                        >
                          {point}
                        </td>
                      )}
                      
                      {/* Attribute */}
                      <td className="px-4 py-2 border-r border-slate-200 font-medium text-slate-600">
                        {attr}
                      </td>

                      {/* Limit */}
                      <td className="px-4 py-2 border-r border-slate-200 text-slate-400 text-xs">
                         <input 
                             type="text" 
                             value={rowData.limit || ''}
                             onChange={(e) => handleChange(point, attr, 'limit', e.target.value)}
                             disabled={!canEdit}
                             className="w-full bg-transparent outline-none border-b border-transparent focus:border-indigo-300 transition-colors"
                             placeholder={DEFAULT_LIMITS[attr] || '-'}
                         />
                      </td>

                      {/* 24h */}
                      <td className="px-2 py-2 border-r border-slate-100">
                        <input
                          type="text"
                          value={rowData.observation24h || ''}
                          onChange={(e) => handleChange(point, attr, 'observation24h', e.target.value)}
                          disabled={!canEdit}
                          className="w-full text-center rounded border-slate-200 border px-1 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none disabled:bg-slate-100"
                        />
                      </td>

                      {/* 48h */}
                      <td className="px-2 py-2 border-r border-slate-100">
                        <input
                          type="text"
                          value={rowData.observation48h || ''}
                          onChange={(e) => handleChange(point, attr, 'observation48h', e.target.value)}
                          disabled={!canEdit}
                          className="w-full text-center rounded border-slate-200 border px-1 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none disabled:bg-slate-100"
                        />
                      </td>

                      {/* 72h */}
                      <td className="px-2 py-2 border-r border-slate-100">
                        <input
                          type="text"
                          value={rowData.observation72h || ''}
                          onChange={(e) => handleChange(point, attr, 'observation72h', e.target.value)}
                          disabled={!canEdit}
                          className="w-full text-center rounded border-slate-200 border px-1 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none disabled:bg-slate-100"
                        />
                      </td>

                       {/* Negative Control */}
                       <td className="px-2 py-2 border-r border-slate-100">
                        <input
                          type="text"
                          value={rowData.negativeControl || ''}
                          onChange={(e) => handleChange(point, attr, 'negativeControl', e.target.value)}
                          disabled={!canEdit}
                          className="w-full text-center rounded border-slate-200 border px-1 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none disabled:bg-slate-100"
                        />
                      </td>

                      {/* Remarks */}
                      <td className="px-2 py-2 border-r border-slate-100">
                        <input
                          type="text"
                          value={rowData.remarks || ''}
                          onChange={(e) => handleChange(point, attr, 'remarks', e.target.value)}
                          disabled={!canEdit}
                          className="w-full rounded border-slate-200 border px-2 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none disabled:bg-slate-100"
                        />
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
