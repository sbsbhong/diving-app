import React from 'react';
import { updatePlannedWatchDives, type PlannedWatchDivesUpdateStatus } from '../native/watch-connectivity';
import type { DivePlan } from '../types/dive-plan';
import type { DivePlanRepository } from '../repositories/dive-plan-repository';
import { defaultDivePlanRepository } from '../repositories/default-dive-plan-repository';
import { useDeleteDivePlanMutation, useDivePlansQuery, useSaveDivePlanMutation } from './use-dive-plan-queries';

type UseDivePlansOptions = {
  repository?: DivePlanRepository;
  queryScope?: string;
};

type DivePlanRepositoryWithSyncList = DivePlanRepository & {
  listSync?: () => DivePlan[];
};

export const useDivePlans = (options: UseDivePlansOptions = {}) => {
  const repository = options.repository ?? defaultDivePlanRepository;
  const initialPlans = React.useMemo(() => {
    const repositoryWithSyncList = repository as DivePlanRepositoryWithSyncList;

    if (typeof repositoryWithSyncList.listSync === 'function') {
      return repositoryWithSyncList.listSync();
    }

    return undefined;
  }, [repository]);
  const plansQuery = useDivePlansQuery(repository, {
    initialData: initialPlans,
    staleTime: Infinity,
    queryScope: options.queryScope,
  });
  const savePlanMutation = useSaveDivePlanMutation(repository, { queryScope: options.queryScope });
  const deletePlanMutation = useDeleteDivePlanMutation(repository, { queryScope: options.queryScope });
  const plans = plansQuery.data ?? initialPlans ?? [];
  const [plannedWatchSyncStatus, setPlannedWatchSyncStatus] = React.useState<PlannedWatchDivesUpdateStatus | undefined>();
  const refresh = React.useCallback(async () => {
    await plansQuery.refetch();
  }, [plansQuery]);

  React.useEffect(() => {
    let isCurrent = true;

    void updatePlannedWatchDives(plans)
      .then(status => {
        if (isCurrent) {
          setPlannedWatchSyncStatus(status);
        }
      })
      .catch(error => {
        console.warn('Failed to update planned watch dives', error);
      });

    return () => {
      isCurrent = false;
    };
  }, [plans]);

  return {
    plans,
    refresh,
    savePlan: savePlanMutation.mutateAsync,
    deletePlan: deletePlanMutation.mutateAsync,
    isLoading: plansQuery.isLoading,
    isRefreshing: plansQuery.isRefetching,
    isSaving: savePlanMutation.isPending,
    isDeleting: deletePlanMutation.isPending,
    plannedWatchSyncStatus,
    listError: plansQuery.error,
    saveError: savePlanMutation.error,
    deleteError: deletePlanMutation.error,
  };
};
