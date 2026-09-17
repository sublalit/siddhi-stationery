import React from 'react';
import { TrendingUp, ArrowDownRight, ArrowUpRight, Activity } from 'lucide-react';

interface ActivityItem {
  _id: string;
  productName: string;
  sku: string;
  type: string;
  quantity: number;
  reason: string;
  timestamp: string;
}

interface ActivityLogProps {
  activities: ActivityItem[];
}

export default function ActivityLog({ activities }: ActivityLogProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
        <Activity className="w-5 h-5 text-[#00aeef]" />
        <h2 className="text-base font-bold text-slate-900">Recent Activity</h2>
      </div>

      {activities.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-8 text-slate-400 text-xs">
          <TrendingUp className="w-8 h-8 mb-2 opacity-50" />
          No recent inventory transactions logged yet.
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto max-h-[320px] pr-1">
          {activities.map((act) => {
            const isStockOut = act.type === 'Stock Out';
            return (
              <div
                key={act._id}
                className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      isStockOut ? 'bg-red-500' : 'bg-emerald-500'
                    }`}
                  />
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{act.type}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {act.productName} ({act.reason})
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`text-xs font-bold flex items-center justify-end gap-0.5 ${
                      isStockOut ? 'text-red-600' : 'text-emerald-600'
                    }`}
                  >
                    {isStockOut ? '-' : '+'}
                    {act.quantity}
                    {isStockOut ? (
                      <ArrowDownRight className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    )}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">{act.timestamp}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
