import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders } from "./cors.ts";

interface TranslationRequest {
  targetLocale: string;
  strings: {
    text: string;
    hash: string;
    context?: string;
    namespace?: string;
  }[];
}

// Simulated Translation API - In production, swap with OpenAI/Google Cloud Translate.
// This function respects variables like {{amount}} and {{date}}
async function translateWithAI(
  texts: string[],
  targetLocale: string,
  glossary: Record<string, string>
): Promise<string[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  return texts.map(text => {
    // If it's a known short phrase, use a heuristic for the mock
    let translated = text;
    
    // Simple mock translations for demonstration
    if (targetLocale === 'bn') {
      if (text === 'Upcoming FDR Maturity') translated = 'আসন্ন FDR মেয়াদপূর্তি';
      else if (text === 'Your DPS installment of {{amount}} is due tomorrow.') translated = 'আপনার {{amount}} টাকার DPS কিস্তি আগামীকাল প্রদেয়।';
      else if (text === 'Dashboard') translated = 'ড্যাশবোর্ড';
      else if (text === 'Settings') translated = 'সেটিংস';
      else if (text === 'Real Wealth Intelligence') translated = 'বাস্তব সম্পদ বিশ্লেষণ';
      else if (text === 'Salary Management') translated = 'বেতন ব্যবস্থাপনা';
      else translated = `[BN] ${text}`; // Fallback visual identifier

      // Apply glossary replacements for financial correctness
      for (const [eng, bng] of Object.entries(glossary)) {
        // Simple case-insensitive replacement (careful not to break variables)
        const regex = new RegExp(`\\b${eng}\\b`, 'gi');
        translated = translated.replace(regex, bng);
      }
    }
    return translated;
  });
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { targetLocale, strings } = await req.json() as TranslationRequest;

    if (!targetLocale || !strings || !Array.isArray(strings)) {
      throw new Error('Invalid payload format. Expected { targetLocale, strings: [] }');
    }

    // Initialize Supabase Admin Client to bypass RLS for caching
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Fetch Glossary
    const { data: glossaryData } = await supabase
      .from('translation_glossary')
      .select('english_term, translated_term')
      .eq('target_locale', targetLocale)
      .eq('is_active', true);

    const glossary: Record<string, string> = {};
    if (glossaryData) {
      glossaryData.forEach(g => {
        glossary[g.english_term] = g.translated_term;
      });
    }

    // 2. Perform translation via external provider
    const textsToTranslate = strings.map(s => s.text);
    const translatedTexts = await translateWithAI(textsToTranslate, targetLocale, glossary);

    // 3. Prepare cache payload
    const cacheEntries = strings.map((s, index) => ({
      source_locale: 'en',
      target_locale: targetLocale,
      source_text: s.text,
      source_hash: s.hash,
      translated_text: translatedTexts[index],
      context: s.context || 'global',
      namespace: s.namespace || 'common',
      provider: 'mock_ai',
      glossary_version: 1,
    }));

    // 4. Save to Cache
    const { error: insertError } = await supabase
      .from('translation_cache')
      .upsert(cacheEntries, { 
        onConflict: 'source_locale, target_locale, source_hash, context',
        ignoreDuplicates: true 
      });

    if (insertError) {
      console.error('Failed to cache translations:', insertError);
      // We don't throw here. We still return the translations to the user.
    }

    // 5. Return mapped response
    const results = strings.map((s, idx) => ({
      hash: s.hash,
      translated_text: translatedTexts[idx],
    }));

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMsg }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
