import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users, Plus, Eye, Check, Loader } from 'lucide-react';
import { getAvatars } from '../../lib/api';
import { cn } from '../../lib/utils';
import type { AvatarAsset } from '../../types';

interface Props {
  value?: string;
  onChange: (avatarId: string) => void;
}

export default function StepAvatarSelector({ value, onChange }: Props) {
  const [previewAvatar, setPreviewAvatar] = useState<AvatarAsset | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['avatars'],
    queryFn: () => getAvatars(),
  });

  const avatars = data?.items || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Chọn nhân vật ảo</h2>
          <p className="text-sm text-gray-500 mt-0.5">Chọn avatar từ thư viện hoặc tạo mới</p>
        </div>
        <Link
          to="/avatar/create"
          className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700"
        >
          <Plus className="w-4 h-4" />
          Tạo Avatar mới
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader className="w-6 h-6 text-primary-600 animate-spin" />
        </div>
      ) : avatars.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
          <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 mb-3">Chưa có avatar nào</p>
          <Link to="/avatar/create" className="text-primary-600 font-medium hover:underline">
            Tạo avatar đầu tiên của bạn
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {avatars.map((avatar: AvatarAsset) => (
            <div
              key={avatar.id}
              onClick={() => onChange(avatar.id)}
              className={cn(
                'relative bg-white rounded-xl border-2 overflow-hidden cursor-pointer transition-all group',
                value === avatar.id
                  ? 'border-primary-500 ring-2 ring-primary-200'
                  : 'border-gray-200 hover:border-purple-300 hover:shadow-md'
              )}
            >
              <div className="aspect-square bg-gradient-to-br from-purple-50 to-gray-100 flex items-center justify-center relative">
                {avatar.reference_image_path ? (
                  <img
                    src={avatar.reference_image_path}
                    alt={avatar.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Users className="w-12 h-12 text-gray-300" />
                )}
                {value === avatar.id && (
                  <div className="absolute top-2 right-2 bg-primary-600 rounded-full p-1">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                <div className="absolute bottom-2 left-2">
                  <span className={cn(
                    'px-2 py-0.5 rounded text-xs font-medium',
                    avatar.avatar_type === 'ai_generated' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                  )}>
                    {avatar.avatar_type === 'ai_generated' ? 'AI' : 'Khuôn mặt thật'}
                  </span>
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-gray-900 truncate text-sm">{avatar.name}</h3>
                <div className="flex items-center gap-1 mt-1 flex-wrap">
                  {avatar.tags?.slice(0, 2).map((tag: string) => (
                    <span key={tag} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setPreviewAvatar(avatar); }}
                  className="mt-2 w-full text-xs text-center py-1 border border-gray-200 rounded text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Xem chi tiết
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {value && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-800">Đã chọn avatar</p>
            <p className="text-xs text-green-600">
              {avatars.find((a: AvatarAsset) => a.id === value)?.name || value}
            </p>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewAvatar && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewAvatar(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="aspect-square bg-gradient-to-br from-purple-50 to-gray-100">
              {previewAvatar.reference_image_path ? (
                <img src={previewAvatar.reference_image_path} alt={previewAvatar.name} className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Users className="w-20 h-20 text-gray-300" />
                </div>
              )}
            </div>
            <div className="p-5">
              <h3 className="font-bold text-lg text-gray-900">{previewAvatar.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{previewAvatar.description}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {previewAvatar.tags?.map((tag: string) => (
                  <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{tag}</span>
                ))}
              </div>
              <button
                onClick={() => { onChange(previewAvatar.id); setPreviewAvatar(null); }}
                className="mt-4 w-full bg-primary-600 text-white py-2 rounded-lg font-medium hover:bg-primary-700"
              >
                Chọn Avatar này
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
