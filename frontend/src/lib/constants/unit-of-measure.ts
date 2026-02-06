import type { UnitOfMeasure } from '@nusaf/shared';
import { UNIT_OF_MEASURE_LABELS } from '@nusaf/shared';

export type { UnitOfMeasure };
export { UNIT_OF_MEASURE_LABELS };

export const UOM_OPTIONS: UnitOfMeasure[] = ['EA', 'MTR', 'KG', 'SET', 'PR', 'ROL', 'BX'];

export const UOM_SELECT_OPTIONS: Array<{ value: UnitOfMeasure; label: string }> = UOM_OPTIONS.map(
  (uom) => ({ value: uom, label: UNIT_OF_MEASURE_LABELS[uom] })
);

export function getUomLabel(code: string): string {
  return UNIT_OF_MEASURE_LABELS[code as UnitOfMeasure] ?? code;
}
