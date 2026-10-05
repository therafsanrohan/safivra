import React from 'react';
import { SalaryManagementDashboard } from './SalaryManagementDashboard';

export const BudgetsPage: React.FC = () => {
  return (
    <div className="page-container pt-4 space-y-6">
      <SalaryManagementDashboard />
    </div>
  );
};
