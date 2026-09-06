-- Sprint 3: Zakat Calculations

-- 1. Calculations Table
CREATE TABLE IF NOT EXISTS public.zakat_calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rule_set_id UUID NOT NULL REFERENCES public.zakat_rule_sets(id),
    rate_snapshot_id UUID NOT NULL REFERENCES public.zakat_rate_snapshots(id),
    status TEXT NOT NULL CHECK (status IN ('draft', 'confirmed_snapshot', 'paid')) DEFAULT 'draft',
    zakat_anniversary_date DATE,
    total_assets NUMERIC NOT NULL DEFAULT 0,
    total_deductions NUMERIC NOT NULL DEFAULT 0,
    net_zakatable_wealth NUMERIC NOT NULL DEFAULT 0,
    is_eligible BOOLEAN NOT NULL DEFAULT false,
    estimated_zakat_amount NUMERIC NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'BDT',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_zakat_calculations_user_id ON public.zakat_calculations(user_id);
CREATE INDEX idx_zakat_calculations_status ON public.zakat_calculations(status);

-- 2. Calculation Items Table (Details of the calculation)
CREATE TABLE IF NOT EXISTS public.zakat_calculation_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    calculation_id UUID NOT NULL REFERENCES public.zakat_calculations(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL CHECK (item_type IN ('cash', 'gold', 'silver', 'business', 'investment', 'liability', 'other')),
    source_table TEXT,
    source_id UUID,
    amount NUMERIC NOT NULL,
    currency TEXT NOT NULL DEFAULT 'BDT',
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_zakat_calculation_items_calc_id ON public.zakat_calculation_items(calculation_id);

-- Enable RLS
ALTER TABLE public.zakat_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zakat_calculation_items ENABLE ROW LEVEL SECURITY;

-- Policies for Calculations
CREATE POLICY "Users can manage their own calculations"
    ON public.zakat_calculations
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Policies for Calculation Items
CREATE POLICY "Users can manage their own calculation items"
    ON public.zakat_calculation_items
    FOR ALL
    TO authenticated
    USING (calculation_id IN (SELECT id FROM public.zakat_calculations WHERE user_id = auth.uid()))
    WITH CHECK (calculation_id IN (SELECT id FROM public.zakat_calculations WHERE user_id = auth.uid()));

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_zakat_calculations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_zakat_calculations_updated_at
    BEFORE UPDATE ON public.zakat_calculations
    FOR EACH ROW
    EXECUTE FUNCTION update_zakat_calculations_updated_at();
