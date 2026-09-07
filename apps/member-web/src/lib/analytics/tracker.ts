import { supabase } from '@/lib/supabase/client';

export async function trackFeatureUsage(featureName: string, actionType: string = 'view', metadata: Record<string, any> = {}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await (supabase.from('user_feature_logs') as any).insert({
      user_id: user.id,
      feature_name: featureName,
      action_type: actionType,
      metadata
    });
  } catch (err) {
    // Non-blocking analytics tracking
    console.debug('[FeatureTracker] Analytics log error:', err);
  }
}
