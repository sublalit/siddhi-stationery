import React from 'react';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  badge?: string;
  badgeColor?: 'emerald' | 'amber' | 'red' | 'cyan';
  icon: LucideIcon;
  href?: string;
}

export default function MetricCard({
  title,
  value,
  subtitle,
  badge,
  badgeColor = 'cyan',
  icon: Icon,
  href,
}: MetricCardProps) {
  const badgeClasses = {
    emerald: 'text-emerald-600 bg-emerald-50',
    amber: 'text-amber-600 bg-amber-50',
    red: 'text-red-600 bg-red-50',
    cyan: 'text-[#00aeef] bg-cyan-50',
  }[badgeColor];

  const content = (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-[#00aeef]/60 transition-all relative overflow-hidden flex flex-col justify-between h-full group cursor-pointer">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide group-hover:text-[#00aeef] transition-colors">
            {title}
          </span>
          <div className="text-2xl lg:text-3xl font-bold text-slate-900 mt-1 group-hover:scale-105 origin-left transition-transform">
            {value}
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-cyan-50 text-[#00aeef] group-hover:bg-[#00aeef] group-hover:text-white transition-colors">
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {(subtitle || badge) && (
        <div className="mt-3 flex items-center justify-between text-xs">
          {badge && (
            <span className={`px-2 py-0.5 rounded-md font-semibold ${badgeClasses}`}>
              {badge}
            </span>
          )}
          {subtitle && <span className="text-slate-400 font-medium">{subtitle}</span>}
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href} className="block h-full">{content}</Link>;
  }

  return content;
}
