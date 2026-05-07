export const GENDERS = [
  { value: 'female', label: 'Nữ' },
  { value: 'male', label: 'Nam' },
  { value: 'non-binary', label: 'Phi nhị nguyên' },
] as const;

export const ETHNICITIES = [
  { value: 'african', label: 'Châu Phi' },
  { value: 'asian', label: 'Đông Á' },
  { value: 'southeast_asian', label: 'Đông Nam Á' },
  { value: 'european', label: 'Châu Âu' },
  { value: 'indian', label: 'Ấn Độ' },
  { value: 'middle_eastern', label: 'Trung Đông' },
  { value: 'latin', label: 'Latin' },
  { value: 'mixed', label: 'Hỗn hợp' },
] as const;

export const FACE_SHAPES = ['oval', 'round', 'square', 'heart', 'oblong', 'diamond'];
export const FACE_SHAPE_LABELS: Record<string, string> = {
  oval: 'Oval',
  round: 'Tròn',
  square: 'Vuông',
  heart: 'Trái tim',
  oblong: 'Dài',
  diamond: 'Kim cương',
};
export const EYE_SHAPES = ['large', 'almond', 'hooded', 'narrow', 'round', 'upturned', 'downturned'];
export const EYE_SHAPE_LABELS: Record<string, string> = {
  large: 'To',
  almond: 'Hạnh nhân',
  hooded: 'Mắt một mí',
  narrow: 'Hẹp',
  round: 'Tròn',
  upturned: 'Cong lên',
  downturned: 'Cong xuống',
};
export const EYE_COLORS = ['black', 'brown', 'dark_brown', 'hazel', 'green', 'blue', 'gray', 'amber', 'violet', 'deep_brown'];
export const EYE_COLOR_LABELS: Record<string, string> = {
  black: 'Đen',
  brown: 'Nâu',
  dark_brown: 'Nâu đậm',
  hazel: 'Hazel',
  green: 'Xanh lá',
  blue: 'Xanh dương',
  gray: 'Xám',
  amber: 'Hổ phách',
  violet: 'Tím',
  deep_brown: 'Nâu sẫm',
};
export const EYE_SIZES = ['small', 'medium', 'large'];
export const EYE_SIZE_LABELS: Record<string, string> = {
  small: 'Nhỏ',
  medium: 'Trung bình',
  large: 'To',
};
export const NOSE_SHAPES = ['small', 'sharp', 'round', 'broad', 'straight', 'aquiline', 'button', 'flared'];
export const NOSE_SHAPE_LABELS: Record<string, string> = {
  small: 'Nhỏ',
  sharp: 'Sắc',
  round: 'Tròn',
  broad: 'Rộng',
  straight: 'Thẳng',
  aquiline: 'Gồ',
  button: 'Trợn',
  flared: 'Cánh rộng',
};
export const NOSE_WIDTHS = ['narrow', 'medium', 'wide'];
export const NOSE_WIDTH_LABELS: Record<string, string> = {
  narrow: 'Hẹp',
  medium: 'Trung bình',
  wide: 'Rộng',
};
export const LIP_SHAPES = ['full', 'thin', 'medium', 'heart-shaped'];
export const LIP_SHAPE_LABELS: Record<string, string> = {
  full: 'Đầy',
  thin: 'Mỏng',
  medium: 'Trung bình',
  'heart-shaped': 'Trái tim',
};
export const LIP_VOLUMES = ['natural', 'plump', 'subtle'];
export const LIP_VOLUME_LABELS: Record<string, string> = {
  natural: 'Tự nhiên',
  plump: 'Đầy',
  subtle: 'Nhẹ',
};
export const EAR_SHAPES = ['attached', 'detached'];
export const EAR_SIZES = ['small', 'medium', 'large'];
export const EAR_PROTRUSIONS = ['flat', 'slightly_protruding', 'prominent'];
export const SKIN_COLORS = ['black', 'dark_brown', 'medium_brown', 'olive', 'white', 'fair', 'light', 'porcelain', 'pink', 'purple', 'red', 'yellow', 'gold', 'bronze'];
export const SKIN_COLOR_LABELS: Record<string, string> = {
  black: 'Đen',
  dark_brown: 'Nâu đậm',
  medium_brown: 'Nâu vừa',
  olive: 'Olive',
  white: 'Trắng',
  fair: 'Fair',
  light: 'Sáng',
  porcelain: 'Porcelain',
  pink: 'Hồng',
  purple: 'Tím',
  red: 'Đỏ',
  yellow: 'Vàng',
  gold: 'Vàng gold',
  bronze: 'Bronze',
};
export const SKIN_UNDERTOONES = ['warm', 'cool', 'neutral'];
export const SKIN_UNDERTOONE_LABELS: Record<string, string> = {
  warm: 'Ấm',
  cool: 'Lạnh',
  neutral: 'Trung tính',
};
export const HAIR_STYLES = ['straight', 'wavy', 'curly', 'coily', 'braided', 'bald'];
export const HAIR_STYLE_LABELS: Record<string, string> = {
  straight: 'Thẳng',
  wavy: 'Sóng',
  curly: 'Xoăn',
  coily: 'Xoăn cuộn',
  braided: 'Tết tóc',
  bald: 'Hói',
};
export const HAIR_LENGTHS = ['bald', 'shaved', 'pixie', 'chin-length', 'shoulder-length', 'mid-back', 'long'];
export const HAIR_LENGTH_LABELS: Record<string, string> = {
  bald: 'Hói',
  shaved: 'Cạo',
  pixie: 'Pixie',
  'chin-length': 'Ngắn',
  'shoulder-length': 'Ngang vai',
  'mid-back': 'Lưng',
  long: 'Dài',
};
export const HAIR_COLORS = ['black', 'dark_brown', 'brown', 'auburn', 'chestnut', 'blonde', 'platinum', 'ginger', 'gray', 'white'];
export const BANGS_OPTIONS = ['none', 'side-swept', 'curtain', 'blunt', 'zigzag'];
export const BANGS_LABELS: Record<string, string> = {
  none: 'Không',
  'side-swept': 'Rẽ ngang',
  curtain: 'Rèm cửa',
  blunt: 'Cắt thẳng',
  zigzag: 'Zigzag',
};
export const EYEBROW_SHAPES = ['arched', 'straight', 'rounded', 'angular', 'thick', 'thin'];
export const EYEBROW_SHAPE_LABELS: Record<string, string> = {
  arched: 'Vòm',
  straight: 'Thẳng',
  rounded: 'Bo tròn',
  angular: 'Góc cạnh',
  thick: 'Dày',
  thin: 'Mỏng',
};
export const EXPRESSIONS = ['neutral', 'slight_smile', 'happy', 'big_smile', 'serious', 'confident', 'thoughtful', 'playful', 'surprised'];
export const BODY_TYPES = ['slim', 'slender', 'athletic', 'average', 'curvy', 'voluptuous', 'stocky', 'muscular'];
export const BODY_TYPE_LABELS: Record<string, string> = {
  slim: 'Gầy',
  slender: 'Thon gọn',
  athletic: 'Thể thao',
  average: 'Trung bình',
  curvy: 'Đầy đặn',
  voluptuous: 'Quyến rũ',
  stocky: 'Chắc nịch',
  muscular: 'Cơ bắp',
};
export const HEIGHTS = ['short', 'average', 'tall', 'very_tall'];
export const HEIGHT_LABELS: Record<string, string> = {
  short: 'Thấp',
  average: 'Trung bình',
  tall: 'Cao',
  very_tall: 'Rất cao',
};
export const SHOES_OPTIONS = ['sneakers', 'heels', 'loafers', 'boots', 'sandals', 'barefoot', 'flats', 'platform'];
export const SHOES_LABELS: Record<string, string> = {
  sneakers: 'Giày thể thao',
  heels: 'Giày cao gót',
  loafers: 'Giày lười',
  boots: 'Bốt',
  sandals: 'Dép',
  barefoot: 'Chân trần',
  flats: 'Giày bệt',
  platform: 'Giày đế xuồng',
};
export const OUTFIT_CATEGORIES = ['business', 'casual', 'smart_casual', 'sports', 'traditional', 'fashion', 'lifestyle', 'custom'];
export const SHOOTING_STYLES = [
  { value: 'portrait', label: 'Chân dung', desc: 'Đầu và vai' },
  { value: 'half_body', label: 'Nửa thân', desc: 'Từ thắt lưng lên' },
  { value: 'full_body', label: 'Toàn thân', desc: 'Hình người đầy đủ' },
  { value: 'lifestyle', label: 'Đời thường', desc: 'Chụp phong cách sống' },
  { value: 'product_shot', label: 'Giới thiệu sản phẩm', desc: 'Pose giới thiệu sản phẩm' },
] as const;
export const CAMERA_ANGLES = [
  { value: 'eye_level', label: 'Ngang tầm mắt', desc: 'Tự nhiên' },
  { value: 'low_angle', label: 'Góc thấp', desc: 'Tự tin, quyền lực' },
  { value: 'high_angle', label: 'Góc cao', desc: 'Thân thiện, bay bổng' },
  { value: 'dramatic', label: 'Điện ảnh', desc: 'Góc dramatic' },
] as const;

