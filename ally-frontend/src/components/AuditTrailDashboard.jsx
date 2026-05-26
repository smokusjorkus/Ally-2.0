import React, { useEffect, useMemo, useState } from 'react';
import { Activity, AlertCircle, Filter, Loader2, RefreshCw, Search } from 'lucide-react';
import { auditService } from '../services/auditService';

const moduleOptions = ['', 'AUTH', 'CASE', 'DOCUMENT', 'AI'];
const actionOptions = [
  '',
  'LOGIN',
  'CREATE_CASE',
  'ACCEPT_CASE',
  'DECLINE_CASE',
  'DELETE_CASE',
  'UPDATE_CASE_STATUS',
  'UPLOAD_DOCUMENT',
  'DELETE_DOCUMENT',
  'AI_QUERY',
];

const formatDate = (value) => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleString();
};

const AuditTrailDashboard = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [moduleName, setModuleName] = useState('');
  const [action, setAction] = useState('');
  const [search, setSearch] = useState('');

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await auditService.getAuditLogs({ moduleName, action, limit: 200 });
      setLogs(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load audit trail');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [moduleName, action]);

  const filteredLogs = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return logs;
    return logs.filter((log) => {
      return [
        log.actorEmail,
        log.actorRole,
        log.action,
        log.moduleName,
        log.targetType,
        log.targetId,
        log.description,
        log.status,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [logs, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Trail</h1>
          <p className="text-sm text-gray-600">
            Review user actions, case activity, document changes, and AI inquiries.
          </p>
        </div>
        <button
          onClick={loadLogs}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="grid gap-3 md:grid-cols-3">
          <label className="block">
            <span className="flex items-center gap-2 mb-1 text-sm font-medium text-gray-700">
              <Filter className="w-4 h-4" />
              Module
            </span>
            <select
              value={moduleName}
              onChange={(e) => setModuleName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {moduleOptions.map((option) => (
                <option key={option || 'ALL'} value={option}>
                  {option || 'All modules'}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="block mb-1 text-sm font-medium text-gray-700">Action</span>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {actionOptions.map((option) => (
                <option key={option || 'ALL'} value={option}>
                  {option || 'All actions'}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="block mb-1 text-sm font-medium text-gray-700">Search</span>
            <div className="relative">
              <Search className="absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Actor, action, case, document..."
                className="w-full py-2 pl-9 pr-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </label>
        </div>
      </div>

      <div className="overflow-hidden bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-gray-900">{filteredLogs.length} records</span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-600">
            <Loader2 className="w-6 h-6 mr-2 animate-spin" />
            Loading audit trail...
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 p-4 m-4 text-red-700 border border-red-200 rounded-lg bg-red-50">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-gray-500">No audit records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 font-semibold text-left text-gray-700">Time</th>
                  <th className="px-4 py-3 font-semibold text-left text-gray-700">Actor</th>
                  <th className="px-4 py-3 font-semibold text-left text-gray-700">Module</th>
                  <th className="px-4 py-3 font-semibold text-left text-gray-700">Action</th>
                  <th className="px-4 py-3 font-semibold text-left text-gray-700">Target</th>
                  <th className="px-4 py-3 font-semibold text-left text-gray-700">Description</th>
                  <th className="px-4 py-3 font-semibold text-left text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLogs.map((log) => (
                  <tr key={log.auditId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(log.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{log.actorEmail || 'System'}</div>
                      <div className="text-xs text-gray-500">{log.actorRole || 'N/A'} {log.actorId ? `#${log.actorId}` : ''}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded">
                        {log.moduleName}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{log.action}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {log.targetType || 'N/A'} {log.targetId ? `#${log.targetId}` : ''}
                    </td>
                    <td className="px-4 py-3 text-gray-700 min-w-[240px]">{log.description || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-50 rounded">
                        {log.status || 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditTrailDashboard;
