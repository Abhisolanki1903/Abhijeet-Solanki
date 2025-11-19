
import React, { useEffect, useState } from 'react';
import { LabRecord, SAMPLE_POINTS, ATTRIBUTES, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';
import { X, AlertCircle } from 'lucide-react';

interface RecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: Partial<LabRecord>) => void;
  editingRecord?: LabRecord | null;
}

export const RecordModal: React.FC<RecordModalProps> = ({ isOpen, onClose, onSave, editingRecord }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<Partial<LabRecord>>({});
  const [error, setError] = useState('');

  // Reset form when opening/closing or changing record
  useEffect(() => {
    if (isOpen) {
      if (editingRecord) {
        setFormData({ ...editingRecord, adminRemark: '' });
      } else {
        // Default new record
        setFormData({
          date: new Date().toISOString().split('T')[0],
          samplePoint: SAMPLE_POINTS[0],
          attribute: ATTRIBUTES[0],
          value: '',
          limit: '',
          observation24h: '',
          observation48h: '',
          observation72h: '',
          negativeControl: '',
          remarks: ''
        });
      }
      setError('');
    }
  }, [isOpen, editingRecord]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation Logic
    if (!formData.date) {
      setError('Date is required.');
      return;
    }

    const entryDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    entryDate.setHours(0, 0, 0, 0);

    // Date Rule: Users cannot backdate. Admins can.
    if (user?.role !== UserRole.ADMIN && entryDate < today) {
      setError('Entry date cannot be in the past.');
      return;
    }

    // Edit Rule: Admins must provide a remark when editing
    if (editingRecord && user?.role === UserRole.ADMIN && !formData.adminRemark?.trim()) {
      setError('Admin remark is mandatory for modifications.');
      return;
    }

    onSave(formData);
  };

  const handleChange = (field: keyof LabRecord, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">
            {editingRecord ? 'Edit Record' : 'New Data Entry'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
              <input
                type="date"
                value={formData.date || ''}
                onChange={e => handleChange('date', e.target.value)}
                className="w-full rounded-lg border-slate-200 border px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            {/* Sample Point */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sample Point</label>
              <select
                value={formData.samplePoint || ''}
                onChange={e => handleChange('samplePoint', e.target.value)}
                className="w-full rounded-lg border-slate-200 border px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              >
                {SAMPLE_POINTS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            {/* Attribute */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Attribute</label>
              <select
                value={formData.attribute || ''}
                onChange={e => handleChange('attribute', e.target.value)}
                className="w-full rounded-lg border-slate-200 border px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              >
                {ATTRIBUTES.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

             {/* Limit */}
             <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Limit (Standard)</label>
              <input
                type="text"
                value={formData.limit || ''}
                onChange={e => handleChange('limit', e.target.value)}
                className="w-full rounded-lg border-slate-200 border px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>

            {/* General Remarks */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">General Remarks</label>
              <input
                type="text"
                value={formData.remarks || ''}
                onChange={e => handleChange('remarks', e.target.value)}
                className="w-full rounded-lg border-slate-200 border px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Observations Group */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Observations & Controls</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">24 Hours</label>
                <input
                  type="text"
                  value={formData.observation24h || ''}
                  onChange={e => handleChange('observation24h', e.target.value)}
                  className="w-full rounded border-slate-200 border px-2 py-1.5 text-sm focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">48 Hours</label>
                <input
                  type="text"
                  value={formData.observation48h || ''}
                  onChange={e => handleChange('observation48h', e.target.value)}
                  className="w-full rounded border-slate-200 border px-2 py-1.5 text-sm focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">72 Hours</label>
                <input
                  type="text"
                  value={formData.observation72h || ''}
                  onChange={e => handleChange('observation72h', e.target.value)}
                  className="w-full rounded border-slate-200 border px-2 py-1.5 text-sm focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Negative Control</label>
                <input
                  type="text"
                  value={formData.negativeControl || ''}
                  onChange={e => handleChange('negativeControl', e.target.value)}
                  className="w-full rounded border-slate-200 border px-2 py-1.5 text-sm focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. Clear"
                />
              </div>
            </div>
          </div>

          {/* Admin Modification Remark */}
          {editingRecord && user?.role === UserRole.ADMIN && (
             <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
               <label className="block text-sm font-bold text-amber-800 mb-1">
                 Reason for Modification <span className="text-red-500">*</span>
               </label>
               <textarea
                 value={formData.adminRemark || ''}
                 onChange={e => handleChange('adminRemark', e.target.value)}
                 placeholder="Explain why you are editing this record..."
                 className="w-full rounded border-amber-300 border px-3 py-2 text-sm focus:ring-1 focus:ring-amber-500"
                 rows={2}
               />
             </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
            >
              {editingRecord ? 'Update Record' : 'Save Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};