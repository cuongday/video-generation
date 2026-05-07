import { Check, Camera, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { TemplateConfig } from '../../types';

interface Props {
  template?: TemplateConfig;
  selectedShots?: string[];
  onChange: (shots: string[]) => void;
}

export default function StepShotSelector({ template, selectedShots = [], onChange }: Props) {
  const shotDefinitions = template?.shots_config?.shot_definitions || {};
  const defaultShots = template?.shots_config?.default_shots || [];

  const activeShots = selectedShots.length > 0 ? selectedShots : defaultShots;

  const toggleShot = (shotId: string) => {
    if (activeShots.includes(shotId)) {
      if (activeShots.length > 1) {
        onChange(activeShots.filter((s) => s !== shotId));
      }
    } else {
      onChange([...activeShots, shotId]);
    }
  };

  if (Object.keys(shotDefinitions).length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <Camera className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p>Template này không có cấu hình shots</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Cấu hình Shots</h2>
        <p className="text-sm text-gray-500 mt-0.5">Chọn các shot cần có trong video (tối thiểu 1 shot)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(shotDefinitions).map(([shotId, shot]) => (
          <div
            key={shotId}
            onClick={() => toggleShot(shotId)}
            className={cn(
              'relative p-4 rounded-xl border-2 cursor-pointer transition-all',
              activeShots.includes(shotId)
                ? 'border-primary-500 bg-primary-50/50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                activeShots.includes(shotId) ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500'
              )}>
                <Camera className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{shot.name}</h3>
                  {activeShots.includes(shotId) && (
                    <Check className="w-4 h-4 text-primary-600 flex-shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {shot.duration}s
                  </span>
                  <span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">
                    {shot.camera}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {shot.elements?.map((el: string) => (
                    <span key={el} className="px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded text-xs">
                      {el}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Shot Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Tổng quan</h4>
        <div className="flex flex-wrap gap-2">
          {activeShots.map((shotId) => {
            const shot = shotDefinitions[shotId];
            if (!shot) return null;
            return (
              <div key={shotId} className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs">
                <span className="font-medium text-gray-800">{shot.name}</span>
                <span className="text-gray-400">{shot.duration}s</span>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Tổng thời lượng ước tính: {activeShots.reduce((sum, id) => sum + (shotDefinitions[id]?.duration || 0), 0)}s
        </p>
      </div>
    </div>
  );
}
