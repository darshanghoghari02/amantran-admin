import { API_URL, getImageUrl } from '@/config';
import React, { useRef, useCallback } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { CanvasElement } from '../../types';

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
   SINGLE HANDLE DOT  (stable, outside main component)
═══════════════════════════════════════════════════════════ */
interface HandleProps {
  pos: HandlePos;
  style: React.CSSProperties;
  onMouseDown: (e: React.MouseEvent, pos: HandlePos) => void;
}

const HANDLE_SIZE = 8;

const Handle = React.memo(({ pos, style, onMouseDown }: HandleProps) => {
  const isRotate = pos === 'rotate';

  return (
    <div
      onMouseDown={(e) => onMouseDown(e, pos)}
      style={{
        position: 'absolute',
        width: 8,
        height: 8,
        background: isRotate ? '#AA820A' : '#fff',
        border: `1.5px solid ${isRotate ? '#AA820A' : '#C55B6C'}`,
        borderRadius: '50%',
        cursor: CURSORS[pos],
        zIndex: 10001,
        boxSizing: 'border-box',
        padding: 0,
        margin: 0,
        boxShadow: 'none',
        ...style,
      }}
    />
  );
});

Handle.displayName = 'Handle';

/* ═══════════════════════════════════════════════════════════
   SELECTION OVERLAY  (border + all handles)
═══════════════════════════════════════════════════════════ */
interface SelectionOverlayProps {
  elem: CanvasElement;
  displayScale: number;
  onResizeStart: (e: React.MouseEvent, elem: CanvasElement, pos: HandlePos) => void;
  onRotateStart: (e: React.MouseEvent, elem: CanvasElement) => void;
}

const HALF = 4;
const HALF_SIDE = 4;

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

  return (
    <>
      {/* Selection Border */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          border: '1px solid #C55B6C',
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
        onMouseDown={handleMouseDown}
        style={{
          top: -16,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 8,
          height: 8,
          background: '#AA820A',
          border: '1px solid #AA820A',
        }}
      />

      {/* Rotate Line */}
      <div
        style={{
          position: 'absolute',
          top: -10,
          left: '50%',
          width: 1,
          height: 10,
          background: '#C55B6C',
          transform: 'translateX(-50%)',
          pointerEvents: 'none',
          zIndex: 9999,
        }}
      />

      {/* Corners */}
      <Handle
        pos="nw"
        onMouseDown={handleMouseDown}
        style={{ top: -HALF, left: -HALF }}
      />

      <Handle
        pos="ne"
        onMouseDown={handleMouseDown}
        style={{ top: -HALF, right: -HALF }}
      />

      <Handle
        pos="sw"
        onMouseDown={handleMouseDown}
        style={{ bottom: -HALF, left: -HALF }}
      />

      <Handle
        pos="se"
        onMouseDown={handleMouseDown}
        style={{ bottom: -HALF, right: -HALF }}
      />

      {/* Side Handles */}
      <Handle
        pos="n"
        onMouseDown={handleMouseDown}
        style={{
          top: -HALF_SIDE,
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      />

      <Handle
        pos="s"
        onMouseDown={handleMouseDown}
        style={{
          bottom: -HALF_SIDE,
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      />

      <Handle
        pos="w"
        onMouseDown={handleMouseDown}
        style={{
          left: -HALF_SIDE,
          top: '50%',
          transform: 'translateY(-50%)',
        }}
      />

      <Handle
        pos="e"
        onMouseDown={handleMouseDown}
        style={{
          right: -HALF_SIDE,
          top: '50%',
          transform: 'translateY(-50%)',
        }}
      />
    </>
  );
});

SelectionOverlay.displayName = 'SelectionOverlay';
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
  } = useCanvasStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const snapGuideRef = useRef<HTMLDivElement>(null);

  if (!template) return null;
  const currentPage = template.pages[selectedPageIndex];
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

      updateElement(elem.id, { x: newX, y: newY });
    };

    const onUp = () => {
      showSnap(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [displayScale, selectElement, updateElement]);

  /* ─────────────────────────── RESIZE ─────────────────────────── */
  const handleResizeStart = useCallback((
    e: React.MouseEvent,
    elem: CanvasElement,
    pos: HandlePos
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const iW = elem.width;
    const iH = elem.height;
    const iX = elem.x;
    const iY = elem.y;
    const iFS = elem.fontSize ?? 36;   // initial font size
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

        updateElement(elem.id, {
          x: Math.round(newX),
          y: Math.round(newY),
          width: Math.round(newW),
          height: Math.round(newH),
          fontSize: newFontSize,
        });
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
        });
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
      });
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [displayScale, updateElement]);

  /* ─────────────────────────── ROTATE ─────────────────────────── */
  const handleRotateStart = useCallback((
    e: React.MouseEvent,
    elem: CanvasElement
  ) => {
    e.preventDefault();
    e.stopPropagation();

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

      updateElement(elem.id, { rotation: Math.round(angle) });
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [displayScale, updateElement]);

  /* ─────────────────────────── RENDER ─────────────────────────── */
  return (
    <div
      className="flex-1 bg-[#F5F2EE] overflow-auto flex items-center justify-center p-8 relative canvas-grid-pattern"
      onClick={() => selectElement(null)}
    >
      {/* Scaled canvas wrapper */}
      <div
        style={{
          width: `${displayW}px`,
          height: `${displayH}px`,
          minWidth: `${displayW}px`,
          minHeight: `${displayH}px`,
          position: 'relative',
        }}
        className="bg-white border border-wedding-pink-medium/50 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
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
                onMouseDown={(e) => handleElementMouseDown(e, elem)}
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  left: elem.x,
                  top: elem.y,
                  width: elem.width,
                  // Text: auto-height so selection border hugs rendered text tightly.
                  // Images/stickers: keep the stored fixed height.
                  height: isText ? 'auto' : elem.height,
                  minHeight: isText ? undefined : elem.height,
                  transform: `rotate(${elem.rotation ?? 0}deg)`,
                  transformOrigin: 'top left',
                  opacity: elem.opacity ?? 1,
                  zIndex: elem.zIndex,
                  cursor: elem.isLocked ? 'not-allowed' : 'move',
                  overflow: 'visible',
                  boxSizing: 'border-box',
                  padding: 0,
                  margin: 0,
                  display: isText ? 'inline-block' : 'block',
                }}
                className={
                  !isSelected && !elem.isLocked
                    ? 'hover:outline hover:outline-1 hover:outline-[#d49da5]'
                    : ''
                }
              >
                {/* ── Text ── */}
                {isText ? (
                  <div
                    style={{
                      fontFamily: elem.languageStyles?.[selectedLanguage]?.fontFamily || elem.fontFamily || 'Rasa',
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
                      /* ── KEY FIX: block layout, auto height → selection hugs text ── */
                      display: 'block',
                      width: '100%',
                      height: 'auto',
                      margin: 0,
                      padding: 0,
                      overflow: 'visible',
                      boxSizing: 'border-box',
                    }}
                  >
                    {displayText}
                  </div>
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

                {/* ── Selection overlay with handles ── */}
                {isSelected && !elem.isLocked && (
                  <SelectionOverlay
                    elem={elem}
                    displayScale={displayScale}
                    onResizeStart={handleResizeStart}
                    onRotateStart={handleRotateStart}
                  />
                )}

                {/* ── Locked indicator ── */}
                {isSelected && elem.isLocked && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      border: '2px dashed #888',
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
    </div>
  );
}
