'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface TableRecord {
  id: string;
  [key: string]: any;
}

/**
 * Generic Table Viewer/Editor Component
 * 
 * Works for any table in the database
 * Route: /console/tables/[table]
 * 
 * Features:
 * - View all records with pagination
 * - View single record details
 * - Create new records
 * - Update existing records
 * - Delete records
 */

export default function TablePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const table = (params?.table as string) || '';
  const schema = searchParams.get('schema') || 'public';
  const recordId = searchParams.get('id');
  
  const [data, setData] = useState<TableRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<TableRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const [limit] = useState(50);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  
  useEffect(() => {
    if (table) {
      loadData();
      if (recordId) {
        loadRecord(recordId);
      }
    }
  }, [table, recordId, offset]);
  
  async function loadData() {
    try {
      setLoading(true);
      
      // Use API route instead of direct Supabase query
      const params = new URLSearchParams({
        schema,
        limit: limit.toString(),
        offset: offset.toString(),
      });
      
      const response = await fetch(`/api/console/tables/${table}?${params}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
      
      const result = await response.json();
      setData(result.data || []);
      setCount(result.count || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  
  async function loadRecord(id: string) {
    try {
      const params = new URLSearchParams({ schema, id });
      const response = await fetch(`/api/console/tables/${table}?${params}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const result = await response.json();
      setSelectedRecord(result.data);
      setEditForm(result.data);
    } catch (err: any) {
      setError(err.message);
    }
  }
  
  async function handleCreate() {
    try {
      const params = new URLSearchParams({ schema });
      const response = await fetch(`/api/console/tables/${table}?${params}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create');
      }
      
      const result = await response.json();
      setData([result.data, ...data]);
      setEditForm({});
      setEditing(false);
      loadData(); // Refresh
    } catch (err: any) {
      setError(err.message);
    }
  }
  
  async function handleUpdate() {
    if (!selectedRecord) return;
    
    try {
      const params = new URLSearchParams({ schema, id: selectedRecord.id });
      const response = await fetch(`/api/console/tables/${table}?${params}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update');
      }
      
      const result = await response.json();
      setSelectedRecord(result.data);
      setData(data.map(r => r.id === result.data.id ? result.data : r));
      setEditing(false);
    } catch (err: any) {
      setError(err.message);
    }
  }
  
  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this record?')) return;
    
    try {
      const params = new URLSearchParams({ schema, id });
      const response = await fetch(`/api/console/tables/${table}?${params}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete');
      }
      
      setData(data.filter(r => r.id !== id));
      if (selectedRecord?.id === id) {
        setSelectedRecord(null);
      }
    } catch (err: any) {
      setError(err.message);
    }
  }
  
  if (loading && !data.length) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      </div>
    );
  }
  
  const displayName = table.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const columns = data.length > 0 ? Object.keys(data[0]) : [];
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{displayName}</h1>
          <p className="text-sm text-gray-500">{schema}.{table}</p>
          <p className="text-sm text-gray-500 mt-1">{count} total records</p>
        </div>
        <button
          onClick={() => {
            setEditing(true);
            setEditForm({});
            setSelectedRecord(null);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + Create New
        </button>
      </div>
      
      {editing && (
        <div className="mb-6 p-4 bg-gray-50 rounded">
          <h2 className="text-lg font-semibold mb-4">
            {selectedRecord ? 'Edit Record' : 'Create New Record'}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {columns.map(col => (
              <div key={col}>
                <label className="block text-sm font-medium mb-1">{col}</label>
                <input
                  type="text"
                  value={editForm[col] || ''}
                  onChange={(e) => setEditForm({ ...editForm, [col]: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  disabled={col === 'id' || col === 'created_at'}
                />
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={selectedRecord ? handleUpdate : handleCreate}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              {selectedRecord ? 'Update' : 'Create'}
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setEditForm({});
              }}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map(key => (
                <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {key}
                </th>
              ))}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((record) => (
              <tr key={record.id} className="hover:bg-gray-50">
                {columns.map(key => (
                  <td key={key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {typeof record[key] === 'object' 
                      ? JSON.stringify(record[key]).substring(0, 50) + '...'
                      : String(record[key] || '').substring(0, 100)}
                  </td>
                ))}
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => {
                      setSelectedRecord(record);
                      setEditForm(record);
                      setEditing(true);
                    }}
                    className="text-blue-600 hover:text-blue-800 mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(record.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {count > limit && (
        <div className="mt-4 flex justify-between">
          <button
            onClick={() => setOffset(Math.max(0, offset - limit))}
            disabled={offset === 0}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Showing {offset + 1}-{Math.min(offset + limit, count)} of {count}
          </span>
          <button
            onClick={() => setOffset(offset + limit)}
            disabled={offset + limit >= count}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
