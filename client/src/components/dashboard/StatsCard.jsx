// src/components/dashboard/StatsCard.jsx
import React from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatsCard = ({ title, value, trend, change, icon: Icon, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600'
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className={`rounded-lg p-2 ${colorClasses[color]}`}>
            {Icon && <Icon className="h-6 w-6" />}
          </div>
          {trend && (
            <div className="flex items-center space-x-1">
              {trend === 'up' ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className={trend === 'up' ? 'text-green-500' : 'text-red-500'}>
                {change}
              </span>
            </div>
          )}
        </div>
        <div className="mt-4 space-y-1">
          <h3 className="text-2xl font-bold">{value}</h3>
          <p className="text-sm text-gray-500">{title}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsCard;