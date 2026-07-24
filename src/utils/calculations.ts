import type { Account, Transaction, DebtItem, UserProfile, FIREProjectionPoint, DebtPayoffSchedulePoint } from '../types/finance';

// 1. NET WORTH CALCULATIONS
export function calculateNetWorth(accounts: Account[]) {
  const assets = accounts
    .filter((a) => !a.isLiability)
    .reduce((sum, a) => sum + a.balance, 0);

  const liabilities = accounts
    .filter((a) => a.isLiability)
    .reduce((sum, a) => sum + a.balance, 0);

  return {
    assets,
    liabilities,
    netWorth: assets - liabilities,
  };
}

// 2. MONTHLY CASHFLOW CALCULATIONS
export function calculateMonthlyCashflow(transactions: Transaction[]) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyTransactions = transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const income = monthlyTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = monthlyTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netSavings = income - expenses;
  const savingsRate = income > 0 ? (netSavings / income) * 100 : 0;

  return {
    income,
    expenses,
    netSavings,
    savingsRate: Math.max(0, savingsRate),
  };
}

// 3. FIRE (FINANCIAL INDEPENDENCE) CALCULATIONS
export function calculateFIRETarget(profile: UserProfile, monthlyExpenses: number): {
  targetPortfolio: number;
  annualExpenses: number;
  yearsToFIRE: number;
  fireAge: number;
  monthlyInvestmentNeeded: number;
} {
  const annualExpenses = monthlyExpenses * 12;
  const swr = profile.annualWithdrawalRate / 100; // e.g. 0.04
  const targetPortfolio = swr > 0 ? annualExpenses / swr : annualExpenses * 25;

  const netRealReturn = (profile.expectedReturnRate - profile.inflationRate) / 100; // e.g. 0.055
  const yearsAvailable = Math.max(1, profile.targetFireAge - profile.currentAge);

  // Formula for Future Value of Series PMT: FV = PMT * (((1 + r)^n - 1) / r)
  // PMT = FV * r / ((1 + r)^n - 1)
  const monthlyRate = netRealReturn / 12;
  const totalMonths = yearsAvailable * 12;

  let monthlyInvestmentNeeded = 0;
  if (monthlyRate > 0 && totalMonths > 0) {
    const fvFactor = (Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate;
    monthlyInvestmentNeeded = targetPortfolio / fvFactor;
  } else {
    monthlyInvestmentNeeded = targetPortfolio / (totalMonths || 1);
  }

  return {
    targetPortfolio,
    annualExpenses,
    yearsToFIRE: yearsAvailable,
    fireAge: profile.targetFireAge,
    monthlyInvestmentNeeded: Math.max(0, monthlyInvestmentNeeded),
  };
}

export function generateFIREProjection(
  profile: UserProfile,
  currentInvestments: number,
  monthlyContribution: number,
  monthlyExpenses: number
): FIREProjectionPoint[] {
  const { targetPortfolio } = calculateFIRETarget(profile, monthlyExpenses);
  const netRealReturn = (profile.expectedReturnRate - profile.inflationRate) / 100;
  const startYear = new Date().getFullYear();
  const points: FIREProjectionPoint[] = [];

  let currentPortfolio = currentInvestments;
  let totalContributions = currentInvestments;
  const maxYears = Math.min(45, Math.max(10, profile.targetFireAge - profile.currentAge + 5));

  for (let year = 0; year <= maxYears; year++) {
    const age = profile.currentAge + year;
    const yearNumber = startYear + year;

    points.push({
      age,
      year: yearNumber,
      portfolioValue: Math.round(currentPortfolio),
      fireTarget: Math.round(targetPortfolio),
      totalContributions: Math.round(totalContributions),
      totalInterestEarned: Math.round(Math.max(0, currentPortfolio - totalContributions)),
    });

    // Grow portfolio for next year
    const yearlyInterest = currentPortfolio * netRealReturn;
    const yearlyContribution = monthlyContribution * 12;

    currentPortfolio = currentPortfolio + yearlyInterest + yearlyContribution;
    totalContributions += yearlyContribution;
  }

  return points;
}

// 4. DEBT PAYOFF COMPARISON (AVALANCHE VS SNOWBALL)
export function simulateDebtPayoff(
  debts: DebtItem[],
  extraMonthlyPayment: number
): {
  avalancheMonths: number;
  snowballMonths: number;
  avalancheTotalInterest: number;
  snowballTotalInterest: number;
  interestSaved: number;
  monthsSaved: number;
  schedule: DebtPayoffSchedulePoint[];
} {
  if (debts.length === 0) {
    return {
      avalancheMonths: 0,
      snowballMonths: 0,
      avalancheTotalInterest: 0,
      snowballTotalInterest: 0,
      interestSaved: 0,
      monthsSaved: 0,
      schedule: [],
    };
  }

  // Simulation runner function
  const runSimulation = (strategy: 'avalanche' | 'snowball') => {
    let items = debts.map((d) => ({
      ...d,
      currentBal: d.balance,
    }));

    let totalInterestPaid = 0;
    let months = 0;
    const maxMonths = 360; // 30 year safety cap
    const monthlyHistory: { month: number; remaining: number; interestPaid: number }[] = [];

    while (items.some((d) => d.currentBal > 0) && months < maxMonths) {
      months++;

      // Sort remaining debts
      if (strategy === 'avalanche') {
        // Highest APR first
        items.sort((a, b) => b.apr - a.apr);
      } else {
        // Smallest Balance first
        items.sort((a, b) => a.currentBal - b.currentBal);
      }

      let extraAvailable = extraMonthlyPayment;
      let monthInterest = 0;

      // 1. Accrue monthly interest & pay minimums
      for (const d of items) {
        if (d.currentBal > 0) {
          const monthlyRate = d.apr / 100 / 12;
          const interest = d.currentBal * monthlyRate;
          d.currentBal += interest;
          monthInterest += interest;
          totalInterestPaid += interest;

          // Pay minimum
          const payment = Math.min(d.currentBal, d.minimumPayment);
          d.currentBal -= payment;
        }
      }

      // 2. Apply extra payment to target debt
      for (const d of items) {
        if (d.currentBal > 0 && extraAvailable > 0) {
          const extraPay = Math.min(d.currentBal, extraAvailable);
          d.currentBal -= extraPay;
          extraAvailable -= extraPay;
        }
      }

      const totalRemaining = items.reduce((sum, i) => sum + Math.max(0, i.currentBal), 0);
      monthlyHistory.push({
        month: months,
        remaining: Math.round(totalRemaining),
        interestPaid: Math.round(totalInterestPaid),
      });
    }

    return { months, totalInterestPaid, monthlyHistory };
  };

  const avalanche = runSimulation('avalanche');
  const snowball = runSimulation('snowball');

  // Combine monthly schedule points for chart visualization
  const maxMonthCount = Math.max(avalanche.monthlyHistory.length, snowball.monthlyHistory.length);
  const schedule: DebtPayoffSchedulePoint[] = [];

  const startDate = new Date();

  for (let m = 1; m <= Math.min(60, maxMonthCount); m++) {
    const d = new Date(startDate);
    d.setMonth(d.getMonth() + m);
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

    const avPoint = avalanche.monthlyHistory[m - 1] || avalanche.monthlyHistory[avalanche.monthlyHistory.length - 1] || { remaining: 0, interestPaid: avalanche.totalInterestPaid };
    const sbPoint = snowball.monthlyHistory[m - 1] || snowball.monthlyHistory[snowball.monthlyHistory.length - 1] || { remaining: 0, interestPaid: snowball.totalInterestPaid };

    schedule.push({
      month: m,
      dateStr,
      avalancheRemaining: avPoint.remaining,
      snowballRemaining: sbPoint.remaining,
      avalancheInterestPaid: avPoint.interestPaid,
      snowballInterestPaid: sbPoint.interestPaid,
    });
  }

  return {
    avalancheMonths: avalanche.months,
    snowballMonths: snowball.months,
    avalancheTotalInterest: avalanche.totalInterestPaid,
    snowballTotalInterest: snowball.totalInterestPaid,
    interestSaved: Math.max(0, snowball.totalInterestPaid - avalanche.totalInterestPaid),
    monthsSaved: Math.max(0, snowball.months - avalanche.months),
    schedule,
  };
}

// 5. FINANCIAL HEALTH & WEALTH READINESS INDEX SCORE (0-100)
export function calculateWealthReadinessScore(
  netWorth: number,
  monthlyExpenses: number,
  liquidAssets: number,
  totalLiabilities: number,
  savingsRate: number,
  literacyScore: number
): {
  totalScore: number;
  emergencyFundMonths: number;
  tier: 'Vulnerable' | 'Building' | 'Accelerating' | 'Wealth Ready' | 'Financial Freedom';
  breakdown: {
    emergencyFundScore: number; // Max 25
    savingsRateScore: number;   // Max 25
    debtRatioScore: number;     // Max 25
    literacyScoreComponent: number; // Max 25
  };
} {
  // Emergency Fund Months
  const emergencyFundMonths = monthlyExpenses > 0 ? liquidAssets / monthlyExpenses : 6;
  const emergencyFundScore = Math.min(25, (emergencyFundMonths / 6) * 25);

  // Savings Rate Score (Target >= 20%)
  const savingsRateScore = Math.min(25, (savingsRate / 20) * 25);

  // Debt-to-Asset ratio score (Lower liabilities relative to assets)
  const debtRatio = netWorth > 0 ? (totalLiabilities / (netWorth + totalLiabilities)) : 1;
  const debtRatioScore = Math.max(0, 25 - (debtRatio * 25));

  // Literacy Score component
  const literacyScoreComponent = Math.min(25, (literacyScore / 100) * 25);

  const totalScore = Math.round(emergencyFundScore + savingsRateScore + debtRatioScore + literacyScoreComponent);

  let tier: 'Vulnerable' | 'Building' | 'Accelerating' | 'Wealth Ready' | 'Financial Freedom' = 'Building';
  if (totalScore < 40) tier = 'Vulnerable';
  else if (totalScore < 60) tier = 'Building';
  else if (totalScore < 80) tier = 'Accelerating';
  else if (totalScore < 95) tier = 'Wealth Ready';
  else tier = 'Financial Freedom';

  return {
    totalScore,
    emergencyFundMonths: parseFloat(emergencyFundMonths.toFixed(1)),
    tier,
    breakdown: {
      emergencyFundScore: Math.round(emergencyFundScore),
      savingsRateScore: Math.round(savingsRateScore),
      debtRatioScore: Math.round(debtRatioScore),
      literacyScoreComponent: Math.round(literacyScoreComponent),
    },
  };
}
