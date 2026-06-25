import { createAsyncStorageKeyValueStore, type PersistentKeyValueStore } from '../storage/persistent-key-value-store';
import { PersistentJsonStore, migrateVersionedValue } from '../storage/persistent-json-store';
import { mobileStorageKeys } from '../storage/storage-keys';
import type { DivePlan } from '../types/dive-plan';
import type { DivePlanRepository } from './dive-plan-repository';
import { cloneDivePlan, compareDivePlans } from './local-dive-plan-repository';

export type PersistentDivePlanRepositoryOptions = {
  storage?: PersistentKeyValueStore;
  now?: () => number;
  initialPlans?: DivePlan[];
  onReadError?: (error: Error) => void;
};

export class PersistentDivePlanRepository implements DivePlanRepository {
  private readonly store: PersistentJsonStore<DivePlan[]>;
  private readonly now: () => number;

  constructor(options: PersistentDivePlanRepositoryOptions = {}) {
    const initialPlans = options.initialPlans ?? [];
    this.now = options.now ?? getCurrentTimestampSeconds;
    this.store = new PersistentJsonStore<DivePlan[]>({
      key: mobileStorageKeys.planbook,
      schemaVersion: 2,
      defaultValue: () => initialPlans.map(cloneDivePlan),
      migrate: envelope => migrateVersionedValue<DivePlan[]>(mobileStorageKeys.planbook, 2, envelope),
      storage: options.storage ?? createAsyncStorageKeyValueStore(),
      now: this.now,
      onReadError: options.onReadError,
    });
  }

  async list(): Promise<DivePlan[]> {
    return (await this.readPlans()).map(cloneDivePlan).sort((left, right) => compareDivePlans(left, right, this.now()));
  }

  async get(localId: string): Promise<DivePlan | undefined> {
    const plan = (await this.readPlans()).find(currentPlan => currentPlan.localId === localId);
    return plan ? cloneDivePlan(plan) : undefined;
  }

  async save(plan: DivePlan): Promise<DivePlan> {
    const plans = await this.readPlans();
    const nextPlans = plans.some(currentPlan => currentPlan.localId === plan.localId)
      ? plans.map(currentPlan => (currentPlan.localId === plan.localId ? cloneDivePlan(plan) : currentPlan))
      : [...plans, cloneDivePlan(plan)];

    await this.writePlans(nextPlans);
    return cloneDivePlan(plan);
  }

  async delete(localId: string): Promise<void> {
    const plans = await this.readPlans();
    await this.writePlans(plans.filter(plan => plan.localId !== localId));
  }

  private async readPlans(): Promise<DivePlan[]> {
    return (await this.store.read()).map(cloneDivePlan);
  }

  private async writePlans(plans: DivePlan[]): Promise<void> {
    await this.store.write(plans.map(cloneDivePlan).sort((left, right) => compareDivePlans(left, right, this.now())));
  }
}

export const createDefaultPersistentDivePlanRepository = (
  options: PersistentDivePlanRepositoryOptions = {},
): PersistentDivePlanRepository => new PersistentDivePlanRepository(options);

export const defaultPersistentDivePlanRepository = createDefaultPersistentDivePlanRepository();

function getCurrentTimestampSeconds(): number {
  return Date.now() / 1000;
}
