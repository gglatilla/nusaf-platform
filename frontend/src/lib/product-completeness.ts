/**
 * Product completeness scoring for publishing readiness.
 *
 * Required fields (must be filled before publishing):
 * - Marketing Title
 * - Marketing Description
 * - Meta Title
 * - Meta Description
 * - At least 1 product image
 *
 * Optional fields (improve score, not required):
 * - Technical specifications (>=1 entry)
 * - At least 1 document
 */

export interface CompletenessField {
  key: string;
  label: string;
  met: boolean;
  required: boolean;
}

export interface CompletenessResult {
  /** Overall score 0-100 */
  score: number;
  /** Individual field statuses */
  fields: CompletenessField[];
  /** Whether all required fields are met (publishing allowed) */
  canPublish: boolean;
  /** Count of required fields that are satisfied */
  requiredMet: number;
  /** Total required fields */
  requiredTotal: number;
}

interface CompletenessInput {
  marketingTitle: string | null;
  marketingDescription: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  specifications: Record<string, string> | null;
  imageCount: number;
  documentCount: number;
}

interface FieldDefinition {
  key: string;
  label: string;
  required: boolean;
  weight: number;
  check: (input: CompletenessInput) => boolean;
}

const FIELD_DEFINITIONS: FieldDefinition[] = [
  {
    key: 'marketingTitle',
    label: 'Marketing Title',
    required: true,
    weight: 20,
    check: (input) => !!input.marketingTitle?.trim(),
  },
  {
    key: 'marketingDescription',
    label: 'Marketing Description',
    required: true,
    weight: 20,
    check: (input) => !!input.marketingDescription?.trim(),
  },
  {
    key: 'metaTitle',
    label: 'Meta Title',
    required: true,
    weight: 15,
    check: (input) => !!input.metaTitle?.trim(),
  },
  {
    key: 'metaDescription',
    label: 'Meta Description',
    required: true,
    weight: 15,
    check: (input) => !!input.metaDescription?.trim(),
  },
  {
    key: 'images',
    label: 'Product Image',
    required: true,
    weight: 15,
    check: (input) => input.imageCount >= 1,
  },
  {
    key: 'specifications',
    label: 'Technical Specifications',
    required: false,
    weight: 10,
    check: (input) =>
      !!input.specifications && Object.keys(input.specifications).length >= 1,
  },
  {
    key: 'documents',
    label: 'Product Document',
    required: false,
    weight: 5,
    check: (input) => input.documentCount >= 1,
  },
];

export function calculateCompleteness(input: CompletenessInput): CompletenessResult {
  let totalWeight = 0;
  let earnedWeight = 0;
  let requiredMet = 0;
  let requiredTotal = 0;

  const fields: CompletenessField[] = FIELD_DEFINITIONS.map((def) => {
    const met = def.check(input);
    totalWeight += def.weight;
    if (met) earnedWeight += def.weight;
    if (def.required) {
      requiredTotal++;
      if (met) requiredMet++;
    }
    return {
      key: def.key,
      label: def.label,
      met,
      required: def.required,
    };
  });

  const score = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;

  return {
    score,
    fields,
    canPublish: requiredMet === requiredTotal,
    requiredMet,
    requiredTotal,
  };
}
