-- Seed Data for Safivra Real Wealth Intelligence - Economic Indicators
-- Safe to run multiple times (UPSERT logic).

BEGIN;

-- 1. Insert Base Economic Series
INSERT INTO public.economic_series (series_code, name, provider, base_period, currency_code, frequency, description)
VALUES 
  ('BGD_CPI', 'Bangladesh Consumer Price Index', 'Bangladesh Bureau of Statistics', '2005-06=100', 'BDT', 'monthly', 'Primary inflation gauge for BDT.'),
  ('US_CPI', 'US Consumer Price Index', 'Bureau of Labor Statistics', '1982-84=100', 'USD', 'monthly', 'Primary inflation gauge for USD.'),
  ('BGD_GDP_GROWTH', 'Bangladesh GDP Growth Rate', 'World Bank', 'Annual', 'BDT', 'yearly', 'Annual percentage growth rate of GDP at market prices based on constant local currency.'),
  ('BGD_POLICY_RATE', 'Bangladesh Bank Repo Rate', 'Bangladesh Bank', 'Current', 'BDT', 'monthly', 'Central Bank Policy Rate (Risk-free baseline)')
ON CONFLICT (series_code) DO UPDATE 
SET 
  name = EXCLUDED.name,
  provider = EXCLUDED.provider,
  description = EXCLUDED.description;

-- 2. Insert Observations (Mock/Baseline data for 2024/2025)
DO $$ 
DECLARE
  v_bgd_cpi UUID;
  v_us_cpi UUID;
  v_bgd_gdp UUID;
  v_bgd_rate UUID;
BEGIN
  SELECT id INTO v_bgd_cpi FROM public.economic_series WHERE series_code = 'BGD_CPI';
  SELECT id INTO v_us_cpi FROM public.economic_series WHERE series_code = 'US_CPI';
  SELECT id INTO v_bgd_gdp FROM public.economic_series WHERE series_code = 'BGD_GDP_GROWTH';
  SELECT id INTO v_bgd_rate FROM public.economic_series WHERE series_code = 'BGD_POLICY_RATE';

  -- BGD CPI
  INSERT INTO public.economic_observations (series_id, period_date, index_value, growth_rate) VALUES
    (v_bgd_cpi, '2024-01-01', 121.5, 0.095),
    (v_bgd_cpi, '2024-06-01', 125.2, 0.098),
    (v_bgd_cpi, '2025-01-01', 130.1, 0.092)
  ON CONFLICT (series_id, period_date) DO UPDATE SET index_value = EXCLUDED.index_value, growth_rate = EXCLUDED.growth_rate;

  -- BGD GDP Growth (Yearly)
  INSERT INTO public.economic_observations (series_id, period_date, index_value, growth_rate) VALUES
    (v_bgd_gdp, '2023-12-31', NULL, 0.058),
    (v_bgd_gdp, '2024-12-31', NULL, 0.056)
  ON CONFLICT (series_id, period_date) DO UPDATE SET growth_rate = EXCLUDED.growth_rate;

  -- BGD Policy Rate
  INSERT INTO public.economic_observations (series_id, period_date, index_value, growth_rate) VALUES
    (v_bgd_rate, '2024-01-01', NULL, 0.080),
    (v_bgd_rate, '2024-06-01', NULL, 0.085),
    (v_bgd_rate, '2025-01-01', NULL, 0.090)
  ON CONFLICT (series_id, period_date) DO UPDATE SET growth_rate = EXCLUDED.growth_rate;
END $$;

COMMIT;
