import React from 'react';
import { WorkflowResolution } from './WorkflowResolver';

interface WorkflowBannerProps {
  resolution: WorkflowResolution;
  onAction?: (actionId: string) => void;
  isProcessing?: boolean;
}

export const WorkflowBanner: React.FC<WorkflowBannerProps> = ({ resolution, onAction, isProcessing }) => {
  const { title, description, severity, ownerRole, primaryCTA, secondaryCTAs, blockingMessage } = resolution;

  const bgColors = {
    info: 'bg-blue-50 border-blue-200',
    warning: 'bg-yellow-50 border-yellow-200',
    error: 'bg-red-50 border-red-200',
    success: 'bg-green-50 border-green-200',
    default: 'bg-gray-50 border-gray-200'
  };

  const textColors = {
    info: 'text-blue-800',
    warning: 'text-yellow-900',
    error: 'text-red-900',
    success: 'text-green-800',
    default: 'text-gray-800'
  };

  const iconColors = {
    info: 'text-blue-500',
    warning: 'text-yellow-500',
    error: 'text-red-500',
    success: 'text-green-500',
    default: 'text-gray-500'
  };

  return (
    <div className={`p-6 rounded-2xl border ${bgColors[severity]} relative overflow-hidden shadow-sm mb-8`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className={`text-xl font-bold ${textColors[severity]}`}>{title}</h2>
            {ownerRole !== 'NONE' && (
              <span className={`px-2 py-1 text-xs font-semibold rounded-full bg-white/60 ${textColors[severity]}`}>
                Waiting on {ownerRole}
              </span>
            )}
          </div>
          <p className={`${textColors[severity]} opacity-90 max-w-2xl`}>{description}</p>
          {blockingMessage && (
            <p className="text-red-600 text-sm mt-2 font-medium flex items-center gap-1">
              ⚠️ {blockingMessage}
            </p>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {secondaryCTAs.map(cta => (
            <button
              key={cta.id}
              onClick={() => onAction && onAction(cta.id)}
              disabled={isProcessing || !!cta.disabledReason}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors 
                ${cta.variant === 'danger' ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-white text-gray-700 hover:bg-gray-100'} 
                disabled:opacity-50`}
              title={cta.disabledReason}
            >
              {cta.label}
            </button>
          ))}
          {primaryCTA && (
            <button
              onClick={() => onAction && onAction(primaryCTA.id)}
              disabled={isProcessing || !!primaryCTA.disabledReason}
              className={`px-6 py-2.5 text-sm font-semibold rounded-lg shadow-sm transition-colors text-white
                ${primaryCTA.disabledReason ? 'bg-gray-400 cursor-not-allowed' : 'bg-ess-purple hover:bg-ess-darkPurple'}
              `}
              title={primaryCTA.disabledReason}
            >
              {isProcessing ? 'Processing...' : primaryCTA.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
