// @ts-nocheck

// ENHANCED: components/dashboard/StatsCard.jsx
import React, { useState } from "react";
import { Card, CardContent } from "../../components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  MoreVertical,
  RefreshCw,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const StatsCard = ({
  title,
  value,
  trend,
  change,
  icon: Icon,
  color = "blue",
  loading = false,
  error = false,
  subtitle,
  onClick,
  onRefresh,
  showMenu = false,
  timeframe = "vs last month",
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    red: "bg-red-100 text-red-600",
    purple: "bg-purple-100 text-purple-600",
    orange: "bg-orange-100 text-orange-600",
    yellow: "bg-yellow-100 text-yellow-600",
  };

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="flex items-center justify-between">
              <div className="rounded-lg p-2 bg-gray-200 w-10 h-10"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-8 bg-gray-200 rounded w-20"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="rounded-lg p-2 bg-red-100 text-red-600">
              {Icon && <Icon className="h-6 w-6" />}
            </div>
            <button
              onClick={handleRefresh}
              className="text-gray-400 hover:text-gray-600"
              disabled={isRefreshing}
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
            </button>
          </div>
          <div className="mt-4 space-y-1">
            <h3 className="text-2xl font-bold text-red-600">Error</h3>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-xs text-red-500">Failed to load data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`transition-all duration-200 ${onClick ? "cursor-pointer hover:shadow-md hover:border-blue-300" : ""}`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className={`rounded-lg p-2 ${colorClasses[color]}`}>
            {Icon && <Icon className="h-6 w-6" />}
          </div>

          <div className="flex items-center space-x-2">
            {trend && change && (
              <div className="flex items-center space-x-1">
                {trend === "up" ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span
                  className={`text-sm font-medium ${trend === "up" ? "text-green-500" : "text-red-500"}`}
                >
                  {change}
                </span>
              </div>
            )}

            {showMenu && (
              <DropdownMenu>
                <DropdownMenuTrigger className="text-gray-400 hover:text-gray-600">
                  <MoreVertical className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onRefresh && (
                    <DropdownMenuItem
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                    >
                      <RefreshCw
                        className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
                      />
                      Refresh
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => console.log("View details")}>
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => console.log("Export data")}>
                    Export Data
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        <div className="mt-4 space-y-1">
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
          <p className="text-sm text-gray-500">{title}</p>
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
          {timeframe && trend && (
            <p className="text-xs text-gray-400">{timeframe}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsCard;
