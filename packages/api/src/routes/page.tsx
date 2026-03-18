"use client";

import React, { useState, useEffect } from "react";

export default function DLQReviewPage() {
  const [dlqItems, setDlqItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  useEffect(() => {
    // Mocking real initial data load.
    // Next step would be to hook this into `GET /api/operator/dlq`
    setDlqItems([
      {
        id: "dlq-123",
        tenant_id: "tenant-noisy-123",
        source: "shopify",
        error_reason: "Invalid webhook signature",
        created_at: new Date().toISOString(),
        payload: '{"order_id": "123", "total": "50.00"}',
        headers: { "x-shopify-hmac-sha256": "invalid-signature-123" },
      },
      {
        id: "dlq-124",
        tenant_id: "tenant-abc-456",
        source: "stripe",
        error_reason: "Malformed JSON payload",
        created_at: new Date(Date.now() - 3600000).toISOString(),
        payload: '{"charge_id": "ch_123", "amount": 1000',
        headers: { "stripe-signature": "t=123,v1=abc" },
      },
    ]);
    setLoading(false);
  }, []);

  const handleReplay = async (item: any) => {
    alert(`Replaying webhook from ${item.source} for tenant ${item.tenant_id}`);
    // In reality: POST /api/operator/dlq/${item.id}/replay
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dead Letter Queue (DLQ)</h1>
          <p className="text-sm text-gray-500 mt-1">
            Review and replay failed webhooks and ingestion errors.
          </p>
        </div>
        <button className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700">
          Purge All
        </button>
      </div>

      <div className="bg-white shadow rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Timestamp
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Source
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tenant ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Error Reason
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {dlqItems.map((item: any) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(item.created_at).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {item.source}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                  {item.tenant_id || "Unknown"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                  {item.error_reason}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => setSelectedItem(item)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Inspect
                  </button>
                  <button
                    onClick={() => handleReplay(item)}
                    className="text-green-600 hover:text-green-900"
                  >
                    Replay
                  </button>
                </td>
              </tr>
            ))}
            {dlqItems.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  The Dead Letter Queue is currently empty.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Inspect Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Inspect Failed Webhook</h3>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-gray-400 hover:text-gray-500"
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-4 overflow-y-auto flex-1">
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Error Reason</h4>
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700 font-mono">
                  {selectedItem.error_reason}
                </div>
              </div>
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Headers</h4>
                <pre className="p-3 bg-gray-900 text-gray-300 rounded-md text-xs overflow-x-auto">
                  {JSON.stringify(selectedItem.headers, null, 2)}
                </pre>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Raw Payload</h4>
                <pre className="p-3 bg-gray-900 text-gray-300 rounded-md text-xs overflow-x-auto whitespace-pre-wrap">
                  {selectedItem.payload}
                </pre>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleReplay(selectedItem);
                  setSelectedItem(null);
                }}
                className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                Replay Webhook
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
