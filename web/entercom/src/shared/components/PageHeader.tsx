import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ElementType;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, icon: Icon, children }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="p-2 bg-ess-purple/10 text-ess-purple rounded-lg">
            <Icon size={24} />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {description && <p className="text-sm text-gray-500">{description}</p>}
        </div>
      </div>
      {children && <div>{children}</div>}
    </div>
  );
}
