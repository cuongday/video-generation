import { useMutation } from '@tanstack/react-query';
import { enhancePrompt, synthesizeAvatarPattern } from '../lib/api';
import type { AvatarBiometrics } from '../types';

export function usePromptEnhance() {
  return useMutation({
    mutationFn: (params: {
      raw_description: string;
      flow_type?: string;
      style?: string;
      mood?: string;
      camera?: string;
    }) => enhancePrompt(params),
  });
}

export function useAvatarSynthesize() {
  return useMutation({
    mutationFn: (biometrics: Partial<AvatarBiometrics>) =>
      synthesizeAvatarPattern(biometrics),
  });
}
