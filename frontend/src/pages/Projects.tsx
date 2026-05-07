import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Video, Plus, Trash2, FolderOpen } from 'lucide-react';
import { getProjects, deleteProject, createProject } from '../lib/api';

export default function Projects() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['projects'],
    queryFn: () => getProjects(),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => refetch(),
  });

  const createMutation = useMutation({
    mutationFn: () => createProject({ name: 'New Project', flow_type: 'custom' }),
    onSuccess: (d) => {
      window.location.href = `/project/${d.id}`;
    },
  });

  return (
    <div className="max-w-4xl mx-auto px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dự án</h1>
          <p className="text-gray-500 mt-1">Quản lý các dự án video của bạn</p>
        </div>
        <button
          onClick={() => createMutation.mutate()}
          className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Dự án mới
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl h-32 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data?.items?.map((p: { id: string; name: string; template_name?: string; status: string; updated_at: string }) => (
            <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:border-primary-300 transition-colors">
              <div className="flex items-start justify-between">
                <Link to={`/project/${p.id}`} className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 hover:text-primary-700 truncate">{p.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {p.template_name || 'Tùy chỉnh'} — {p.status}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(p.updated_at).toLocaleDateString('vi-VN')}
                  </p>
                </Link>
                <button
                  onClick={() => deleteMutation.mutate(p.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {data?.items?.length === 0 && (
            <div className="col-span-2 text-center py-16 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
              <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>Chưa có dự án nào</p>
              <Link to="/templates" className="text-primary-600 text-sm mt-2 inline-block hover:underline">
                Tạo dự án mới
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
