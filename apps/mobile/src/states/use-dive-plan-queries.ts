import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { DivePlan } from '../types/dive-plan';
import type { DivePlanRepository } from '../repositories/dive-plan-repository';
import { defaultDivePlanRepository } from '../repositories/local-dive-plan-repository';

export type DivePlanQueryOptions = {
  queryScope?: string;
  initialData?: DivePlan[];
  staleTime?: number;
};

const DEFAULT_QUERY_SCOPE = 'default';
const repositoryScopes = new WeakMap<DivePlanRepository, string>();
let nextRepositoryScopeId = 1;

export const getDivePlanQueryScope = (
  repository: DivePlanRepository = defaultDivePlanRepository,
  queryScope?: string,
): string => {
  if (queryScope) {
    return queryScope;
  }

  if (repository === defaultDivePlanRepository) {
    return DEFAULT_QUERY_SCOPE;
  }

  const currentScope = repositoryScopes.get(repository);

  if (currentScope) {
    return currentScope;
  }

  const nextScope = `repository:${nextRepositoryScopeId}`;
  nextRepositoryScopeId += 1;
  repositoryScopes.set(repository, nextScope);
  return nextScope;
};

export const divePlanQueryKeys = {
  all: (repository: DivePlanRepository = defaultDivePlanRepository, queryScope?: string) =>
    ['divePlans', getDivePlanQueryScope(repository, queryScope)] as const,
  list: (repository: DivePlanRepository = defaultDivePlanRepository, queryScope?: string) =>
    [...divePlanQueryKeys.all(repository, queryScope), 'list'] as const,
  detail: (localId: string, repository: DivePlanRepository = defaultDivePlanRepository, queryScope?: string) =>
    [...divePlanQueryKeys.all(repository, queryScope), 'detail', localId] as const,
};

export const useDivePlansQuery = (
  repository: DivePlanRepository = defaultDivePlanRepository,
  options: DivePlanQueryOptions = {},
) => {
  return useQuery({
    queryKey: divePlanQueryKeys.list(repository, options.queryScope),
    queryFn: () => repository.list(),
    initialData: options.initialData,
    staleTime: options.staleTime,
  });
};

export const useSaveDivePlanMutation = (
  repository: DivePlanRepository = defaultDivePlanRepository,
  options: DivePlanQueryOptions = {},
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (plan: DivePlan) => repository.save(plan),
    onSuccess: plan => {
      queryClient.setQueryData(divePlanQueryKeys.detail(plan.localId, repository, options.queryScope), plan);
      queryClient.setQueryData<DivePlan[]>(divePlanQueryKeys.list(repository, options.queryScope), currentPlans => {
        const plans = currentPlans ?? [];
        const nextPlans = plans.some(currentPlan => currentPlan.localId === plan.localId)
          ? plans.map(currentPlan => (currentPlan.localId === plan.localId ? plan : currentPlan))
          : [plan, ...plans];

        return nextPlans;
      });
      queryClient.invalidateQueries({ queryKey: divePlanQueryKeys.list(repository, options.queryScope) });
    },
  });
};

export const useDeleteDivePlanMutation = (
  repository: DivePlanRepository = defaultDivePlanRepository,
  options: DivePlanQueryOptions = {},
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (localId: string) => repository.delete(localId),
    onSuccess: (_result, localId) => {
      queryClient.setQueryData<DivePlan[]>(divePlanQueryKeys.list(repository, options.queryScope), currentPlans =>
        (currentPlans ?? []).filter(plan => plan.localId !== localId),
      );
      queryClient.invalidateQueries({ queryKey: divePlanQueryKeys.all(repository, options.queryScope) });
    },
  });
};
