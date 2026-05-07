import { useState } from 'react';
import { BookOpen, Loader } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Props {
  value?: { storyTitle: string; genre: string; setting: string; mainCharacters: string };
  onChange: (data: Props['value']) => void;
}

const GENRES = [
  { value: 'drama', label: 'Drama', desc: 'Bi kịch, cảm xúc' },
  { value: 'comedy', label: 'Comedy', desc: 'Hài hước, vui nhộn' },
  { value: 'thriller', label: 'Thriller', desc: 'Hồi hộp, căng thẳng' },
  { value: 'romance', label: 'Romance', desc: 'Lãng mạn, tình cảm' },
  { value: 'scifi', label: 'Sci-Fi', desc: 'Khoa học viễn tưởng' },
  { value: 'fantasy', label: 'Fantasy', desc: 'Phép thuật, thần thoại' },
  { value: 'documentary', label: 'Documentary', desc: 'Tài liệu, thực tế' },
  { value: 'action', label: 'Action', desc: 'Hành động, phiêu lưu' },
];

export default function StepPromptInput({ value, onChange }: Props) {
  const [data, setData] = useState(value || {
    storyTitle: '',
    genre: '',
    setting: '',
    mainCharacters: '',
  });

  const update = (updates: Partial<typeof data>) => {
    const next = { ...data, ...updates };
    setData(next);
    onChange(next);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Cài đặt câu chuyện</h2>
        <p className="text-sm text-gray-500 mt-0.5">Nhập thông tin cơ bản về câu chuyện bạn muốn kể</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên câu chuyện *</label>
        <input
          type="text"
          value={data.storyTitle}
          onChange={(e) => update({ storyTitle: e.target.value })}
          placeholder="VD: Hành trình tìm lại bản thân, Chuyến phiêu lưu của..."
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Thể loại</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {GENRES.map((g) => (
            <button
              key={g.value}
              onClick={() => update({ genre: g.value })}
              className={cn(
                'p-3 rounded-xl border-2 text-left transition-all',
                data.genre === g.value
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              )}
            >
              <span className="font-medium text-sm">{g.label}</span>
              <p className="text-xs text-gray-500 mt-0.5">{g.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Bối cảnh</label>
        <textarea
          value={data.setting}
          onChange={(e) => update({ setting: e.target.value })}
          rows={3}
          placeholder="VD: Tokyo hiện đại, một thành phố nhỏ ven biển vào những năm 1980, một vương quốc thần tiên..."
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Nhân vật chính</label>
        <textarea
          value={data.mainCharacters}
          onChange={(e) => update({ mainCharacters: e.target.value })}
          rows={2}
          placeholder="VD: Maya, một nghệ sĩ 28 tuổi đang tìm kiếm nguồn cảm hứng; Ken, một chàng trai trẻ với ước mơ lớn..."
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white resize-none"
        />
      </div>

      {data.storyTitle && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary-600" />
          <p className="text-sm text-primary-700 font-medium">"{data.storyTitle}"</p>
          {data.genre && <span className="text-xs text-primary-500">({data.genre})</span>}
        </div>
      )}
    </div>
  );
}
