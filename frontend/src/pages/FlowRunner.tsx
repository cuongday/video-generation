import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useCallback, Suspense, lazy, useRef } from 'react';
import { useFlowStore } from '../stores/useFlowStore';
import { getTemplate, getProject, updateProject, createProject } from '../lib/api';
import { cn } from '../lib/utils';
import { ChevronLeft, ChevronRight, CheckCircle, Loader } from 'lucide-react';
import type { TemplateConfig, TemplateStep } from '../types';

const StepAvatarSelector = lazy(() => import('../components/flow-steps/StepAvatarSelector'));
const StepProductForm = lazy(() => import('../components/flow-steps/StepProductForm'));
const StepSpaceSelector = lazy(() => import('../components/flow-steps/StepSpaceSelector'));
const StepShotSelector = lazy(() => import('../components/flow-steps/StepShotSelector'));
const StepScriptEditor = lazy(() => import('../components/flow-steps/StepScriptEditor'));
const StepGeneration = lazy(() => import('../components/flow-steps/StepGeneration'));
const StepPromptInput = lazy(() => import('../components/flow-steps/StepPromptInput'));
const StepStyleSelector = lazy(() => import('../components/flow-steps/StepStyleSelector'));
const StepSceneEditor = lazy(() => import('../components/flow-steps/StepSceneEditor'));

const COMPONENT_MAP: Record<string, React.LazyExoticComponent<React.ComponentType<any>>> = {
  AvatarSelector: StepAvatarSelector,
  ProductForm: StepProductForm,
  SpaceSelector: StepSpaceSelector,
  ShotSelector: StepShotSelector,
  ScriptEditor: StepScriptEditor,
  GenerationConfig: StepGeneration,
  PromptInput: StepPromptInput,
  StyleSelector: StepStyleSelector,
  MoodSelector: StepStyleSelector,
};

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader className="w-6 h-6 text-primary-600 animate-spin" />
    </div>
  );
}

function UnknownComponent({ name }: { name: string }) {
  return (
    <div className="text-center py-12 text-gray-400">
      <p className="font-medium text-gray-500">Component chưa được hỗ trợ: {name}</p>
      <p className="text-sm mt-1 text-gray-400">Vui lòng chọn template khác hoặc báo cáo lỗi này.</p>
    </div>
  );
}

