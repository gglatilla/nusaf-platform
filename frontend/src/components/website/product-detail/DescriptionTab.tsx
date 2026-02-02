interface DescriptionTabProps {
  description: string | null;
}

export function DescriptionTab({ description }: DescriptionTabProps) {
  if (!description) {
    return (
      <div className="py-8 text-center">
        <p className="text-slate-500">No description available for this product.</p>
      </div>
    );
  }

  return (
    <div className="prose prose-slate max-w-none py-6">
      <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">{description}</div>
    </div>
  );
}
