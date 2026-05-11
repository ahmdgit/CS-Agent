import React, { useState, useEffect } from 'react';
import { analyzeRideHailingTerm } from '../services/geminiService';
import { TermMeaningResult } from '../types';
import { Button } from './ui/Button';
import { Textarea } from './ui/Textarea';
import { BookOpen, Search, Copy, Check, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export function TermDecoderTab() {
  const getSavedState = () => {
    try {
      const saved = localStorage.getItem('termDecoderState');
      const parsed = saved ? JSON.parse(saved) : {};
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  };
  const savedState = getSavedState();

  const [input, setInput] = useState(savedState.input || '');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TermMeaningResult | null>(savedState.result || null);
  const [isCopiedEng, setIsCopiedEng] = useState(false);
  const [isCopiedAr, setIsCopiedAr] = useState(false);

  useEffect(() => {
    localStorage.setItem('termDecoderState', JSON.stringify({ input, result }));
  }, [input, result]);

  useEffect(() => {
    const handleReset = () => {
      setInput('');
      setResult(null);
    };
    window.addEventListener('reset-termDecoder', handleReset);
    window.addEventListener('cancel-termDecoder', handleReset);
    return () => {
      window.removeEventListener('reset-termDecoder', handleReset);
      window.removeEventListener('cancel-termDecoder', handleReset);
    };
  }, []);

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    setIsLoading(true);
    try {
      const analysis = await analyzeRideHailingTerm(input);
      setResult(analysis);
      toast.success('Term analyzed successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to analyze term');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, lang: 'eng' | 'ar') => {
    navigator.clipboard.writeText(text);
    if (lang === 'eng') {
      setIsCopiedEng(true);
      setTimeout(() => setIsCopiedEng(false), 2000);
    } else {
      setIsCopiedAr(true);
      setTimeout(() => setIsCopiedAr(false), 2000);
    }
    toast.success('Copied to clipboard');
  };

  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-primary-100 rounded-xl text-primary-600">
          <BookOpen className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Term Decoder</h2>
          <p className="text-slate-600">Understand ride-hailing jargon and abbreviations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full overflow-hidden">
        {/* Input Section */}
        <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-200 p-6 overflow-y-auto">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Term or Phrase
          </label>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g., 'PAX was a no-show', 'surge pricing', 'cancel fee', 'كابتن، الموقع غلط'"
            className="flex-1 min-h-[200px] mb-4 resize-none"
          />
          <Button
            onClick={handleAnalyze}
            disabled={isLoading || !input.trim()}
            className="w-full flex justify-center items-center gap-2"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
            {isLoading ? 'Analyzing...' : 'Analyze Term'}
          </Button>
        </div>

        {/* Results Section */}
        <div className="flex flex-col h-full bg-slate-50 rounded-2xl border border-slate-200 p-6 overflow-y-auto">
          <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            Meaning
          </h3>

          {!result ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <BookOpen className="w-12 h-12 mb-4 opacity-20" />
              <p>Enter a term to see its meaning in English and Arabic.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {result.isUnclear && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-800">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
                  <p className="text-sm">
                    This term is unclear or doesn't seem to be related to the ride-hailing context.
                  </p>
                </div>
              )}

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                  <span className="text-sm font-medium text-slate-700">English Meaning</span>
                  <button
                    onClick={() => copyToClipboard(result.englishMeaning, 'eng')}
                    className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                    title="Copy"
                  >
                    {isCopiedEng ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <div className="p-4 text-slate-700 leading-relaxed text-sm">
                  {result.englishMeaning}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                  <span className="text-sm font-medium text-slate-700">Arabic Meaning (المعنى بالعربية)</span>
                  <button
                    onClick={() => copyToClipboard(result.arabicMeaning, 'ar')}
                    className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                    title="Copy"
                  >
                    {isCopiedAr ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <div className="p-4 text-slate-700 leading-relaxed text-sm text-right" dir="auto">
                  {result.arabicMeaning}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
