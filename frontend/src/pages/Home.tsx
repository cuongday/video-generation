import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Video, Zap, Users, FolderOpen, ArrowRight, Play, Sparkles } from 'lucide-react';
import { getTemplates } from '../lib/api';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  affiliate: <Sparkles className="w-5 h-5" />,
  avatar: <Users className="w-5 h-5" />,
  cinematic: <Film className="w-5 h-5" />,
  educational: <BookOpen className="w-5 h-5" />,
  storytelling: <Book className="w-5 h-5" />,
  commercial: <ShoppingBag className="w-5 h-5" />,
  custom: <Plus className="w-5 h-5" />,
};

import { Film, BookOpen, Book, ShoppingBag, Plus } from 'lucide-react';

export default function Home() {
  const { data: templates } = useQuery({
    queryKey: ['templates'],
    queryFn: () => getTemplates(),
  });

  const featuredTemplates = templates?.slice(0, 3) || [];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white">
        <div className="max-w-5xl mx-auto px-8 py-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Video className="w-7 h-7" />
            </div>
            <h1 className="text-3xl font-bold">AI Video Generator</h1>
          </div>
          <p className="text-primary-100 text-lg max-w-2xl mb-8">
            Tạo video bằng AI dễ dàng. Chọn template, tùy chỉnh theo ý bạn, và xem video được tạo ra tức thì.
          </p>

          <div className="flex gap-3">
            <Link
              to="/templates"
              className="inline-flex items-center gap-2 bg-white text-primary-700 px-5 py-2.5 rounded-lg font-medium hover:bg-primary-50 transition-colors"
            >
              <Zap className="w-4 h-4" />
              Bắt đầu tạo video
            </Link>
            <Link
              to="/avatar/create"
              className="inline-flex items-center gap-2 bg-white/20 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-white/30 transition-colors"
            >
              <Users className="w-4 h-4" />
              Tạo AI Avatar
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Start Templates */}
      <div className="max-w-5xl mx-auto px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Template phổ biến</h2>
          <Link to="/templates" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
            Xem tất cả <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {featuredTemplates.map((t: { id: string; name: string; description?: string; category: string; icon: string }) => (
            <Link
              key={t.id}
              to={`/template/${t.id}`}
              className="group bg-white rounded-xl border border-gray-200 p-5 hover:border-primary-300 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center text-primary-600">
                  {CATEGORY_ICONS[t.category] || <Video className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary-700">{t.name}</h3>
                  <p className="text-xs text-gray-500 capitalize">{t.category}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 line-clamp-2">{t.description}</p>
              <div className="mt-3 flex items-center gap-1 text-sm text-primary-600 font-medium">
                <Play className="w-3.5 h-3.5" />
                Bắt đầu
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-10">
          <Link
            to="/avatar/create"
            className="flex items-center gap-4 bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-5 hover:shadow-md transition-all"
          >
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center text-white flex-shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Tạo AI Influencer</h3>
              <p className="text-sm text-purple-700 mt-0.5">Xây dựng nhân vật ảo với ngoại hình tùy chỉnh</p>
            </div>
          </Link>

          <Link
            to="/projects"
            className="flex items-center gap-4 bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-5 hover:shadow-md transition-all"
          >
            <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-white flex-shrink-0">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Quản lý Projects</h3>
              <p className="text-sm text-amber-700 mt-0.5">Xem và tiếp tục các dự án đang làm</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
