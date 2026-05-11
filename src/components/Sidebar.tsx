import React, { useState, useEffect } from 'react';
import { ShieldCheck, X, Search, ChevronUp, ChevronDown, Settings2, Check } from 'lucide-react';
import { NavItem, defaultNavItems, TabId } from '../config/navigation';

interface SidebarProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  macrosCount: number;
}

export function Sidebar({ 
  activeTab, 
  setActiveTab, 
  isSidebarOpen, 
  setIsSidebarOpen, 
  macrosCount 
}: SidebarProps) {
  const [navItems, setNavItems] = useState<NavItem[]>(defaultNavItems);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCustomizeMode, setIsCustomizeMode] = useState(false);

  // Load custom order from local storage
  useEffect(() => {
    try {
      const savedOrder = localStorage.getItem('sidebarOrder');
      if (savedOrder) {
        const orderIds = JSON.parse(savedOrder) as TabId[];
        const orderedItems = [...defaultNavItems].sort((a, b) => {
          const indexA = orderIds.indexOf(a.id);
          const indexB = orderIds.indexOf(b.id);
          // If an item is not in the saved order, push it to the end
          if (indexA === -1) return 1;
          if (indexB === -1) return -1;
          return indexA - indexB;
        });
        setNavItems(orderedItems);
      }
    } catch {}
  }, []);

  const saveOrder = (items: NavItem[]) => {
    const orderIds = items.map(item => item.id);
    localStorage.setItem('sidebarOrder', JSON.stringify(orderIds));
    setNavItems(items);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const newItems = [...navItems];
      [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
      saveOrder(newItems);
    } else if (direction === 'down' && index < navItems.length - 1) {
      const newItems = [...navItems];
      [newItems[index + 1], newItems[index]] = [newItems[index], newItems[index + 1]];
      saveOrder(newItems);
    }
  };

  const filteredItems = navItems.filter(item => 
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-20 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 w-64 bg-white border-r border-slate-200 flex flex-col z-30 transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary-600 rounded-lg shadow-sm">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-violet-600 flex items-center gap-2">
              CS Agent
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary-100 text-primary-700 uppercase tracking-wider">v1.6</span>
            </h1>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 text-slate-400 hover:text-slate-600 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar - only visible when not customizing */}
        {!isCustomizeMode && (
          <div className="p-4 border-b border-slate-100 shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              />
            </div>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {filteredItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            // Allow showing the macro count
            const displayLabel = item.id === 'macros' ? `${item.label} (${macrosCount})` : item.label;

            return (
              <div key={item.id} className="flex items-center gap-1 group">
                <button
                  onClick={() => {
                    setActiveTab(item.id);
                    if (window.innerWidth < 1024) setIsSidebarOpen(false);
                  }}
                  className={`flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive && !isCustomizeMode
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  } ${isCustomizeMode ? 'opacity-70 pointer-events-none' : ''}`}
                >
                  <Icon className={`w-5 h-5 ${isActive && !isCustomizeMode ? 'text-primary-600' : 'text-slate-400'}`} />
                  <span className="truncate">{displayLabel}</span>
                </button>

                {isCustomizeMode && !searchQuery && (
                   <div className="flex flex-col gap-0 items-center justify-center -space-y-1 px-1">
                    <button 
                      onClick={() => moveItem(index, 'up')}
                      disabled={index === 0}
                      className="p-1 text-slate-400 hover:text-primary-600 disabled:opacity-30 disabled:hover:text-slate-400"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => moveItem(index, 'down')}
                      disabled={index === filteredItems.length - 1}
                      className="p-1 text-slate-400 hover:text-primary-600 disabled:opacity-30 disabled:hover:text-slate-400"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          {filteredItems.length === 0 && (
            <div className="text-center py-6 text-sm text-slate-500">
              No tools found matching "{searchQuery}"
            </div>
          )}
        </nav>

        {/* Customize Bar */}
        <div className="p-4 border-t border-slate-200 shrink-0 bg-slate-50/50">
          <button
            onClick={() => {
              setIsCustomizeMode(!isCustomizeMode);
              if (!isCustomizeMode) setSearchQuery(''); // Clear search when entering customize mode
            }}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isCustomizeMode 
                ? 'bg-primary-600 text-white hover:bg-primary-700' 
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {isCustomizeMode ? (
              <>
                <Check className="w-4 h-4" />
                Done Customizing
              </>
            ) : (
              <>
                <Settings2 className="w-4 h-4" />
                Customize Menu
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
