import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ChevronLeft, ChevronRight, Loader, RefreshCw, Save, Upload, User, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAvatarStore } from '../stores/useAvatarStore';
import {
  GENDERS, ETHNICITIES, FACE_SHAPES, FACE_SHAPE_LABELS, EYE_SHAPES, EYE_SHAPE_LABELS,
  EYE_COLORS, EYE_COLOR_LABELS, EYE_SIZES, EYE_SIZE_LABELS,
  NOSE_SHAPES, NOSE_SHAPE_LABELS, NOSE_WIDTHS, NOSE_WIDTH_LABELS,
  LIP_SHAPES, LIP_SHAPE_LABELS, LIP_VOLUMES, LIP_VOLUME_LABELS,
  SKIN_COLORS, SKIN_COLOR_LABELS, SKIN_UNDERTOONES, SKIN_UNDERTOONE_LABELS,
  HAIR_STYLES, HAIR_STYLE_LABELS, HAIR_LENGTHS, HAIR_LENGTH_LABELS, HAIR_COLORS,
  BANGS_OPTIONS, BANGS_LABELS, EYEBROW_SHAPES, EYEBROW_SHAPE_LABELS,
  EXPRESSIONS, BODY_TYPES, BODY_TYPE_LABELS, HEIGHTS, HEIGHT_LABELS,
  SHOES_OPTIONS, SHOES_LABELS,
  FRECKLES_OPTIONS, DIMPLES_OPTIONS, MULTI_ANGLE_OPTIONS, MULTI_OUTFIT_OPTIONS,
  SHOOTING_STYLES, CAMERA_ANGLES, ASPECT_RATIOS_IMAGE,
} from '../lib/constants';
import { createAvatar, getAvatar, generateReferenceImages, generateMultiAngle, generateMultiOutfit, generateVariations } from '../lib/api';
import { synthesizeAvatarPattern } from '../lib/api';

const STEPS = [
  { id: 'name', title: 'Đặt tên' },
  { id: 'identity', title: 'Giới tính & Ethnicity' },
  { id: 'face', title: 'Gương mặt' },
  { id: 'body', title: 'Thân thể & Trang phục' },
  { id: 'influencer', title: 'Influencer Style' },
  { id: 'generate', title: 'Tạo Reference' },
  { id: 'assets', title: 'Assets bổ sung' },
  { id: 'save', title: 'Lưu Avatar' },
];

export default function AvatarCreator() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const store = useAvatarStore();
  const [error, setError] = useState<string | null>(null);

  const synthesizeMutation = useMutation({
    mutationFn: (biometrics: object) => synthesizeAvatarPattern(biometrics),
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; biometrics: object; avatar_type: string; tags: string[]; description: string }) =>
      createAvatar(data),
  });

  const generateRefMutation = useMutation({
    mutationFn: ({ avatarId, n, aspectRatio }: { avatarId: string; n: number; aspectRatio: string }) => 
      generateReferenceImages(avatarId, n, undefined, aspectRatio),
    onError: (err: any) => {
      const errorMsg = err?.response?.data?.detail || err?.message || 'Unknown error';
      setError(`Lỗi tạo Reference: ${errorMsg}`);
    },
  });

  const generateAnglesMutation = useMutation({
    mutationFn: ({ avatarId, angles }: { avatarId: string; angles: string[] }) => generateMultiAngle(avatarId, angles),
    onError: (err: any) => {
      const errorMsg = err?.response?.data?.detail || err?.message || 'Unknown error';
      setError(`Lỗi tạo góc mặt: ${errorMsg}`);
    },
  });

  const generateOutfitsMutation = useMutation({
    mutationFn: ({ avatarId, outfits }: { avatarId: string; outfits: string[] }) => generateMultiOutfit(avatarId, outfits),
    onError: (err: any) => {
      const errorMsg = err?.response?.data?.detail || err?.message || 'Unknown error';
      setError(`Lỗi tạo trang phục: ${errorMsg}`);
    },
  });

  const generateVariationsMutation = useMutation({
    mutationFn: ({ avatarId, n }: { avatarId: string; n: number }) => generateVariations(avatarId, n),
    onError: (err: any) => {
      const errorMsg = err?.response?.data?.detail || err?.message || 'Unknown error';
      setError(`Lỗi tạo biến thể: ${errorMsg}`);
    },
  });

  const [synthesizedPrompt, setSynthesizedPrompt] = useState('');
  const [createdAvatar, setCreatedAvatar] = useState<{ id: string; face_images?: string[]; reference_image_path?: string } | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [variationImages, setVariationImages] = useState<string[]>([]);
  const [imageCount, setImageCount] = useState(4);

  const handleSynthesize = async () => {
    setError(null);
    const result = await synthesizeMutation.mutateAsync(store.biometrics);
    setSynthesizedPrompt(result.full_body_prompt || result.main_prompt);
  };

  const handleCreateAvatar = async () => {
    setError(null);
    const avatar = await createMutation.mutateAsync({
      name: store.name,
      biometrics: store.biometrics,
      avatar_type: 'ai_generated',
      tags: store.tags,
      description: store.description || synthesizedPrompt,
    });
    setCreatedAvatar(avatar);
  };

  const handleGenerateImages = async () => {
    if (!createdAvatar) return;
    setError(null);
    try {
      const ref = await generateRefMutation.mutateAsync({ 
        avatarId: createdAvatar.id, 
        n: imageCount,
        aspectRatio: store.aspectRatio,
      });
      // Update state with paths from response
      const paths = (ref.variations || []).map((p: string) => {
        if (p.startsWith('../')) {
          return '/' + p.replace('../', '');
        }
        return p;
      });
      setGeneratedImages(paths);
      setVariationImages([]);
      // Reload avatar to update state
      const updatedAvatar = await getAvatar(createdAvatar.id);
      setCreatedAvatar(updatedAvatar);
    } catch (e) {
      // Error handled by mutation onError
    }
  };

  const handleGenerateVariations = async () => {
    if (!createdAvatar) return;
    setError(null);
    try {
      const ref = await generateVariationsMutation.mutateAsync({ 
        avatarId: createdAvatar.id, 
        n: imageCount,
      });
      // Update state with variations from response
      const paths = (ref.variations || []).map((p: string) => {
        if (p.startsWith('../')) {
          return '/' + p.replace('../', '');
        }
        return p;
      });
      setVariationImages(paths);
      // Also update generatedImages to show all variations_images
      const allPaths = (ref.variations_images || []).map((p: string) => {
        if (p.startsWith('../')) {
          return '/' + p.replace('../', '');
        }
        return p;
      });
      setGeneratedImages(allPaths);
      // Reload avatar to update state
      const updatedAvatar = await getAvatar(createdAvatar.id);
      setCreatedAvatar(updatedAvatar);
    } catch (e) {
      // Error handled by mutation onError
    }
  };

  const handleSaveProfile = () => {
    navigate('/avatar/library');
  };

  return (
    <div className="max-w-4xl mx-auto px-8 py-8">
      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2 flex-shrink-0">
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
              i < step ? 'bg-green-500 text-white' :
              i === step ? 'bg-primary-600 text-white' :
              'bg-gray-200 text-gray-500'
            )}>
              {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
            </div>
            <span className={cn('text-sm font-medium', i === step ? 'text-primary-700' : 'text-gray-400')}>
              {s.title}
            </span>
            {i < STEPS.length - 1 && (
              <div className={cn('w-8 h-0.5', i < step ? 'bg-green-400' : 'bg-gray-200')} />
            )}
          </div>
        ))}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-700 font-medium">Đã xảy ra lỗi</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-xs text-red-500 hover:text-red-700 underline"
            >
              Đóng thông báo
            </button>
          </div>
        </div>
      )}

      {/* Step Content */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 min-h-96">
        {step === 0 && <StepName store={store} />}
        {step === 1 && <StepIdentity store={store} />}
        {step === 2 && <StepFace store={store} />}
        {step === 3 && <StepBody store={store} />}
        {step === 4 && <StepInfluencer store={store} />}
        {step === 5 && (
          <StepGenerate
            store={store}
            synthesizedPrompt={synthesizedPrompt}
            onSynthesize={handleSynthesize}
            synthesizeLoading={synthesizeMutation.isPending}
            createdAvatar={createdAvatar}
            generatedImages={generatedImages}
            variationImages={variationImages}
            onCreateAvatar={handleCreateAvatar}
            onGenerateImages={handleGenerateImages}
            onGenerateVariations={handleGenerateVariations}
            imageCount={imageCount}
            setImageCount={setImageCount}
            createLoading={createMutation.isPending}
            generateLoading={generateRefMutation.isPending || generateVariationsMutation.isPending}
          />
        )}
        {step === 6 && (
          <StepAssets
            createdAvatar={createdAvatar}
            selectedAngles={store.selectedAngles}
            selectedOutfits={store.selectedOutfits}
            setSelectedAngles={(a) => store.setSelectedAngles(a)}
            setSelectedOutfits={(o) => store.setSelectedOutfits(o)}
            generateAngles={generateAnglesMutation}
            generateOutfits={generateOutfitsMutation}
          />
        )}
        {step === 7 && <StepSave store={store} createdAvatar={createdAvatar} onSave={() => navigate('/avatar/library')} />}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-40"
        >
          <ChevronLeft className="w-4 h-4" /> Quay lại
        </button>
        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep(step + 1)}
            className="inline-flex items-center gap-2 bg-primary-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-primary-700"
          >
            Tiếp tục <ChevronRight className="w-4 h-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

