import { useState, useCallback } from 'react';
import { Upload, X, Image, Loader } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ProductInfo {
  name: string;
  brand: string;
  price: string;
  description: string;
  features: string;
  imageUrl?: string;
}

interface Props {
  value?: ProductInfo;
  onChange: (product: ProductInfo) => void;
}

export default function StepProductForm({ value, onChange }: Props) {
  const [product, setProduct] = useState<ProductInfo>(value || {
    name: '',
    brand: '',
    price: '',
    description: '',
    features: '',
    imageUrl: '',
  });
  const [imagePreview, setImagePreview] = useState<string | null>(value?.imageUrl || null);
  const [isUploading, setIsUploading] = useState(false);

  const update = useCallback((updates: Partial<ProductInfo>) => {
    const next = { ...product, ...updates };
    setProduct(next);
    onChange(next);
  }, [product, onChange]);

  const handleImageUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImagePreview(dataUrl);
      update({ imageUrl: dataUrl });
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  }, [update]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleImageUpload(file);
  }, [handleImageUpload]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file);
  }, [handleImageUpload]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Thông tin sản phẩm</h2>
        <p className="text-sm text-gray-500 mt-0.5">Nhập thông tin sản phẩm cần unbox/review</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên sản phẩm *</label>
          <input
            type="text"
            value={product.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="VD: Sony WH-1000XM5, iPhone 15 Pro Max"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Thương hiệu</label>
          <input
            type="text"
            value={product.brand}
            onChange={(e) => update({ brand: e.target.value })}
            placeholder="VD: Sony, Apple, Samsung"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Giá tiềh (VNĐ)</label>
          <input
            type="text"
            value={product.price}
            onChange={(e) => update({ price: e.target.value })}
            placeholder="VD: 8.990.000"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Mô tả sản phẩm</label>
        <textarea
          value={product.description}
          onChange={(e) => update({ description: e.target.value })}
          rows={3}
          placeholder="Mô tả ngắn về sản phẩm, tính năng nổi bật..."
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Tính năng nổi bật</label>
        <textarea
          value={product.features}
          onChange={(e) => update({ features: e.target.value })}
          rows={2}
          placeholder="VD: Chống ồn chủ động, pin 30h, kết nối đa thiết bị..."
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white resize-none"
        />
      </div>

      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Hình ảnh sản phẩm</label>
        {imagePreview ? (
          <div className="relative inline-block">
            <img src={imagePreview} alt="Product preview" className="w-full max-h-64 object-contain rounded-xl border border-gray-200 bg-gray-50" />
            <button
              onClick={() => { setImagePreview(null); update({ imageUrl: '' }); }}
              className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-lg text-red-500 hover:bg-red-50 shadow-sm"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className={cn(
              'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
              'hover:border-primary-400 hover:bg-primary-50/50',
              'border-gray-300 bg-gray-50'
            )}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="product-image-upload"
            />
            <label htmlFor="product-image-upload" className="cursor-pointer">
              {isUploading ? (
                <Loader className="w-8 h-8 mx-auto mb-2 text-primary-500 animate-spin" />
              ) : (
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              )}
              <p className="text-sm text-gray-600 font-medium">
                {isUploading ? 'Đang tải lên...' : 'Kéo thả hoặc click để tải ảnh'}
              </p>
              <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP (tối đa 10MB)</p>
            </label>
          </div>
        )}
      </div>

      {product.name && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
          <Image className="w-4 h-4 text-green-600" />
          <p className="text-sm text-green-700 font-medium">Đã nhập: {product.name}</p>
        </div>
      )}
    </div>
  );
}
