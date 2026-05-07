import { create } from 'zustand';
import type { AvatarAsset, AvatarBiometrics } from '../types';

interface AvatarStore {
  currentAvatar: AvatarAsset | null;
  biometrics: Partial<AvatarBiometrics>;
  name: string;
  tags: string[];
  description: string;
  selectedAngles: string[];
  selectedOutfits: string[];
  aspectRatio: string;
  setAvatar: (avatar: AvatarAsset | null) => void;
  updateBiometrics: (updates: Partial<AvatarBiometrics>) => void;
  setName: (name: string) => void;
  setTags: (tags: string[]) => void;
  setDescription: (desc: string) => void;
  setSelectedAngles: (angles: string[]) => void;
  setSelectedOutfits: (outfits: string[]) => void;
  setAspectRatio: (ratio: string) => void;
  reset: () => void;
}

const defaultBiometrics: Partial<AvatarBiometrics> = {
  gender: 'female',
  ethnicity: 'southeast_asian',
  age: 25,
  face_shape: 'oval',
  eye_shape: 'almond',
  eye_color: 'dark_brown',
  eye_size: 'medium',
  nose_shape: 'small',
  nose_width: 'medium',
  lip_shape: 'medium',
  lip_volume: 'natural',
  ear_shape: 'attached',
  ear_size: 'medium',
  ear_protrusion: 'flat',
  skin_color: 'medium_brown',
  skin_undertone: 'warm',
  hair_style: 'straight',
  hair_length: 'shoulder_length',
  hair_color: 'black',
  bangs: 'none',
  eyebrows: 'arched',
  freckles: 'none',
  dimples: 'none',
  expression: 'slight_smile',
  body_type: 'average',
  height: 'average',
  bust_cm: undefined,
  waist_cm: undefined,
  hips_cm: undefined,
  outfit_top: '',
  outfit_bottom: '',
  outfit_description: '',
  shoes: 'sneakers',
  accessories: {},
  // Influencer-specific fields
  shooting_style: 'full_body',
  environment: 'modern urban cafe with natural lighting, outdoor terrace',
  pose_description: 'standing confidently, natural pose',
  camera_angle: 'eye_level',
  additional_details: 'warm golden hour lighting, shallow depth of field, bokeh background',
};

export const useAvatarStore = create<AvatarStore>((set) => ({
  currentAvatar: null,
  biometrics: { ...defaultBiometrics },
  name: '',
  tags: [],
  description: '',
  selectedAngles: ['front', '3/4_left', '3/4_right', 'profile_left'],
  selectedOutfits: ['business', 'casual', 'smart_casual'],
  aspectRatio: '9:16',

  setAvatar: (avatar) => set({ currentAvatar: avatar }),
  updateBiometrics: (updates) =>
    set((state) => ({ biometrics: { ...state.biometrics, ...updates } })),
  setName: (name) => set({ name }),
  setTags: (tags) => set({ tags }),
  setDescription: (desc) => set({ description: desc }),
  setSelectedAngles: (angles) => set({ selectedAngles: angles }),
  setSelectedOutfits: (outfits) => set({ selectedOutfits: outfits }),
  setAspectRatio: (ratio) => set({ aspectRatio: ratio }),
  reset: () =>
    set({ 
      currentAvatar: null, 
      biometrics: { ...defaultBiometrics }, 
      name: '', 
      tags: [], 
      description: '', 
      selectedAngles: ['front', '3/4_left', '3/4_right', 'profile_left'], 
      selectedOutfits: ['business', 'casual', 'smart_casual'],
      aspectRatio: '9:16',
    }),
}));