function StepName({ store }: { store: typeof useAvatarStore.prototype }) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-1">Đặt tên Avatar</h2>
      <p className="text-gray-500 mb-6">Đặt tên để dễ nhận biết nhân vật ảo của bạn</p>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tên Avatar *</label>
          <input
            type="text"
            value={store.name}
            onChange={(e) => store.setName(e.target.value)}
            placeholder="VD: Linh, Minh, Sarah..."
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
          <input
            type="text"
            value={store.tags.join(', ')}
            onChange={(e) => store.setTags(e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
            placeholder="VD: female-host, lifestyle, product-review"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <p className="text-xs text-gray-400 mt-1">Phân cách bằng dấu phẩy</p>
        </div>
      </div>
    </div>
  );
}

function StepIdentity({ store }: { store: typeof useAvatarStore.prototype }) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-1">Giới tính & Ethnicity</h2>
      <p className="text-gray-500 mb-6">Chọn giới tính và nguồn gốc ethnicity cho nhân vật ảo</p>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Giới tính</label>
          <div className="grid grid-cols-3 gap-2">
            {GENDERS.map((g) => (
              <button
                key={g.value}
                onClick={() => store.updateBiometrics({ gender: g.value as 'female' | 'male' | 'non-binary' })}
                className={cn(
                  'px-3 py-2 rounded-lg border text-sm font-medium transition-colors',
                  store.biometrics.gender === g.value
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                )}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ethnicity</label>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
            {ETHNICITIES.map((e) => (
              <button
                key={e.value}
                onClick={() => store.updateBiometrics({ ethnicity: e.value as typeof store.biometrics.ethnicity })}
                className={cn(
                  'px-3 py-2 rounded-lg border text-sm font-medium transition-colors text-left',
                  store.biometrics.ethnicity === e.value
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                )}
              >
                {e.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Độ tuổi: {store.biometrics.age || 25}</label>
        <input
          type="range"
          min={18}
          max={65}
          value={store.biometrics.age || 25}
          onChange={(e) => store.updateBiometrics({ age: parseInt(e.target.value) })}
          className="w-full accent-primary-600"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>18</span><span>65</span>
        </div>
      </div>
    </div>
  );
}

function SelectField({ label, value, options, onChange }: {
  label: string; value: string; options: readonly string[]; onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1).replace(/_/g, ' ')}</option>
        ))}
      </select>
    </div>
  );
}

