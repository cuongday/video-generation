import { useState } from 'react';
import { Film, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Props {
  value?: { style: string; mood: string };
  onChange: (data: Props['value']) => void;
}

const STYLES = [
  { value: 'cinematic', label: 'Cinematic', desc: 'Điện ảnh chuyên nghiệp' },
  { value: 'documentary', label: 'Documentary', desc: 'Phong cách tài liệu' },
  { value: 'anime', label: 'Anime', desc: 'Phong cách hoạt hình Nhật' },
  { value: 'vintage', label: 'Vintage', desc: 'Cổ điển, hoài cổ' },
  { value: 'neon', label: 'Neon', desc: 'Neon, cyberpunk' },
  { value: 'minimalist', label: 'Minimalist', desc: 'Tối giản, hiện đại' },
  { value: 'painterly', label: 'Painterly', desc: 'Giống tranh vẽ' },
  { value: 'documentary_real', label: 'Documentary Real', desc: 'Thực tế, chân thực' },
];

const MOODS = [
  { value: 'epic', label: 'Epic', color: 'bg-orange-100 text-orange-700', desc: 'Hùng vĩ, hoành tráng' },
  { value: 'dark', label: 'Dark', color: 'bg-gray-800 text-white', desc: 'Tối, u ám' },
  { value: 'warm', label: 'Warm', color: 'bg-amber-100 text-amber-700', desc: 'Ấm áp, dễ chịu' },
  { value: 'mysterious', label: 'Mysterious', color: 'bg-purple-100 text-purple-700', desc: ' bí ẩn' },
  { value: 'uplifting', label: 'Uplifting', color: 'bg-green-100 text-green-700', desc: 'Lạc quan, tích cực' },
  { value: 'melancholic', label: 'Melancholic', color: 'bg-blue-100 text-blue-700', desc: 'Buồn, sâu lắng' },
  { value: 'tense', label: 'Tense', color: 'bg-red-100 text-red-700', desc: 'Căng thẳng, kịch tính' },
  { value: 'whimsical', label: 'Whimsical', color: 'bg-pink-100 text-pink-700', desc: 'Ngộ nghĩnh, đáng yêu' },
];

export default function StepStyleSelector({ value, onChange }: Props) {
  const [data, setData] = useState(value || { style: '', mood: '' });

  const update = (updates: Partial<typeof data>) => {
    const next = { ...data, ...updates };
    setData(next);
    onChange(next);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Phong cách & Cảm xúc</h2>
        <p className="text-sm text-gray-500 mt-0.5">Chọn phong cách điện ảnh và mood cho câu chuyện</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Phong cách hình ảnh</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {STYLES.map((s) => (
            <button
              key={s.value}
              onClick={() => update({ style: s.value })}
              className={cn(
                'p-4 rounded-xl border-2 text-left transition-all',
                data.style === s.value
                  ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <Film className="w-4 h-4 text-gray-500" />
                <span className="font-semibold text-sm">{s.label}</span>
                {data.style === s.value && <Check className="w-4 h-4 text-primary-600 ml-auto" />}
              </div>
              <p className="text-xs text-gray-500">{s.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Mood / Cảm xúc</label>
        <div className="flex flex-wrap gap-2">
          {MOODS.map((m) => (
            <button
              key={m.value}
              onClick={() => update({ mood: m.value })}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all',
                data.mood === m.value
                  ? `${m.color} border-current`
                  : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
        {data.mood && (
          <p className="text-xs text-gray-500 mt-2">
            {MOODS.find((m) => m.value === data.mood)?.desc}
          </p>
        )}
      </div>

      {(data.style || data.mood) && (
        <div className="bg-gradient-to-r from-primary-50 to-purple-50 border border-primary-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-800 mb-1">Cấu hình đã chọn:</h4>
          <p className="text-sm text-gray-600">
            {data.style && <span className="font-medium">{data.style}</span>}
            {data.style && data.mood && <span className="text-gray-400 mx-2">+</span>}
            {data.mood && <span className="font-medium">{data.mood}</span>}
          </p>
        </div>
      )}
    </div>
  );
}
