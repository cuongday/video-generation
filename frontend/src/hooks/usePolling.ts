import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getJobStatus } from '../lib/api';

export function usePolling<T>(
  jobId: string | null,
  transform: (data: unknown) => T,
  interval = 3000,
  enabled = true,
) {
  return useQuery({
    queryKey: ['job', jobId],
    queryFn: async () => {
      if (!jobId) return null;
      const data = await getJobStatus(jobId);
      return transform(data);
    },
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'completed' || status === 'failed') return false;
      return interval;
    },
    enabled: Boolean(jobId) && enabled,
  });
}
