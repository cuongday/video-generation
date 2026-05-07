import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { Video, Users, Film, BookOpen, Book, ShoppingBag, Plus, Search, Filter } from 'lucide-react';
import { getTemplates } from '../lib/api';
import { TEMPLATE_CATEGORIES } from '../lib/constants';
import { cn } from '../lib/utils';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  affiliate: <ShoppingBag className="w-5 h-5" />,
  avatar: <Users className="w-5 h-5" />,
  cinematic: <Film className="w-5 h-5" />,
  educational: <BookOpen className="w-5 h-5" />,
  storytelling: <Book className="w-5 h-5" />,
  commercial: <ShoppingBag className="w-5 h-5" />,
  custom: <Plus className="w-5 h-5" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  affiliate: 'bg-pink-50 text-pink-600 border-pink-200',
  avatar: 'bg-purple-50 text-purple-600 border-purple-200',
  cinematic: 'bg-blue-50 text-blue-600 border-blue-200',
  educational: 'bg-green-50 text-green-600 border-green-200',
  storytelling: 'bg-orange-50 text-orange-600 border-orange-200',
  commercial: 'bg-amber-50 text-amber-600 border-amber-200',
  custom: 'bg-gray-50 text-gray-600 border-gray-200',
};

export default function TemplateGallery() {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('category') || 'all';

  const { data: templates, isLoading } = useQuery({
    queryKey: ['templates', category],
    queryFn: () => getTemplates(category === 'all' ? undefined : category),
  });

  return (
    <div className="max-w-6xl mx-auto px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Bộ sưu tập Template</h1>
        <p className="text-gray-500 mt-1">Chọn template phù hợp để bắt đầu tạo video</p>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 mb-8 flex-wrap">
        {TEMPLATE_CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setSearchParams(cat.value === 'all' ? {} : { category: cat.value })}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium border transition-colors',
              category === cat.value || (cat.value === 'all' && !category)
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl h-48 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {templates?.map((t: { id: string; name: string; description?: string; category: string; icon: string; is_builtin: boolean }) => (
            <Link
              key={t.id}
              to={`/template/${t.id}`}
              className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-primary-300 hover:shadow-lg transition-all"
            >
              {/* Preview Area */}
              <div className="h-36 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className={cn(
                  'w-14 h-14 rounded-xl flex items-center justify-center border-2',
                  CATEGORY_COLORS[t.category] || CATEGORY_COLORS.custom
                )}>
                  {CATEGORY_ICONS[t.category] || <Video className="w-6 h-6" />}
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn(
                    'px-2 py-0.5 rounded text-xs font-medium capitalize border',
                    CATEGORY_COLORS[t.category] || CATEGORY_COLORS.custom
                  )}>
                    {t.category}
                  </span>
                  {t.is_builtin && (
                    <span className="px-2 py-0.5 rounded text-xs bg-primary-50 text-primary-600 border border-primary-200">
                      Có sẵn
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-primary-700">{t.name}</h3>
                <p className="text-sm text-gray-500 line-clamp-2">{t.description}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {templates?.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Video className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>Không có template nào trong danh mục này</p>
        </div>
      )}
    </div>
  );
}
