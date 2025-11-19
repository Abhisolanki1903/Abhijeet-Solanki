
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LabRecord, UserRole, SAMPLE_POINTS, ATTRIBUTES } from '../types';
import { getRecords, saveRecord, createRecord } from '../services/storage';
import { RecordModal } from '../components/RecordModal';
import { DailyDataGrid } from '../components/DailyDataGrid';
import { Plus, Search, Edit2, ShieldAlert, Filter, X, Calendar, Table, List } from 'lucide-react';

type ViewMode = 'list' | 'daily';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<LabRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<LabRecord | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [dateStart, setDateStart] = useState(new Date().toISOString().split('T')[0]); // Default to today for List view range start or Daily view
  const [dateEnd, setDateEnd] = useState('');
  const [sampleFilter, setSampleFilter] = useState('');
  const [attributeFilter, setAttributeFilter] = useState('');
  
  // Load records
  const fetchRecords = () => {
    const all = getRecords();
    // Sort by date desc
    const sorted = all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setRecords(sorted);
  };

  useEffect(() => {
    fetchRecords();
    // Set up event listener for storage updates (simple way to refresh list when grid updates)
    const handleStorage = () => fetchRecords();
    window.addEventListener('storage', handleStorage);
    // Also hook into a custom event if we were in a real app, but for now we rely on fetchRecords on render or manual triggers
    // Since DailyDataGrid saves to localStorage, we can just re-fetch when switching tabs
    return () => window.removeEventListener('storage', handleStorage);
  }, [viewMode]); // Re-fetch when view mode changes

  const handleSave = (data: Partial<LabRecord>) => {
    if (editingRecord) {
      // Update existing
      const updated: LabRecord = {
        ...editingRecord,
        ...data,
        lastModifiedBy: user?.username,
        lastModifiedAt: new Date().toISOString(),
      } as LabRecord;
      saveRecord(updated);
    } else {
      // Create new
      createRecord({
        ...data,
        date: data.date!,
        samplePoint: data.samplePoint!,
        attribute: data.attribute!,
        value: data.value || '',
        limit: data.limit || '',
        observation24h: data.observation24h || '',
        observation48h: data.observation48h || '',
        observation72h: data.observation72h || '',
        negativeControl: data.negativeControl || '',
        remarks: data.remarks || '',
        createdBy: user?.username || 'Unknown',
        createdById: user?.id || 'unknown',
      } as any);
    }
    setIsModalOpen(false);
    setEditingRecord(null);
    fetchRecords();
  };

  const handleEditClick = (record: LabRecord) => {
    if (user?.role !== UserRole.ADMIN) return;
    setEditingRecord(record);
    setIsModalOpen(true);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDateStart('');
    setDateEnd('');
    setSampleFilter('');
    setAttributeFilter('');
  };

  const filteredRecords = records.filter(r => {
    const searchLower = searchTerm.toLowerCase();
    
    // Text Search
    const matchesSearch = !searchTerm || (
      r.samplePoint.toLowerCase().includes(searchLower) ||
      r.attribute.toLowerCase().includes(searchLower) ||
      r.createdBy.toLowerCase().includes(searchLower) ||
      (r.value || '').toLowerCase().includes(searchLower) ||
      (r.remarks && r.remarks.toLowerCase().includes(searchLower))
    );

    // Dropdown Filters
    const matchesSample = !sampleFilter || r.samplePoint === sampleFilter;
    const matchesAttribute = !attributeFilter || r.attribute === attributeFilter;
    
    // Date Range Logic (YYYY-MM-DD string comparison is valid)
    const matchesDateStart = !dateStart || r.date >= dateStart;
    const matchesDateEnd = !dateEnd || r.date <= dateEnd;

    return matchesSearch && matchesSample && matchesAttribute && matchesDateStart && matchesDateEnd;
  });

  const activeFiltersCount = [searchTerm, dateEnd, sampleFilter, attributeFilter].filter(Boolean).length + (dateStart ? 1 : 0);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Laboratory Logs</h1>
          <p className="text-slate-500 mt-1">Manage and track water quality samples.</p>
        </div>
        
        <div className="flex items-center space-x-3">
            {/* View Toggle */}
            <div className="bg-slate-100 p-1 rounded-lg flex border border-slate-200">
                <button 
                    onClick={() => setViewMode('daily')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center transition-all ${viewMode === 'daily' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Table className="w-4 h-4 mr-2" />
                    Daily Entry
                </button>
                <button 
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center transition-all ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <List className="w-4 h-4 mr-2" />
                    List View
                </button>
            </div>

            {viewMode === 'list' && (
                <button
                onClick={() => { setEditingRecord(null); setIsModalOpen(true); }}
                className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm transition-all text-sm font-medium"
                >
                <Plus className="w-4 h-4 mr-2" />
                New Entry
                </button>
            )}
        </div>
      </div>

      {/* View Content */}
      {viewMode === 'daily' ? (
          <div className="space-y-4">
              <div className="flex items-center space-x-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center space-x-2">
                      <Calendar className="w-5 h-5 text-indigo-600" />
                      <span className="font-semibold text-slate-700">Select Date for Entry:</span>
                  </div>
                  <input 
                      type="date" 
                      value={dateStart}
                      onChange={(e) => setDateStart(e.target.value)}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 font-medium"
                  />
              </div>
              <DailyDataGrid selectedDate={dateStart || new Date().toISOString().split('T')[0]} />
          </div>
      ) : (
        <>
            {/* Advanced Filter Bar (List View Only) */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
                <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-semibold text-slate-700 flex items-center">
                        <Filter className="w-4 h-4 mr-2" />
                        Filter Records
                    </h3>
                    {activeFiltersCount > 0 && (
                        <button 
                            onClick={clearFilters}
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center transition-colors"
                        >
                            <X className="w-3 h-3 mr-1" />
                            Clear Filters
                        </button>
                    )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Text Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search text..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
                        />
                    </div>

                    {/* Sample Point Filter */}
                    <div>
                        <select
                            value={sampleFilter}
                            onChange={(e) => setSampleFilter(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm bg-white text-slate-600"
                        >
                            <option value="">All Sample Points</option>
                            {SAMPLE_POINTS.map(p => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                    </div>

                    {/* Attribute Filter */}
                    <div>
                        <select
                            value={attributeFilter}
                            onChange={(e) => setAttributeFilter(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm bg-white text-slate-600"
                        >
                            <option value="">All Attributes</option>
                            {ATTRIBUTES.map(a => (
                                <option key={a} value={a}>{a}</option>
                            ))}
                        </select>
                    </div>

                    {/* Date Range */}
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <input
                                type="date"
                                value={dateStart}
                                onChange={(e) => setDateStart(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-slate-600"
                                title="Start Date"
                            />
                        </div>
                        <div className="relative flex-1">
                            <input
                                type="date"
                                value={dateEnd}
                                onChange={(e) => setDateEnd(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-slate-600"
                                title="End Date"
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                    <div className="text-xs text-slate-500">
                        Showing {filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''}
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-4 whitespace-nowrap">Date</th>
                        <th className="px-6 py-4 whitespace-nowrap">Sample Point</th>
                        <th className="px-6 py-4 whitespace-nowrap">Attribute</th>
                        <th className="px-6 py-4 whitespace-nowrap">Limit</th>
                        <th className="px-6 py-4 whitespace-nowrap">Entered By</th>
                        <th className="px-6 py-4 whitespace-nowrap">Observations</th>
                        <th className="px-6 py-4 whitespace-nowrap">Neg. Control</th>
                        <th className="px-6 py-4 whitespace-nowrap text-right">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                    {filteredRecords.length === 0 ? (
                        <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                            No records found matching your criteria.
                        </td>
                        </tr>
                    ) : (
                        filteredRecords.map((record) => (
                        <tr key={record.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                            {record.date}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-slate-700">
                            {record.samplePoint}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                {record.attribute}
                            </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-slate-500 text-xs">
                            {record.limit}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                                <span className="text-slate-900">{record.createdBy}</span>
                                <span className="text-xs text-slate-400">
                                {new Date(record.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            </td>
                            <td className="px-6 py-4 text-slate-600 max-w-xs truncate">
                            {record.observation24h || record.observation48h || record.observation72h || '-'}
                            {record.adminRemark && (
                                <div className="flex items-center text-amber-600 text-xs mt-1">
                                <ShieldAlert className="w-3 h-3 mr-1" />
                                Edited by Admin
                                </div>
                            )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                                {record.negativeControl || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                            {user?.role === UserRole.ADMIN ? (
                                <button 
                                onClick={() => handleEditClick(record)}
                                className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
                                title="Edit Record"
                                >
                                <Edit2 className="w-4 h-4" />
                                </button>
                            ) : (
                                <span className="text-slate-300 cursor-not-allowed p-1">
                                <Edit2 className="w-4 h-4" />
                                </span>
                            )}
                            </td>
                        </tr>
                        ))
                    )}
                    </tbody>
                </table>
                </div>
                
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 text-xs text-slate-500">
                * Normal users can only create entries for today or future dates. Admins can edit past entries with a mandatory remark.
                </div>
            </div>
        </>
      )}

      <RecordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        editingRecord={editingRecord}
      />
    </div>
  );
};