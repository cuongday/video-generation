import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Sparkles, Copy, Check, Loader, RefreshCw } from 'lucide-react';
import { enhancePrompt } from '../../lib/api';
import { cn } from '../../lib/utils';
import type { TemplateConfig } from '../../types';

interface ShotScript {
  shotId: string;
  prompt: string;
  enhancedPrompt?: string;
}

interface Props {
  template?: TemplateConfig;
  selectedShots?: string[];
  value?: ShotScript[];
  onChange: (scripts: ShotScript[]) => void;
}

export default function StepScriptEditor({ template, selectedShots = [], value = [], onChange }: Props) {
  const [scripts, setScripts] = useState<ShotScript[]>(() => {
    if (value.length > 0) return value;
    const defaults = template?.shots_config?.default_shots || [];
    return defaults.map((shotId) => {
      const shot = template?.shots_config?.shot_definitions?.[shotId];
      return {
        shotId,
        prompt: shot?.prompt_template || '',
      };
    });
  });

  const [enhancingId, setEnhancingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const enhanceMutation = useMutation({
    mutationFn: (prompt: string) => enhancePrompt({ prompt }),
  });

  const updatePrompt = (shotId: string, prompt: string) => {
    const updated = scripts.map((s) =>
      s.shotId === shotId ? { ...s, prompt } : s
    );
    setScripts(updated);
    onChange(updated);
  };

  const handleEnhance = async (shot: ShotScript) => {
    if (!shot.prompt) return;
    setEnhancingId(shot.shotId);
    try {
      const result = await enhanceMutation.mutateAsync(shot.prompt);
      const enhanced = result.enhanced_prompt || result.prompt || shot.prompt;
      const updated = scripts.map((s) =>
        s.shotId === shot.shotId ? { ...s, prompt: enhanced, enhancedPrompt: enhanced } : s
      );
      setScripts(updated);
      onChange(updated);
    } catch {
      // error handled by mutation
    } finally {
      setEnhancingId(null);
    }
  };

  const handleCopy = (shot: ShotScript) => {
    navigator.clipboard.writeText(shot.prompt);
    setCopiedId(shot.shotId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const shotDefinitions = template?.shots_config?.shot_definitions || {};
  const activeShots = selectedShots.length > 0 ? selectedShots : (template?.shots_config?.default_shots || []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Kịch bản & Prompt</h2>
        <p className="text-sm text-gray-500 mt-0.5">Viết prompt cho từng shot. Có thể dùng AI để cải thiện.</p>
      </div>

      <div className="space-y-4">
        {activeShots.map((shotId) => {
          const shot = shotDefinitions[shotId];
          const script = scripts.find((s) => s.shotId === shotId);
          if (!shot) return null;

          return (
            <div key={shotId} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {activeShots.indexOf(shotId) + 1}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{shot.name}</h3>
                  <p className="text-xs text-gray-500">
                    Camera: {shot.camera} | Duration: {shot.duration}s
                  </p>
                </div>
              </div>

              {/* Template hint */}
              <div className="mb-2">
                <p className="text-xs text-gray-400">Template: <span className="italic">{shot.prompt_template?.substring(0, 80)}...</span></p>
              </div>

              <textarea
                value={script?.prompt || ''}
                onChange={(e) => updatePrompt(shotId, e.target.value)}
                rows={4}
                placeholder="Viết prompt cho shot này..."
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white resize-none font-mono"
              />

              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => handleEnhance({ shotId, prompt: script?.prompt || '' })}
                  disabled={!script?.prompt || enhancingId === shotId}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    'bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50'
                  )}
                >
                  {enhancingId === shotId ? (
                    <Loader className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  Cải thiện với AI
                </button>
                <button
                  onClick={() => handleCopy({ shotId, prompt: script?.prompt || '' })}
                  disabled={!script?.prompt}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {copiedId === shotId ? (
                    <Check className="w-3.5 h-3.5 text-green-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copiedId === shotId ? 'Đã copy' : 'Copy'}
                </button>
              </div>

              {enhanceMutation.isError && enhancingId === shotId && (
                <p className="text-red-500 text-xs mt-2">
                  Lỗi AI: {(enhanceMutation.error as any)?.message || 'Không thể cải thiện prompt'}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {scripts.some((s) => s.prompt) && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
          <Check className="w-4 h-4 text-green-600" />
          <p className="text-sm text-green-700 font-medium">
            {scripts.filter((s) => s.prompt).length}/{scripts.length} shots đã có prompt
          </p>
        </div>
      )}
    </div>
  );
}
