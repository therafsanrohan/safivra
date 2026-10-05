import React from 'react';
import { SalaryManagementDashboard } from './SalaryManagementDashboard';

// Named export used by router (alias for BudgetsPage → SalaryManagementDashboard)
export const SalaryBudgetPage: React.FC = () => {
  return (
    <div className="page-container pt-4 space-y-6">
      <SalaryManagementDashboard />
    </div>
  );
};
