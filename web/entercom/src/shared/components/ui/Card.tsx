
export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`px-6 py-5 border-b border-gray-100 ${className}`}>{children}</div>;
}

export function CardContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}

export function MetricCard({ title, value, icon, trend }: { title: string; value: string | number; icon?: React.ReactNode; trend?: string }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {trend && <p className="text-xs text-green-600 mt-2">{trend}</p>}
        </div>
        {icon && (
          <div className="h-12 w-12 rounded-xl bg-purple-50 text-ess-purple flex items-center justify-center">
            {icon}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
