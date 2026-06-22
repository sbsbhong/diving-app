import React from 'react';
import type { DivePlan } from '../types/dive-plan';
import type { DivePlanRepository } from '../repositories/dive-plan-repository';
import { defaultDivePlanRepository } from '../repositories/local-dive-plan-repository';
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

  return {
    plans: plansQuery.data ?? initialPlans ?? [],
    savePlan: savePlanMutation.mutateAsync,
    deletePlan: deletePlanMutation.mutateAsync,
    isLoading: plansQuery.isLoading,
    isSaving: savePlanMutation.isPending,
    isDeleting: deletePlanMutation.isPending,
    listError: plansQuery.error,
    saveError: savePlanMutation.error,
    deleteError: deletePlanMutation.error,
  };
};