function StepFace({ store }: { store: typeof useAvatarStore.prototype }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Tùy chỉnh Gương mặt</h2>
        <p className="text-gray-500 text-sm">Chọn các đặc điểm khuôn mặt — click vào hình phù hợp với bạn</p>
      </div>

      {/* Face Shape */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <span className="w-5 h-5 rounded bg-amber-100 text-amber-600 flex items-center justify-center text-xs">1</span>
          Hình dáng mặt
        </h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {FACE_SHAPES.map((shape) => (
            <button
              key={shape}
              onClick={() => store.updateBiometrics({ face_shape: shape })}
              className={cn(
                'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center',
                store.biometrics.face_shape === shape
                  ? 'border-primary-500 bg-primary-50 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              )}
            >
              <FaceShapeSVG shape={shape} />
              <span className="text-xs font-medium text-gray-700">{FACE_SHAPE_LABELS[shape] ?? shape}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Eye Shape */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <span className="w-5 h-5 rounded bg-blue-100 text-blue-600 flex items-center justify-center text-xs">2</span>
          Hình dáng mắt
        </h3>
        <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
          {EYE_SHAPES.map((shape) => (
            <button
              key={shape}
              onClick={() => store.updateBiometrics({ eye_shape: shape })}
              className={cn(
                'flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all text-center',
                store.biometrics.eye_shape === shape
                  ? 'border-primary-500 bg-primary-50 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              )}
            >
              <EyeShapeSVG shape={shape} />
              <span className="text-xs font-medium text-gray-700">{EYE_SHAPE_LABELS[shape] ?? shape}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Eye Color */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <span className="w-5 h-5 rounded bg-purple-100 text-purple-600 flex items-center justify-center text-xs">3</span>
          Màu mắt
        </h3>
        <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
          {EYE_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => store.updateBiometrics({ eye_color: color })}
              className={cn(
                'flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all text-center',
                store.biometrics.eye_color === color
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              )}
            >
              <div className={cn('w-7 h-7 rounded-full border border-black/10 shadow-inner', EYE_COLOR_MAP[color] ?? 'bg-gray-400')} />
              <span className="text-xs text-gray-500">{EYE_COLOR_LABELS[color] ?? color}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Skin Color */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <span className="w-5 h-5 rounded bg-pink-100 text-pink-600 flex items-center justify-center text-xs">4</span>
          Màu da
        </h3>
        <div className="grid grid-cols-5 md:grid-cols-7 gap-2">
          {SKIN_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => store.updateBiometrics({ skin_color: color })}
              className={cn(
                'flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all text-center',
                store.biometrics.skin_color === color
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              )}
            >
              <div className={cn('w-8 h-8 rounded-full border-2 shadow-inner', SKIN_COLOR_MAP[color] ?? 'bg-gray-400', store.biometrics.skin_color === color ? 'ring-2 ring-offset-1 ring-primary-400' : 'border-white/50')} />
              <span className="text-xs text-gray-500">{SKIN_COLOR_LABELS[color] ?? color}</span>
            </button>
          ))}
        </div>
        {/* Undertone */}
        <div className="mt-3">
          <label className="text-xs text-gray-500 mb-2 block">Tone da</label>
          <div className="flex gap-2">
            {SKIN_UNDERTOONES.map((t) => (
              <button
                key={t}
                onClick={() => store.updateBiometrics({ skin_undertone: t })}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all',
                  store.biometrics.skin_undertone === t
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'
                )}
              >
                {SKIN_UNDERTOONE_LABELS[t] ?? t}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Nose */}
      <div className="grid grid-cols-2 gap-6">
        <section>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Hình dáng mũi</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {NOSE_SHAPES.map((shape) => (
              <button
                key={shape}
                onClick={() => store.updateBiometrics({ nose_shape: shape })}
                className={cn(
                  'flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all text-center',
                  store.biometrics.nose_shape === shape
                    ? 'border-primary-500 bg-primary-50 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                )}
              >
                <NoseShapeSVG shape={shape} />
                <span className="text-xs font-medium text-gray-700">{NOSE_SHAPE_LABELS[shape] ?? shape}</span>
              </button>
            ))}
          </div>
        </section>
        <section>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Chiều rộng mũi</h3>
          <div className="grid grid-cols-3 gap-2">
            {NOSE_WIDTHS.map((w) => (
              <button
                key={w}
                onClick={() => store.updateBiometrics({ nose_width: w })}
                className={cn(
                  'px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all',
                  store.biometrics.nose_width === w
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
                )}
              >
                {NOSE_WIDTH_LABELS[w] ?? w}
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* Lips */}
      <div className="grid grid-cols-2 gap-6">
        <section>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Hình dáng môi</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {LIP_SHAPES.map((shape) => (
              <button
                key={shape}
                onClick={() => store.updateBiometrics({ lip_shape: shape })}
                className={cn(
                  'flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all text-center',
                  store.biometrics.lip_shape === shape
                    ? 'border-primary-500 bg-primary-50 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                )}
              >
                <LipShapeSVG shape={shape} />
                <span className="text-xs font-medium text-gray-700">{LIP_SHAPE_LABELS[shape] ?? shape}</span>
              </button>
            ))}
          </div>
        </section>
        <section>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Độ đầy môi</h3>
          <div className="grid grid-cols-3 gap-2">
            {LIP_VOLUMES.map((v) => (
              <button
                key={v}
                onClick={() => store.updateBiometrics({ lip_volume: v })}
                className={cn(
                  'px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all',
                  store.biometrics.lip_volume === v
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
                )}
              >
                {LIP_VOLUME_LABELS[v] ?? v}
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* Hair */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <span className="w-5 h-5 rounded bg-orange-100 text-orange-600 flex items-center justify-center text-xs">5</span>
          Tóc
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 mb-2 block">Màu tóc</label>
            <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
              {HAIR_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => store.updateBiometrics({ hair_color: color })}
                  className={cn(
                    'flex flex-col items-center gap-1 p-1.5 rounded-xl border-2 transition-all text-center',
                    store.biometrics.hair_color === color
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  )}
                >
                  <div className={cn('w-6 h-6 rounded-full border border-black/10 shadow-inner', HAIR_COLOR_MAP[color] ?? 'bg-gray-400')} />
                  <span className="text-xs text-gray-500 capitalize leading-tight">{color.replace(/_/g, ' ')}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-2 block">Kiểu tóc</label>
              <div className="grid grid-cols-3 gap-1.5">
                {HAIR_STYLES.map((s) => (
                  <button
                    key={s}
                    onClick={() => store.updateBiometrics({ hair_style: s })}
                    className={cn(
                      'px-2 py-1.5 rounded-lg border-2 text-xs font-medium transition-all',
                      store.biometrics.hair_style === s
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
                    )}
                  >
                    {HAIR_STYLE_LABELS[s] ?? s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-2 block">Độ dài tóc</label>
              <div className="grid grid-cols-2 gap-1.5">
                {HAIR_LENGTHS.map((l) => (
                  <button
                    key={l}
                    onClick={() => store.updateBiometrics({ hair_length: l })}
                    className={cn(
                      'px-2 py-1.5 rounded-lg border-2 text-xs font-medium transition-all',
                      store.biometrics.hair_length === l
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
                    )}
                  >
                    {HAIR_LENGTH_LABELS[l] ?? l.replace(/-/g, ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-2 block">Rèm tóc (Bangs)</label>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-1.5">
              {BANGS_OPTIONS.map((b) => (
                <button
                  key={b}
                  onClick={() => store.updateBiometrics({ bangs: b })}
                  className={cn(
                    'px-2 py-1.5 rounded-lg border-2 text-xs font-medium transition-all',
                    store.biometrics.bangs === b
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
                  )}
                >
                  {BANGS_LABELS[b] ?? b}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Other features */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Các đặc điểm khác</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Eye Size */}
          <div className="p-3 border border-gray-200 rounded-xl bg-white">
            <label className="text-xs text-gray-500 mb-2 block">Kích thước mắt</label>
            <div className="flex gap-1.5">
              {EYE_SIZES.map((s) => (
                <button
                  key={s}
                  onClick={() => store.updateBiometrics({ eye_size: s })}
                  className={cn(
                    'flex-1 py-1.5 rounded-lg border-2 text-xs font-medium transition-all',
                    store.biometrics.eye_size === s
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-100 text-gray-500 hover:border-gray-200'
                  )}
                >
                  {EYE_SIZE_LABELS[s] ?? s}
                </button>
              ))}
            </div>
          </div>
          {/* Eyebrows */}
          <div className="p-3 border border-gray-200 rounded-xl bg-white">
            <label className="text-xs text-gray-500 mb-2 block">Lông mày</label>
            <div className="grid grid-cols-3 gap-1">
              {EYEBROW_SHAPES.slice(0, 3).map((b) => (
                <button
                  key={b}
                  onClick={() => store.updateBiometrics({ eyebrows: b })}
                  className={cn(
                    'py-1 rounded border-2 text-xs font-medium transition-all',
                    store.biometrics.eyebrows === b
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-100 text-gray-500 hover:border-gray-200'
                  )}
                >
                  {EYEBROW_SHAPE_LABELS[b] ?? b}
                </button>
              ))}
            </div>
          </div>
          {/* Expression */}
          <div className="p-3 border border-gray-200 rounded-xl bg-white">
            <label className="text-xs text-gray-500 mb-2 block">Biểu cảm</label>
            <div className="grid grid-cols-3 gap-1">
              {EXPRESSIONS.slice(0, 3).map((e) => (
                <button
                  key={e}
                  onClick={() => store.updateBiometrics({ expression: e })}
                  className={cn(
                    'py-1 rounded border-2 text-xs font-medium transition-all capitalize',
                    store.biometrics.expression === e
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-100 text-gray-500 hover:border-gray-200'
                  )}
                >
                  {e.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>
          {/* Freckles + Dimples */}
          <div className="p-3 border border-gray-200 rounded-xl bg-white">
            <label className="text-xs text-gray-500 mb-1.5 block">Tàn nhang / Gò má</label>
            <div className="grid grid-cols-2 gap-1">
              <button
                onClick={() => store.updateBiometrics({ freckles: store.biometrics.freckles === 'none' ? 'light' : 'none' })}
                className={cn(
                  'py-1 rounded border-2 text-xs font-medium transition-all',
                  store.biometrics.freckles !== 'none'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-100 text-gray-500 hover:border-gray-200'
                )}
              >
                {store.biometrics.freckles !== 'none' ? `Có (${store.biometrics.freckles})` : 'Tàn nhang'}
              </button>
              <button
                onClick={() => store.updateBiometrics({ dimples: store.biometrics.dimples === 'none' ? 'cheek' : 'none' })}
                className={cn(
                  'py-1 rounded border-2 text-xs font-medium transition-all',
                  store.biometrics.dimples !== 'none'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-100 text-gray-500 hover:border-gray-200'
                )}
              >
                {store.biometrics.dimples !== 'none' ? `Có (${store.biometrics.dimples})` : 'Gò má'}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ---- SVG Components ---- */
const EYE_COLOR_MAP: Record<string, string> = {
  black: 'bg-gray-900',
  brown: 'bg-amber-800',
  dark_brown: 'bg-amber-950',
  hazel: 'bg-amber-600',
  green: 'bg-green-600',
  blue: 'bg-blue-500',
  gray: 'bg-gray-400',
  amber: 'bg-amber-500',
  violet: 'bg-purple-400',
  deep_brown: 'bg-amber-900',
};

const SKIN_COLOR_MAP: Record<string, string> = {
  black: 'bg-gray-900',
  dark_brown: 'bg-amber-900',
  medium_brown: 'bg-amber-700',
  olive: 'bg-lime-800',
  white: 'bg-gray-100',
  fair: 'bg-amber-300',
  light: 'bg-amber-200',
  porcelain: 'bg-rose-200',
  pink: 'bg-pink-200',
  purple: 'bg-purple-300',
  red: 'bg-red-300',
  yellow: 'bg-yellow-200',
  gold: 'bg-yellow-500',
  bronze: 'bg-orange-700',
};

const HAIR_COLOR_MAP: Record<string, string> = {
  black: 'bg-gray-900',
  dark_brown: 'bg-amber-900',
  brown: 'bg-amber-700',
  auburn: 'bg-orange-700',
  chestnut: 'bg-amber-800',
  blonde: 'bg-yellow-300',
  platinum: 'bg-gray-100',
  ginger: 'bg-orange-500',
  gray: 'bg-gray-400',
  white: 'bg-gray-100',
};

/* ---- SVG Reference Illustration Components ---- */

// Face Shape SVG - realistic silhouettes
function FaceShapeSVG({ shape }: { shape: string }) {
  const baseSkin = '#F5D0B5';
  const hairColor = '#2D1810';
  const skinStroke = '#D4A882';
  const shapes: Record<string, JSX.Element> = {
    oval: (
      <svg viewBox="0 0 60 70" className="w-10 h-12">
        <ellipse cx="30" cy="36" rx="18" ry="26" fill={baseSkin} stroke={skinStroke} strokeWidth="1.5"/>
        <ellipse cx="30" cy="10" rx="16" ry="12" fill={hairColor}/>
        <circle cx="23" cy="32" r="2" fill="#8B5E3C"/>
        <circle cx="37" cy="32" r="2" fill="#8B5E3C"/>
        <ellipse cx="30" cy="40" rx="3" ry="1.5" fill="#D4956A"/>
        <path d="M27 47 Q30 49 33 47" fill="none" stroke="#C48B5C" strokeWidth="1" strokeLinecap="round"/>
      </svg>
    ),
    round: (
      <svg viewBox="0 0 60 70" className="w-10 h-12">
        <ellipse cx="30" cy="36" rx="24" ry="25" fill={baseSkin} stroke={skinStroke} strokeWidth="1.5"/>
        <ellipse cx="30" cy="12" rx="22" ry="14" fill={hairColor}/>
        <circle cx="22" cy="33" r="2.5" fill="#8B5E3C"/>
        <circle cx="38" cy="33" r="2.5" fill="#8B5E3C"/>
        <ellipse cx="30" cy="41" rx="3" ry="2" fill="#D4956A"/>
        <path d="M26 49 Q30 51 34 49" fill="none" stroke="#C48B5C" strokeWidth="1" strokeLinecap="round"/>
      </svg>
    ),
    square: (
      <svg viewBox="0 0 60 70" className="w-10 h-12">
        <rect x="7" y="10" width="46" height="52" rx="14" fill={baseSkin} stroke={skinStroke} strokeWidth="1.5"/>
        <rect x="9" y="5" width="42" height="18" rx="10" fill={hairColor}/>
        <circle cx="22" cy="32" r="2" fill="#8B5E3C"/>
        <circle cx="38" cy="32" r="2" fill="#8B5E3C"/>
        <ellipse cx="30" cy="40" rx="3" ry="1.5" fill="#D4956A"/>
        <path d="M26 48 Q30 50 34 48" fill="none" stroke="#C48B5C" strokeWidth="1" strokeLinecap="round"/>
      </svg>
    ),
    heart: (
      <svg viewBox="0 0 60 70" className="w-10 h-12">
        <path d="M30 62 C8 45 4 25 14 14 C20 8 30 14 30 14 C30 14 40 8 46 14 C56 25 52 45 30 62Z" fill={baseSkin} stroke={skinStroke} strokeWidth="1.5"/>
        <path d="M12 14 C18 4 30 8 30 8 C30 8 42 4 48 14 C42 6 30 10 30 10 C30 10 18 6 12 14Z" fill={hairColor}/>
        <circle cx="23" cy="32" r="2" fill="#8B5E3C"/>
        <circle cx="37" cy="32" r="2" fill="#8B5E3C"/>
        <ellipse cx="30" cy="40" rx="3" ry="1.5" fill="#D4956A"/>
        <path d="M27 48 Q30 50 33 48" fill="none" stroke="#C48B5C" strokeWidth="1" strokeLinecap="round"/>
      </svg>
    ),
    oblong: (
      <svg viewBox="0 0 60 70" className="w-10 h-12">
        <ellipse cx="30" cy="35" rx="16" ry="32" fill={baseSkin} stroke={skinStroke} strokeWidth="1.5"/>
        <ellipse cx="30" cy="6" rx="14" ry="10" fill={hairColor}/>
        <circle cx="23" cy="30" r="2" fill="#8B5E3C"/>
        <circle cx="37" cy="30" r="2" fill="#8B5E3C"/>
        <ellipse cx="30" cy="38" rx="3" ry="1.5" fill="#D4956A"/>
        <path d="M27 46 Q30 48 33 46" fill="none" stroke="#C48B5C" strokeWidth="1" strokeLinecap="round"/>
      </svg>
    ),
    diamond: (
      <svg viewBox="0 0 60 70" className="w-10 h-12">
        <path d="M30 4 L52 35 L30 66 L8 35Z" fill={baseSkin} stroke={skinStroke} strokeWidth="1.5"/>
        <path d="M14 30 C18 12 30 8 30 8 C30 8 42 12 46 30 C40 16 30 12 30 12 C30 12 20 16 14 30Z" fill={hairColor}/>
        <circle cx="22" cy="32" r="2" fill="#8B5E3C"/>
        <circle cx="38" cy="32" r="2" fill="#8B5E3C"/>
        <ellipse cx="30" cy="42" rx="3" ry="1.5" fill="#D4956A"/>
        <path d="M27 50 Q30 52 33 50" fill="none" stroke="#C48B5C" strokeWidth="1" strokeLinecap="round"/>
      </svg>
    ),
  };
  return shapes[shape] ?? shapes.oval;
}

// Eye Shape SVG - detailed eye illustrations
function EyeShapeSVG({ shape }: { shape: string }) {
  const eyeWhite = '#FAFAFA';
  const iris = '#6B4E31';
  const pupil = '#1A1A1A';
  const skin = '#F5D0B5';
  const svgProps = { className: 'w-10 h-6', viewBox: '0 0 48 24' };
  const shapes: Record<string, JSX.Element> = {
    large: (
      <svg {...svgProps}>
        <path d="M2 12 C10 1 38 1 46 12 C38 23 10 23 2 12Z" fill={skin} stroke="#D4A882" strokeWidth="1"/>
        <path d="M4 12 C12 4 36 4 44 12 C36 20 12 20 4 12Z" fill={eyeWhite} stroke="#CCC" strokeWidth="0.5"/>
        <circle cx="24" cy="12" r="7" fill={iris}/>
        <circle cx="24" cy="12" r="4" fill={pupil}/>
        <circle cx="26" cy="10" r="2" fill="white" opacity="0.8"/>
        <path d="M2 12 C8 5 40 5 46 12" fill="none" stroke="#8B6B4A" strokeWidth="1.2"/>
      </svg>
    ),
    almond: (
      <svg {...svgProps}>
        <path d="M2 12 C8 4 40 4 46 12 C40 20 8 20 2 12Z" fill={skin} stroke="#D4A882" strokeWidth="1"/>
        <path d="M5 12 C11 6 37 6 43 12 C37 18 11 18 5 12Z" fill={eyeWhite} stroke="#CCC" strokeWidth="0.5"/>
        <circle cx="24" cy="12" r="5.5" fill={iris}/>
        <circle cx="24" cy="12" r="3" fill={pupil}/>
        <circle cx="25.5" cy="10.5" r="1.5" fill="white" opacity="0.8"/>
        <path d="M2 12 C8 5 40 5 46 12" fill="none" stroke="#8B6B4A" strokeWidth="1.2"/>
      </svg>
    ),
    hooded: (
      <svg {...svgProps}>
        <path d="M2 12 C8 4 40 4 46 12 C40 20 8 20 2 12Z" fill={skin} stroke="#D4A882" strokeWidth="1"/>
        <path d="M5 13 C11 8 37 8 43 13 C37 18 11 18 5 13Z" fill={eyeWhite} stroke="#CCC" strokeWidth="0.5"/>
        <circle cx="24" cy="13" r="5" fill={iris}/>
        <circle cx="24" cy="13" r="2.8" fill={pupil}/>
        <circle cx="25.5" cy="11.5" r="1.3" fill="white" opacity="0.8"/>
        <path d="M2 12 C8 5 40 5 46 12" fill="none" stroke="#8B6B4A" strokeWidth="1.5"/>
        <path d="M6 6 Q24 10 42 6" fill={skin} stroke="#C4A882" strokeWidth="0.8"/>
      </svg>
    ),
    narrow: (
      <svg {...svgProps}>
        <path d="M2 12 C10 7 38 7 46 12 C38 17 10 17 2 12Z" fill={skin} stroke="#D4A882" strokeWidth="1"/>
        <path d="M5 12 C12 8 36 8 43 12 C36 16 12 16 5 12Z" fill={eyeWhite} stroke="#CCC" strokeWidth="0.5"/>
        <circle cx="24" cy="12" r="4" fill={iris}/>
        <circle cx="24" cy="12" r="2.2" fill={pupil}/>
        <circle cx="25" cy="11" r="1" fill="white" opacity="0.8"/>
        <path d="M2 12 C10 6 38 6 46 12" fill="none" stroke="#8B6B4A" strokeWidth="1.2"/>
      </svg>
    ),
    round: (
      <svg {...svgProps}>
        <circle cx="24" cy="12" r="11" fill={skin} stroke="#D4A882" strokeWidth="1"/>
        <circle cx="24" cy="12" r="8" fill={eyeWhite} stroke="#CCC" strokeWidth="0.5"/>
        <circle cx="24" cy="12" r="6" fill={iris}/>
        <circle cx="24" cy="12" r="3.5" fill={pupil}/>
        <circle cx="26" cy="10" r="2" fill="white" opacity="0.8"/>
        <path d="M14 6 Q24 3 34 6" fill="none" stroke="#8B6B4A" strokeWidth="1.5"/>
      </svg>
    ),
    upturned: (
      <svg {...svgProps}>
        <path d="M2 14 C8 4 40 4 46 14 C40 22 8 22 2 14Z" fill={skin} stroke="#D4A882" strokeWidth="1"/>
        <path d="M5 14 C11 7 37 7 43 14 C37 20 11 20 5 14Z" fill={eyeWhite} stroke="#CCC" strokeWidth="0.5"/>
        <circle cx="24" cy="14" r="5" fill={iris}/>
        <circle cx="24" cy="14" r="2.8" fill={pupil}/>
        <circle cx="25.5" cy="12.5" r="1.3" fill="white" opacity="0.8"/>
        <path d="M2 14 C10 5 38 5 46 14" fill="none" stroke="#8B6B4A" strokeWidth="1.2"/>
        <path d="M8 10 Q24 6 40 10" fill="none" stroke="#8B6B4A" strokeWidth="1" strokeDasharray="2,1"/>
      </svg>
    ),
    downturned: (
      <svg {...svgProps}>
        <path d="M2 10 C8 20 40 20 46 10 C40 2 8 2 2 10Z" fill={skin} stroke="#D4A882" strokeWidth="1"/>
        <path d="M5 10 C11 17 37 17 43 10 C37 4 11 4 5 10Z" fill={eyeWhite} stroke="#CCC" strokeWidth="0.5"/>
        <circle cx="24" cy="10" r="5" fill={iris}/>
        <circle cx="24" cy="10" r="2.8" fill={pupil}/>
        <circle cx="25.5" cy="8.5" r="1.3" fill="white" opacity="0.8"/>
        <path d="M2 10 C10 21 38 21 46 10" fill="none" stroke="#8B6B4A" strokeWidth="1.2"/>
        <path d="M8 14 Q24 18 40 14" fill="none" stroke="#8B6B4A" strokeWidth="1" strokeDasharray="2,1"/>
      </svg>
    ),
  };
  return shapes[shape] ?? shapes.almond;
}

// Nose Shape SVG - profile view silhouettes
function NoseShapeSVG({ shape }: { shape: string }) {
  const skin = '#F5D0B5';
  const skinStroke = '#D4A882';
  const svgProps = { className: 'w-10 h-10', viewBox: '0 0 36 36' };
  const shapes: Record<string, JSX.Element> = {
    small: (
      <svg {...svgProps}>
        <path d="M18 4 L14 22 Q18 28 22 22 L18 4Z" fill={skin} stroke={skinStroke} strokeWidth="1.5"/>
        <ellipse cx="18" cy="26" rx="4" ry="3" fill={skin} stroke={skinStroke} strokeWidth="1"/>
        <circle cx="15" cy="26" r="1.5" fill="#C48B5C"/>
        <circle cx="21" cy="26" r="1.5" fill="#C48B5C"/>
      </svg>
    ),
    sharp: (
      <svg {...svgProps}>
        <path d="M18 4 L12 22 Q18 30 24 22 L18 4Z" fill={skin} stroke={skinStroke} strokeWidth="1.5"/>
        <path d="M12 24 Q18 30 24 24" fill="none" stroke={skinStroke} strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M14 26 L14 28 M22 26 L22 28" stroke="#C48B5C" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    round: (
      <svg {...svgProps}>
        <path d="M18 4 L11 24 Q18 32 25 24 L18 4Z" fill={skin} stroke={skinStroke} strokeWidth="1.5"/>
        <ellipse cx="18" cy="27" rx="7" ry="5" fill={skin} stroke={skinStroke} strokeWidth="1.2"/>
        <circle cx="13" cy="27" r="2" fill="#C48B5C"/>
        <circle cx="23" cy="27" r="2" fill="#C48B5C"/>
      </svg>
    ),
    broad: (
      <svg {...svgProps}>
        <path d="M18 4 L8 24 Q18 32 28 24 L18 4Z" fill={skin} stroke={skinStroke} strokeWidth="1.5"/>
        <ellipse cx="18" cy="27" rx="10" ry="6" fill={skin} stroke={skinStroke} strokeWidth="1.2"/>
        <circle cx="10" cy="27" r="2.5" fill="#C48B5C"/>
        <circle cx="26" cy="27" r="2.5" fill="#C48B5C"/>
      </svg>
    ),
    straight: (
      <svg {...svgProps}>
        <path d="M18 4 L16 22 L18 28 L20 22 L18 4Z" fill={skin} stroke={skinStroke} strokeWidth="1.5"/>
        <path d="M14 26 Q18 30 22 26" fill="none" stroke={skinStroke} strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="15" cy="26" r="1.5" fill="#C48B5C"/>
        <circle cx="21" cy="26" r="1.5" fill="#C48B5C"/>
      </svg>
    ),
    aquiline: (
      <svg {...svgProps}>
        <path d="M18 4 Q12 18 16 24 Q20 18 18 4Z" fill={skin} stroke={skinStroke} strokeWidth="1.5"/>
        <path d="M12 26 Q18 32 24 26" fill="none" stroke={skinStroke} strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="14" cy="26" r="1.5" fill="#C48B5C"/>
        <circle cx="22" cy="26" r="1.5" fill="#C48B5C"/>
      </svg>
    ),
    button: (
      <svg {...svgProps}>
        <path d="M18 4 L16 20 L18 22 L20 20 L18 4Z" fill={skin} stroke={skinStroke} strokeWidth="1.5"/>
        <ellipse cx="18" cy="24" rx="6" ry="6" fill={skin} stroke={skinStroke} strokeWidth="1.2"/>
        <circle cx="14" cy="24" r="1.5" fill="#C48B5C"/>
        <circle cx="22" cy="24" r="1.5" fill="#C48B5C"/>
      </svg>
    ),
    flared: (
      <svg {...svgProps}>
        <path d="M18 4 L9 24 Q18 32 27 24 L18 4Z" fill={skin} stroke={skinStroke} strokeWidth="1.5"/>
        <ellipse cx="18" cy="26" rx="9" ry="6" fill={skin} stroke={skinStroke} strokeWidth="1.2"/>
        <path d="M9 24 Q5 26 7 29 Q10 28 12 26" fill="none" stroke={skinStroke} strokeWidth="1.2"/>
        <path d="M27 24 Q31 26 29 29 Q26 28 24 26" fill="none" stroke={skinStroke} strokeWidth="1.2"/>
        <circle cx="11" cy="26" r="2" fill="#C48B5C"/>
        <circle cx="25" cy="26" r="2" fill="#C48B5C"/>
      </svg>
    ),
  };
  return shapes[shape] ?? shapes.small;
}

// Lip Shape SVG - detailed lip illustrations
function LipShapeSVG({ shape }: { shape: string }) {
  const lipBase = '#E88B9E';
  const lipDark = '#C4657A';
  const lipLight = '#F5A0B4';
  const skin = '#F5D0B5';
  const svgProps = { className: 'w-12 h-7', viewBox: '0 0 48 22' };
  const shapes: Record<string, JSX.Element> = {
    full: (
      <svg {...svgProps}>
        <path d="M4 10 Q12 2 24 6 Q36 2 44 10 Q36 18 24 14 Q12 18 4 10Z" fill={lipBase} stroke={lipDark} strokeWidth="1.5"/>
        <path d="M4 10 Q24 4 44 10 Q24 8 4 10Z" fill={lipLight} stroke="none"/>
        <path d="M4 10 Q12 2 24 6 Q36 2 44 10" fill="none" stroke={lipDark} strokeWidth="1.5"/>
        <path d="M24 6 Q24 10 24 14" fill="none" stroke={lipDark} strokeWidth="0.8"/>
      </svg>
    ),
    thin: (
      <svg {...svgProps}>
        <path d="M4 11 Q12 7 24 9 Q36 7 44 11 Q36 15 24 13 Q12 15 4 11Z" fill={lipBase} stroke={lipDark} strokeWidth="1.5"/>
        <path d="M4 11 Q24 8 44 11 Q24 10 4 11Z" fill={lipLight} stroke="none"/>
        <path d="M4 11 Q12 7 24 9 Q36 7 44 11" fill="none" stroke={lipDark} strokeWidth="1.2"/>
        <path d="M24 9 Q24 11 24 13" fill="none" stroke={lipDark} strokeWidth="0.8"/>
      </svg>
    ),
    medium: (
      <svg {...svgProps}>
        <path d="M4 11 Q12 3 24 7 Q36 3 44 11 Q36 17 24 14 Q12 17 4 11Z" fill={lipBase} stroke={lipDark} strokeWidth="1.5"/>
        <path d="M4 11 Q24 6 44 11 Q24 9 4 11Z" fill={lipLight} stroke="none"/>
        <path d="M4 11 Q12 3 24 7 Q36 3 44 11" fill="none" stroke={lipDark} strokeWidth="1.3"/>
        <path d="M24 7 Q24 11 24 14" fill="none" stroke={lipDark} strokeWidth="0.8"/>
      </svg>
    ),
    'heart-shaped': (
      <svg {...svgProps}>
        <path d="M24 4 C14 7 4 11 2 15 C8 17 14 13 24 10 C34 13 40 17 46 15 C44 11 34 7 24 4Z" fill={lipBase} stroke={lipDark} strokeWidth="1.5"/>
        <path d="M24 4 C16 7 6 10 4 13 C10 14 15 11 24 8 C33 11 38 14 44 13 C42 10 32 7 24 4Z" fill={lipLight} stroke="none"/>
        <path d="M24 4 C14 7 4 11 2 15" fill="none" stroke={lipDark} strokeWidth="1.2"/>
        <path d="M24 4 C34 7 44 11 46 15" fill="none" stroke={lipDark} strokeWidth="1.2"/>
        <path d="M24 4 Q24 7 24 10" fill="none" stroke={lipDark} strokeWidth="0.8"/>
      </svg>
    ),
  };
  return shapes[shape] ?? shapes.medium;
}


function StepBody({ store }: { store: typeof useAvatarStore.prototype }) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-1">Thân thể & Trang phục</h2>
      <p className="text-gray-500 mb-6">Mô tả thân thể và nhập trang phục cho nhân vật ảo</p>

      {/* Body Type */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-2">Thể trạng</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {BODY_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => store.updateBiometrics({ body_type: type })}
              className={cn(
                'py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all',
                store.biometrics.body_type === type
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              )}
            >
              {BODY_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      {/* Height */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-2">Chiều cao</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {HEIGHTS.map((h) => (
            <button
              key={h}
              onClick={() => store.updateBiometrics({ height: h })}
              className={cn(
                'py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all',
                store.biometrics.height === h
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              )}
            >
              {HEIGHT_LABELS[h]}
            </button>
          ))}
        </div>
      </div>

      {/* Body Measurements - Vòng 1, 2, 3 */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-2">Số đo cơ thể (cm)</label>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Vòng 1 (Ngực)</label>
            <input
              type="number"
              placeholder="VD: 85"
              value={store.biometrics.bust_cm || ''}
              onChange={(e) => store.updateBiometrics({ bust_cm: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Vòng 2 (Eo)</label>
            <input
              type="number"
              placeholder="VD: 65"
              value={store.biometrics.waist_cm || ''}
              onChange={(e) => store.updateBiometrics({ waist_cm: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Vòng 3 (Mông)</label>
            <input
              type="number"
              placeholder="VD: 90"
              value={store.biometrics.hips_cm || ''}
              onChange={(e) => store.updateBiometrics({ hips_cm: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Outfit - Text inputs */}
      <div className="space-y-4 mb-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Áo / Trang phục trên</label>
          <input
            type="text"
            placeholder="VD: White silk blouse, fitted black turtleneck, floral print dress"
            value={store.biometrics.outfit_top || ''}
            onChange={(e) => store.updateBiometrics({ outfit_top: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quần / Trang phục dưới</label>
          <input
            type="text"
            placeholder="VD: High-waisted navy wide-leg trousers, denim skirt, athletic shorts"
            value={store.biometrics.outfit_bottom || ''}
            onChange={(e) => store.updateBiometrics({ outfit_bottom: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phụ kiện & Mô tả thêm</label>
          <textarea
            value={store.biometrics.outfit_description || ''}
            onChange={(e) => store.updateBiometrics({ outfit_description: e.target.value })}
            rows={2}
            placeholder="VD: Gold stud earrings, minimalist watch, subtle makeup look"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Shoes */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-2">Giày</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {SHOES_OPTIONS.map((shoe) => (
            <button
              key={shoe}
              onClick={() => store.updateBiometrics({ shoes: shoe })}
              className={cn(
                'py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all',
                store.biometrics.shoes === shoe
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              )}
            >
              {SHOES_LABELS[shoe]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepGenerate({ store, synthesizedPrompt, onSynthesize, synthesizeLoading, createdAvatar, generatedImages, variationImages, onCreateAvatar, onGenerateImages, onGenerateVariations, imageCount, setImageCount, createLoading, generateLoading }: {
  store: typeof useAvatarStore.prototype;
  synthesizedPrompt: string;
  onSynthesize: () => void;
  synthesizeLoading: boolean;
  createdAvatar: { id: string } | null;
  generatedImages: string[];
  variationImages: string[];
  onCreateAvatar: () => void;
  onGenerateImages: () => void;
  onGenerateVariations: () => void;
  imageCount: number;
  setImageCount: (n: number) => void;
  createLoading: boolean;
  generateLoading: boolean;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-1">Tạo Ảnh Reference</h2>
      <p className="text-gray-500 mb-6">Xem prompt tổng hợp từ các thông tin đã nhập và tạo ảnh reference</p>

      {!synthesizedPrompt ? (
        <div className="text-center py-8">
          <button
            onClick={onSynthesize}
            disabled={synthesizeLoading || !store.name}
            className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50"
          >
            {synthesizeLoading ? <Loader className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Tạo Prompt từ thông tin
          </button>
          {!store.name && <p className="text-xs text-gray-400 mt-2">Vui lòng nhập tên ở bước 1</p>}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">Prompt tổng hợp</h3>
              <button
                onClick={() => navigator.clipboard.writeText(synthesizedPrompt)}
                className="text-xs text-primary-600 hover:underline bg-transparent border-none"
              >
                Sao chép
              </button>
            </div>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{synthesizedPrompt}</p>
          </div>

          {/* Bước 1: Tạo Avatar Profile */}
          {!createdAvatar && (
            <div className="text-center py-4">
              <button
                onClick={onCreateAvatar}
                disabled={createLoading}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {createLoading ? <Loader className="w-4 h-4 animate-spin" /> : <User className="w-4 h-4" />}
                Tạo Avatar Profile
              </button>
              <p className="text-xs text-gray-400 mt-2">Bước 1: Lưu thông tin avatar vào hệ thống</p>
            </div>
          )}

          {/* Bước 2: Generate Reference Images */}
          {createdAvatar && generatedImages.length === 0 && (
            <div className="border border-purple-200 rounded-lg p-4 bg-purple-50/50">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Bước 2: Tạo Ảnh Reference</h3>
              
              {/* Aspect Ratio Selector */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Tỷ lệ ảnh</label>
                <div className="flex items-center gap-3">
                  {ASPECT_RATIOS_IMAGE.map((ratio) => (
                    <button
                      key={ratio.value}
                      onClick={() => store.setAspectRatio(ratio.value)}
                      className={cn(
                        'px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all',
                        store.aspectRatio === ratio.value
                          ? 'border-purple-500 bg-purple-500 text-white'
                          : 'border-gray-200 text-gray-600 hover:border-purple-300'
                      )}
                    >
                      {ratio.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Số lượng ảnh cần tạo</label>
                <div className="flex items-center gap-3">
                  {[1, 2, 4, 6, 8].map((n) => (
                    <button
                      key={n}
                      onClick={() => setImageCount(n)}
                      className={cn(
                        'w-10 h-10 rounded-lg border-2 text-sm font-medium transition-all',
                        imageCount === n
                          ? 'border-purple-500 bg-purple-500 text-white'
                          : 'border-gray-200 text-gray-600 hover:border-purple-300'
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">Chọn số ảnh reference muốn tạo (1-8)</p>
              </div>
              <button
                onClick={onGenerateImages}
                disabled={generateLoading}
                className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50"
              >
                {generateLoading ? <Loader className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Tạo {imageCount} Ảnh Reference ({store.aspectRatio})
              </button>
            </div>
          )}

          {/* Hiển thị ảnh đã tạo */}
          {generatedImages.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Ảnh Reference đã tạo ({generatedImages.length} ảnh)</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {generatedImages.map((img, i) => (
                  <img key={i} src={img} alt={`Avatar ${i + 1}`} className="w-full object-cover rounded-lg border border-gray-200" style={{ aspectRatio: store.aspectRatio.replace(':', '/') }} />
                ))}
              </div>
              
              {/* Tạo Biến thể */}
              <div className="mt-6 border-t pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Tạo Biến thể (Giữ nguyên người)</h4>
                <p className="text-xs text-gray-500 mb-3">Tạo các biến thể khác nhau nhưng vẫn là cùng một người</p>
                <button
                  onClick={onGenerateVariations}
                  disabled={generateLoading}
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {generateLoading ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  Tạo {imageCount} Biến thể
                </button>
              </div>

              {/* Hiển thị biến thể */}
              {variationImages.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Biến thể đã tạo ({variationImages.length} ảnh)</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {variationImages.map((img, i) => (
                      <img key={i} src={img} alt={`Variation ${i + 1}`} className="w-full object-cover rounded-lg border border-gray-200" style={{ aspectRatio: store.aspectRatio.replace(':', '/') }} />
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 flex gap-3 justify-center">
                <button
                  onClick={onGenerateImages}
                  disabled={generateLoading}
                  className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                >
                  {generateLoading ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  Tạo thêm Reference
                </button>
                <button
                  onClick={() => { setGeneratedImages([]); setVariationImages([]); }}
                  className="inline-flex items-center gap-2 border border-purple-300 text-purple-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-50"
                >
                  Tạo lại từ đầu
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StepAssets({ createdAvatar, selectedAngles, selectedOutfits, setSelectedAngles, setSelectedOutfits, generateAngles, generateOutfits }: {
  createdAvatar: { id: string } | null;
  selectedAngles: string[];
  selectedOutfits: string[];
  setSelectedAngles: (a: string[]) => void;
  setSelectedOutfits: (o: string[]) => void;
  generateAngles: ReturnType<typeof useMutation>;
  generateOutfits: ReturnType<typeof useMutation>;
}) {
  if (!createdAvatar) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p>Vui lòng tạo avatar reference trước (bước 6)</p>
      </div>
    );
  }

  const toggleAngle = (v: string) => {
    setSelectedAngles(selectedAngles.includes(v) ? selectedAngles.filter(a => a !== v) : [...selectedAngles, v]);
  };
  const toggleOutfit = (v: string) => {
    setSelectedOutfits(selectedOutfits.includes(v) ? selectedOutfits.filter(o => o !== v) : [...selectedOutfits, v]);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-1">Tạo Assets bổ sung</h2>
      <p className="text-gray-500 mb-6">Tạo ảnh nhiều góc mặt và nhiều trang phục khác nhau</p>

      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Góc mặt (Multi-Angle)</h3>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
          {MULTI_ANGLE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => toggleAngle(opt.value)}
              className={cn(
                'px-3 py-2 rounded-lg border text-sm font-medium transition-colors',
                selectedAngles.includes(opt.value)
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => generateAngles.mutate({ avatarId: createdAvatar.id, angles: selectedAngles })}
          disabled={generateAngles.isPending || selectedAngles.length === 0}
          className="mt-3 inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
        >
          {generateAngles.isPending ? <Loader className="w-3.5 h-3.5 animate-spin" /> : null}
          Tạo ảnh góc mặt
        </button>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Trang phục (Multi-Outfit)</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {MULTI_OUTFIT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => toggleOutfit(opt.value)}
              className={cn(
                'px-3 py-2 rounded-lg border text-sm font-medium transition-colors',
                selectedOutfits.includes(opt.value)
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => generateOutfits.mutate({ avatarId: createdAvatar.id, outfits: selectedOutfits })}
          disabled={generateOutfits.isPending || selectedOutfits.length === 0}
          className="mt-3 inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
        >
          {generateOutfits.isPending ? <Loader className="w-3.5 h-3.5 animate-spin" /> : null}
          Tạo ảnh trang phục
        </button>
      </div>
    </div>
  );
}

function StepSave({ store, createdAvatar, onSave }: { store: typeof useAvatarStore.prototype; createdAvatar: { id: string } | null; onSave: () => void }) {
  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle className="w-8 h-8 text-green-600" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Avatar đã sẵn sàng!</h2>
      <p className="text-gray-500 mb-6">
        {store.name} đã được tạo thành công.
        {createdAvatar ? ' Ảnh reference và assets đã được sinh.' : ' Bạn có thể regenerate assets sau.'}
      </p>
      <button
        onClick={onSave}
        className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700"
      >
        <Save className="w-4 h-4" />
        Xem trong Avatar Library
      </button>
    </div>
  );
}

// Step Influencer - Style cho influencer
function StepInfluencer({ store }: { store: typeof useAvatarStore.prototype }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Phong cách Influencer</h2>
        <p className="text-gray-500 text-sm">Cài đặt phong cách chụp ảnh và môi trường cho influencer</p>
      </div>

      {/* Shooting Style */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Phong cách chụp</label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {SHOOTING_STYLES.map((style) => (
            <button
              key={style.value}
              onClick={() => store.updateBiometrics({ shooting_style: style.value as typeof store.biometrics.shooting_style })}
              className={cn(
                'p-3 rounded-lg border-2 text-center transition-all',
                store.biometrics.shooting_style === style.value
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <div className="text-sm font-medium text-gray-700">{style.label}</div>
              <div className="text-xs text-gray-500 mt-1">{style.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Camera Angle */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Góc máy</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {CAMERA_ANGLES.map((angle) => (
            <button
              key={angle.value}
              onClick={() => store.updateBiometrics({ camera_angle: angle.value as typeof store.biometrics.camera_angle })}
              className={cn(
                'p-3 rounded-lg border-2 text-center transition-all',
                store.biometrics.camera_angle === angle.value
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <div className="text-sm font-medium text-gray-700">{angle.label}</div>
              <div className="text-xs text-gray-500 mt-1">{angle.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Environment */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Môi trường / Background</label>
        <textarea
          value={store.biometrics.environment || ''}
          onChange={(e) => store.updateBiometrics({ environment: e.target.value })}
          rows={3}
          placeholder="VD: Modern urban cafe with natural lighting, outdoor terrace, rooftop garden, beach sunset, city street..."
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <p className="text-xs text-gray-400 mt-1">Mô tả môi trường xung quanh influencer</p>
      </div>

      {/* Pose Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả Pose</label>
        <input
          type="text"
          value={store.biometrics.pose_description || ''}
          onChange={(e) => store.updateBiometrics({ pose_description: e.target.value })}
          placeholder="VD: standing confidently, natural pose, sitting casually, leaning against wall..."
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Additional Details */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Chi tiết bổ sung</label>
        <textarea
          value={store.biometrics.additional_details || ''}
          onChange={(e) => store.updateBiometrics({ additional_details: e.target.value })}
          rows={2}
          placeholder="VD: warm golden hour lighting, shallow depth of field, bokeh background, natural sunlight..."
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <p className="text-xs text-gray-400 mt-1">Ánh sáng, hiệu ứng, chất lượng ảnh</p>
      </div>

      {/* Quick Environment Presets */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Môi trường nhanh</label>
        <div className="flex flex-wrap gap-2">
          {[
            'modern urban cafe with natural lighting',
            'rooftop garden with city view',
            'beach at golden hour',
            'cozy home interior',
            'city street with neon lights',
            'outdoor terrace garden',
            'modern minimalist studio',
            'forest with natural light',
          ].map((preset) => (
            <button
              key={preset}
              onClick={() => store.updateBiometrics({ environment: preset })}
              className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 transition-colors"
            >
              {preset.split(' ').slice(0, 3).join(' ')}...
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
