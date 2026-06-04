import { API_URL, getImageUrl } from '@/config';
import React, { useRef, useCallback } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { CanvasElement } from '../../types';
import { ChevronUp, ChevronDown, Copy, Trash2, Plus } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════
   HANDLE TYPES
═══════════════════════════════════════════════════════════ */
type HandlePos =
  | 'nw' | 'n' | 'ne'
  | 'w' | 'e'
  | 'sw' | 's' | 'se'
  | 'rotate';

/* Map each handle to its CSS cursor */
const CURSORS: Record<HandlePos, string> = {
  nw: 'nw-resize', n: 'n-resize', ne: 'ne-resize',
  w: 'w-resize', e: 'e-resize',
  sw: 'sw-resize', s: 's-resize', se: 'se-resize',
  rotate: 'grab',
};

/* ═══════════════════════════════════════════════════════════
   SINGLE HANDLE DOT (stable, zoom-independent size)
═══════════════════════════════════════════════════════════ */
interface HandleProps {
  pos: HandlePos;
  style: React.CSSProperties;
  onMouseDown: (e: React.MouseEvent, pos: HandlePos) => void;
  displayScale: number;
}

const Handle = React.memo(({ pos, style, onMouseDown, displayScale }: HandleProps) => {
  const isRotate = pos === 'rotate';
  const size = 8 / displayScale;
  const borderWidth = 1.5 / displayScale;

  return (
    <div
      onMouseDown={(e) => onMouseDown(e, pos)}
      style={{
        position: 'absolute',
        width: size,
        height: size,
        background: isRotate ? '#AA820A' : '#fff',
        border: `${borderWidth}px solid ${isRotate ? '#AA820A' : '#C55B6C'}`,
        borderRadius: '50%',
        cursor: CURSORS[pos],
        zIndex: 10001,
        boxSizing: 'border-box',
        padding: 0,
        margin: 0,
        boxShadow: 'none',
        pointerEvents: 'auto',
        ...style,
      }}
    />
  );
});

Handle.displayName = 'Handle';

/* ═══════════════════════════════════════════════════════════
   SELECTION OVERLAY (border + all handles + coordinates)
═══════════════════════════════════════════════════════════ */
interface SelectionOverlayProps {
  elem: CanvasElement;
  displayScale: number;
  onResizeStart: (e: React.MouseEvent, elem: CanvasElement, pos: HandlePos) => void;
  onRotateStart: (e: React.MouseEvent, elem: CanvasElement) => void;
}

