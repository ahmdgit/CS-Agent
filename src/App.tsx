import React, { useState, Suspense, lazy } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { TutorialModal } from './components/TutorialModal';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CommandPalette } from './components/CommandPalette';
import { useAppContext } from './contexts/AppContext';
import { MessageSquarePlus, FolderOpen, Globe2, ShieldCheck, HelpCircle, Link as LinkIcon, Info, LayoutTemplate, AlertCircle, SpellCheck, LayoutDashboard, Menu, X, Lock, Map, Database, Mic, LogOut, Calculator, Save, Waypoints, XCircle, RotateCcw, RefreshCw, Coffee, Search, BookOpen } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { Modal } from './components/ui/Modal';
import { Button } from './components/ui/Button';

import { useAuth } from './hooks/useAuth';
import { useUpcomingBreak } from './hooks/useUpcomingBreak';
import { useAppReset } from './hooks/useAppReset';
import { db } from './lib/firebase';

const DashboardTab = lazy(() => import('./components/DashboardTab').then(m => ({ default: m.DashboardTab })));
const DraftTab = lazy(() => import('./components/DraftTab').then(m => ({ default: m.DraftTab })));
const MacrosTab = lazy(() => import('./components/MacrosTab').then(m => ({ default: m.MacrosTab })));
const TranslatorTab = lazy(() => import('./components/TranslatorTab').then(m => ({ default: m.TranslatorTab })));
const AskCaptainTab = lazy(() => import('./components/AskCaptainTab').then(m => ({ default: m.AskCaptainTab })));
const TermDecoderTab = lazy(() => import('./components/TermDecoderTab').then(m => ({ default: m.TermDecoderTab })));
const LinksTab = lazy(() => import('./components/LinksTab').then(m => ({ default: m.LinksTab })));
const TemplatesTab = lazy(() => import('./components/TemplatesTab').then(m => ({ default: m.TemplatesTab })));
const UpdatesTab = lazy(() => import('./components/UpdatesTab').then(m => ({ default: m.UpdatesTab })));
const GrammarCheckTab = lazy(() => import('./components/GrammarCheckTab').then(m => ({ default: m.GrammarCheckTab })));
const TollGatesTab = lazy(() => import('./components/TollGatesTab').then(m => ({ default: m.TollGatesTab })));
const SpeechToTextTab = lazy(() => import('./components/SpeechToTextTab').then(m => ({ default: m.SpeechToTextTab })));
const CalculatorTab = lazy(() => import('./components/CalculatorTab').then(m => ({ default: m.CalculatorTab })));
const BackupTab = lazy(() => import('./components/BackupTab').then(m => ({ default: m.BackupTab })));
const WorkflowsTab = lazy(() => import('./components/WorkflowsTab').then(m => ({ default: m.WorkflowsTab })));
const RephraseTab = lazy(() => import('./components/RephraseTab').then(m => ({ default: m.RephraseTab })));
const BreaksTab = lazy(() => import('./components/BreaksTab').then(m => ({ default: m.BreaksTab })));

import { TabId, defaultNavItems } from './config/navigation';
import { Sidebar } from './components/Sidebar';

