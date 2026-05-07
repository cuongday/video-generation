import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { LayoutGrid, Trash2, Plus, Eye, X, Loader, Wand2 } from 'lucide-react';
import { getSpaces, deleteSpace, generateSpace } from '../lib/api';
import { cn } from '../lib/utils';
import SpaceDetailModal from '../components/modals/SpaceDetailModal';
import type { SpaceAsset } from '../types';

const CATEGORIES = [
  { value: '', label: 'Tất cả' },
  { value: 'generated', label: 'Đã tạo bằng AI' },
  { value: 'indoor', label: 'Trong nhà' },
  { value: 'outdoor', label: 'Ngoài trời' },
  { value: 'office', label: 'Văn phòng' },
  { value: 'cafe', label: 'Cafe' },
  { value: 'studio', label: 'Studio' },
  { value: 'street', label: 'Đường phố' },
  { value: 'nature', label: 'Thiên nhiên' },
  { value: 'custom', label: 'Tùy chỉnh' },
];

const STYLES = [
  'modern minimalist', 'classic traditional', 'industrial loft',
  'scandinavian', 'bohemian', 'vintage retro', 'luxury elegant',
  'tropical paradise', 'urban street', 'japanese zen',
];

const LIGHTINGS = [
  'natural lighting', 'warm golden hour', 'studio soft', 'dramatic shadows',
  'cool blue tone', 'cinematic lighting', 'neon night', 'soft diffused',
];

const ASPECT_RATIOS = [
  { value: '16:9', label: '16:9', desc: 'Ngang (YouTube)' },
  { value: '9:16', label: '9:16', desc: 'Dọc (TikTok/Reels)' },
  { value: '1:1', label: '1:1', desc: 'Vuông (Instagram)' },
];

interface GenerateForm {
  name: string;
  prompt: string;
  style: string;
  lighting: string;
  aspect_ratio: string;
}

