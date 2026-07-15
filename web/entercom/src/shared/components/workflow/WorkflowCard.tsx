import React from 'react';
import { StatusBadge } from '../ui/StatusBadge';

interface WorkflowCardProps {
  title: string;
  status: string;
  summary: React.ReactNode;
  ownerRole?: string;
  nextAction?: string;
  priority?: string;
  linkedResource?: React.ReactNode;
}

export const WorkflowCard: React.FC<WorkflowCardProps> = ({
  title,
  status,
  summary,
  ownerRole,
  nextAction,
  priority,
  linkedResource
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{title}</h1>
          <div className="flex items-center gap-3 mt-3">
            <StatusBadge status={status} />
            {priority && (
              <span className={`px-3 py-1 rounded text-sm font-medium capitalize
                ${priority === 'urgent' || priority === 'emergency' ? 'bg-red-100 text-red-800' :
                  priority === 'high' ? 'bg-orange-100 text-orange-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                {priority} Priority
              </span>
            )}
          </div>
        </div>
        {linkedResource && (
          <div className="text-right">
            {linkedResource}
          </div>
        )}
      </div>

      <div className="prose prose-sm text-gray-600 mb-8 whitespace-pre-wrap max-w-none">
        {summary}
      </div>

      <div className="flex flex-wrap gap-6 border-t border-gray-100 pt-6">
        {ownerRole && (
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Current Owner</h3>
            <p className="text-sm font-medium text-gray-900">{ownerRole}</p>
          </div>
        )}
        {nextAction && (
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Next Action</h3>
            <p className="text-sm font-medium text-gray-900">{nextAction}</p>
          </div>
        )}
      </div>
    </div>
  );
};
