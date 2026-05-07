import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Video, Clock, CheckCircle, XCircle, Loader } from 'lucide-react';
import { getJobs } from '../lib/api';
import { cn } from '../lib/utils';

const STATUS_CONFIG = {
  pending: { icon: Clock, color: 'text-yellow-600 bg-yellow-50', label: 'Chờ xử lý' },
  running: { icon: Loader, color: 'text-blue-600 bg-blue-50', label: 'Đang chạy' },
  completed: { icon: CheckCircle, color: 'text-green-600 bg-green-50', label: 'Hoàn thành' },
  failed: { icon: XCircle, color: 'text-red-600 bg-red-50', label: 'Thất bại' },
};

export default function History() {
  const { data, isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => getJobs(),
  });

  return (
    <div className="max-w-4xl mx-auto px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Lịch sử tạo</h1>
        <p className="text-gray-500 mt-1">Lịch sử tạo video và hình ảnh</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-lg h-16 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {data?.items?.map((job: { id: string; job_type: string; provider: string; status: string; created_at: string }) => {
            const cfg = STATUS_CONFIG[job.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
            const Icon = cfg.icon;
            return (
              <div key={job.id} className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-4">
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', cfg.color)}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 capitalize">{job.job_type}</span>
                    <span className="text-gray-400">qua</span>
                    <span className="text-gray-600 text-sm">{job.provider}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(job.created_at).toLocaleString('vi-VN')}
                  </p>
                </div>
                <span className={cn('px-2.5 py-1 rounded text-xs font-medium', cfg.color)}>
                  {cfg.label}
                </span>
              </div>
            );
          })}

          {data?.items?.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <Video className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>Chưa có job nào</p>
              <Link to="/templates" className="text-primary-600 text-sm mt-2 inline-block hover:underline">
                Bắt đầu tạo video
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
