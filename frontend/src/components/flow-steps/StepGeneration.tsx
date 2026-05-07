import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Play, Loader, Video, Image, Wand2 } from 'lucide-react';
import { generateVideo, generateImage, createProject } from '../../lib/api';
import { cn } from '../../lib/utils';
import type { TemplateConfig } from '../../types';

const VIDEO_PROVIDERS = [
  { id: 'kling', label: 'Kling', desc: 'Chất lượng cao, nhanh' },
  { id: 'seedance', label: 'Seedance', desc: 'Mượt mà, chi tiết' },
  { id: 'sora', label: 'Sora', desc: 'Sáng tạo, đa dạng' },
  { id: 'veo', label: 'Veo (Google)', desc: 'Chân thực, có âm thanh' },
];

const IMAGE_PROVIDERS = [
  { id: 'nano_banana', label: 'Nano Banana (Gemini)', desc: 'Ảnh chân thực, AI mạnh' },
  { id: 'dalle', label: 'DALL-E', desc: 'Sáng tạo, đa dạng' },
];

const ASPECT_RATIOS = [
  { value: '16:9', label: '16:9', desc: 'Ngang (YouTube)' },
  { value: '9:16', label: '9:16', desc: 'Dọc (TikTok/Reels)' },
  { value: '1:1', label: '1:1', desc: 'Vuông (Instagram)' },
];

interface ShotScript {
  shotId: string;
  prompt: string;
}

interface FlowData {
  avatarId?: string;
  product?: { name: string; brand: string; price: string; description: string; features: string; imageUrl?: string };
  spaceId?: string;
  selectedShots?: string[];
  scripts?: ShotScript[];
}

interface Props {
  template?: TemplateConfig;
  flowData?: FlowData;
  onComplete?: () => void;
}

export default function StepGeneration({ template, flowData, onComplete }: Props) {
  const [videoProvider, setVideoProvider] = useState(template?.defaults?.provider || 'kling');
  const [imageProvider, setImageProvider] = useState(template?.defaults?.image_provider || 'nano_banana');
  const [aspectRatio, setAspectRatio] = useState(template?.defaults?.aspect_ratio || '16:9');
  const [duration, setDuration] = useState(5);
  const [generatedJobs, setGeneratedJobs] = useState<Array<{ shotId: string; jobId: string; type: string }>>([]);

  const createProjectMutation = useMutation({
    mutationFn: (data: object) => createProject(data),
  });

  const generateImageMutation = useMutation({
    mutationFn: (data: object) => generateImage(data),
  });

  const generateVideoMutation = useMutation({
    mutationFn: (data: object) => generateVideo(data),
  });

  const handleGenerate = async () => {
    if (!flowData) return;

    // Create project first
    const project = await createProjectMutation.mutateAsync({
      name: `${template?.name || 'Video'} - ${new Date().toLocaleDateString('vi-VN')}`,
      template_id: template?.id,
      flow_type: template?.category,
      flow_data: flowData,
      aspect_ratio: aspectRatio,
      status: 'generating',
    });

    const jobs: Array<{ shotId: string; jobId: string; type: string }> = [];

    // Generate images for each shot
    const selectedShots = flowData.selectedShots || template?.shots_config?.default_shots || [];
    const scripts = flowData.scripts || [];

    for (const shotId of selectedShots) {
      const script = scripts.find((s) => s.shotId === shotId);
      if (!script?.prompt) continue;

      try {
        const result = await generateImageMutation.mutateAsync({
          prompt: script.prompt,
          aspect_ratio: aspectRatio,
          provider: imageProvider,
          project_id: project.id,
        });
        jobs.push({ shotId, jobId: result.job_id, type: 'image' });
      } catch (e) {
        console.error(`Failed to generate image for ${shotId}:`, e);
      }
    }

    setGeneratedJobs(jobs);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Cấu hình & Tạo Video</h2>
        <p className="text-sm text-gray-500 mt-0.5">Chọn provider và bắt đầu tạo nội dung</p>
      </div>

      {/* Provider Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Provider tạo ảnh</label>
        <div className="grid grid-cols-2 gap-3">
          {IMAGE_PROVIDERS.map((p) => (
            <button
              key={p.id}
              onClick={() => setImageProvider(p.id)}
              className={cn(
                'p-3 rounded-xl border-2 text-left transition-all',
                imageProvider === p.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <Image className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-sm">{p.label}</span>
              </div>
              <p className="text-xs text-gray-500">{p.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Provider tạo video</label>
        <div className="grid grid-cols-3 gap-3">
          {VIDEO_PROVIDERS.map((p) => (
            <button
              key={p.id}
              onClick={() => setVideoProvider(p.id)}
              className={cn(
                'p-3 rounded-xl border-2 text-left transition-all',
                videoProvider === p.id
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <Video className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-sm">{p.label}</span>
              </div>
              <p className="text-xs text-gray-500">{p.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Aspect Ratio */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Tỷ lệ khung hình</label>
        <div className="grid grid-cols-3 gap-3">
          {ASPECT_RATIOS.map((r) => (
            <button
              key={r.value}
              onClick={() => setAspectRatio(r.value)}
              className={cn(
                'p-3 rounded-xl border-2 text-center transition-all',
                aspectRatio === r.value
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              )}
            >
              <span className="font-medium text-sm">{r.label}</span>
              <p className="text-xs text-gray-500 mt-0.5">{r.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Thời lượng video mỗi shot (giây): {duration}s
        </label>
        <input
          type="range"
          min={1}
          max={30}
          value={duration}
          onChange={(e) => setDuration(parseInt(e.target.value))}
          className="w-full accent-green-600"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>1s</span><span>30s</span>
        </div>
      </div>

      {/* Flow Data Summary */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-2">
        <h4 className="text-sm font-medium text-gray-700">Tóm tắt nội dung</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {flowData?.avatarId && (
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400">Avatar:</span>
              <span className="font-medium text-gray-700">Đã chọn</span>
            </div>
          )}
          {flowData?.product?.name && (
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400">Sản phẩm:</span>
              <span className="font-medium text-gray-700">{flowData.product.name}</span>
            </div>
          )}
          {flowData?.spaceId && (
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400">Không gian:</span>
              <span className="font-medium text-gray-700">Đã chọn</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400">Shots:</span>
            <span className="font-medium text-gray-700">
              {flowData?.selectedShots?.length || template?.shots_config?.default_shots?.length || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Generated Jobs */}
      {generatedJobs.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-green-800 mb-2">Đã tạo {generatedJobs.length} jobs</h4>
          <div className="space-y-1.5">
            {generatedJobs.map((job) => (
              <div key={job.shotId} className="flex items-center gap-2 text-xs text-green-700">
                <Loader className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
                <span>Shot: {job.shotId}</span>
                <span className="text-green-400">({job.type})</span>
                <span className="text-green-500">Job: {job.jobId.substring(0, 8)}...</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-green-600 mt-2">
            Có thể kiểm tra tiến trình trong Dashboard hoặc Jobs
          </p>
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={generateImageMutation.isPending || createProjectMutation.isPending}
        className={cn(
          'w-full py-3 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2',
          'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        {generateImageMutation.isPending || createProjectMutation.isPending ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            Đang khởi tạo...
          </>
        ) : (
          <>
            <Wand2 className="w-5 h-5" />
            Bắt đầu tạo video
          </>
        )}
      </button>

      {generateImageMutation.isError && (
        <p className="text-red-500 text-sm text-center">
          Lỗi: {(generateImageMutation.error as any)?.message || 'Không thể tạo video'}
        </p>
      )}
    </div>
  );
}
