import type { DivePlan } from '../types/dive-plan';

export type DivePlanRepository = {
  list(): Promise<DivePlan[]>;
  get(localId: string): Promise<DivePlan | undefined>;
  save(plan: DivePlan): Promise<DivePlan>;
  delete(localId: string): Promise<void>;
};
