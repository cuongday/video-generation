import { useQuery, useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Key, Plus, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { getAPIKeys, createAPIKey, deleteAPIKey, updateAPIKey } from '../lib/api';
import { cn } from '../lib/utils';

const PROVIDERS = [
  { value: 'nano_banana', label: 'nano-banana (Gemini)' },
  { value: 'sora', label: 'Sora 2 (OpenAI)' },
  { value: 'kling', label: 'Kling 3.0 (Kuaishou)' },
  { value: 'seedance', label: 'Seedance' },
  { value: 'dall_e', label: 'DALL-E 3' },
  { value: 'veo', label: 'Veo 3.1 (Google)' },
];

export default function Settings() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newKey, setNewKey] = useState({ provider: 'nano_banana', api_key: '', label: '' });

  const { data: keys, refetch } = useQuery({
    queryKey: ['api-keys'],
    queryFn: getAPIKeys,
  });

  const createMutation = useMutation({
    mutationFn: (data: object) => createAPIKey(data),
    onSuccess: () => { refetch(); setShowAddForm(false); setNewKey({ provider: 'nano_banana', api_key: '', label: '' }); },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAPIKey,
    onSuccess: () => refetch(),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => updateAPIKey(id, { is_active }),
    onSuccess: () => refetch(),
  });

  return (
    <div className="max-w-3xl mx-auto px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cài đặt</h1>
          <p className="text-gray-500 mt-1">Quản lý API keys và cấu hình</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Thêm API Key
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Thêm API Key mới</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nhà cung cấp</label>
              <select
                value={newKey.provider}
                onChange={(e) => setNewKey({ ...newKey, provider: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {PROVIDERS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên gợi nhớ</label>
              <input
                type="text"
                value={newKey.label}
                onChange={(e) => setNewKey({ ...newKey, label: e.target.value })}
                placeholder="VD: OpenAI Key của tôi"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
              <input
                type="password"
                value={newKey.api_key}
                onChange={(e) => setNewKey({ ...newKey, api_key: e.target.value })}
                placeholder="sk-..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => createMutation.mutate(newKey)}
                disabled={!newKey.api_key || !newKey.label}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
              >
                Lưu
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Keys List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-semibold text-gray-900">Danh sách API Keys</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {keys?.map((key: { id: string; provider: string; label: string; is_active: boolean; quota_used: number; quota_limit?: number; created_at: string }) => (
            <div key={key.id} className="px-5 py-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-gray-900">{key.label}</span>
                  <span className={cn(
                    'px-1.5 py-0.5 rounded text-xs font-medium',
                    key.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  )}>
                    {key.provider}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  Đã dùng: {key.quota_used} / {key.quota_limit || 'không giới hạn'}
                  — Tạo ngày {new Date(key.created_at).toLocaleDateString('vi-VN')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleMutation.mutate({ id: key.id, is_active: !key.is_active })}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    key.is_active ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'
                  )}
                  title={key.is_active ? 'Tắt' : 'Bật'}
                >
                  {key.is_active ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => deleteMutation.mutate(key.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {keys?.length === 0 && (
            <div className="px-5 py-12 text-center text-gray-400">
              <Key className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Chưa có API key nào</p>
              <p className="text-xs mt-1">Thêm API key để bắt đầu tạo video</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
