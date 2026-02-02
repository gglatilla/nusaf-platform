interface SpecificationsTabProps {
  specifications: Record<string, string | number | boolean> | null;
}

export function SpecificationsTab({ specifications }: SpecificationsTabProps) {
  if (!specifications || Object.keys(specifications).length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-slate-500">No specifications available for this product.</p>
      </div>
    );
  }

  // Format the key for display (convert camelCase/snake_case to Title Case)
  const formatKey = (key: string): string => {
    return key
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  // Format the value for display
  const formatValue = (value: string | number | boolean): string => {
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    return String(value);
  };

  const entries = Object.entries(specifications);

  return (
    <div className="py-6">
      <table className="w-full">
        <tbody className="divide-y divide-slate-200">
          {entries.map(([key, value], index) => (
            <tr key={key} className={index % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
              <td className="px-4 py-3 text-sm font-medium text-slate-700 w-1/3">{formatKey(key)}</td>
              <td className="px-4 py-3 text-sm text-slate-600">{formatValue(value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
