import type { DivePlan } from '../types/dive-plan';
import type { DivePlanRepository } from './dive-plan-repository';

export type LocalDivePlanRepositoryOptions = {
  now?: () => number;
};

export class LocalDivePlanRepository implements DivePlanRepository {
  private plansByLocalId = new Map<string, DivePlan>();
  private readonly now: () => number;

  constructor(initialPlans: DivePlan[] = [], options: LocalDivePlanRepositoryOptions = {}) {
    this.now = options.now ?? getCurrentTimestampSeconds;

    for (const plan of initialPlans) {
      this.plansByLocalId.set(plan.localId, clonePlan(plan));
    }
  }

  async list(): Promise<DivePlan[]> {
    return this.listSync();
  }

  async get(localId: string): Promise<DivePlan | undefined> {
    return this.getSync(localId);
  }

  async save(plan: DivePlan): Promise<DivePlan> {
    this.plansByLocalId.set(plan.localId, clonePlan(plan));
    return clonePlan(plan);
  }

  async delete(localId: string): Promise<void> {
    this.plansByLocalId.delete(localId);
  }

  listSync(): DivePlan[] {
    return Array.from(this.plansByLocalId.values()).map(clonePlan).sort((left, right) => comparePlans(left, right, this.now()));
  }

  getSync(localId: string): DivePlan | undefined {
    const plan = this.plansByLocalId.get(localId);
    return plan ? clonePlan(plan) : undefined;
  }
}

export const defaultDivePlanRepository = new LocalDivePlanRepository();

function getCurrentTimestampSeconds(): number {
  return Date.now() / 1000;
}

function clonePlan(plan: DivePlan): DivePlan {
  return JSON.parse(JSON.stringify(plan)) as DivePlan;
}

function comparePlans(left: DivePlan, right: DivePlan, now: number): number {
  const leftBucket = getSortBucket(left, now);
  const rightBucket = getSortBucket(right, now);

  if (leftBucket !== rightBucket) {
    return leftBucket - rightBucket;
  }

  return getSortTimestamp(left, now) - getSortTimestamp(right, now);
}

function getSortBucket(plan: DivePlan, now: number): number {
  if (plan.status === 'planned' && plan.plannedAt !== undefined && plan.plannedAt >= now) {
    return 0;
  }

  if (plan.status === 'planned') {
    return 1;
  }

  if (plan.status === 'draft') {
    return 2;
  }

  return 3;
}

function getSortTimestamp(plan: DivePlan, now: number): number {
  if (plan.status === 'planned' && plan.plannedAt !== undefined && plan.plannedAt >= now) {
    return plan.plannedAt;
  }

  if (plan.status === 'planned') {
    return -(plan.plannedAt ?? plan.updatedAt);
  }

  if (plan.status === 'draft') {
    return -plan.updatedAt;
  }

  return -(plan.completedAt ?? plan.updatedAt);
}
