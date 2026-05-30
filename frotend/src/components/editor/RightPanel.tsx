import React, { useState, useEffect } from 'react';
import { 
  Trash2, 
  Copy, 
  Lock, 
  Unlock, 
  ArrowUp, 
  ArrowDown, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify,
  Languages
} from 'lucide-react';
import { useCanvasStore } from '../../store/canvasStore';
import { translateToAll } from '../../utils/translate';
import { API_URL } from '@/config';

export default function RightPanel() {
  const { 
    template, 
    selectedPageIndex, 
    selectedElementId, 
    updateElement, 
    deleteElement, 
    duplicateElement,
    bringToFront,
    sendToBack,
    toggleLock,
    selectedLanguage
  } = useCanvasStore();

  const [isTranslating, setIsTranslating] = useState(false);
  const [availableFonts, setAvailableFonts] = useState<string[]>([]);

  useEffect(() => {
    async function fetchAllFonts() {
      if (!template) return;
      try {
        const res = await fetch(`${API_URL}/api/fonts`);
        const data = await res.json();
        if (Array.isArray(data)) {
          const fontFamilies = data.filter((f: any) => f.isActive).map((f: any) => f.family);
          // Merge template fonts and all database fonts, deduplicating them
          const templateFonts = template?.fonts || [];
          const merged = Array.from(new Set([...templateFonts, ...fontFamilies]));
          setAvailableFonts(merged);
        } else {
          setAvailableFonts(template?.fonts || []);
        }
      } catch (err) {
        console.error("Failed to fetch available fonts in editor panel:", err);
        setAvailableFonts(template?.fonts || []);
      }
    }
    
    fetchAllFonts();
  }, [template?.fonts]);

  if (!template) return null;

  const currentPage = template.pages[selectedPageIndex];
  const element = currentPage?.elements.find((e) => e.id === selectedElementId);

  const handleAutoTranslate = async (elementText: string) => {
    if (!elementText || !elementText.trim() || !element) return;
    setIsTranslating(true);
    try {
      const langs = template.languages && template.languages.length > 0 
        ? template.languages 
        : ['English', 'Hindi', 'Gujarati', 'Marathi', 'Tamil', 'Urdu'];
      
      const translations = await translateToAll(elementText.trim(), selectedLanguage, langs);
      
      updateElement(element.id, { 
        text: translations['English'] || elementText.trim(),
        translations 
      });
    } catch (err) {
      console.error("Manual auto-translate error:", err);
    } finally {
      setIsTranslating(false);
    }
  };

  // If no element is selected, show Document Properties instead of showing a blank screen
  if (!element) {
    return (
      <div className="w-80 bg-white border-l border-wedding-pink-medium/40 p-6 flex flex-col justify-start shrink-0 shadow-sm z-10 space-y-6 overflow-y-auto">
        <div>
          <span className="text-[10px] font-extrabold text-wedding-pink-dark uppercase tracking-wider block">
            Workspace Settings
          </span>
          <h4 className="text-sm font-bold text-wedding-charcoal-dark tracking-tight">Document Properties</h4>
        </div>

        <div className="p-4 bg-wedding-pink-light/35 border border-wedding-pink-medium/30 rounded-2xl space-y-3">
          <div>
            <p className="text-[9px] font-bold text-gray-400 uppercase">Canvas Dimensions</p>
            <p className="text-xs font-bold text-wedding-charcoal-dark mt-0.5">1080 x 1920 pixels (9:16)</p>
          </div>
          <div>
            <p className="text-[9px] font-bold text-gray-400 uppercase">Target Aspect Ratio</p>
            <p className="text-xs text-gray-600 font-semibold mt-0.5">Full HD Portrait Mobile Screen</p>
          </div>
          <div>
            <p className="text-[9px] font-bold text-gray-400 uppercase">Editing Language</p>
            <p className="text-xs font-extrabold text-wedding-pink-dark mt-0.5">{selectedLanguage}</p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-bold text-wedding-charcoal-light uppercase tracking-wider">Reference Instructions</p>
          <div className="text-[11px] text-gray-500 space-y-3 leading-relaxed">
            <p>
              🌸 Click on any **text box element** or **sticker** inside the active slide viewport to edit its positioning, sizing, font spacing, weight, and drop shadow presets.
            </p>
            <p>
              🌍 Your text edits in the **{selectedLanguage}** language will automatically replicate to other secondary languages if they haven't been customized yet.
            </p>
            <p>
              🎹 **Keyboard Shortcuts Supported:**
              <br />• `Ctrl + Z` / `Ctrl + Y` (Undo / Redo)
              <br />• `Ctrl + D` (Duplicate element)
              <br />• `Delete` / `Backspace` (Delete element)
              <br />• `Arrow Keys` / `Shift + Arrows` (1px / 10px nudges)
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isLocked = element.isLocked;

  const handleCoordinateChange = (field: 'x' | 'y' | 'width' | 'height' | 'rotation', val: string) => {
    const num = parseInt(val) || 0;
    updateElement(element.id, { [field]: num });
  };

  const handleOpacityChange = (val: string) => {
    const opacity = parseFloat(val) || 1;
    updateElement(element.id, { opacity: Math.max(0, Math.min(1, opacity)) });
  };

  return (
    <div className="w-80 bg-white border-l border-wedding-pink-medium/40 p-6 overflow-y-auto space-y-6 shrink-0 shadow-sm z-10">
      {/* Element Header & Quick Actions */}
      <div className="flex items-center justify-between pb-4 border-b border-wedding-pink-medium/20">
        <div>
          <span className="text-[10px] font-extrabold text-wedding-pink-dark uppercase tracking-wider">
            {element.type === 'text' ? 'Text Box Element' : element.type === 'sticker' ? 'Sticker Asset' : 'Image Graphic'}
          </span>
          <h4 className="text-sm font-bold text-wedding-charcoal-dark tracking-tight">Properties Inspector</h4>
        </div>
        
        <div className="flex gap-1.5">
          <button
            onClick={() => toggleLock(element.id)}
            className={`p-2 rounded-xl border transition-all ${
              isLocked
                ? 'bg-wedding-gold-accent/20 border-wedding-gold-accent/50 text-wedding-gold-dark'
                : 'border-wedding-pink-medium/30 text-wedding-charcoal-light hover:bg-wedding-pink-light/30'
            }`}
            title={isLocked ? 'Unlock Element' : 'Lock Element'}
          >
            {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          </button>
          
          <button
            onClick={() => duplicateElement(element.id)}
            className="p-2 border border-wedding-pink-medium/30 text-wedding-charcoal-light hover:bg-wedding-pink-light/30 rounded-xl transition-all"
            title="Duplicate Element"
            disabled={isLocked}
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          
          <button
            onClick={() => deleteElement(element.id)}
            className="p-2 border border-transparent text-red-500 hover:bg-red-50 rounded-xl transition-all"
            title="Delete Element"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 1. Text Specific Customizations */}
      {element.type === 'text' && (
        <div className="space-y-4">
          {/* Text Input Content Area */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-wedding-charcoal-light uppercase tracking-wider">
                Text Content ({selectedLanguage})
              </label>
              <button
                type="button"
                onClick={() => handleAutoTranslate(element.translations?.[selectedLanguage] ?? element.text ?? '')}
                disabled={isLocked || isTranslating || !(element.translations?.[selectedLanguage] ?? element.text ?? '').trim()}
                className="text-[10px] font-extrabold text-wedding-pink-dark hover:text-wedding-pink-medium flex items-center gap-1 transition-colors disabled:opacity-40"
                title="Automatically translate this text box to all other languages"
              >
                <Languages className={`w-3 h-3 ${isTranslating ? 'animate-spin' : ''}`} />
                {isTranslating ? 'Translating...' : 'Auto-Translate'}
              </button>
            </div>
            <textarea
              value={element.translations?.[selectedLanguage] ?? element.text ?? ''}
              onChange={(e) => updateElement(element.id, { text: e.target.value })}
              rows={3}
              disabled={isLocked || isTranslating}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-wedding-pink-medium/40 text-wedding-charcoal-dark focus:outline-none focus:ring-2 focus:ring-wedding-pink-dark/20 resize-none font-medium leading-relaxed"
            />
          </div>

          {/* Typography dropdown family & sizes */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-wedding-charcoal-light uppercase tracking-wider block">Font Family</label>
              <select
                value={element.fontFamily || 'Rasa'}
                onChange={(e) => updateElement(element.id, { fontFamily: e.target.value })}
                disabled={isLocked}
                className="w-full px-2 py-2.5 text-xs rounded-xl bg-white border border-wedding-pink-medium/40 text-wedding-charcoal-dark focus:outline-none"
              >
                {(availableFonts.length > 0 ? availableFonts : (template.fonts || [])).map((f) => (
                  <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
                ))}
                <option value="sans-serif">System Sans</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-wedding-charcoal-light uppercase tracking-wider block">Size (px)</label>
              <input
                type="number"
                value={element.fontSize || 36}
                onChange={(e) => updateElement(element.id, { fontSize: parseInt(e.target.value) || 12 })}
                disabled={isLocked}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-wedding-pink-medium/40 text-wedding-charcoal-dark focus:outline-none"
              />
            </div>
          </div>

          {/* Font Weight & Letter Spacing Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-wedding-charcoal-light uppercase tracking-wider block">Font Weight</label>
              <select
                value={element.fontWeight || 'normal'}
                onChange={(e) => updateElement(element.id, { fontWeight: e.target.value })}
                disabled={isLocked}
                className="w-full px-2 py-2.5 text-xs rounded-xl bg-white border border-wedding-pink-medium/40 text-wedding-charcoal-dark focus:outline-none"
              >
                <option value="300">Light (300)</option>
                <option value="normal">Regular (400)</option>
                <option value="500">Medium (500)</option>
                <option value="600">Semi-Bold (600)</option>
                <option value="bold">Bold (700)</option>
                <option value="800">Extra-Bold (800)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-wedding-charcoal-light uppercase tracking-wider block">Letter Spacing (px)</label>
              <input
                type="number"
                step="0.5"
                value={element.letterSpacing || 0}
                onChange={(e) => updateElement(element.id, { letterSpacing: parseFloat(e.target.value) || 0 })}
                disabled={isLocked}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-wedding-pink-medium/40 text-wedding-charcoal-dark focus:outline-none"
              />
            </div>
          </div>

          {/* Wedding Drop Shadow Presets */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-wedding-charcoal-light uppercase tracking-wider block">Premium Shadow Presets</label>
            <select
              value={element.textShadow || ''}
              onChange={(e) => updateElement(element.id, { textShadow: e.target.value })}
              disabled={isLocked}
              className="w-full px-2 py-2.5 text-xs rounded-xl bg-white border border-wedding-pink-medium/40 text-wedding-charcoal-dark focus:outline-none font-medium"
            >
              <option value="">None (Clean Matte)</option>
              <option value="0 2px 4px rgba(74, 46, 53, 0.15)">Subtle Blush Glow</option>
              <option value="2px 2px 4px rgba(184, 107, 119, 0.4)">Rose Gold Shadow</option>
              <option value="1px 1px 0px #FFF, 2px 2px 0px #AA820A, 3px 3px 5px rgba(0,0,0,0.25)">Royal Gold Emboss</option>
              <option value="2px 4px 6px rgba(0, 0, 0, 0.3)">Vintage Charcoal Drop</option>
            </select>
          </div>

          {/* Text Color HEX */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-wedding-charcoal-light uppercase tracking-wider block">Text Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={element.color || '#4A2E35'}
                onChange={(e) => updateElement(element.id, { color: e.target.value })}
                disabled={isLocked}
                className="w-8 h-8 rounded-lg border border-wedding-pink-medium/40 cursor-pointer overflow-hidden p-0"
              />
              <input
                type="text"
                value={element.color || '#4A2E35'}
                onChange={(e) => updateElement(element.id, { color: e.target.value })}
                disabled={isLocked}
                placeholder="#4A2E35"
                className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-wedding-pink-medium/40 text-wedding-charcoal-dark focus:outline-none uppercase font-mono"
              />
            </div>
          </div>

          {/* Line Height Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[10px] font-bold text-wedding-charcoal-light uppercase tracking-wider">
              <span>Line Height</span>
              <span>{element.lineHeight || 1.2}</span>
            </div>
            <input
              type="range"
              min="0.8"
              max="2.5"
              step="0.1"
              value={element.lineHeight || 1.2}
              onChange={(e) => updateElement(element.id, { lineHeight: parseFloat(e.target.value) })}
              disabled={isLocked}
              className="w-full accent-wedding-pink-dark h-1 bg-wedding-pink-light rounded-lg cursor-pointer"
            />
          </div>

          {/* Text Alignment grid */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-wedding-charcoal-light uppercase tracking-wider block">Alignment</label>
            <div className="grid grid-cols-4 border border-wedding-pink-medium/40 rounded-xl overflow-hidden divide-x divide-wedding-pink-medium/40 bg-white">
              {[
                { id: 'left', icon: AlignLeft },
                { id: 'center', icon: AlignCenter },
                { id: 'right', icon: AlignRight },
                { id: 'justify', icon: AlignJustify }
              ].map((align) => {
                const Icon = align.icon;
                const isSelected = (element.alignment || 'center') === align.id;
                return (
                  <button
                    key={align.id}
                    type="button"
                    onClick={() => updateElement(element.id, { alignment: align.id as any })}
                    disabled={isLocked}
                    className={`py-2 flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-wedding-pink-light/65 text-wedding-pink-dark font-bold'
                        : 'text-gray-400 hover:bg-wedding-pink-light/10 hover:text-wedding-charcoal-dark'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 2. Absolute Transform position coordinates */}
      <div className="space-y-4 pt-4 border-t border-wedding-pink-medium/20">
        <label className="text-[10px] font-bold text-wedding-charcoal-light uppercase tracking-wider block">Layout Position Vectors</label>
        
        {/* Row coordinates X/Y */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-gray-400">Position X (px)</span>
            <input
              type="number"
              value={element.x}
              onChange={(e) => handleCoordinateChange('x', e.target.value)}
              disabled={isLocked}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-wedding-pink-medium/40 text-wedding-charcoal-dark focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-gray-400">Position Y (px)</span>
            <input
              type="number"
              value={element.y}
              onChange={(e) => handleCoordinateChange('y', e.target.value)}
              disabled={isLocked}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-wedding-pink-medium/40 text-wedding-charcoal-dark focus:outline-none"
            />
          </div>
        </div>

        {/* Row coordinates Width/Height */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-gray-400">Width W (px)</span>
            <input
              type="number"
              value={element.width}
              onChange={(e) => handleCoordinateChange('width', e.target.value)}
              disabled={isLocked}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-wedding-pink-medium/40 text-wedding-charcoal-dark focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-gray-400">Height H (px)</span>
            <input
              type="number"
              value={element.height}
              onChange={(e) => handleCoordinateChange('height', e.target.value)}
              disabled={isLocked}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-wedding-pink-medium/40 text-wedding-charcoal-dark focus:outline-none"
            />
          </div>
        </div>

        {/* Row coordinates Rotate */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-gray-400">Rotation (deg)</span>
            <input
              type="number"
              value={element.rotation}
              min="0"
              max="360"
              onChange={(e) => handleCoordinateChange('rotation', e.target.value)}
              disabled={isLocked}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-wedding-pink-medium/40 text-wedding-charcoal-dark focus:outline-none"
            />
          </div>
          
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-gray-400">Layer depth (Z)</span>
            <div className="flex border border-wedding-pink-medium/40 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => bringToFront(element.id)}
                disabled={isLocked}
                className="flex-1 py-1.5 flex items-center justify-center text-wedding-charcoal-light hover:bg-wedding-pink-light/20 border-r border-wedding-pink-medium/40 text-xs font-semibold"
                title="Bring element to Front layer"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => sendToBack(element.id)}
                disabled={isLocked}
                className="flex-1 py-1.5 flex items-center justify-center text-wedding-charcoal-light hover:bg-wedding-pink-light/20 text-xs font-semibold"
                title="Send element to Back layer"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Opacity slider */}
        <div className="space-y-1.5 pt-2">
          <div className="flex justify-between items-center text-[10px] font-bold text-wedding-charcoal-light uppercase tracking-wider">
            <span>Opacity Alpha</span>
            <span>{Math.round(element.opacity * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={element.opacity}
            onChange={(e) => handleOpacityChange(e.target.value)}
            disabled={isLocked}
            className="w-full accent-wedding-pink-dark h-1 bg-wedding-pink-light rounded-lg cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
