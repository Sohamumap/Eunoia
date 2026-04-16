import React from 'react';
import { Flame, Clock, TrendingUp, Shuffle } from 'lucide-react';

/**
 * Reddit-style sort tabs (Hot, New, Top, Controversial)
 */
export default function SortTabs({ activeSort = 'hot', onSortChange }) {
  const tabs = [
    { id: 'hot', label: 'Hot', icon: Flame },
    { id: 'new', label: 'New', icon: Clock },
    { id: 'top', label: 'Top', icon: TrendingUp },
    { id: 'controversial', label: 'Controversial', icon: Shuffle }
  ];

  return (
    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-full p-1">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeSort === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => onSortChange(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-sans text-xs font-medium transition-all ${
              isActive
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Icon size={14} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
