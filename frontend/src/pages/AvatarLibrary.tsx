import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users, Trash2, Plus, Eye } from 'lucide-react';
import { getAvatars, deleteAvatar } from '../lib/api';
import { cn } from '../lib/utils';
import AvatarDetailModal from '../components/AvatarDetailModal';
import type { AvatarAsset } from '../types';

export default function AvatarLibrary() {
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarAsset | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['avatars'],
    queryFn: () => getAvatars(),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAvatar,
    onSuccess: () => refetch(),
  });

  return (
    <div className="max-w-5xl mx-auto px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Thư viện Avatar</h1>
          <p className="text-gray-500 mt-1">Quản lý nhân vật ảo đã tạo</p>
        </div>
        <Link
          to="/avatar/create"
          className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700"
        >
          <Plus className="w-4 h-4" />
          Tạo Avatar mới
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl h-64 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {data?.items?.map((avatar: AvatarAsset) => (
            <div
              key={avatar.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-purple-300 hover:shadow-md transition-all group"
            >
              {/* Avatar Preview */}
              <div className="aspect-square bg-gradient-to-br from-purple-50 to-gray-100 flex items-center justify-center relative">
                {avatar.reference_image_path ? (
                  <img
                    src={avatar.reference_image_path}
                    alt={avatar.name}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => setSelectedAvatar(avatar)}
                  />
                ) : (
                  <Users className="w-12 h-12 text-gray-300" />
                )}
                {/* Overlay buttons */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <button
                    onClick={() => setSelectedAvatar(avatar)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-700 flex items-center gap-1.5 shadow-sm"
                  >
                    <Eye className="w-3.5 h-3.5" /> Xem chi tiết
                  </button>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(avatar.id); }}
                  className="absolute top-2 right-2 p-1.5 bg-white/80 rounded-lg text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <div className="absolute bottom-2 left-2">
                  <span className={cn(
                    'px-2 py-0.5 rounded text-xs font-medium',
                    avatar.avatar_type === 'ai_generated' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                  )}>
                    {avatar.avatar_type === 'ai_generated' ? 'AI' : 'Khuôn mặt thật'}
                  </span>
                </div>
              </div>

              {/* Avatar Info */}
              <div className="p-3">
                <h3 className="font-semibold text-gray-900 truncate">{avatar.name}</h3>
                <div className="flex items-center gap-1 mt-1 flex-wrap">
                  {avatar.tags?.slice(0, 3).map((tag: string) => (
                    <span key={tag} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(avatar.created_at).toLocaleDateString('vi-VN')}
                </p>
              </div>
            </div>
          ))}

          {data?.items?.length === 0 && (
            <div className="col-span-full text-center py-16 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>Chưa có avatar nào</p>
              <Link to="/avatar/create" className="text-primary-600 text-sm mt-2 inline-block hover:underline">
                Tạo avatar đầu tiên
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {selectedAvatar && (
        <AvatarDetailModal
          avatar={selectedAvatar}
          onClose={() => setSelectedAvatar(null)}
        />
      )}
    </div>
  );
}
