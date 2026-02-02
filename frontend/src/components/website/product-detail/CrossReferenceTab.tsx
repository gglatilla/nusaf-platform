import { ArrowLeftRight, Check, AlertCircle } from 'lucide-react';
import { PublicCrossReference } from '@/lib/api';

interface CrossReferenceTabProps {
  crossReferences: PublicCrossReference[];
}

export function CrossReferenceTab({ crossReferences }: CrossReferenceTabProps) {
  if (crossReferences.length === 0) {
    return (
      <div className="py-8 text-center">
        <ArrowLeftRight className="h-12 w-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">No cross-references available for this product.</p>
        <p className="text-sm text-slate-400 mt-2">
          Cross-references help you find equivalent parts from other manufacturers.
        </p>
      </div>
    );
  }

  // Group by brand
  const byBrand = crossReferences.reduce(
    (acc, ref) => {
      const brand = ref.competitorBrand || 'Other';
      if (!acc[brand]) acc[brand] = [];
      acc[brand].push(ref);
      return acc;
    },
    {} as Record<string, PublicCrossReference[]>
  );

  const brands = Object.keys(byBrand).sort();

  return (
    <div className="py-6">
      <p className="text-sm text-slate-600 mb-4">
        This product is compatible with or replaces the following competitor parts:
      </p>

      <div className="space-y-6">
        {brands.map((brand) => (
          <div key={brand}>
            <h4 className="text-sm font-semibold text-slate-900 mb-2">{brand}</h4>
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Part Number
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Match Type
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {byBrand[brand].map((ref, index) => (
                    <tr key={index} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm font-mono text-slate-900">
                        {ref.competitorSku}
                      </td>
                      <td className="px-4 py-3">
                        {ref.isExact ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">
                            <Check className="h-3 w-3" />
                            Exact Match
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded">
                            <AlertCircle className="h-3 w-3" />
                            Equivalent
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {ref.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
