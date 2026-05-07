export interface Template {
  id: string;
  name: string;
  description?: string;
  category: string;
  icon: string;
  is_builtin: boolean;
  version: string;
}

export interface TemplateConfig {
  id: string;
  name: string;
  description?: string;
  icon: string;
  category: string;
  is_builtin: boolean;
  version: string;
  flow: {
    steps: TemplateStep[];
  };
  shots_config?: {
    default_shots: string[];
    shot_definitions: Record<string, ShotDefinition>;
  };
  prompt_config?: Record<string, string>;
  defaults?: Record<string, string>;
}

export interface TemplateStep {
  id: string;
  title: string;
  description: string;
  components: string[];
  required: boolean;
}

export interface ShotDefinition {
  name: string;
  duration: number;
  camera: string;
  elements: string[];
  prompt_template: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  template_id?: string;
  template_name?: string;
  flow_type: string;
  flow_data: Record<string, unknown>;
  status: string;
  provider?: string;
  aspect_ratio: string;
  duration: number;
  created_at: string;
  updated_at: string;
}

export interface Scene {
  id: string;
  project_id: string;
  order_index: number;
  name: string;
  scene_type: string;
  config: Record<string, unknown>;
  prompt?: string;
  enhanced_prompt?: string;
  style?: string;
  mood?: string;
  camera?: string;
  image_path?: string;
  video_path?: string;
  duration: number;
  status: string;
  transition?: string;
}

export interface AvatarAsset {
  id: string;
  name: string;
  description?: string;
  avatar_type: 'ai_generated' | 'real_face';
  biometrics?: AvatarBiometrics;
  tags: string[];
  extra_metadata: Record<string, unknown>;
  reference_image_path?: string;
  face_images: Record<string, string>;
  body_images: Record<string, string>;
  video_clips: Record<string, string>;
  is_active: boolean;
  created_at: string;
}

export interface AvatarBiometrics {
  gender: 'female' | 'male' | 'non-binary';
  ethnicity: 'african' | 'asian' | 'southeast_asian' | 'european' | 'indian' | 'middle_eastern' | 'latin' | 'mixed';
  age: number;
  face_shape: string;
  eye_shape: string;
  eye_color: string;
  eye_size: string;
  nose_shape: string;
  nose_width: string;
  lip_shape: string;
  lip_volume: string;
  ear_shape: string;
  ear_size: string;
  ear_protrusion: string;
  skin_color: string;
  skin_undertone: string;
  hair_style: string;
  hair_length: string;
  hair_color: string;
  bangs: string;
  eyebrows: string;
  freckles: string;
  dimples: string;
  mole_location?: string;
  glasses?: string;
  expression: string;
  body_type: string;
  height: string;
  bust_cm?: number;
  waist_cm?: number;
  hips_cm?: number;
  outfit_description: string;
  outfit_top?: string;
  outfit_bottom?: string;
  shoes: string;
  accessories: Record<string, string>;
  // Influencer-specific fields
  shooting_style?: 'portrait' | 'half_body' | 'full_body' | 'lifestyle' | 'product_shot';
  environment?: string;
  pose_description?: string;
  camera_angle?: 'eye_level' | 'low_angle' | 'high_angle' | 'dramatic';
  additional_details?: string;
}

export interface SpaceAsset {
  id: string;
  name: string;
  description?: string;
  image_path?: string;
  prompt?: string;
  style?: string;
  lighting?: string;
  category: string;
  tags: string[];
  is_active: boolean;
  created_at: string;
}

export interface Job {
  id: string;
  project_id?: string;
  scene_id?: string;
  job_type: string;
  provider: string;
  provider_job_id?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  priority: number;
  input_data: Record<string, unknown>;
  output_path?: string;
  cost?: number;
  error_message?: string;
  progress: number;
  estimated_time?: number;
  created_at: string;
  completed_at?: string;
}

export interface APIKey {
  id: string;
  provider: string;
  label: string;
  is_active: boolean;
  quota_limit?: number;
  quota_used: number;
  is_builtin: boolean;
  created_at: string;
}

export interface FlowState {
  templateId: string | null;
  projectId: string | null;
  currentStep: number;
  completedSteps: number[];
  data: Record<string, unknown>;
}

export interface PromptEnhancement {
  main_prompt: string;
  face_prompt: string;
  hair_prompt: string;
  body_prompt: string;
  angle_prompts: Record<string, string>;
  outfit_prompts: Record<string, string>;
}
