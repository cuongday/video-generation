import { useQuery } from '@tanstack/react-query';
import { getJobs, getProjects, getAvatars } from '../lib/api';
import { Video, FolderOpen, Clock, CheckCircle } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Dashboard() {
  const { data: jobs } = useQuery({ queryKey: ['jobs'], queryFn: getJobs });
  const { data: projects } = useQuery({ queryKey: ['projects'], queryFn: () => getProjects() });
  const { data: avatars } = useQuery({ queryKey: ['avatars'], queryFn: () => getAvatars() });

  const stats = {
    totalJobs: jobs?.items?.length || 0,
    completedJobs: jobs?.items?.filter((j: { status: string }) => j.status === 'completed').length || 0,
    totalProjects: projects?.items?.length || 0,
    totalAvatars: avatars?.items?.length || 0,
    pendingJobs: jobs?.items?.filter((j: { status: string }) => j.status === 'pending' || j.status === 'running').length || 0,
  };

  const recentJobs = jobs?.items?.slice(0, 5) || [];

  return (
    <div className="max-w-5xl mx-auto px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Bảng điều khiển</h1>
        <p className="text-gray-500 mt-1">Tổng quan về hoạt động của bạn</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Tổng Jobs', value: stats.totalJobs, icon: Video, color: 'bg-blue-50 text-blue-600' },
          { label: 'Hoàn thành', value: stats.completedJobs, icon: CheckCircle, color: 'bg-green-50 text-green-600' },
          { label: 'Đang chạy', value: stats.pendingJobs, icon: Clock, color: 'bg-yellow-50 text-yellow-600' },
          { label: 'Dự án', value: stats.totalProjects, icon: FolderOpen, color: 'bg-purple-50 text-purple-600' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-3', stat.color)}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Recent Jobs */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Jobs gần đây</h2>
        {recentJobs.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">Chưa có job nào</p>
        ) : (
          <div className="space-y-3">
            {recentJobs.map((j: { id: string; job_type: string; provider: string; status: string; created_at: string }) => (
              <div key={j.id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 capitalize">{j.job_type}</p>
                  <p className="text-xs text-gray-500">{j.provider}</p>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(j.created_at).toLocaleDateString('vi-VN')}
                </span>
                <span className={cn(
                  'px-2 py-0.5 rounded text-xs font-medium',
                  j.status === 'completed' ? 'bg-green-100 text-green-700' :
                  j.status === 'failed' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                )}>
                  {j.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