export const CAMERA_MOVEMENTS = [
  { value: 'static', label: 'Tĩnh' },
  { value: 'slow_pan', label: 'Quay chậm' },
  { value: 'dolly', label: 'Dolly' },
  { value: 'orbit', label: 'Quay vòng' },
  { value: 'tracking', label: 'Tracking' },
  { value: 'zoom', label: 'Phóng to' },
  { value: 'tilt', label: 'Nghiêng' },
  { value: 'cinematic', label: 'Điện ảnh' },
  { value: 'dynamic', label: 'Năng động' },
] as const;

export const ASPECT_RATIOS = [
  { value: '16:9', label: '16:9 (Ngang)', desc: 'YouTube, TV' },
  { value: '9:16', label: '9:16 (Dọc)', desc: 'TikTok, Reels, Shorts' },
  { value: '1:1', label: '1:1 (Vuông)', desc: 'Instagram Feed' },
  { value: '4:3', label: '4:3 (Chuẩn)', desc: 'Định dạng cổ điển' },
] as const;

export const VIDEO_STYLES = [
  { value: 'photorealistic', label: 'Siêu thực', desc: 'Chân thực, sống động' },
  { value: 'cinematic', label: 'Điện ảnh', desc: 'Phong cách phim' },
  { value: 'anime', label: 'Anime', desc: 'Phong cách hoạt hình Nhật' },
  { value: '3d_render', label: '3D Render', desc: 'Đồ họa 3D' },
  { value: 'oil_painting', label: 'Tranh dầu', desc: 'Phong cách hội họa cổ điển' },
  { value: 'watercolor', label: 'Truyện tranh', desc: 'Nghệ thuật màu nước' },
  { value: 'digital_art', label: 'Nghệ thuật số', desc: 'Minh họa kỹ thuật số hiện đại' },
  { value: 'low_poly', label: 'Low Poly', desc: 'Phong cách hình học' },
  { value: 'vintage', label: 'Cổ điển', desc: 'Thẩm mỹ phim cũ' },
  { value: 'neon', label: 'Neon', desc: 'Hiệu ứng neon' },
  { value: 'minimalist', label: 'Tối giản', desc: 'Thiết kế sạch sẽ, tối giản' },
  { value: 'abstract', label: 'Trừu tượng', desc: 'Nghệ thuật trừu tượng' },
] as const;

