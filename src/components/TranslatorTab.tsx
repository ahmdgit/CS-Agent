import React, { useState, useRef, useEffect } from 'react';
import { translateText, detectLanguage } from '../services/geminiService';
import { Languages, Copy, CheckCircle2, RotateCcw, ImagePlus, X, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/Button';
import { Textarea } from './ui/Textarea';

export function TranslatorTab() {
  const getSavedTranslatorState = () => {
    try {
      const saved = localStorage.getItem('translatorTab_state');
      const parsed = saved ? JSON.parse(saved) : {};
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  };
  const savedState = getSavedTranslatorState();

  const [activeSubTab, setActiveSubTab] = useState<'translate' | 'detect'>(savedState.activeSubTab || 'translate');
  const [transInput, setTransInput] = useState(savedState.transInput || '');
  const [targetLanguage, setTargetLanguage] = useState(savedState.targetLanguage || 'English');
  const [translation, setTranslation] = useState(savedState.translation || '');
  const [detectedLanguage, setDetectedLanguage] = useState(savedState.detectedLanguage || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [image, setImage] = useState<{ data: string, mimeType: string } | null>(savedState.image || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem('translatorTab_state', JSON.stringify({ 
        activeSubTab, transInput, targetLanguage, translation, detectedLanguage,
        image: image && image.data.length < 1000000 ? image : null
      }));
    } catch {
      localStorage.setItem('translatorTab_state', JSON.stringify({ 
        activeSubTab, transInput, targetLanguage, translation, detectedLanguage, image: null
      }));
    }
  }, [activeSubTab, transInput, targetLanguage, translation, detectedLanguage, image]);

  const languages = ['English', 'Arabic', 'Russian', 'Spanish', 'French', 'German', 'Chinese', 'Japanese'];

  const handleTranslate = async () => {
    if (!transInput.trim() && !image) return;
    setIsLoading(true);
    setTranslation('');
    setIsCopied(false);
    try {
      await translateText(transInput, targetLanguage, (chunk) => {
        setTranslation(chunk);
      }, image || undefined);
    } catch (error: any) {
      console.error('Error translating text:', error);
      const errorMessage = error?.message || String(error);
      if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
        toast.error('API quota exceeded. Please wait a minute and try again, or add your own API key in Settings.', { duration: 6000 });
      } else {
        toast.error('Failed to translate text. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDetect = async (textToDetect?: string) => {
    const text = textToDetect || transInput;
    if (!text.trim()) return;
    setIsLoading(true);
    setDetectedLanguage('');
    try {
      const result = await detectLanguage(text);
      setDetectedLanguage(result);
    } catch (error: any) {
      console.error('Error detecting language:', error);
      toast.error('Failed to detect language.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (translation) {
      navigator.clipboard.writeText(translation);
      setIsCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleReset = () => {
    setTransInput('');
    setTranslation('');
    setIsCopied(false);
    setImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const result = evt.target?.result as string;
      const base64Data = result.split(',')[1];
      setImage({
        data: base64Data,
        mimeType: file.type
      });
    };
    reader.readAsDataURL(file);
  };



  useEffect(() => {
    const onReset = () => handleReset();
    const onCancel = () => handleReset();
    window.addEventListener('reset-translator', onReset);
    window.addEventListener('cancel-translator', onCancel);
    return () => {
      window.removeEventListener('reset-translator', onReset);
      window.removeEventListener('cancel-translator', onCancel);
    };
  }, []);
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-200">
          <button
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${activeSubTab === 'translate' ? 'bg-white text-primary-600 border-b-2 border-primary-600' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            onClick={() => setActiveSubTab('translate')}
          >
            <div className="flex items-center justify-center gap-2">
              <Languages className="w-4 h-4" />
              Translate
            </div>
          </button>
          <button
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${activeSubTab === 'detect' ? 'bg-white text-primary-600 border-b-2 border-primary-600' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            onClick={() => setActiveSubTab('detect')}
          >
            <div className="flex items-center justify-center gap-2">
              <Search className="w-4 h-4" />
              Detect Language
            </div>
          </button>
        </div>
        
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary-50 rounded-lg">
              {activeSubTab === 'translate' ? <Languages className="w-6 h-6 text-primary-600" /> : <Search className="w-6 h-6 text-primary-600" />}
            </div>
            <h2 className="text-xl font-semibold text-slate-800">
              {activeSubTab === 'translate' ? 'Quick Translation' : 'Language Detection'}
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3 relative">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-700">Text to {activeSubTab === 'translate' ? 'translate' : 'detect'}:</label>
                {activeSubTab === 'translate' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-primary-600 hover:text-primary-700"
                    leftIcon={<ImagePlus className="w-4 h-4" />}
                  >
                    Add Image
                  </Button>
                )}
                {activeSubTab === 'translate' && (
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                )}
              </div>
              
              {image && activeSubTab === 'translate' && (
                <div className="relative inline-block mb-2">
                  <img 
                    src={`data:${image.mimeType};base64,${image.data}`} 
                    alt="To translate" 
                    className="h-20 rounded-lg border border-slate-200 object-cover"
                  />
                  <button
                    onClick={() => setImage(null)}
                    className="absolute -top-2 -right-2 p-1 bg-white border border-slate-200 rounded-full shadow-sm hover:bg-slate-50 text-slate-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              <Textarea
                className="h-40 resize-y bg-slate-50"
                placeholder={activeSubTab === 'translate' ? "Enter text here or paste an image (Ctrl+V)..." : "Paste text here to detect its language..."}
                value={transInput}
                maxLength={5000}
                onChange={(e) => setTransInput(e.target.value)}
                onPaste={(e) => {
                  const pastedText = e.clipboardData?.getData('text');
                  if (activeSubTab === 'detect' && pastedText) {
                    // Auto detect when pasting text
                    setTimeout(() => {
                      if (!isLoading) {
                        const currentText = (e.target as HTMLTextAreaElement).value;
                        const selectionStart = (e.target as HTMLTextAreaElement).selectionStart;
                        const selectionEnd = (e.target as HTMLTextAreaElement).selectionEnd;
                        const newText = currentText.substring(0, selectionStart) + pastedText + currentText.substring(selectionEnd);
                        handleDetect(newText);
                      }
                    }, 0);
                  }

                  const items = e.clipboardData?.items;
                  if (!items || activeSubTab !== 'translate') return;
                  
                  for (let i = 0; i < items.length; i++) {
                    if (items[i].type.indexOf('image') !== -1) {
                      const file = items[i].getAsFile();
                      if (file) {
                        e.preventDefault(); // Prevent default paste behavior if it's an image
                        if (file.size > 5 * 1024 * 1024) {
                          toast.error('Image must be less than 5MB');
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = (evt) => {
                          const result = evt.target?.result as string;
                          const base64Data = result.split(',')[1];
                          setImage({
                            data: base64Data,
                            mimeType: file.type
                          });
                        };
                        reader.readAsDataURL(file);
                      }
                    }
                  }
                }}
                disabled={isLoading}
              />
              <div className={`absolute bottom-3 right-3 text-xs ${transInput.length >= 4900 ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                {transInput.length}/5000
              </div>
            </div>

            <div className="space-y-6">
              {activeSubTab === 'translate' ? (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-700">Translate TO:</label>
                  <select
                    className="w-full p-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors appearance-none"
                    value={targetLanguage}
                    onChange={(e) => setTargetLanguage(e.target.value)}
                  >
                    {languages.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-3 pt-6">
                  {detectedLanguage && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-6 bg-emerald-50 rounded-xl border border-emerald-100 shadow-sm text-center"
                    >
                      <p className="text-sm text-emerald-600 font-medium mb-1">Detected Language</p>
                      <p className="text-2xl font-bold text-emerald-800">{detectedLanguage}</p>
                    </motion.div>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={handleReset}
                  disabled={isLoading || (!transInput && !translation && !image && !detectedLanguage)}
                  leftIcon={<RotateCcw className="w-4 h-4" />}
                  className="px-6"
                >
                  Reset
                </Button>
                {activeSubTab === 'translate' ? (
                  <Button
                    onClick={handleTranslate}
                    disabled={isLoading || (!transInput.trim() && !image)}
                    isLoading={isLoading}
                    className="flex-1 bg-primary-600 hover:bg-primary-700"
                  >
                    {isLoading ? 'Translating...' : 'Translate'}
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleDetect()}
                    disabled={isLoading || !transInput.trim()}
                    isLoading={isLoading}
                    className="flex-1 bg-primary-600 hover:bg-primary-700"
                  >
                    {isLoading ? 'Detecting...' : 'Detect Language'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeSubTab === 'translate' && translation && (
          <motion.div
            key="translation-result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">Translation</h3>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium border border-emerald-100">
                {targetLanguage}
              </span>
            </div>
            <div className="relative">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-slate-700 whitespace-pre-wrap font-sans leading-relaxed min-h-[100px]">
                {translation}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="absolute top-3 right-3 bg-white shadow-sm"
                leftIcon={isCopied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              >
                {isCopied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