export default function FlowRunner() {
  const { templateId, projectId } = useParams<{ templateId?: string; projectId?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasInitializedRef = useRef(false);

  const {
    currentStep, completedSteps, goToStep, nextStep, prevStep,
    init, canAdvance, data, updateStep, setProjectId, reset
  } = useFlowStore();

  const { data: template, isLoading: templateLoading } = useQuery({
    queryKey: ['template', templateId],
    queryFn: () => getTemplate(templateId!),
    enabled: Boolean(templateId),
  });

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProject(projectId!),
    enabled: Boolean(projectId),
  });

  const createProjectMutation = useMutation({
    mutationFn: (d: object) => createProject(d),
    onSuccess: (proj: { id: string }) => {
      setProjectId(proj.id);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      navigate(`/project/${proj.id}`, { replace: true });
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: ({ id, d }: { id: string; d: object }) => updateProject(id, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const effectiveTemplate = template || project?.template_config || undefined;
  const steps: TemplateStep[] = effectiveTemplate?.flow?.steps || [];
  const currentStepData = steps[currentStep];
  const currentStepId = currentStepData?.id || `step_${currentStep}`;

  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    if (project?.flow_data && Object.keys(project.flow_data).length > 0) {
      const savedStepId = project.flow_data._currentStep;
      init(project.template_id || templateId || '', project.id);
      if (savedStepId !== undefined) {
        const stepIndex = steps.findIndex(s => s.id === savedStepId);
        if (stepIndex >= 0) {
          useFlowStore.getState().goToStep(stepIndex);
        }
      }
      Object.entries(project.flow_data).forEach(([key, value]) => {
        if (key !== '_currentStep') {
          updateStep(key, value);
        }
      });
    } else if (templateId) {
      init(templateId, projectId);
      if (projectId) {
        setProjectId(projectId);
      }
    }

    return () => { hasInitializedRef.current = false; };
  }, [template, project]);

  useEffect(() => {
    if (effectiveTemplate && !projectId && currentStep === 0 && !createProjectMutation.isPending) {
      createProjectMutation.mutate({
        name: `${effectiveTemplate.name} - ${new Date().toLocaleDateString('vi-VN')}`,
        template_id: effectiveTemplate.id,
        flow_type: effectiveTemplate.category,
        flow_data: { _currentStep: steps[0]?.id },
        aspect_ratio: effectiveTemplate.defaults?.aspect_ratio || '16:9',
        status: 'draft',
      });
    }
  }, [effectiveTemplate, currentStep]);

  const saveToBackend = useCallback((flowData: Record<string, unknown>, stepId: string) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    const projId = useFlowStore.getState().projectId;
    if (!projId) return;

    saveTimerRef.current = setTimeout(() => {
      updateProjectMutation.mutate({
        id: projId,
        d: {
          flow_data: { ...flowData, _currentStep: stepId },
          status: 'draft',
        },
      });
    }, 1000);
  }, []);

  const handleDataChange = useCallback((value: unknown) => {
    updateStep(currentStepId, value);
    saveToBackend({ ...useFlowStore.getState().data, [currentStepId]: value }, currentStepId);
  }, [currentStepId, updateStep, saveToBackend]);

  const handleNextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      nextStep();
    } else {
      navigate('/projects');
    }
  }, [currentStep, steps.length, nextStep, navigate]);

  const canGoNext = canAdvance(effectiveTemplate, currentStep, data);

  if (templateLoading || projectLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (!effectiveTemplate) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-400">
        Template không tìm thấy
      </div>
    );
  }

  const stepValue = data[currentStepId];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar */}
      <div className="w-72 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-gray-100">
          <button
            onClick={() => navigate('/templates')}
            className="text-xs text-gray-400 hover:text-gray-600 mb-2 flex items-center gap-1"
          >
            <ChevronLeft className="w-3 h-3" />
            Quay về templates
          </button>
          <h2 className="font-semibold text-gray-900">{effectiveTemplate.name}</h2>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{effectiveTemplate.description}</p>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {steps.map((step, i) => {
            const stepId = step.id || `step_${i}`;
            const hasData = data[stepId] !== undefined && data[stepId] !== null;
            return (
              <button
                key={step.id || i}
                onClick={() => goToStep(i)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left',
                  i === currentStep
                    ? 'bg-primary-50 text-primary-700'
                    : completedSteps.includes(i)
                    ? 'text-green-700 bg-green-50'
                    : hasData
                    ? 'text-blue-700 bg-blue-50'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <div className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0',
                  i === currentStep ? 'bg-primary-600 text-white' :
                  completedSteps.includes(i) ? 'bg-green-500 text-white' :
                  hasData ? 'bg-blue-500 text-white' :
                  'bg-gray-200 text-gray-500'
                )}>
                  {completedSteps.includes(i) ? <CheckCircle className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <span className="truncate">{step.title}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-400">
            Bước {currentStep + 1} / {steps.length}
          </p>
          <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 transition-all"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Right Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="bg-white border-b border-gray-200 px-8 py-6 flex-shrink-0">
          <p className="text-xs text-primary-600 font-medium uppercase tracking-wider">
            Bước {currentStep + 1}
          </p>
          <h1 className="text-xl font-semibold text-gray-900 mt-1">{currentStepData?.title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{currentStepData?.description}</p>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 min-h-64">
            <Suspense fallback={<LoadingSpinner />}>
              {currentStepData?.components?.map((componentName) => {
                const Component = COMPONENT_MAP[componentName];
                if (!Component) {
                  return <UnknownComponent key={componentName} name={componentName} />;
                }
                return (
                  <div key={componentName}>
                    <Component
                      value={stepValue}
                      onChange={handleDataChange}
                      template={effectiveTemplate as TemplateConfig}
                      selectedShots={(data['selectedShots'] as string[]) || (effectiveTemplate as TemplateConfig)?.shots_config?.default_shots || []}
                      flowData={{
                        avatarId: data['avatar'],
                        product: data['product'],
                        spaceId: data['space'],
                        selectedShots: (data['selectedShots'] as string[]) || [],
                        scripts: data['script'] as any[],
                      }}
                      onComplete={() => navigate('/projects')}
                    />
                  </div>
                );
              })}
            </Suspense>
          </div>
        </div>

        <div className="bg-white border-t border-gray-200 px-8 py-4 flex items-center justify-between flex-shrink-0">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
            Quay lại
          </button>

          <div className="text-xs text-gray-400 text-center">
            {currentStepData?.required ? 'Bước bắt buộc' : 'Bước tùy chọn'}
            {!canGoNext && currentStepData?.required && (
              <span className="block text-red-400 mt-0.5">Vui lòng hoàn thành bước này</span>
            )}
          </div>

          {currentStep < steps.length - 1 ? (
            <button
              onClick={handleNextStep}
              disabled={!canGoNext}
              className="inline-flex items-center gap-2 bg-primary-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50"
            >
              Tiếp tục
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleNextStep}
              className="inline-flex items-center gap-2 bg-green-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4" />
              Hoàn tất
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
