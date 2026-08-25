import React from 'react';
import type { LeaveRequest } from '../context/DatabaseContext';

interface SVGChartsProps {
  requests: LeaveRequest[];
}

export const SVGCharts: React.FC<SVGChartsProps> = ({ requests }) => {
  // 1. Group by Category
  const categories: Record<string, number> = {
    medical: 0,
    'family emergency': 0,
    personal: 0,
    other: 0,
  };
  
  requests.forEach(r => {
    if (categories[r.reason_category] !== undefined) {
      categories[r.reason_category]++;
    } else {
      categories.other++;
    }
  });

  const totalCatCount = Object.values(categories).reduce((a, b) => a + b, 0) || 1;

  // 2. Group by Department
  const depts: Record<string, number> = {};
  requests.forEach(r => {
    const dept = r.student?.department || 'Other';
    depts[dept] = (depts[dept] || 0) + 1;
  });

  const deptEntries = Object.entries(depts);
  const maxDeptCount = Math.max(...deptEntries.map(([, count]) => count), 1);

  // 3. Requests by Date (last 7 days)
  const last7Days: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    last7Days[dateStr] = 0;
  }

  requests.forEach(r => {
    if (last7Days[r.requested_date] !== undefined) {
      last7Days[r.requested_date]++;
    }
  });

  const dailyEntries = Object.entries(last7Days);
  const maxDailyCount = Math.max(...dailyEntries.map(([, count]) => count), 1);

  // Colors mapping
  const catColors: Record<string, string> = {
    medical: '#ef4444', // red
    'family emergency': '#f97316', // orange
    personal: '#0ea5e9', // sky
    other: '#64748b', // slate
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Chart 1: Daily Requests */}
      <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col">
        <h4 className="text-sm font-semibold text-slate-700 mb-4">Requests (Last 7 Days)</h4>
        <div className="h-48 flex items-end justify-between gap-2 px-2 pt-4">
          {dailyEntries.map(([date, count]) => {
            const heightPct = (count / maxDailyCount) * 80; // max 80% height
            const dayLabel = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
            return (
              <div key={date} className="flex flex-col items-center flex-1 group relative">
                {/* Tooltip */}
                <div className="absolute -top-8 bg-slate-800 text-white text-xs px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 font-medium">
                  {count} reqs
                </div>
                {/* Bar */}
                <div 
                  style={{ height: `${Math.max(heightPct, 5)}%` }} 
                  className={`w-full rounded-t-md transition-all duration-500 hover:opacity-85 ${count > 0 ? 'bg-sky-600' : 'bg-slate-100'}`}
                />
                <span className="text-[10px] text-slate-400 font-medium mt-2">{dayLabel}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chart 2: Reason Categories */}
      <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col">
        <h4 className="text-sm font-semibold text-slate-700 mb-4">Leave Categories</h4>
        <div className="flex items-center justify-around h-48">
          {/* Simple Donut SVG */}
          <div className="relative w-32 h-32">
            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" strokeWidth="4.2" />
              {(() => {
                let accumulatedPercent = 0;
                return Object.entries(categories).map(([cat, count]) => {
                  const percent = (count / totalCatCount) * 100;
                  if (percent === 0) return null;
                  const dashArray = `${percent} ${100 - percent}`;
                  const dashOffset = 100 - accumulatedPercent;
                  accumulatedPercent += percent;
                  return (
                    <circle
                      key={cat}
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="none"
                      stroke={catColors[cat]}
                      strokeWidth="4.2"
                      strokeDasharray={dashArray}
                      strokeDashoffset={dashOffset}
                    />
                  );
                });
              })()}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs font-semibold text-slate-400">Total</span>
              <span className="text-lg font-bold text-slate-700">{requests.length}</span>
            </div>
          </div>
          
          {/* Legend */}
          <div className="flex flex-col gap-2">
            {Object.entries(categories).map(([cat, count]) => (
              <div key={cat} className="flex items-center gap-2 text-xs">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: catColors[cat] }} />
                <span className="text-slate-500 capitalize">{cat}:</span>
                <span className="font-semibold text-slate-700">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chart 3: Department Breakdown */}
      <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col">
        <h4 className="text-sm font-semibold text-slate-700 mb-4">Department Requests</h4>
        <div className="h-48 flex flex-col justify-center gap-3 overflow-y-auto px-1">
          {deptEntries.length === 0 ? (
            <div className="text-center text-xs text-slate-400 py-8">No data available</div>
          ) : (
            deptEntries.map(([dept, count]) => {
              const widthPct = (count / maxDeptCount) * 100;
              return (
                <div key={dept} className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-600 truncate max-w-[150px]">{dept}</span>
                    <span className="text-slate-900 font-bold">{count}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
