import { X, Copy, RefreshCw, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/utils';
import type { SpaceAsset } from '../../types';

interface SpaceDetailModalProps {
  space: SpaceAsset;
  onClose: () => void;
}

export default function SpaceDetailModal({ space, onClose }: SpaceDetailModalProps) {
  const [copied, setCopied] = useState<'prompt' | 'image' | null>(null);

  const handleCopy = async (text: string, type: 'prompt' | 'image') => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-gradient-to-br from-teal-50 to-gray-100 flex-shrink-0">
              {space.image_path ? (
                <img src={space.image_path} alt={space.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                  </svg>
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{space.name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                {space.category && (
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-teal-100 text-teal-700 capitalize">
                    {space.category}
                  </span>
                )}
                {space.tags?.slice(0, 3).map((tag: string) => (
                  <span key={tag} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Main image */}
          {space.image_path ? (
            <div className="flex justify-center">
              <div className="rounded-2xl overflow-hidden border-2 border-gray-100 max-w-full">
                <img
                  src={space.image_path}
                  alt={space.name}
                  className="max-h-[400px] w-auto object-contain"
                />
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-full max-w-lg aspect-video bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-200">
                <div className="text-center text-gray-400">
                  <svg className="w-16 h-16 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                  </svg>
                  <p className="text-sm">Không có hình ảnh</p>
                </div>
              </div>
            </div>
          )}

          {/* Info grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Mô tả</h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {space.description || 'Không có mô tả'}
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Prompt gốc</h4>
              <p className="text-sm text-gray-700 line-clamp-4">
                {space.prompt || 'Không có prompt'}
              </p>
              {space.prompt && (
                <button
                  onClick={() => handleCopy(space.prompt!, 'prompt')}
                  className="mt-2 text-xs text-teal-600 hover:text-teal-700 flex items-center gap-1"
                >
                  {copied === 'prompt' ? (
                    <>
                      <CheckCircle className="w-3 h-3" /> Đã sao chép!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" /> Sao chép prompt
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Style & Lighting */}
            {(space.style || space.lighting) && (
              <div className="bg-gray-50 rounded-xl p-4 md:col-span-2">
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Thông số</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {space.style && (
                    <div>
                      <span className="text-gray-400 text-xs">Phong cách</span>
                      <p className="font-medium text-gray-700 capitalize">{space.style}</p>
                    </div>
                  )}
                  {space.lighting && (
                    <div>
                      <span className="text-gray-400 text-xs">Ánh sáng</span>
                      <p className="font-medium text-gray-700 capitalize">{space.lighting}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Copy image URL */}
          {space.image_path && (
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Hình ảnh</h4>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={space.image_path}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-600 bg-white"
                />
                <button
                  onClick={() => handleCopy(space.image_path!, 'image')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all flex-shrink-0',
                    copied === 'image'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-teal-600 text-white hover:bg-teal-700'
                  )}
                >
                  {copied === 'image' ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" /> Đã sao chép
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy URL
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="text-xs text-gray-400 text-center">
            Tạo ngày {new Date(space.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>
    </div>
  );
}