const SelectionOverlay = React.memo(({
  elem,
  displayScale,
  onResizeStart,
  onRotateStart,
}: SelectionOverlayProps) => {

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, pos: HandlePos) => {
      e.stopPropagation();
      e.preventDefault();

      if (pos === 'rotate') {
        onRotateStart(e, elem);
      } else {
        onResizeStart(e, elem, pos);
      }
    },
    [elem, onResizeStart, onRotateStart]
  );

  const half = 4 / displayScale;
  const borderWidth = 1.5 / displayScale;
  const rotateOffset = 16 / displayScale;

  return (
    <>
      {/* Selection Border */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          border: `${borderWidth}px solid #C55B6C`,
          pointerEvents: 'none',
          zIndex: 9999,
          boxSizing: 'border-box',
          padding: 0,
          margin: 0,
        }}
      />

      {/* Rotate Handle */}
      <Handle
        pos="rotate"
        displayScale={displayScale}
        onMouseDown={handleMouseDown}
        style={{
          top: -rotateOffset - half,
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      />

      {/* Rotate Line */}
      <div
        style={{
          position: 'absolute',
          top: -rotateOffset,
          left: '50%',
          width: borderWidth,
          height: rotateOffset,
          background: '#C55B6C',
          transform: 'translateX(-50%)',
          pointerEvents: 'none',
          zIndex: 9999,
        }}
      />

      {/* Corners */}
      <Handle
        pos="nw"
        displayScale={displayScale}
        onMouseDown={handleMouseDown}
        style={{ top: -half, left: -half }}
      />

      <Handle
        pos="ne"
        displayScale={displayScale}
        onMouseDown={handleMouseDown}
        style={{ top: -half, right: -half }}
      />

      <Handle
        pos="sw"
        displayScale={displayScale}
        onMouseDown={handleMouseDown}
        style={{ bottom: -half, left: -half }}
      />

      <Handle
        pos="se"
        displayScale={displayScale}
        onMouseDown={handleMouseDown}
        style={{ bottom: -half, right: -half }}
      />

      {/* Side Handles */}
      <Handle
        pos="n"
        displayScale={displayScale}
        onMouseDown={handleMouseDown}
        style={{
          top: -half,
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      />

      <Handle
        pos="s"
        displayScale={displayScale}
        onMouseDown={handleMouseDown}
        style={{
          bottom: -half,
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      />

      <Handle
        pos="w"
        displayScale={displayScale}
        onMouseDown={handleMouseDown}
        style={{
          left: -half,
          top: '50%',
          transform: 'translateY(-50%)',
        }}
      />

      <Handle
        pos="e"
        displayScale={displayScale}
        onMouseDown={handleMouseDown}
        style={{
          right: -half,
          top: '50%',
          transform: 'translateY(-50%)',
        }}
      />

      {/* Figma-style coordinate badge */}
      <div
        style={{
          position: 'absolute',
          bottom: -32 / displayScale,
          left: '50%',
          transform: `translateX(-50%) scale(${1 / displayScale})`,
          transformOrigin: 'center top',
          background: '#1E1E1E',
          color: '#FFFFFF',
          padding: '2px 8px',
          borderRadius: '4px',
          fontSize: '10px',
          fontWeight: '500',
          fontFamily: 'monospace',
          whiteSpace: 'nowrap',
          boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
          zIndex: 10002,
          pointerEvents: 'none',
        }}
      >
        W: {Math.round(elem.width)} | H: {Math.round(elem.height)} | X: {Math.round(elem.x)} | Y: {Math.round(elem.y)}
      </div>
    </>
  );
});

SelectionOverlay.displayName = 'SelectionOverlay';

/* Helper to render punctuation and English digits with a clean sans-serif font when a legacy font (like KAP series) is active */
function renderFormattedText(text: string, fontFamily: string) {
  const isLegacyFont = fontFamily.toLowerCase().startsWith('kap');
  if (!isLegacyFont) return text;

  // Split by any sequence of dots, commas, slashes, dashes, colons, brackets, quotes, and English numbers
  const parts = text.split(/([.,\/:\-()&?!"'()[\]{}<>0-9]+)/g);

  return parts.map((part, idx) => {
    const isSpecial = /^[.,\/:\-()&?!"'()[\]{}<>0-9]+$/.test(part);
    if (isSpecial) {
      return (
        <span key={idx} style={{ fontFamily: 'sans-serif' }}>
          {part}
        </span>
      );
    }
    return part;
  });
}

/* ═══════════════════════════════════════════════════════════
   MAIN CANVAS AREA
═══════════════════════════════════════════════════════════ */
export default function CanvasArea() {
  const {
    template,
    selectedPageIndex,
    selectedElementId,
    selectElement,
    updateElement,
    zoom,
    selectedLanguage,
    selectPage,
    reorderPages,
    addPage,
    duplicatePage,
    deletePage,
    pushHistory,
  } = useCanvasStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const snapGuideRef = useRef<HTMLDivElement>(null);

  const currentPage = template?.pages?.[selectedPageIndex];
  const selectedElement = currentPage?.elements?.find((el) => el.id === selectedElementId);

  const [prevSelectedId, setPrevSelectedId] = React.useState<string | null>(null);
  const [measuredTextHeight, setMeasuredTextHeight] = React.useState<number | null>(null);

  if (selectedElementId !== prevSelectedId) {
    setPrevSelectedId(selectedElementId);
    const initialHeight = (typeof document !== 'undefined' && selectedElementId)
      ? (document.getElementById(selectedElementId)?.clientHeight ?? null)
      : null;
    setMeasuredTextHeight(initialHeight);
  }

  React.useLayoutEffect(() => {
    if (!selectedElement || selectedElement.type !== 'text') {
      setMeasuredTextHeight(null);
      return;
    }

    const measure = () => {
      const domEl = document.getElementById(selectedElement.id);
      if (domEl) {
        setMeasuredTextHeight(domEl.clientHeight);
      }
    };

    measure();
    const timer = setTimeout(measure, 0);
    return () => clearTimeout(timer);
  }, [
    selectedElementId,
    selectedElement?.width,
    selectedElement?.text,
    selectedElement?.fontSize,
    selectedElement?.fontFamily,
    selectedElement?.lineHeight,
    selectedElement?.letterSpacing,
    selectedLanguage,
    selectedElement?.translations?.[selectedLanguage]
  ]);

  if (!template) return null;
  if (!currentPage) return null;

  const LOGICAL_W = 1080;
  const LOGICAL_H = 1920;
  const displayScale = zoom / 100;
  const displayW = LOGICAL_W * displayScale;
  const displayH = LOGICAL_H * displayScale;

  /* ─────────────────────────── helpers ─────────────────────────── */
  function showSnap(show: boolean) {
    if (snapGuideRef.current) {
      snapGuideRef.current.style.display = show ? 'block' : 'none';
    }
  }

  /* ─────────────────────────── DRAG ─────────────────────────── */
  const handleElementMouseDown = useCallback((
    e: React.MouseEvent,
    elem: CanvasElement
  ) => {
    selectElement(elem.id);
    if (elem.isLocked) return;

    e.preventDefault();
    e.stopPropagation();

    pushHistory();

    const startX = e.clientX;
    const startY = e.clientY;
    const initX = elem.x;
    const initY = elem.y;
    const SNAP = 12; // snap tolerance in logical px

    const onMove = (mv: MouseEvent) => {
      const dx = (mv.clientX - startX) / displayScale;
      const dy = (mv.clientY - startY) / displayScale;

      let newX = Math.round(initX + dx);
      let newY = Math.round(initY + dy);

      // Center-X snap
      const centerX = newX + elem.width / 2;
      if (Math.abs(centerX - 540) < SNAP) {
        newX = Math.round(540 - elem.width / 2);
        showSnap(true);
      } else {
        showSnap(false);
      }

      updateElement(elem.id, { x: newX, y: newY }, true);
    };

    const onUp = () => {
      showSnap(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [displayScale, selectElement, updateElement, pushHistory]);

  /* ─────────────────────────── RESIZE ─────────────────────────── */
  const handleResizeStart = useCallback((
    e: React.MouseEvent,
    elem: CanvasElement,
    pos: HandlePos
  ) => {
    e.preventDefault();
    e.stopPropagation();

    pushHistory();

    const startX = e.clientX;
    const startY = e.clientY;
    const iW = elem.width;
    const iH = elem.height;
    const iX = elem.x;
    const iY = elem.y;
    const iFS = elem.languageStyles?.[selectedLanguage]?.fontSize ?? elem.fontSize ?? 36;   // initial font size
    const isCorner = ['nw', 'ne', 'sw', 'se'].includes(pos);

    const onMove = (mv: MouseEvent) => {
      const dx = (mv.clientX - startX) / displayScale;
      const dy = (mv.clientY - startY) / displayScale;

      /* ── CORNERS → proportional fontSize scale ── */
      if (isCorner && elem.type === 'text') {
        let newW = iW, newH = iH, newX = iX, newY = iY;

        switch (pos) {
          case 'se': newW = iW + dx; newH = iH + dy; break;
          case 'sw': newW = iW - dx; newH = iH + dy; newX = iX + dx; break;
          case 'ne': newW = iW + dx; newH = iH - dy; newY = iY + dy; break;
          case 'nw': newW = iW - dx; newH = iH - dy; newX = iX + dx; newY = iY + dy; break;
        }

        newW = Math.max(40, newW);
        newH = Math.max(20, newH);

        // Scale fontSize proportionally to width change
        const scale = newW / iW;
        const newFontSize = Math.max(6, Math.round(iFS * scale));

        const updates: Partial<CanvasElement> = {
          x: Math.round(newX),
          y: Math.round(newY),
          width: Math.round(newW),
          height: Math.round(newH),
          fontSize: newFontSize,
        };

        if (elem.languageStyles) {
          updates.languageStyles = {
            ...elem.languageStyles,
            [selectedLanguage]: {
              ...(elem.languageStyles[selectedLanguage] || {}),
              fontSize: newFontSize,
            },
          };
        }

        updateElement(elem.id, updates, true);
        return;
      }

      /* ── STICKER/IMAGE CORNERS → proportional aspect ratio scale ── */
      if (isCorner && elem.type !== 'text') {
        let newW = iW, newH = iH, newX = iX, newY = iY;

        let dragChange = 0;
        switch (pos) {
          case 'se': dragChange = dx; break;
          case 'sw': dragChange = -dx; break;
          case 'ne': dragChange = dx; break;
          case 'nw': dragChange = -dx; break;
        }

        const scale = (iW + dragChange) / iW;
        newW = Math.max(20, iW * scale);
        newH = Math.max(20, iH * scale);

        // Adjust positions based on pinned corner
        if (pos === 'sw' || pos === 'nw') {
          newX = (iX + iW) - newW;
        }
        if (pos === 'ne' || pos === 'nw') {
          newY = (iY + iH) - newH;
        }

        updateElement(elem.id, {
          x: Math.round(newX),
          y: Math.round(newY),
          width: Math.round(newW),
          height: Math.round(newH),
        }, true);
        return;
      }

      /* ── SIDES → resize container only (no fontSize change) ── */
      let w = iW, h = iH, x = iX, y = iY;
      switch (pos) {
        case 'e': w = iW + dx; break;
        case 'w': w = iW - dx; x = iX + dx; break;
        case 's': h = iH + dy; break;
        case 'n': h = iH - dy; y = iY + dy; break;
      }
      updateElement(elem.id, {
        x: Math.round(x),
        y: Math.round(y),
        width: Math.max(40, Math.round(w)),
        height: Math.max(20, Math.round(h)),
      }, true);
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [displayScale, updateElement, selectedLanguage, pushHistory]);

  /* ─────────────────────────── ROTATE ─────────────────────────── */
  const handleRotateStart = useCallback((
    e: React.MouseEvent,
    elem: CanvasElement
  ) => {
    e.preventDefault();
    e.stopPropagation();

    pushHistory();

    // Center of element in screen coordinates
    const logicalCanvas = containerRef.current;
    if (!logicalCanvas) return;

    const rect = logicalCanvas.getBoundingClientRect();
    const centerX = rect.left + (elem.x + elem.width / 2) * displayScale;
    const centerY = rect.top + (elem.y + elem.height / 2) * displayScale;

    const onMove = (mv: MouseEvent) => {
      const angle = Math.atan2(
        mv.clientY - centerY,
        mv.clientX - centerX
      ) * (180 / Math.PI) + 90; // +90 because 0° = up

      updateElement(elem.id, { rotation: Math.round(angle) }, true);
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [displayScale, updateElement, pushHistory]);

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    dragItem.current = index;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    dragOverItem.current = index;
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
      const pages = [...template.pages];
      const draggedPage = pages[dragItem.current];
      pages.splice(dragItem.current, 1);
      pages.splice(dragOverItem.current, 0, draggedPage);
      
      reorderPages(pages);
      selectPage(dragOverItem.current);
    }
    dragItem.current = null;
    dragOverItem.current = null;
  };



  /* ─────────────────────────── RENDER ─────────────────────────── */
  return (
    <div
      className="flex-1 bg-[#F5F2EE] flex flex-col relative"
      onClick={() => selectElement(null)}
    >
      {/* A. Canvas Viewport (the scrollable space where the canvas sits) */}
      <div
        className="flex-1 overflow-auto flex items-center justify-center p-16 relative canvas-grid-pattern pb-12"
        onClick={() => selectElement(null)}
      >
        {/* Anchor container with the exact size of the canvas card */}
        <div
          style={{
            width: `${displayW}px`,
            height: `${displayH}px`,
            position: 'relative',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 1. Floating Page Actions Toolbar (above the canvas card, not scaled, crisp rendering) */}
          <div
            style={{
              position: 'absolute',
              top: -48,
              left: 0,
              right: 0,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              pointerEvents: 'auto',
              zIndex: 10005,
            }}
            className="bg-[#1E1E1E]/95 backdrop-blur-md border border-white/10 rounded-xl px-3 text-white shadow-xl select-none"
          >
            {/* Left: Page Index Indicator */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold text-wedding-gold-light tracking-wider uppercase font-mono">
                Page {selectedPageIndex + 1} of {template.pages.length}
              </span>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1">
              {/* Move Up */}
              <button
                type="button"
                onClick={() => {
                  if (selectedPageIndex > 0) {
                    const pages = [...template.pages];
                    const temp = pages[selectedPageIndex];
                    pages[selectedPageIndex] = pages[selectedPageIndex - 1];
                    pages[selectedPageIndex - 1] = temp;
                    reorderPages(pages);
                    selectPage(selectedPageIndex - 1);
                  }
                }}
                disabled={selectedPageIndex === 0}
                className="p-1.5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg transition-colors text-gray-300 hover:text-white"
                title="Move Page Up"
              >
                <ChevronUp className="w-4 h-4" />
              </button>

              {/* Move Down */}
              <button
                type="button"
                onClick={() => {
                  if (selectedPageIndex < template.pages.length - 1) {
                    const pages = [...template.pages];
                    const temp = pages[selectedPageIndex];
                    pages[selectedPageIndex] = pages[selectedPageIndex + 1];
                    pages[selectedPageIndex + 1] = temp;
                    reorderPages(pages);
                    selectPage(selectedPageIndex + 1);
                  }
                }}
                disabled={selectedPageIndex === template.pages.length - 1}
                className="p-1.5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg transition-colors text-gray-300 hover:text-white"
                title="Move Page Down"
              >
                <ChevronDown className="w-4 h-4" />
              </button>

              <span className="w-[1px] h-4 bg-white/10 mx-1" />

              {/* Duplicate */}
              <button
                type="button"
                onClick={() => {
                  duplicatePage(selectedPageIndex);
                }}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-gray-300 hover:text-white flex items-center gap-1 text-[11px] font-bold"
                title="Duplicate Page"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Duplicate</span>
              </button>

              {/* Delete */}
              <button
                type="button"
                onClick={() => {
                  if (template.pages.length > 1) {
                    deletePage(selectedPageIndex);
                  }
                }}
                disabled={template.pages.length <= 1}
                className="p-1.5 hover:bg-red-500/20 hover:text-red-300 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-300 rounded-lg transition-colors text-gray-300 flex items-center gap-1 text-[11px] font-bold"
                title="Delete Page"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>

              <span className="w-[1px] h-4 bg-white/10 mx-1" />

              {/* Add Page */}
              <button
                type="button"
                onClick={() => {
                  addPage();
                }}
                className="p-1.5 hover:bg-wedding-pink-dark/30 text-wedding-gold-light hover:text-white rounded-lg transition-colors flex items-center gap-1 text-[11px] font-extrabold"
                title="Add New Page"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Page</span>
              </button>
            </div>
          </div>

          {/* 2. The visible canvas card (clips background/elements inside card) */}
          <div
            style={{
              width: '100%',
              height: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
              overflow: 'hidden',
            }}
            className="bg-white border border-wedding-pink-medium/50 shadow-2xl"
          >
            {/* ── Logical 1080×1920 canvas layer (scaled down) ── */}
            <div
              ref={containerRef}
              style={{
                width: `${LOGICAL_W}px`,
                height: `${LOGICAL_H}px`,
                transform: `scale(${displayScale})`,
                transformOrigin: 'top left',
                position: 'absolute',
                top: 0,
                left: 0,
                overflow: 'hidden',
              }}
            >
              {/* Background image */}
              {currentPage.backgroundImage && (
                <img
                  src={getImageUrl(currentPage.backgroundImage)}
                  alt="Page background"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    pointerEvents: 'none',
                    userSelect: 'none',
                  }}
                />
              )}

              {/* Center snap guide (vertical dashed line) */}
              <div
                ref={snapGuideRef}
                style={{
                  display: 'none',
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: 540,
                  width: 1,
                  borderLeft: '2px dashed #AA820A',
                  zIndex: 9998,
                  pointerEvents: 'none',
                }}
              />

              {/* ── Elements ── */}
              {(currentPage.elements || []).map((elem) => {
                const isSelected = selectedElementId === elem.id;
                const isText = elem.type === 'text';
                const displayText = elem.translations?.[selectedLanguage] ?? elem.text ?? '';

                return (
                  <div
                    key={elem.id}
                    id={elem.id}
                    onMouseDown={(e) => handleElementMouseDown(e, elem)}
                    onClick={(e) => e.stopPropagation()}
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      width: elem.width,
                      height: isText ? 'auto' : elem.height,
                      minHeight: isText ? undefined : elem.height,
                      transform: `translate(${elem.x}px, ${elem.y}px) rotate(${elem.rotation ?? 0}deg)`,
                      transformOrigin: 'center',
                      opacity: elem.opacity ?? 1,
                      zIndex: elem.zIndex,
                      cursor: elem.isLocked ? 'not-allowed' : 'move',
                      overflow: 'visible', // Overflow visible so borders don't clip
                      boxSizing: 'border-box',
                      padding: 0,
                      margin: 0,
                      display: isText ? 'inline-block' : 'block',
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      MozUserSelect: 'none',
                    }}
                    className={
                      !isSelected && !elem.isLocked
                        ? 'hover:outline hover:outline-1 hover:outline-[#d49da5]'
                        : ''
                    }
                  >
                    {/* ── Text ── */}
                    {isText ? (
                      (() => {
                        const fontFamily = elem.languageStyles?.[selectedLanguage]?.fontFamily || elem.fontFamily || 'Rasa';
                        return (
                          <div
                            className="text-actual-content"
                            style={{
                              fontFamily: fontFamily,
                              fontSize: `${elem.languageStyles?.[selectedLanguage]?.fontSize ?? elem.fontSize ?? 36}px`,
                              color: elem.languageStyles?.[selectedLanguage]?.color || elem.color || '#4A2E35',
                              lineHeight: elem.languageStyles?.[selectedLanguage]?.lineHeight ?? elem.lineHeight ?? 1,
                              textAlign: (elem.languageStyles?.[selectedLanguage]?.alignment || elem.alignment as any) || 'center',
                              fontWeight: elem.languageStyles?.[selectedLanguage]?.fontWeight || elem.fontWeight || 'normal',
                              letterSpacing: elem.languageStyles?.[selectedLanguage]?.letterSpacing !== undefined
                                ? `${elem.languageStyles[selectedLanguage].letterSpacing}px`
                                : (elem.letterSpacing ? `${elem.letterSpacing}px` : '0px'),
                              textShadow: elem.languageStyles?.[selectedLanguage]?.textShadow || elem.textShadow || 'none',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                              overflowWrap: 'break-word',
                              display: 'block',
                              width: '100%',
                              height: 'auto',
                              margin: 0,
                              padding: 0,
                              overflow: 'visible',
                              boxSizing: 'border-box',
                              userSelect: 'none',
                              WebkitUserSelect: 'none',
                              MozUserSelect: 'none',
                            }}
                          >
                            {renderFormattedText(displayText, fontFamily)}
                          </div>
                        );
                      })()
                    ) : (
                      /* ── Sticker / Image ── */
                      <img
                        src={getImageUrl(elem.imagePath)}
                        alt="Element"
                        draggable={false}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          pointerEvents: 'none',
                          userSelect: 'none',
                          display: 'block',
                        }}
                        onError={(ev) => {
                          ev.currentTarget.src =
                            "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100' height='100' fill='%23FFD1D7'/><text x='50' y='55' font-size='24' text-anchor='middle'>🌺</text></svg>";
                        }}
                      />
                    )}

                    {/* ── Locked indicator ── */}
                    {isSelected && elem.isLocked && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          border: `${1.5 / displayScale}px dashed #888`,
                          pointerEvents: 'none',
                          zIndex: 9999,
                          boxSizing: 'border-box',
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Global Selection Overlay Layer (overflow: visible, so handles can extend outside the card) */}
          <div
            style={{
              width: `${LOGICAL_W}px`,
              height: `${LOGICAL_H}px`,
              transform: `scale(${displayScale})`,
              transformOrigin: 'top left',
              position: 'absolute',
              top: 0,
              left: 0,
              pointerEvents: 'none',
              overflow: 'visible',
              zIndex: 10000,
            }}
          >
            {/* Selected Element Overlay */}
            {selectedElement && !selectedElement.isLocked && (() => {
              const actualHeight = selectedElement.type === 'text'
                ? (measuredTextHeight ?? selectedElement.height ?? 50)
                : selectedElement.height;

              return (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: selectedElement.width,
                    height: actualHeight,
                    transform: `translate(${selectedElement.x}px, ${selectedElement.y}px) rotate(${selectedElement.rotation ?? 0}deg)`,
                    transformOrigin: 'center',
                    overflow: 'visible',
                    pointerEvents: 'none',
                  }}
                >
                  <SelectionOverlay
                    elem={{ ...selectedElement, height: actualHeight }}
                    displayScale={displayScale}
                    onResizeStart={handleResizeStart}
                    onRotateStart={handleRotateStart}
                  />
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* B. Storyboard Navigator Drawer */}
      <div className="h-32 bg-[#141213] border-t border-wedding-pink-medium/10 flex flex-col justify-center px-6 shrink-0 select-none">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-extrabold tracking-widest text-wedding-gold-light uppercase font-mono">
            Storyboard / Slide Navigator
          </span>
          <span className="text-[10px] text-gray-500 font-mono">
            Drag cards to reorder pages
          </span>
        </div>
        
        <div className="flex items-center gap-3 overflow-x-auto pb-1">
          {template.pages.map((page, idx) => {
            const isPageSelected = idx === selectedPageIndex;
            const scale = 0.055; // 1080 * 0.055 = 59.4px, 1920 * 0.055 = 105.6px
            
            return (
              <div
                key={page.id}
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={(e) => handleDrop(e, idx)}
                onClick={() => selectPage(idx)}
                className={`relative cursor-pointer transition-all duration-250 flex-shrink-0 group ${
                  isPageSelected
                    ? 'ring-2 ring-wedding-pink-dark scale-[1.03] shadow-lg shadow-wedding-pink-dark/20'
                    : 'hover:ring-1 hover:ring-white/20'
                }`}
                style={{
                  width: 60,
                  height: 106,
                  borderRadius: 4,
                  overflow: 'hidden',
                  background: '#201A1C',
                }}
              >
                {/* Scaled preview of the page background */}
                {page.backgroundImage && (
                  <img
                    src={getImageUrl(page.backgroundImage)}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  />
                )}
                
                {/* Scaled elements representation */}
                {(page.elements || []).map((el) => {
                  const isElText = el.type === 'text';
                  return (
                    <div
                      key={el.id}
                      style={{
                        position: 'absolute',
                        left: el.x * scale,
                        top: el.y * scale,
                        width: el.width * scale,
                        height: (isElText ? 40 : el.height) * scale,
                        background: isElText ? (el.color || '#AA820A') : '#FFFFFF40',
                        borderRadius: 1,
                        opacity: 0.6,
                      }}
                      className="pointer-events-none"
                    />
                  );
                })}

                {/* Page number badge */}
                <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-sm px-1 rounded text-[8px] font-extrabold text-white font-mono z-10">
                  {idx + 1}
                </div>
              </div>
            );
          })}
          
          {/* Add Page Card */}
          <button
            type="button"
            onClick={() => addPage()}
            className="w-[60px] h-[106px] flex-shrink-0 border border-dashed border-white/20 hover:border-wedding-pink-dark hover:bg-white/5 rounded flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-white transition-all duration-300"
          >
            <Plus className="w-4 h-4" />
            <span className="text-[8px] font-extrabold uppercase tracking-wider">Add</span>
          </button>
        </div>
      </div>
    </div>
  );
}
