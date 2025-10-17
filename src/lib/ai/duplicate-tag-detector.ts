// ============================================================================
// AI-POWERED DUPLICATE TAG DETECTOR & MERGER
// ============================================================================
// Long-term solution for detecting and merging duplicate tags automatically
// ============================================================================

import OpenAI from 'openai';
import { Redis } from '@upstash/redis';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const redis = Redis.fromEnv();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface DuplicateGroup {
  canonicalTag: string;
  duplicateTags: string[];
  confidence: number;
  reasoning: string;
}

export interface TagMergeResult {
  merged: number;
  skipped: number;
  errors: string[];
  duplicateGroups: DuplicateGroup[];
}

export class DuplicateTagDetector {
  private companyId: string;

  constructor(companyId: string) {
    this.companyId = companyId;
  }

  /**
   * Detect potential duplicate tags using AI analysis
   */
  async detectDuplicates(): Promise<DuplicateGroup[]> {
    console.log('🔍 Detecting duplicate tags with AI...');

    // Get all company tags
    const { data: tags, error } = await supabase
      .from('tags')
      .select('id, name, normalized_name, category, usage_count')
      .eq('company_id', this.companyId)
      .eq('is_active', true)
      .order('usage_count', { ascending: false });

    if (error) {
      console.error('Error fetching tags:', error);
      throw error;
    }

    if (!tags || tags.length < 2) {
      console.log('Not enough tags to detect duplicates');
      return [];
    }

    console.log(`📊 Analyzing ${tags.length} tags for duplicates...`);

    // Check cache first
    const cacheKey = `duplicate_detection:${this.companyId}:${tags.length}`;
    const cached = await redis.get(cacheKey);
    if (cached && typeof cached === 'string') {
      try {
        console.log('♻️ Using cached duplicate detection results');
        return JSON.parse(cached);
      } catch (error) {
        console.warn('Invalid cached duplicate detection data, ignoring cache:', error);
      }
    }

    // Analyze tags in batches to avoid token limits
    const batchSize = 20;
    const allDuplicateGroups: DuplicateGroup[] = [];

    for (let i = 0; i < tags.length; i += batchSize) {
      const batch = tags.slice(i, i + batchSize);
      const batchDuplicates = await this.analyzeTagBatch(batch, tags);
      allDuplicateGroups.push(...batchDuplicates);
    }

    // Cache results for 24 hours
    await redis.set(cacheKey, JSON.stringify(allDuplicateGroups), { ex: 86400 });

    console.log(`✅ Found ${allDuplicateGroups.length} potential duplicate groups`);
    return allDuplicateGroups;
  }