export default function SpaceLibrary() {
  const [selectedSpace, setSelectedSpace] = useState<SpaceAsset | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState('');
  const [form, setForm] = useState<GenerateForm>({
    name: '',
    prompt: '',
    style: 'modern minimalist',
    lighting: 'natural lighting',
    aspect_ratio: '16:9',
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['spaces', activeCategory],
    queryFn: () => getSpaces(),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSpace,
    onSuccess: () => refetch(),
  });

  const generateMutation = useMutation({
    mutationFn: (d: object) => generateSpace(d),
    onSuccess: () => {
      refetch();
      setShowCreateModal(false);
      setForm({ name: '', prompt: '', style: 'modern minimalist', lighting: 'natural lighting', aspect_ratio: '16:9' });
    },
  });

  const spaces: SpaceAsset[] = activeCategory
    ? (data?.items?.filter((s: SpaceAsset) => s.category === activeCategory) || [])
    : (data?.items || []);

  const handleGenerate = async () => {
    if (!form.prompt.trim()) return;
    generateMutation.mutate({
      prompt: form.prompt,
      name: form.name || form.prompt.slice(0, 50),
      style: form.style,
      lighting: form.lighting,
      aspect_ratio: form.aspect_ratio,
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Thư viện Không gian</h1>
          <p className="text-gray-500 mt-1">Quản lý không gian đã tạo</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-teal-700"
        >
          <Wand2 className="w-4 h-4" />
          Tạo Không gian mới
        </button>
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setActiveCategory(cat.value)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
              activeCategory === cat.value
                ? 'bg-teal-100 text-teal-700 border border-teal-300'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl h-56 animate-pulse" />
          ))}
        </div>
      ) : spaces.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {spaces.map((space: SpaceAsset) => (
            <div
              key={space.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-teal-300 hover:shadow-md transition-all group"
            >
              {/* Preview */}
              <div className="aspect-video bg-gradient-to-br from-teal-50 to-gray-100 flex items-center justify-center relative">
                {space.image_path ? (
                  <img
                    src={space.image_path}
                    alt={space.name}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => setSelectedSpace(space)}
                  />
                ) : (
                  <LayoutGrid className="w-10 h-10 text-gray-300" />
                )}
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <button
                    onClick={() => setSelectedSpace(space)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-700 flex items-center gap-1.5 shadow-sm"
                  >
                    <Eye className="w-3.5 h-3.5" /> Chi tiết
                  </button>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(space.id); }}
                  className="absolute top-2 right-2 p-1.5 bg-white/80 rounded-lg text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <div className="absolute bottom-2 left-2">
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-teal-100 text-teal-700 capitalize">
                    {space.category || 'custom'}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                <h3 className="font-semibold text-gray-900 truncate">{space.name}</h3>
                <div className="flex items-center gap-1 mt-1 flex-wrap">
                  {space.tags?.slice(0, 3).map((tag: string) => (
                    <span key={tag} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(space.created_at).toLocaleDateString('vi-VN')}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
          <LayoutGrid className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>Chưa có không gian nào</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-teal-600 text-sm mt-2 inline-block hover:underline"
          >
            Tạo không gian đầu tiên
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {selectedSpace && (
        <SpaceDetailModal
          space={selectedSpace}
          onClose={() => setSelectedSpace(null)}
        />
      )}

      {/* Create / Generate Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !generateMutation.isPending && setShowCreateModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Tạo Không gian mới</h2>
                <p className="text-xs text-gray-500 mt-0.5">Mô tả không gian bằng prompt, hệ thống sẽ tạo hình ảnh bằng AI</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                disabled={generateMutation.isPending}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Prompt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Mô tả không gian <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.prompt}
                  onChange={(e) => setForm({ ...form, prompt: e.target.value })}
                  rows={4}
                  placeholder="Ví dụ: A cozy coffee shop with warm wooden interiors, natural light from large windows, vintage furniture, plants on shelves, soft jazz music ambiance"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent resize-none"
                  disabled={generateMutation.isPending}
                />
                <p className="text-xs text-gray-400 mt-1">Mô tả càng chi tiết, hình ảnh càng chính xác</p>
              </div>

              {/* Style */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phong cách</label>
                <select
                  value={form.style}
                  onChange={(e) => setForm({ ...form, style: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
                  disabled={generateMutation.isPending}
                >
                  {STYLES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Lighting */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Ánh sáng</label>
                <select
                  value={form.lighting}
                  onChange={(e) => setForm({ ...form, lighting: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
                  disabled={generateMutation.isPending}
                >
                  {LIGHTINGS.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>

              {/* Aspect Ratio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Tỷ lệ khung hình</label>
                <div className="grid grid-cols-3 gap-3">
                  {ASPECT_RATIOS.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => setForm({ ...form, aspect_ratio: r.value })}
                      disabled={generateMutation.isPending}
                      className={cn(
                        'p-3 rounded-xl border-2 text-center transition-all disabled:opacity-50',
                        form.aspect_ratio === r.value
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      )}
                    >
                      <span className="font-medium text-sm">{r.label}</span>
                      <p className="text-xs text-gray-500 mt-0.5">{r.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Error */}
              {generateMutation.isError && (() => {
                const err = generateMutation.error as any;
                const status = err?.response?.status;
                const detail = err?.response?.data?.detail || err?.message || 'Đã xảy ra lỗi khi tạo không gian';
                const isQuota = status === 429 || detail.toLowerCase().includes('quota') || detail.toLowerCase().includes('hạn mức');

                return (
                  <div className={cn(
                    'rounded-xl p-4 text-sm flex items-start gap-3',
                    isQuota
                      ? 'bg-amber-50 border border-amber-300 text-amber-800'
                      : 'bg-red-50 border border-red-200 text-red-600'
                  )}>
                    <span className={cn('mt-0.5 flex-shrink-0', isQuota ? 'text-amber-500' : 'text-red-500')}>
                      {isQuota ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </span>
                    <div>
                      <p className="font-semibold">
                        {isQuota ? 'Hết hạn mức sử dụng Gemini API' : 'Lỗi khi tạo không gian'}
                      </p>
                      <p className="mt-1 text-xs opacity-90">{detail}</p>
                      {isQuota && (
                        <p className="mt-1 text-xs opacity-75">Đợi 1-2 phút rồi thử lại, hoặc nâng cấp plan trên Google AI Studio.</p>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex-shrink-0">
              <button
                onClick={handleGenerate}
                disabled={!form.prompt.trim() || generateMutation.isPending}
                className={cn(
                  'w-full py-3 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2',
                  'bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Đang tạo không gian...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    Tạo không gian bằng AI
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
