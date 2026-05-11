import { 
  LayoutDashboard, 
  MessageSquarePlus, 
  FolderOpen, 
  LayoutTemplate, 
  Waypoints, 
  Coffee, 
  AlertCircle, 
  Globe2, 
  BookOpen, 
  Mic, 
  SpellCheck, 
  RefreshCw, 
  HelpCircle, 
  Map, 
  Calculator, 
  Link as LinkIcon, 
  Save 
} from 'lucide-react';

export type TabId = 'dashboard' | 'draft' | 'macros' | 'translator' | 'askCaptain' | 'links' | 'templates' | 'updates' | 'grammar' | 'tollGates' | 'speechToText' | 'calculator' | 'backup' | 'workflows' | 'rephrase' | 'breaks' | 'termDecoder';

export interface NavItem {
  id: TabId;
  label: string;
  icon: any;
}

export const defaultNavItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'draft', label: 'AI Draft & Save', icon: MessageSquarePlus },
  { id: 'macros', label: 'Macros', icon: FolderOpen },
  { id: 'templates', label: 'Templates', icon: LayoutTemplate },
  { id: 'workflows', label: 'Ticket Maker', icon: Waypoints },
  { id: 'breaks', label: 'Breaks', icon: Coffee },
  { id: 'updates', label: 'Updates', icon: AlertCircle },
  { id: 'translator', label: 'Translator', icon: Globe2 },
  { id: 'termDecoder', label: 'Term Decoder', icon: BookOpen },
  { id: 'speechToText', label: 'Speech to Text', icon: Mic },
  { id: 'grammar', label: 'Grammar Check', icon: SpellCheck },
  { id: 'rephrase', label: 'Rephrase Text', icon: RefreshCw },
  { id: 'askCaptain', label: 'Ask Captain', icon: HelpCircle },
  { id: 'tollGates', label: 'Toll Gates', icon: Map },
  { id: 'calculator', label: 'Calculator', icon: Calculator },
  { id: 'links', label: 'Links', icon: LinkIcon },
  { id: 'backup', label: 'Backup & Restore', icon: Save },
];
