import { toast } from 'react-hot-toast';
import { defaultNavItems } from '../config/navigation';

export function useAppReset() {
  const resetAllFields = () => {
    defaultNavItems.forEach(tab => {
      if (tab.id !== 'breaks') {
        window.dispatchEvent(new CustomEvent(`reset-${tab.id}`));
      }
    });
    
    // Clear state in local storage to guarantee background tabs are also reset
    const keysToRemove = [
      'draftTab_state',
      'translatorTab_state',
      'askCaptainTab_state',
      'grammarTab_state',
      'rephraseTab_state',
      'speechToTextTab_state',
      'termDecoderState',
      'tollGatesState',
      'calculatorState'
    ];
    keysToRemove.forEach(k => localStorage.removeItem(k));
    
    toast.success('All fields have been reset.');
  };

  return { resetAllFields };
}