  /**
   * Analyze a batch of tags for duplicates
   */
  private async analyzeTagBatch(
    batchTags: any[],
    allTags: any[]
  ): Promise<DuplicateGroup[]> {
    const tagNames = batchTags.map(t => t.normalized_name);
    const allTagNames = allTags.map(t => t.normalized_name);

    const prompt = `You are an expert at identifying duplicate tags in a product feedback system.

ANALYZE THESE TAGS FOR DUPLICATES:
${tagNames.map(t => `- "${t}"`).join('\n')}

ALL EXISTING TAGS IN SYSTEM (for context):
${allTagNames.join(', ')}

RULES:
1. Identify tags that are semantic duplicates (same meaning, different form)
2. Consider singular/plural variations (e.g., "bug" vs "bugs")
3. Consider different word forms (e.g., "automation" vs "automated")
4. Consider similar concepts (e.g., "accuracy" vs "accurate")
5. Consider formatting differences (e.g., "user-friendly" vs "user_friendly")
6. Consider tool name variations (e.g., "planswift" vs "planswift-tool")
7. Choose the most descriptive/canonical form as the primary tag
8. Be more aggressive - suggest merges with confidence > 0.7

            Use your AI knowledge to identify semantic duplicates, including:
            - Singular/plural variations
            - Different word forms (noun vs adjective vs verb)
            - Similar concepts with different wording
            - Formatting differences (underscores vs hyphens)
            - Tool name variations

Return JSON array of duplicate groups:
[
  {
    "canonicalTag": "accuracy",
    "duplicateTags": ["accurate"],
    "confidence": 0.85,
    "reasoning": "Same concept, different word forms (noun vs adjective)"
  }
]

Return groups with confidence > 0.7. Return empty array [] if no duplicates found.`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You identify duplicate tags for merging.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      });

      const aiResponse = response.choices[0].message.content || '{"groups": []}';
      const result = JSON.parse(aiResponse);
      
      return result.groups || [];
    } catch (error) {
      console.error('Error analyzing tag batch:', error);
      return [];
    }
  }

  /**
   * Merge duplicate tags based on AI recommendations
   */
  async mergeDuplicates(duplicateGroups: DuplicateGroup[]): Promise<TagMergeResult> {
    console.log(`🔄 Merging ${duplicateGroups.length} duplicate groups...`);

    let merged = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const group of duplicateGroups) {
      try {
        const result = await this.mergeTagGroup(group);
        if (result.success) {
          merged += result.mergedCount;
          console.log(`✅ Merged group: ${group.canonicalTag} (${result.mergedCount} tags)`);
        } else {
          skipped += 1;
          console.log(`⚠️ Skipped group: ${group.canonicalTag} - ${result.reason}`);
        }
      } catch (error) {
        const errorMsg = `Error merging group ${group.canonicalTag}: ${error}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    console.log(`🎉 Merge complete: ${merged} tags merged, ${skipped} groups skipped, ${errors.length} errors`);

    return {
      merged,
      skipped,
      errors,
      duplicateGroups,
    };
  }

  /**
   * Merge a single group of duplicate tags
   */
  private async mergeTagGroup(group: DuplicateGroup): Promise<{ success: boolean; mergedCount: number; reason?: string }> {
    // Find the canonical tag
    const { data: canonicalTag, error: canonicalError } = await supabase
      .from('tags')
      .select('id, usage_count')
      .eq('company_id', this.companyId)
      .eq('normalized_name', group.canonicalTag)
      .eq('is_active', true)
      .single();

    if (canonicalError || !canonicalTag) {
      return { success: false, mergedCount: 0, reason: `Canonical tag "${group.canonicalTag}" not found` };
    }

    let mergedCount = 0;

    // Merge each duplicate tag
    for (const duplicateName of group.duplicateTags) {
      const { data: duplicateTag, error: duplicateError } = await supabase
        .from('tags')
        .select('id, usage_count')
        .eq('company_id', this.companyId)
        .eq('normalized_name', duplicateName)
        .eq('is_active', true)
        .single();

      if (duplicateError || !duplicateTag) {
        console.warn(`Duplicate tag "${duplicateName}" not found, skipping`);
        continue;
      }

      // Move tag usages from duplicate to canonical
      const { error: updateError } = await supabase
        .from('tag_usages')
        .update({ tag_id: canonicalTag.id })
        .eq('tag_id', duplicateTag.id);

      if (updateError) {
        console.error(`Error updating tag usages for ${duplicateName}:`, updateError);
        continue;
      }

      // Update canonical tag usage count
      const { error: updateCountError } = await supabase
        .from('tags')
        .update({ 
          usage_count: canonicalTag.usage_count + duplicateTag.usage_count,
          updated_at: new Date().toISOString()
        })
        .eq('id', canonicalTag.id);

      if (updateCountError) {
        console.error(`Error updating canonical tag usage count:`, updateCountError);
        continue;
      }

      // Delete the duplicate tag
      const { error: deleteError } = await supabase
        .from('tags')
        .delete()
        .eq('id', duplicateTag.id);

      if (deleteError) {
        console.error(`Error deleting duplicate tag ${duplicateName}:`, deleteError);
        continue;
      }

      mergedCount++;
    }

    return { success: true, mergedCount };
  }

  /**
   * Run complete duplicate detection and merge process
   */
  async runDuplicateCleanup(): Promise<TagMergeResult> {
    console.log('🚀 Starting automated duplicate tag cleanup...');

    // Step 1: Detect duplicates
    const duplicateGroups = await this.detectDuplicates();

    if (duplicateGroups.length === 0) {
      console.log('✅ No duplicates found!');
      return {
        merged: 0,
        skipped: 0,
        errors: [],
        duplicateGroups: [],
      };
    }

    // Step 2: Show what will be merged
    console.log('\n📋 Duplicate groups to be merged:');
    duplicateGroups.forEach((group, index) => {
      console.log(`${index + 1}. ${group.canonicalTag} ← [${group.duplicateTags.join(', ')}] (confidence: ${group.confidence})`);
      console.log(`   Reasoning: ${group.reasoning}`);
    });

    // Step 3: Merge duplicates
    const result = await this.mergeDuplicates(duplicateGroups);

    // Step 4: Update tag statistics
    await this.updateTagStatistics();

    return result;
  }

  /**
   * Update tag statistics after merging
   */
  private async updateTagStatistics(): Promise<void> {
    console.log('📊 Updating tag statistics...');

    const { error } = await supabase.rpc('update_tag_statistics', {
      p_company_id: this.companyId
    });

    if (error) {
      console.error('Error updating tag statistics:', error);
    } else {
      console.log('✅ Tag statistics updated');
    }
  }
}

/**
 * Factory function to create duplicate detector
 */
export function createDuplicateTagDetector(companyId: string): DuplicateTagDetector {
  return new DuplicateTagDetector(companyId);
}
