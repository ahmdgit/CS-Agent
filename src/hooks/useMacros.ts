import { useState, useEffect } from 'react';
import { Macro } from '../types';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc, query, orderBy, where } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import toast from 'react-hot-toast';
import { generateMacroTranslations } from '../services/geminiService';

export function useMacros() {
  const [macros, setMacros] = useState<Macro[]>([]);
  const [userId, setUserId] = useState<string | null>(auth?.currentUser?.uid || null);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid || null);
    });
    return () => unsubscribe();
  }, []);

  // Migrate local macros to Firebase
  useEffect(() => {
    if (!db || !userId) return;
    
    const migrateLocalData = async () => {
      const keysToCheck = ['macros', 'savedMacros', 'cs-agent-macros'];
      for (const key of keysToCheck) {
        const localDataStr = localStorage.getItem(key);
        if (localDataStr) {
          try {
            const localData = JSON.parse(localDataStr);
            if (Array.isArray(localData) && localData.length > 0) {
              let migratedCount = 0;
              for (const item of localData) {
                if (item.summary && item.response) {
                  const newId = item.id || crypto.randomUUID();
                  const docRef = doc(db, 'macros', newId);
                  
                  const newItem = {
                    id: newId,
                    summary: item.summary,
                    response: item.response,
                    userId: userId,
                    dateAdded: typeof item.dateAdded === 'string' ? item.dateAdded : new Date(item.dateAdded || Date.now()).toISOString(),
                    ...(item.isFavorite !== undefined ? { isFavorite: item.isFavorite } : {})
                  };
                  await setDoc(docRef, newItem, { merge: true });
                  migratedCount++;
                }
              }
              if (migratedCount > 0) {
                toast.success(`Restored ${migratedCount} macros from local storage!`);
              }
            }
            // Don't remove just yet, or maybe rename it to prevent re-migration
            localStorage.setItem(`${key}_migrated`, localDataStr);
            localStorage.removeItem(key);
          } catch (e) {
            console.error(`Failed to migrate local data for key ${key}`, e);
          }
        }
      }
    };

    migrateLocalData();
  }, [userId]);

  useEffect(() => {
    if (!db || !userId) {
      setMacros([]);
      return;
    }

    const q = query(
      collection(db, 'macros'), 
      where('userId', '==', userId)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const macrosData: Macro[] = [];
      snapshot.forEach((doc) => {
        macrosData.push({ id: doc.id, ...doc.data() } as Macro);
      });
      
      // Sort in memory to avoid requiring a composite index
      macrosData.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
      
      setMacros(macrosData);
    }, (error) => {
      console.error('Failed to fetch macros from Firebase', error);
    });

    return () => unsubscribe();
  }, [userId]);

  const saveMacro = async (summary: string, response: string, existingEn?: string, existingAr?: string) => {
    if (!db || !auth?.currentUser) return;
    const id = crypto.randomUUID();
    
    let translations = { english: existingEn || '', arabic: existingAr || '' };
    if (!existingEn || !existingAr) {
      try {
        translations = await generateMacroTranslations(response);
      } catch (err) {
        console.error('Failed to generate translations', err);
      }
    }

    const newMacro = {
      id,
      summary,
      response,
      responseEn: translations.english,
      responseAr: translations.arabic,
      dateAdded: new Date().toISOString(),
      userId: auth.currentUser.uid
    };
    try {
      await setDoc(doc(db, 'macros', id), newMacro);
      toast.success('Macro saved perfectly with automatic translations.');
    } catch (e) {
      console.error('Failed to save macro', e);
      toast.error('Failed to save the macro into system');
    }
  };

  const deleteMacro = async (id: string) => {
    if (!db || !auth?.currentUser) return;
    try {
      await deleteDoc(doc(db, 'macros', id));
    } catch (e) {
      console.error('Failed to delete macro', e);
    }
  };

  const editMacro = async (id: string, summary: string, response: string) => {
    if (!db || !auth?.currentUser) return;
    
    let translations = { english: '', arabic: '' };
    try {
      translations = await generateMacroTranslations(response);
    } catch (err) {
      console.error('Failed to generate translations', err);
    }

    try {
      await updateDoc(doc(db, 'macros', id), { 
        summary, 
        response,
        responseEn: translations.english,
        responseAr: translations.arabic
      });
      toast.success('Macro modified with automatic translations generated.');
    } catch (e) {
      console.error('Failed to edit macro', e);
      toast.error('Cannot edit the respective macro')
    }
  };

  const toggleFavorite = async (id: string, currentStatus: boolean) => {
    if (!db || !auth?.currentUser) return;
    try {
      await updateDoc(doc(db, 'macros', id), { isFavorite: !currentStatus });
    } catch (e) {
      console.error('Failed to toggle favorite', e);
    }
  };

  const translateLegacyMacros = async () => {
    if (!db || !auth?.currentUser) return;
    const legacyMacros = macros.filter(m => !m.responseEn || !m.responseAr);
    if (legacyMacros.length === 0) {
      toast.success('All macros are already translated.');
      return;
    }
    
    let successCount = 0;
    const toastId = toast.loading(`Translating ${legacyMacros.length} legacy macros...`);
    
    for (const macro of legacyMacros) {
      try {
        const translations = await generateMacroTranslations(macro.response);
        await updateDoc(doc(db, 'macros', macro.id), {
          responseEn: translations.english,
          responseAr: translations.arabic
        });
        successCount++;
      } catch (err) {
        console.error(`Failed to translate macro ${macro.id}`, err);
      }
      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    toast.success(`Successfully translated ${successCount} out of ${legacyMacros.length} macros.`, { id: toastId });
  };

  return { macros, saveMacro, deleteMacro, editMacro, toggleFavorite, translateLegacyMacros };
}
