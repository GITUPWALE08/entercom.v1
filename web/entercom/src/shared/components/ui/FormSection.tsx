
export function FormSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </div>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
        {children}
      </div>
    </div>
  );
}