export default function App() {
  const { isAuthenticated, isAuthReady, handleLogout } = useAuth();
  const { upcomingBreak, formatCountdown } = useUpcomingBreak();
  const { resetAllFields } = useAppReset();
  
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  
  const { macros } = useAppContext();

  if (!isAuthReady) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return (
      <>
        <Toaster position="top-right" />
        <LoginScreen />
      </>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <Toaster position="top-right" />
      
      <Sidebar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        macrosCount={macros.length}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Top Header */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 shrink-0 sticky top-0 z-10">
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg mr-3"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-primary-600 rounded-md shadow-sm">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-violet-600 flex items-center gap-2">
                CS Agent
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary-100 text-primary-700 uppercase tracking-wider">v1.6</span>
              </h1>
            </div>
          </div>
          
          <div className="hidden lg:block flex-1"></div>

          {upcomingBreak && upcomingBreak.remainingSeconds !== null && (
            <div className="hidden md:flex items-center gap-3 mx-2 px-4 py-2 bg-primary-50/80 border border-primary-200 shadow-sm rounded-xl whitespace-nowrap">
              <div className="p-1.5 bg-primary-100 rounded-lg">
                <Coffee className="w-5 h-5 text-primary-700" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-bold text-primary-900 text-sm">{upcomingBreak.type} ({upcomingBreak.startTime})</span>
                <span className="text-primary-700 font-medium text-xs">Starts in: <span className="font-bold text-primary-600">{formatCountdown(upcomingBreak.remainingSeconds)}</span></span>
              </div>
            </div>
          )}

          {/* Global Search Button */}
          <div className="flex items-center mx-2 sm:mx-4">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-search'))}
              className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 rounded-lg transition-colors border border-slate-200 w-full sm:w-64 max-w-sm group"
            >
              <Search className="w-4 h-4 text-slate-400 group-hover:text-primary-500" />
              <span className="text-sm font-medium flex-1 text-left">Search everything...</span>
              <kbd className="hidden sm:inline-block bg-white border border-slate-300 rounded px-1.5 py-0.5 font-sans justify-end text-[10px] text-slate-400 shadow-sm">
                Cmd+K
              </kbd>
            </button>
          </div>

          {/* Top Right Action Buttons */}
          <div className="flex items-center gap-1 sm:gap-2 ml-auto">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent(`cancel-${activeTab}`))}
              className="flex items-center gap-2 px-2 sm:px-3 py-2 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors group"
              title="Cancel"
            >
              <XCircle className="w-5 h-5 text-slate-400 group-hover:text-red-600" />
              <span className="hidden sm:inline">Cancel</span>
            </button>
            <button
              onClick={() => setIsResetModalOpen(true)}
              className="flex items-center gap-2 px-2 sm:px-3 py-2 text-sm font-medium text-slate-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors group"
              title="Reset All"
            >
              <RotateCcw className="w-5 h-5 text-slate-400 group-hover:text-primary-600" />
              <span className="hidden sm:inline">Reset</span>
            </button>
            <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block"></div>
            <button
              onClick={() => {
                setIsTutorialOpen(true);
                setIsSidebarOpen(false);
              }}
              className="flex items-center gap-2 px-2 sm:px-3 py-2 text-sm font-medium text-slate-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              title="How to Use"
            >
              <Info className="w-5 h-5 text-slate-400" />
              <span className="hidden sm:inline">How to Use</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-2 sm:px-3 py-2 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5 text-slate-400" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-5xl mx-auto w-full">
            {!db && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-800">
                <Database className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold">Firebase Database Not Connected</h3>
                  <p className="text-sm mt-1">
                    To save your data permanently, please ask the AI to set up Firebase for you.
                  </p>
                </div>
              </div>
            )}
            
            <div className="w-full relative">
              <ErrorBoundary>
                <Suspense fallback={<LoadingSpinner />}>
                  <div className={activeTab === 'dashboard' ? 'block' : 'hidden'}>
                    <DashboardTab onNavigate={setActiveTab} />
                  </div>
                  <div className={activeTab === 'draft' ? 'block' : 'hidden'}><DraftTab /></div>
                  <div className={activeTab === 'macros' ? 'block' : 'hidden'}><MacrosTab /></div>
                  <div className={activeTab === 'templates' ? 'block' : 'hidden'}><TemplatesTab /></div>
                  <div className={activeTab === 'workflows' ? 'block' : 'hidden'}><WorkflowsTab /></div>
                  <div className={activeTab === 'breaks' ? 'block' : 'hidden'}><BreaksTab /></div>
                  <div className={activeTab === 'updates' ? 'block' : 'hidden'}><UpdatesTab /></div>
                  <div className={activeTab === 'translator' ? 'block' : 'hidden'}><TranslatorTab /></div>
                  <div className={activeTab === 'termDecoder' ? 'block' : 'hidden'}><TermDecoderTab /></div>
                  <div className={activeTab === 'speechToText' ? 'block' : 'hidden'}><SpeechToTextTab /></div>
                  <div className={activeTab === 'grammar' ? 'block' : 'hidden'}><GrammarCheckTab /></div>
                  <div className={activeTab === 'rephrase' ? 'block' : 'hidden'}><RephraseTab /></div>
                  <div className={activeTab === 'askCaptain' ? 'block' : 'hidden'}><AskCaptainTab /></div>
                  <div className={activeTab === 'tollGates' ? 'block' : 'hidden'}><TollGatesTab /></div>
                  <div className={activeTab === 'calculator' ? 'block' : 'hidden'}><CalculatorTab /></div>
                  <div className={activeTab === 'links' ? 'block' : 'hidden'}><LinksTab /></div>
                  <div className={activeTab === 'backup' ? 'block' : 'hidden'}><BackupTab /></div>
                </Suspense>
              </ErrorBoundary>
            </div>
          </div>
        </div>
      </main>

      <TutorialModal isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} />
      <CommandPalette />

      <Modal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)} title="Confirm Reset" maxWidth="sm">
        <div className="space-y-4">
          <p className="text-slate-600">
            Are you sure you want to completely reset all fields across all tabs (except Breaks)? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="ghost" onClick={() => setIsResetModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="danger" 
              onClick={() => {
                resetAllFields();
                setIsResetModalOpen(false);
              }}
            >
              Reset All
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