export const VIDEO_MOODS = [
  { value: 'happy', label: 'Vui vẻ', desc: 'Ấm áp, hạnh phúc' },
  { value: 'mysterious', label: ' Bí ẩn', desc: 'Tối, hấp dẫn' },
  { value: 'dramatic', label: 'Kịch tính', desc: 'Cường độ cao' },
  { value: 'peaceful', label: 'Bình yên', desc: 'Yên tĩnh, thư thái' },
  { value: 'energetic', label: 'Năng động', desc: 'Đầy sức sống' },
  { value: 'professional', label: 'Chuyên nghiệp', desc: 'Phong cách doanh nghiệp' },
  { value: 'romantic', label: 'Lãng mạn', desc: 'Tình cảm, ấm áp' },
  { value: 'dark', label: 'Tối', desc: 'U ám, trầm' },
] as const;

export const TEMPLATE_CATEGORIES = [
  { value: 'all', label: 'Tất cả' },
  { value: 'affiliate', label: 'Affiliate' },
  { value: 'avatar', label: 'Avatar' },
  { value: 'cinematic', label: 'Điện ảnh' },
  { value: 'educational', label: 'Hướng dẫn' },
  { value: 'storytelling', label: 'Kể chuyện' },
  { value: 'commercial', label: 'Quảng cáo' },
  { value: 'custom', label: 'Tùy chỉnh' },
] as const;

export const MULTI_ANGLE_OPTIONS = [
  { value: 'front', label: 'Mặt trước' },
  { value: '3/4_left', label: '3/4 Trái' },
  { value: '3/4_right', label: '3/4 Phải' },
  { value: 'profile_left', label: 'Nghiêng Trái' },
  { value: 'profile_right', label: 'Nghiêng Phải' },
  { value: 'looking_up', label: 'Nhìn lên' },
  { value: 'looking_down', label: 'Nhìn xuống' },
  { value: 'tilt_left', label: 'Nghiêng Trái' },
  { value: 'tilt_right', label: 'Nghiêng Phải' },
] as const;

export const MULTI_OUTFIT_OPTIONS = [
  { value: 'business', label: 'Doanh nhân' },
  { value: 'casual', label: 'Thường ngày' },
  { value: 'smart_casual', label: 'Thông minh' },
  { value: 'active', label: 'Thể thao' },
  { value: 'evening', label: 'Dạ hội' },
  { value: 'traditional', label: 'Truyền thống' },
] as const;

// Influencer-specific options — moved to body section above

export const ASPECT_RATIOS_IMAGE = [
  { value: '9:16', label: '9:16 (Dọc)', desc: 'TikTok, Reels, Shorts' },
  { value: '1:1', label: '1:1 (Vuông)', desc: 'Instagram Feed' },
  { value: '3:4', label: '3:4 (Dọc lớn)', desc: 'Instagram Portrait' },
  { value: '16:9', label: '16:9 (Ngang)', desc: 'YouTube, TV' },
] as const;

export const TRANSITIONS = [
  { value: 'none', label: 'Không' },
  { value: 'fade', label: 'Mờ dần' },
  { value: 'dissolve', label: 'Hòa tan' },
  { value: 'wipe', label: 'Quét' },
  { value: 'slide', label: 'Trượt' },
] as const;
