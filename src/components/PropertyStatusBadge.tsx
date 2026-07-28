import React from 'react';
import { ListingStatus } from '../types';
import { CheckCircle2, Sparkles, Check, AlertCircle, Clock } from 'lucide-react';

interface PropertyStatusBadgeProps {
  status?: ListingStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const STATUS_CONFIG: Record<
  ListingStatus,
  { label: string; bgClass: string; textClass: string; borderClass: string; dotClass: string; description: string }
> = {
  available: {
    label: 'Available',
    bgClass: 'bg-emerald-50/90',
    textClass: 'text-emerald-800',
    borderClass: 'border-emerald-200/80',
    dotClass: 'bg-emerald-500',
    description: 'Property is currently vacant and taking new tenant applications.'
  },
  new: {
    label: 'New',
    bgClass: 'bg-teal-50/90',
    textClass: 'text-teal-800',
    borderClass: 'border-teal-200/80',
    dotClass: 'bg-teal-500',
    description: 'Recently published listing.'
  },
  rented: {
    label: 'Rented',
    bgClass: 'bg-blue-50/90',
    textClass: 'text-blue-800',
    borderClass: 'border-blue-200/80',
    dotClass: 'bg-blue-500',
    description: 'Occupied under active lease agreement.'
  },
  unavailable: {
    label: 'Unavailable',
    bgClass: 'bg-slate-100/90',
    textClass: 'text-slate-700',
    borderClass: 'border-slate-300/80',
    dotClass: 'bg-slate-400',
    description: 'Temporarily offline or undergoing maintenance.'
  },
  pending_review: {
    label: 'Pending Review',
    bgClass: 'bg-amber-50/90',
    textClass: 'text-amber-800',
    borderClass: 'border-amber-200/80',
    dotClass: 'bg-amber-500',
    description: 'Under administrative review prior to going live.'
  }
};

export default function PropertyStatusBadge({ status = 'available', size = 'sm', className = '' }: PropertyStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.available;

  const renderIcon = () => {
    switch (status) {
      case 'new':
        return <Sparkles className="w-3 h-3 text-teal-600 shrink-0" />;
      case 'rented':
        return <Check className="w-3 h-3 text-blue-600 shrink-0 stroke-[3]" />;
      case 'unavailable':
        return <AlertCircle className="w-3 h-3 text-slate-500 shrink-0" />;
      case 'pending_review':
        return <Clock className="w-3 h-3 text-amber-600 shrink-0" />;
      case 'available':
      default:
        return <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />;
    }
  };

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-xs px-3 py-1.5 gap-2 font-black'
  };

  return (
    <span
      className={`inline-flex items-center font-bold rounded-full border shadow-2xs backdrop-blur-xs transition-all ${config.bgClass} ${config.textClass} ${config.borderClass} ${sizeClasses[size]} ${className}`}
      title={config.description}
    >
      {renderIcon()}
      <span>{config.label}</span>
    </span>
  );
}
