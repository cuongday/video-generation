import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Loader, RefreshCw, Copy, CheckCircle, Trash2, Plus } from 'lucide-react';
import { cn } from '../lib/utils';
import { generateReferenceImages, getAvatar } from '../lib/api';
import type { AvatarAsset } from '../types';

interface AvatarDetailModalProps {
  avatar: AvatarAsset;
  onClose: () => void;
}

type Tab = 'detail' | 'variations' | 'angles' | 'outfits';

export default function AvatarDetailModal({ avatar, onClose }: AvatarDetailModalProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('detail');
  const [variationCount, setVariationCount] = useState(4);
  const [customPrompt, setCustomPrompt] = useState('');
  const [showVariationForm, setShowVariationForm] = useState(false);

  const allImages = [
    avatar.reference_image_path,
    ...Object.values(avatar.face_images || {}),
    ...Object.values(avatar.body_images || {}),
    ...Object.values(avatar.video_clips || {}),
  ].filter(Boolean) as string[];

  const variationMutation = useMutation({
    mutationFn: ({ avatarId, n, promptOverride }: { avatarId: string; n: number; promptOverride?: string }) =>
      generateReferenceImages(avatarId, n, promptOverride),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['avatars'] });
      await queryClient.invalidateQueries({ queryKey: ['avatar', avatar.id] });
    },
  });

  const handleCreateVariation = async () => {
    await variationMutation.mutateAsync({
      avatarId: avatar.id,
      n: variationCount,
      promptOverride: customPrompt.trim() || undefined,
    });
    setShowVariationForm(false);
  };

  const basePrompt = avatar.extra_metadata?.pattern?.main_prompt || avatar.description || '';
  const combinedPrompt = customPrompt.trim() || basePrompt;

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'detail', label: 'Chi tiết' },
    { id: 'variations', label: 'Biến thể', count: allImages.length },
    { id: 'angles', label: 'Góc mặt', count: Object.keys(avatar.face_images || {}).length },
    { id: 'outfits', label: 'Trang phục', count: Object.keys(avatar.body_images || {}).length },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-gradient-to-br from-purple-100 to-gray-100 flex-shrink-0">
              {avatar.reference_image_path ? (
                <img src={avatar.reference_image_path} alt={avatar.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{avatar.name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={cn(
                  'px-2 py-0.5 rounded text-xs font-medium',
                  avatar.avatar_type === 'ai_generated' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                )}>
                  {avatar.avatar_type === 'ai_generated' ? 'AI Influencer' : 'Khuôn mặt thật'}
                </span>
                {avatar.tags?.map((tag) => (
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

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-3 border-b border-gray-100 flex-shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-2 rounded-t-lg text-sm font-medium transition-colors -mb-px',
                activeTab === tab.id
                  ? 'border-b-2 border-purple-500 text-purple-600 bg-purple-50/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              )}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Tab: Chi tiết */}
          {activeTab === 'detail' && (
            <div className="space-y-6">
              {/* Main image */}
              <div className="flex justify-center">
                <div className="w-64 h-64 rounded-2xl overflow-hidden bg-gradient-to-br from-purple-50 to-gray-100 border-2 border-gray-100">
                  {avatar.reference_image_path ? (
                    <img src={avatar.reference_image_path} alt={avatar.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Mô tả</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {avatar.description || 'Không có mô tả'}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Prompt gốc</h4>
                  <p className="text-sm text-gray-700 line-clamp-3">
                    {basePrompt || 'Không có prompt'}
                  </p>
                  {basePrompt && (
                    <button
                      onClick={() => navigator.clipboard.writeText(basePrompt)}
                      className="mt-2 text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" /> Sao chép prompt
                    </button>
                  )}
                </div>
              </div>

              {/* Biometrics summary */}
              {avatar.biometrics && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Đặc điểm sinh trắc</h4>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-3 text-sm">
                    {[
                      { label: 'Giới tính', value: avatar.biometrics.gender },
                      { label: 'Ethnicity', value: avatar.biometrics.ethnicity },
                      { label: 'Tuổi', value: avatar.biometrics.age },
                      { label: 'Hình mặt', value: avatar.biometrics.face_shape },
                      { label: 'Mắt', value: avatar.biometrics.eye_shape },
                      { label: 'Màu da', value: avatar.biometrics.skin_color },
                      { label: 'Tóc', value: `${avatar.biometrics.hair_color} ${avatar.biometrics.hair_style}` },
                      { label: 'Thể trạng', value: avatar.biometrics.body_type },
                      { label: 'Chiều cao', value: avatar.biometrics.height },
                      { label: 'Vòng 1', value: avatar.biometrics.bust_cm ? `${avatar.biometrics.bust_cm} cm` : undefined },
                      { label: 'Vòng 2', value: avatar.biometrics.waist_cm ? `${avatar.biometrics.waist_cm} cm` : undefined },
                      { label: 'Vòng 3', value: avatar.biometrics.hips_cm ? `${avatar.biometrics.hips_cm} cm` : undefined },
                      { label: 'Áo', value: avatar.biometrics.outfit_top },
                      { label: 'Quần', value: avatar.biometrics.outfit_bottom },
                      { label: 'Mô tả', value: avatar.biometrics.outfit_description },
                      { label: 'Giày', value: avatar.biometrics.shoes },
                    ].filter((item) => item.value).map((item) => (
                      <div key={item.label}>
                        <span className="text-gray-400 text-xs">{item.label}</span>
                        <p className="font-medium text-gray-700 capitalize">{String(item.value).replace(/_/g, ' ')}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-400 text-center">
                Tạo ngày {new Date(avatar.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' })}
              </div>
            </div>
          )}

          {/* Tab: Biến thể */}
          {activeTab === 'variations' && (
            <div className="space-y-5">
              {/* Create variation form */}
              <div className="border border-purple-200 rounded-xl p-5 bg-purple-50/30">
                <h3 className="text-sm font-semibold text-gray-800 mb-1">Tạo biến thể mới</h3>
                <p className="text-xs text-gray-500 mb-4">Tạo các phiên bản khác của avatar dựa trên prompt hiện tại hoặc prompt tùy chỉnh</p>

                {!showVariationForm ? (
                  <button
                    onClick={() => setShowVariationForm(true)}
                    className="inline-flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Tạo biến thể mới
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Số ảnh cần tạo</label>
                      <div className="flex items-center gap-2">
                        {[1, 2, 4, 6, 8].map((n) => (
                          <button
                            key={n}
                            onClick={() => setVariationCount(n)}
                            className={cn(
                              'w-9 h-9 rounded-lg border-2 text-sm font-medium transition-all',
                              variationCount === n
                                ? 'border-purple-500 bg-purple-500 text-white'
                                : 'border-gray-200 text-gray-600 hover:border-purple-300'
                            )}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">
                        Prompt tùy chỉnh
                        <span className="text-gray-400 font-normal ml-1">(để trống = dùng prompt gốc)</span>
                      </label>
                      <textarea
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        rows={3}
                        placeholder={basePrompt}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-400 mt-1">Có thể thay đổi pose, biểu cảm, ánh sáng, backdrop...</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCreateVariation}
                        disabled={variationMutation.isPending}
                        className="inline-flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
                      >
                        {variationMutation.isPending ? (
                          <Loader className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                        Tạo {variationCount} biến thể
                      </button>
                      <button
                        onClick={() => { setShowVariationForm(false); setCustomPrompt(''); }}
                        className="inline-flex items-center gap-2 border border-gray-300 text-gray-600 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* All variations grid */}
              {allImages.length > 0 ? (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    Tất cả ảnh ({allImages.length})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {allImages.map((img, i) => (
                      <div key={i} className="group relative aspect-square rounded-xl overflow-hidden border border-gray-200 hover:border-purple-300 transition-colors">
                        <img
                          src={img}
                          alt={`${avatar.name} - ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <button
                            onClick={() => navigator.clipboard.writeText(img)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-lg px-2 py-1 text-xs font-medium text-gray-700 flex items-center gap-1"
                          >
                            <Copy className="w-3 h-3" /> Copy URL
                          </button>
                        </div>
                        <div className="absolute bottom-1 right-1">
                          <span className="px-1.5 py-0.5 bg-black/50 text-white rounded text-xs">
                            #{i + 1}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                  <p className="text-sm">Chưa có ảnh biến thể nào</p>
                  <p className="text-xs mt-1">Tạo biến thể đầu tiên bằng nút bên trên</p>
                </div>
              )}
            </div>
          )}

          {/* Tab: Góc mặt */}
          {activeTab === 'angles' && (
            <div>
              {Object.keys(avatar.face_images || {}).length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Object.entries(avatar.face_images || {}).map(([angle, url]) => (
                    <div key={angle} className="text-center">
                      <div className="aspect-square rounded-xl overflow-hidden border border-gray-200 mb-2">
                        <img src={url} alt={angle} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-xs font-medium text-gray-600 capitalize">{angle.replace(/_/g, ' ')}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-gray-400">
                  <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                  <p className="text-sm">Chưa có ảnh góc mặt nào</p>
                  <p className="text-xs mt-1">Tạo avatar từ bước Tạo Reference → Assets bổ sung</p>
                </div>
              )}
            </div>
          )}

          {/* Tab: Trang phục */}
          {activeTab === 'outfits' && (
            <div>
              {Object.keys(avatar.body_images || {}).length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Object.entries(avatar.body_images || {}).map(([outfit, url]) => (
                    <div key={outfit} className="text-center">
                      <div className="aspect-[4/3] rounded-xl overflow-hidden border border-gray-200 mb-2">
                        <img src={url} alt={outfit} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-xs font-medium text-gray-600 capitalize">{outfit.replace(/_/g, ' ')}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-gray-400">
                  <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m0 0a2.246 2.246 0 00-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0121 12v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6c0-.98.626-1.813 1.5-2.122" />
                  </svg>
                  <p className="text-sm">Chưa có ảnh trang phục nào</p>
                  <p className="text-xs mt-1">Tạo avatar từ bước Tạo Reference → Assets bổ sung</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
