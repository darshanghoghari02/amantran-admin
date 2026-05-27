import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Undo2,
  Redo2,
  Save,
  ZoomIn,
  ZoomOut,
  Check,
  RefreshCw,
  Eye,
  Languages
} from 'lucide-react';
import { useCanvasStore } from '../../store/canvasStore';
import LeftPanel from './LeftPanel';
import CanvasArea from './CanvasArea';
import RightPanel from './RightPanel';
import PreviewModal from './PreviewModal';
import { translateText } from '../../utils/translate';

interface EditorWorkspaceProps {
  onClose: () => void;
}

export default function EditorWorkspace({ onClose }: EditorWorkspaceProps) {
  const {
    template,
    zoom,
    setZoom,
    undo,
    redo,
    undoStack,
    redoStack,
    autosaveStatus,
    setAutosaveStatus,
    selectedLanguage,
    setSelectedLanguage,
    selectedElementId,
    selectedPageIndex,
    updateElement,
    deleteElement,
    duplicateElement,
    updateTemplatePages
  } = useCanvasStore();

  const [savingManual, setSavingManual] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isTranslatingPage, setIsTranslatingPage] = useState(false);

  // Debounced Autosave Effect
  useEffect(() => {
    if (!template) return;

    // Set status to syncing when a change occurs
    setAutosaveStatus('saving');

    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/templates/${template.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(template)
        });

        if (res.ok) {
          setAutosaveStatus('saved');
          setTimeout(() => setAutosaveStatus('idle'), 2000);
        } else {
          setAutosaveStatus('error');
        }
      } catch (err) {
        console.error('Autosave error:', err);
        setAutosaveStatus('error');
      }
    }, 1500); // 1.5s debounce

    return () => clearTimeout(delayDebounceFn);
  }, [template?.pages, template?.thumbnail, template?.localAssetPaths]);

  // Keyboard Shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an input/textarea
      const activeEl = document.activeElement;
      const isEditing =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        activeEl?.hasAttribute('contenteditable');

      if (isEditing) return;

      // Undo: Ctrl+Z
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (undoStack.length > 0) undo();
      }

      // Redo: Ctrl+Y
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        if (redoStack.length > 0) redo();
      }

      // Duplicate Element: Ctrl+D
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        if (selectedElementId) duplicateElement(selectedElementId);
      }

      // Delete Element: Delete or Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElementId) {
          e.preventDefault();
          deleteElement(selectedElementId);
        }
      }

      // Arrow Nudging
      if (template && selectedElementId && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        const currentPage = template.pages[selectedPageIndex];
        const elem = currentPage?.elements.find(el => el.id === selectedElementId);
        if (elem && !elem.isLocked) {
          e.preventDefault();
          const step = e.shiftKey ? 10 : 1;
          let newX = elem.x;
          let newY = elem.y;
          if (e.key === 'ArrowUp') newY -= step;
          if (e.key === 'ArrowDown') newY += step;
          if (e.key === 'ArrowLeft') newX -= step;
          if (e.key === 'ArrowRight') newX += step;
          updateElement(selectedElementId, { x: newX, y: newY });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedElementId,
    selectedPageIndex,
    template?.pages,
    undoStack.length,
    redoStack.length,
    undo,
    redo,
    duplicateElement,
    deleteElement,
    updateElement
  ]);

  const handleLanguageChange = async (targetLang: string) => {
    setSelectedLanguage(targetLang);

    if (!template || !template.pages) return;

    // Scan all text elements across ALL pages that need translation
    let hasElementsToTranslate = false;
    for (const page of template.pages) {
      if (!page.elements) continue;
      const needsTrans = page.elements.some((elem) => {
        if (elem.type !== 'text') return false;
        const currentTranslation = elem.translations?.[targetLang];
        const englishText = elem.translations?.['English'] || elem.text || '';
        return (
          targetLang !== 'English' &&
          (!currentTranslation || currentTranslation.trim() === '' || currentTranslation === englishText)
        );
      });
      if (needsTrans) {
        hasElementsToTranslate = true;
        break;
      }
    }

    if (!hasElementsToTranslate) return;

    setIsTranslatingPage(true);
    try {
      const updatedPages = await Promise.all(
        template.pages.map(async (page) => {
          if (!page.elements) return page;
          const updatedElements = await Promise.all(
            page.elements.map(async (elem) => {
              if (elem.type !== 'text') return elem;

              const currentTranslation = elem.translations?.[targetLang];
              const englishText = elem.translations?.['English'] || elem.text || '';

              const needsTranslation =
                targetLang !== 'English' &&
                (!currentTranslation || currentTranslation.trim() === '' || currentTranslation === englishText);

              if (!needsTranslation || !englishText.trim()) return elem;

              try {
                const translatedVal = await translateText(englishText, targetLang, 'English');
                const newTranslations = {
                  ...(elem.translations || {}),
                  [targetLang]: translatedVal
                };
                return {
                  ...elem,
                  text: newTranslations['English'] || englishText,
                  translations: newTranslations
                };
              } catch (err) {
                console.error(`Failed to translate element ${elem.id} to ${targetLang}:`, err);
                return elem;
              }
            })
          );
          return {
            ...page,
            elements: updatedElements
          };
        })
      );

      updateTemplatePages(updatedPages);
    } catch (err) {
      console.error("Auto-translate all pages elements error:", err);
    } finally {
      setIsTranslatingPage(false);
    }
  };

  if (!template) return null;

  const handleManualSave = async () => {
    setSavingManual(true);
    setAutosaveStatus('saving');

    try {
      const res = await fetch(`http://localhost:5000/api/templates/${template.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template)
      });

      if (res.ok) {
        setAutosaveStatus('saved');
        setTimeout(() => setAutosaveStatus('idle'), 2000);
      } else {
        setAutosaveStatus('error');
      }
    } catch (err) {
      console.error('Manual save failed:', err);
      setAutosaveStatus('error');
    } finally {
      setSavingManual(false);
    }
  };

  const getSyncStateBadge = () => {
    switch (autosaveStatus) {
      case 'saving':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold rounded-lg uppercase shadow-sm">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            Syncing...
          </span>
        );
      case 'saved':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-green-50 border border-green-200 text-green-700 text-xs font-bold rounded-lg uppercase shadow-sm">
            <Check className="w-3.5 h-3.5 text-green-600 stroke-[3]" />
            Saved to Local
          </span>
        );
      case 'error':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-lg uppercase shadow-sm">
            ✕ Sync Offline
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-wedding-pink-light border border-wedding-pink-medium/30 text-wedding-pink-dark text-xs font-bold rounded-lg uppercase shadow-sm">
            ● Autosave Enabled
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-wedding-bg">
      {/* 1. Designer Header Toolbar */}
      <div className="h-16 bg-wedding-charcoal-dark text-white px-6 flex items-center justify-between border-b border-[#3d2e31]/60 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-wedding-charcoal-light text-wedding-gold-light hover:text-white rounded-xl transition-colors flex items-center justify-center"
            title="Return to templates directory"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <h3 className="text-sm font-extrabold tracking-tight text-wedding-gold-light uppercase leading-none">
              {template.name}
            </h3>
            <p className="text-[10px] text-gray-400 mt-1 font-mono">{template.slug}</p>
          </div>
        </div>

        {/* Center: Undo/Redo & Zoom Adjusters */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1 bg-wedding-charcoal-light/45 p-1 rounded-xl border border-[#3d2e31]/40">
            <button
              onClick={undo}
              disabled={undoStack.length === 0}
              className="p-2 hover:bg-wedding-charcoal-light text-gray-300 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg transition-colors"
              title="Undo"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={redo}
              disabled={redoStack.length === 0}
              className="p-2 hover:bg-wedding-charcoal-light text-gray-300 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg transition-colors"
              title="Redo"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          {/* View Zoom Controller */}
          <div className="flex items-center gap-2 bg-wedding-charcoal-light/45 px-3 py-1.5 rounded-xl border border-[#3d2e31]/40 text-xs font-bold text-gray-300">
            <button
              onClick={() => setZoom(zoom - 5)}
              className="hover:text-white transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="w-12 text-center select-none">{zoom}%</span>
            <button
              onClick={() => setZoom(zoom + 5)}
              className="hover:text-white transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Autosave status indicator, Language, Live Preview, and Save button */}
        <div className="flex items-center gap-4">
          {getSyncStateBadge()}

          {/* Language dropdown */}
          <div className="flex items-center gap-1.5 bg-[#251B1E] px-3.5 py-2 rounded-xl border border-white/5 text-xs font-bold text-gray-300">
            <Languages className="w-4 h-4 text-wedding-gold-light" />
            <select
              value={selectedLanguage}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="bg-transparent text-xs font-bold text-gray-300 focus:outline-none cursor-pointer pr-1"
            >
              {(template.languages && template.languages.length > 0 ? template.languages : ['English', 'Hindi', 'Gujarati', 'Marathi', 'Tamil', 'Urdu']).map((lang) => (
                <option key={lang} value={lang} className="bg-wedding-charcoal-dark text-white font-bold">
                  {lang}
                </option>
              ))}
            </select>
          </div>

          {/* Live Preview Button */}
          <button
            onClick={() => setIsPreviewOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-wedding-pink-dark hover:bg-wedding-pink-medium text-white text-xs font-extrabold rounded-xl transition-all duration-300 shadow-md shadow-wedding-pink-dark/10 transform hover:-translate-y-0.5"
          >
            <Eye className="w-4 h-4" />
            Live Preview
          </button>

          <button
            onClick={handleManualSave}
            disabled={savingManual}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-wedding-gold-accent hover:bg-wedding-gold-dark text-wedding-charcoal-dark text-xs font-extrabold rounded-xl transition-all duration-300 shadow-md shadow-wedding-gold-accent/10 transform hover:-translate-y-0.5"
          >
            <Save className="w-4 h-4" />
            {savingManual ? 'Syncing...' : 'Save Draft'}
          </button>
        </div>
      </div>

      {/* Floating Auto-Translate Toast Notification */}
      {isTranslatingPage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-wedding-charcoal-dark border border-wedding-gold-accent/55 shadow-2xl rounded-2xl px-5 py-3 flex items-center gap-3 text-white text-xs font-bold transition-all animate-bounce">
          <Languages className="w-4 h-4 text-wedding-gold-light animate-spin" />
          <span>✨ Translating card elements to <span className="text-wedding-gold-light">{selectedLanguage}</span>...</span>
        </div>
      )}

      {/* 2. Three Column Canvas layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Elements Sidebar */}
        <LeftPanel />

        {/* Central Workspace canvas viewport */}
        <CanvasArea />

        {/* Right Element properties inspector */}
        <RightPanel />
      </div>

      {/* Immersive Slideshow Preview Modal Overlay */}
      {isPreviewOpen && (
        <PreviewModal
          template={template}
          selectedLanguage={selectedLanguage}
          setSelectedLanguage={setSelectedLanguage}
          onClose={() => setIsPreviewOpen(false)}
        />
      )}
    </div>
  );
}
