import { useState } from 'react';
import { Loader } from 'lucide-react';

interface SceneItem {
  shotId: string;
  description: string;
  duration: number;
}

interface Props {
  value?: SceneItem[];
  onChange: (scenes: SceneItem[]) => void;
}

export default function StepSceneEditor({ value = [], onChange }: Props) {
  const [scenes, setScenes] = useState<SceneItem[]>(
    value.length > 0 ? value : [
      { shotId: 'setup', description: '', duration: 10 },
      { shotId: 'conflict', description: '', duration: 15 },
      { shotId: 'climax', description: '', duration: 15 },
      { shotId: 'resolution', description: '', duration: 10 },
    ]
  );

  const updateScene = (index: number, updates: Partial<SceneItem>) => {
    const next = scenes.map((s, i) => i === index ? { ...s, ...updates } : s);
    setScenes(next);
    onChange(next);
  };

  const shotNames: Record<string, string> = {
    setup: 'Thiết lập',
    conflict: 'Xung đột',
    climax: 'Cao trào',
    resolution: 'Giải quyết',
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Mô tả từng Scene</h2>
        <p className="text-sm text-gray-500 mt-0.5">Viết mô tả ngắn cho mỗi scene trong câu chuyện</p>
      </div>

      <div className="space-y-4">
        {scenes.map((scene, i) => (
          <div key={scene.shotId} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-sm font-bold">
                {i + 1}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{shotNames[scene.shotId] || scene.shotId}</h3>
                <p className="text-xs text-gray-500">Duration: {scene.duration}s</p>
              </div>
            </div>
            <textarea
              value={scene.description}
              onChange={(e) => updateScene(i, { description: e.target.value })}
              rows={3}
              placeholder={`Mô tả scene "${shotNames[scene.shotId] || scene.shotId}"...`}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white resize-none"
            />
          </div>
        ))}
      </div>

      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-xs text-gray-500">
          Tổng thời lượng: {scenes.reduce((sum, s) => sum + s.duration, 0)}s
        </p>
      </div>
    </div>
  );
}
