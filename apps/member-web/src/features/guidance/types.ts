/**
 * Shared TypeScript types for the Financial Guidance & What-if Planner feature.
 * All amounts are strings (Decimal-serialised from Python) to preserve precision.
 */

export interface CategoryConstraint {
  category_id: string;
  category_name: string;
  current_allocation: string;
  already_spent: string;
  min_allocation: string;
  max_reduction_override: string | null;
  is_essential: boolean;
  is_flexible: boolean;
}

export interface ProposedChange {
  change_type: 'reduce_category' | 'one_time_purchase' | 'one_time_saving';
  category_id: string | null;
  new_allocation: string | null;
  one_time_amount: string | null;
  label: string;
  is_user_entered: boolean;
}

export interface ScenarioRequest {
  currency: string;
  planning_days: number;
  available_funds: string;
  total_commitments: string;
  total_protected_funds: string;
  eligible_7day_forecast: string | null;
  category_constraints: CategoryConstraint[];
  proposed_changes: ProposedChange[];
}

export interface ScenarioOption {
  option_id: string;
  label: string;
  description: string;
  changes: ProposedChange[];
  total_reduction: string;
  projected_remaining: string;
  why_this: string;
  assumptions: string[];
}

export interface ScenarioResponse {
  owner_id: string;
  currency: string;
  planning_days: number;
  snapshot_revision: string;
  service_available: boolean;
  starting_assumptions: {
    available_funds: string;
    total_commitments: string;
    total_protected_funds: string;
    net_available: string;
    forecast_basis: 'historical_baseline' | 'insufficient_data' | 'none';
    forecast_label: string;
  };
  options: ScenarioOption[];
  remaining_gap: string | null;
  limitations: string[];
  calculation_version: string;
}

export type GuidanceLoadState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: ScenarioResponse; timestamp: number }
  | { status: 'error'; message: string }
  | { status: 'unavailable'; limitations: string[] };
