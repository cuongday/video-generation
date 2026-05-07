import { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { MapPin, Plus, RefreshCw, Loader, Check, Sparkles } from 'lucide-react';
import { getSpaces, generateSpace } from '../../lib/api';
import { cn } from '../../lib/utils';
import type { SpaceAsset } from '../../types';

interface Props {
  value?: string;
  onChange: (spaceId: string) => void;
}

const SPACE_PRESETS = [
  { label: 'Modern Living Room', prompt: 'modern minimalist living room with large windows, natural light, clean furniture' },
  { label: 'Cozy Bedroom', prompt: 'cozy bedroom with soft lighting, warm tones, bedroom aesthetic' },
  { label: 'Clean Studio', prompt: 'clean white photography studio, professional lighting setup, minimal background' },
  { label: 'Urban Cafe', prompt: 'modern urban cafe interior, natural lighting through large windows, cozy atmosphere' },
  { label: 'Home Office', prompt: 'modern home office setup, desk with laptop, minimalist design, warm lighting' },
  { label: 'Rooftop Garden', prompt: 'rooftop terrace garden with city view, outdoor furniture, golden hour lighting' },
  { label: 'Beach Background', prompt: 'beach sunset background, golden hour, calm ocean waves, tropical vibes' },
  { label: 'Botanical Garden', prompt: 'indoor botanical garden, lush green plants, natural diffused lighting, serene atmosphere' },
];

export default function StepSpaceSelector({ value, onChange }: Props) {
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [generatedPreview, setGeneratedPreview] = useState<string | null>(null);
  const [generatedSpaceId, setGeneratedSpaceId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['spaces'],
    queryFn: () => getSpaces(),
  });

  const generateMutation = useMutation({
    mutationFn: (prompt: string) => generateSpace({
      prompt,
      style: 'modern minimalist',
      lighting: 'natural lighting',
      aspect_ratio: '16:9',
    }),
    onSuccess: (space: SpaceAsset) => {
      setGeneratedPreview(space.image_path ? '/' + space.image_path.replace('../', '') : null);
      setGeneratedSpaceId(space.id);
      onChange(space.id);
      refetch();
    },
  });

  const spaces = data?.items || [];

  const handlePresetSelect = (preset: typeof SPACE_PRESETS[0]) => {
    setSelectedPreset(preset.label);
    setCustomPrompt(preset.prompt);
  };

  const handleGenerate = () => {
    if (customPrompt) {
      generateMutation.mutate(customPrompt);
    }
  };

  const handleSpaceSelect = (space: SpaceAsset) => {
    onChange(space.id);
    setGeneratedSpaceId(null);
    setGeneratedPreview(space.image_path ? '/' + space.image_path.replace('../', '') : null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Không gian quay</h2>
        <p className="text-sm text-gray-500 mt-0.5">Chọn không gian có sẵn hoặc tạo mới bằng AI</p>
      </div>

      {/* Library Spaces */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader className="w-6 h-6 text-primary-600 animate-spin" />
        </div>
      ) : spaces.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Không gian có sẵn</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {spaces.map((space: SpaceAsset) => (
              <div
                key={space.id}
                onClick={() => handleSpaceSelect(space)}
                className={cn(
                  'relative rounded-xl border-2 overflow-hidden cursor-pointer transition-all',
                  (value === space.id || generatedSpaceId === space.id)
                    ? 'border-primary-500 ring-2 ring-primary-200'
                    : 'border-gray-200 hover:border-purple-300 hover:shadow-sm'
                )}
              >
                <div className="aspect-video bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center">
                  {space.image_path ? (
                    <img
                      src={'/' + space.image_path.replace('../', '')}
                      alt={space.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <MapPin className="w-8 h-8 text-gray-300" />
                  )}
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium text-gray-800 truncate">{space.name}</p>
                  <p className="text-xs text-gray-400 truncate">{space.category}</p>
                </div>
                {(value === space.id || generatedSpaceId === space.id) && (
                  <div className="absolute top-2 right-2 bg-primary-600 rounded-full p-1">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generate New Space */}
      <div className="border-t pt-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-500" />
          Tạo không gian mới bằng AI
        </h3>

        {/* Presets */}
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2">Chọn mẫu có sẵn:</p>
          <div className="flex flex-wrap gap-2">
            {SPACE_PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => handlePresetSelect(preset)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  selectedPreset === preset.label
                    ? 'bg-purple-100 text-purple-700 border border-purple-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Prompt */}
        <div className="mb-4">
          <label className="block text-xs text-gray-500 mb-1.5">Mô tả không gian</label>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            rows={3}
            placeholder="VD: Modern minimalist living room with large windows, natural lighting..."
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white resize-none"
          />
        </div>

        {/* Generated Preview */}
        {generatedPreview && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">Preview:</p>
            <div className="relative inline-block">
              <img src={generatedPreview} alt="Generated space" className="w-full max-h-48 object-cover rounded-xl border border-gray-200" />
              <div className="absolute top-2 left-2 bg-green-600 text-white px-2 py-0.5 rounded text-xs font-medium">
                Đã tạo
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={!customPrompt || generateMutation.isPending}
          className="inline-flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
        >
          {generateMutation.isPending ? (
            <Loader className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Tạo không gian mới
        </button>

        {generateMutation.error && (
          <p className="text-red-500 text-xs mt-2">
            Lỗi: {(generateMutation.error as any)?.message || 'Không thể tạo không gian'}
          </p>
        )}
      </div>
    </div>
  );
}
