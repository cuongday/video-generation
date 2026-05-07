import { create } from 'zustand';
import type { TemplateConfig, FlowState } from '../types';

interface FlowStore extends FlowState {
  init: (templateId: string, projectId?: string) => void;
  goToStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateStep: (key: string, value: unknown) => void;
  setProjectId: (id: string) => void;
  setTemplateId: (id: string) => void;
  reset: () => void;
  canAdvance: (
    template: TemplateConfig | undefined,
    currentStep: number,
    data: Record<string, unknown>
  ) => boolean;
  validateStep: (
    stepId: string,
    stepData: unknown,
    isRequired: boolean
  ) => boolean;
}

export const useFlowStore = create<FlowStore>((set, get) => ({
  templateId: null,
  projectId: null,
  currentStep: 0,
  completedSteps: [],
  data: {},

  init: (templateId, projectId) =>
    set({ templateId, projectId: projectId ?? null, currentStep: 0, completedSteps: [], data: {} }),

  goToStep: (step) => set({ currentStep: step }),

  nextStep: () => {
    const { currentStep, completedSteps } = get();
    if (!completedSteps.includes(currentStep)) {
      set({ completedSteps: [...completedSteps, currentStep] });
    }
    set({ currentStep: currentStep + 1 });
  },

  prevStep: () => {
    const { currentStep } = get();
    if (currentStep > 0) set({ currentStep: currentStep - 1 });
  },

  updateStep: (key, value) =>
    set((state) => ({ data: { ...state.data, [key]: value } })),

  setProjectId: (id) => set({ projectId: id }),
  setTemplateId: (id) => set({ templateId: id }),

  reset: () =>
    set({ templateId: null, projectId: null, currentStep: 0, completedSteps: [], data: {} }),

  validateStep: (stepId, stepData, isRequired) => {
    if (!isRequired) return true;
    if (stepData === undefined || stepData === null) return false;
    if (typeof stepData === 'string') return stepData.trim().length > 0;
    if (typeof stepData === 'object') {
      if (Array.isArray(stepData)) return stepData.length > 0;
      return Object.keys(stepData).length > 0;
    }
    return true;
  },

  canAdvance: (template, currentStep, data) => {
    const steps = template?.flow?.steps || [];
    const currentStepData = steps[currentStep];
    if (!currentStepData) return true;

    const stepId = currentStepData.id || `step_${currentStep}`;
    const stepData = data[stepId];

    return get().validateStep(stepId, stepData, currentStepData.required);
  },
}));
