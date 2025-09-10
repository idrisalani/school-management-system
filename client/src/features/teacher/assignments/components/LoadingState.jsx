// client/src/features/teacher/components/assignments/components/LoadingState.jsx
import React from 'react';

const LoadingState = ({ type = 'card', count = 3 }) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div className="border rounded-lg p-4 animate-pulse">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        );
      
      case 'list':
        return (
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        );
      
      case 'grid':
        return (
          <div className="border rounded-lg p-6 animate-pulse">
            <div className="h-24 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {Array(count).fill(null).map((_, index) => (
        <div key={index}>{renderSkeleton()}</div>
      ))}
    </div>
  );
};

export { LoadingState };