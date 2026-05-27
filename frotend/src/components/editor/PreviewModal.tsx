import React, { useState, useEffect } from 'react';
import { 
  X, 
  Smartphone, 
  Monitor, 
  Play, 
  Pause, 
  ChevronLeft, 
  ChevronRight, 
  Languages, 
  Sparkles,
  Music,
  Volume2,
  VolumeX
} from 'lucide-react';
import { Template, CanvasElement } from '../../types';

interface PreviewModalProps {
  template: Template;
  selectedLanguage: string;
  setSelectedLanguage: (lang: string) => void;
  onClose: () => void;
}

export default function PreviewModal({ 
  template, 
  selectedLanguage, 
  setSelectedLanguage, 
  onClose 
}: PreviewModalProps) {
  const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('mobile');
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [soundOn, setSoundOn] = useState(false);

  const pages = template.pages || [];
  const currentPage = pages[activeIndex];

  // Auto-play slides logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && pages.length > 0) {
      interval = setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % pages.length);
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, pages.length]);

  // Keyboard navigation for slider
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, pages.length]);

  const handleNext = () => {
    if (pages.length === 0) return;
    setActiveIndex((prev) => (prev + 1) % pages.length);
  };

  const handlePrev = () => {
    if (pages.length === 0) return;
    setActiveIndex((prev) => (prev - 1 + pages.length) % pages.length);
  };

  // Dimensions of original logical canvas
  const LOGICAL_WIDTH = 1080;
  const LOGICAL_HEIGHT = 1920;

  // Scale calculations:
  // Mobile frame display: e.g. 340px width, so scale = 340 / 1080 = 0.3148
  const mobileWidth = 340;
  const mobileHeight = 604;
  const mobileScale = mobileWidth / LOGICAL_WIDTH;

  // Desktop slide view display inside list: e.g. 240px width
  const desktopCardWidth = 220;
  const desktopCardHeight = 391;
  const desktopScale = desktopCardWidth / LOGICAL_WIDTH;

  return (
    <div className="fixed inset-0 z-50 bg-[#0E090B]/95 backdrop-blur-lg flex flex-col overflow-hidden text-white">
      {/* 1. Designer Headbar Controls */}
      <div className="h-20 border-b border-white/5 bg-[#171013]/90 px-8 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-wedding-pink-dark to-wedding-gold-accent flex items-center justify-center shadow-lg shadow-wedding-pink-dark/20">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-wedding-gold-light uppercase tracking-widest leading-none">
              Immersive Presentation
            </h3>
            <p className="text-[10px] text-gray-400 font-medium mt-1">
              Live Preview & Sync • {template.name} ({pages.length} Pages)
            </p>
          </div>
        </div>

        {/* Center: View Switchers & Controls */}
        <div className="flex items-center gap-6">
          {/* View Modes */}
          <div className="flex items-center bg-[#251B1E] border border-white/5 p-1.5 rounded-2xl gap-1">
            <button
              onClick={() => setViewMode('mobile')}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all duration-300 ${
                viewMode === 'mobile'
                  ? 'bg-wedding-pink-dark text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              Mobile Frame
            </button>
            <button
              onClick={() => setViewMode('desktop')}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all duration-300 ${
                viewMode === 'desktop'
                  ? 'bg-wedding-pink-dark text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Monitor className="w-4 h-4" />
              Desktop Grid
            </button>
          </div>

          {/* Autoplay Slider Controls */}
          {viewMode === 'mobile' && (
            <div className="flex items-center bg-[#251B1E] border border-white/5 p-1 rounded-2xl gap-1">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`p-2.5 rounded-xl transition-colors ${
                  isPlaying ? 'bg-wedding-gold-accent text-wedding-charcoal-dark' : 'text-gray-300 hover:text-white'
                }`}
                title={isPlaying ? 'Pause Slideshow' : 'Play Slideshow'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <div className="h-6 w-px bg-white/10 mx-1"></div>
              <button
                onClick={() => setSoundOn(!soundOn)}
                className={`p-2.5 rounded-xl transition-colors text-gray-300 hover:text-white ${
                  soundOn ? 'text-wedding-gold-light' : ''
                }`}
                title="Toggle Wedding Music (Simulated)"
              >
                {soundOn ? <Volume2 className="w-4 h-4 animate-bounce" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>

        {/* Right Action buttons */}
        <div className="flex items-center gap-4">
          {/* Active preview language selector */}
          <div className="flex items-center gap-2 bg-[#251B1E] px-3.5 py-2 rounded-2xl border border-white/5">
            <Languages className="w-4 h-4 text-wedding-gold-light" />
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-transparent text-xs font-bold text-gray-200 focus:outline-none cursor-pointer pr-2"
            >
              {template.languages.map((lang) => (
                <option key={lang} value={lang} className="bg-[#171013] text-white font-bold">
                  {lang}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onClose}
            className="p-3 bg-white/5 hover:bg-white/15 border border-white/10 hover:border-white/20 text-gray-300 hover:text-white rounded-2xl transition-all"
            title="Exit Preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. Main Content Frame Viewport */}
      <div className="flex-1 overflow-y-auto flex items-center justify-center p-8 bg-radial-gradient">
        {viewMode === 'mobile' ? (
          <div className="flex flex-col items-center gap-6">
            {/* Interactive Mobile device shell mockup */}
            <div className="flex items-center gap-12">
              {/* Prev Navigation trigger */}
              <button
                onClick={handlePrev}
                className="w-14 h-14 bg-[#251B1E]/60 hover:bg-[#342429] border border-white/5 text-gray-300 hover:text-white flex items-center justify-center rounded-2xl transition-all hover:scale-105 shadow-xl"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>

              {/* Smartphone Frame Outer ring */}
              <div className="relative p-3.5 bg-gradient-to-b from-[#E2B755] via-[#A88024] to-[#E2B755] rounded-[52px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] border border-wedding-gold-accent/40">
                {/* Smartphone Internal border */}
                <div className="bg-[#0A0507] rounded-[42px] overflow-hidden relative border-4 border-[#120B0D]">
                  
                  {/* Speaker & camera sensor bar notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#120B0D] rounded-b-2xl z-50 flex items-center justify-center gap-1.5">
                    <div className="w-10 h-1 bg-[#2C2124] rounded-full"></div>
                    <div className="w-2.5 h-2.5 bg-[#170E10] rounded-full border border-gray-800"></div>
                  </div>

                  {/* High fidelity simulation viewport screen */}
                  <div 
                    style={{ width: `${mobileWidth}px`, height: `${mobileHeight}px` }} 
                    className="relative overflow-hidden bg-black select-none"
                  >
                    {currentPage ? (
                      <div className="w-full h-full relative transition-all duration-700 ease-out">
                        {/* Page background image */}
                        {currentPage.backgroundImage && (
                          <img 
                            src={`http://localhost:5000${currentPage.backgroundImage}`} 
                            alt="Background card template" 
                            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                          />
                        )}

                        {/* Rendering absolute child coordinates elements list */}
                        {currentPage.elements && currentPage.elements.map((elem) => {
                          const elementText = elem.translations?.[selectedLanguage] ?? elem.text ?? '';
                          return (
                            <div
                              key={elem.id}
                              style={{
                                position: 'absolute',
                                left: `${elem.x * mobileScale}px`,
                                top: `${elem.y * mobileScale}px`,
                                width: `${elem.width * mobileScale}px`,
                                height: `${elem.height * mobileScale}px`,
                                transform: `rotate(${elem.rotation}deg)`,
                                opacity: elem.opacity,
                                zIndex: elem.zIndex,
                              }}
                              className="flex items-center justify-center origin-center select-none"
                            >
                              {elem.type === 'text' ? (
                                <div
                                  style={{
                                    fontFamily: elem.fontFamily || 'Rasa',
                                    fontSize: `${(elem.fontSize || 36) * mobileScale}px`,
                                    color: elem.color || '#4A2E35',
                                    lineHeight: elem.lineHeight || 1.2,
                                    textAlign: elem.alignment || 'center',
                                    fontWeight: elem.fontWeight || 'normal',
                                    letterSpacing: elem.letterSpacing ? `${elem.letterSpacing * mobileScale}px` : undefined,
                                    textShadow: elem.textShadow || undefined,
                                  }}
                                  className="w-full h-full break-words whitespace-pre-wrap flex items-center justify-center font-medium leading-none select-none"
                                >
                                  {elementText}
                                </div>
                              ) : (
                                <img 
                                  src={`http://localhost:5000${elem.imagePath}`} 
                                  alt="Icon Graphic decal" 
                                  className="w-full h-full object-contain pointer-events-none select-none"
                                  onError={(e) => {
                                    e.currentTarget.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100' height='100' fill='%23FFD1D7'/><text x='50' y='55' font-size='24' text-anchor='middle'>🌺</text></svg>";
                                  }}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold text-xs uppercase">
                        No pages structured
                      </div>
                    )}
                  </div>

                  {/* Navigation dot overlays at bottom of screen */}
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-40">
                    {pages.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveIndex(i)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          activeIndex === i ? 'w-5 bg-wedding-gold-accent shadow-sm' : 'w-1.5 bg-white/40'
                        }`}
                      ></button>
                    ))}
                  </div>

                </div>
              </div>

              {/* Next Navigation trigger */}
              <button
                onClick={handleNext}
                className="w-14 h-14 bg-[#251B1E]/60 hover:bg-[#342429] border border-white/5 text-gray-300 hover:text-white flex items-center justify-center rounded-2xl transition-all hover:scale-105 shadow-xl"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </div>

            {/* Premium Simulated audio player bar */}
            {soundOn && (
              <div className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-[#E2B755]/10 border border-[#E2B755]/30 text-wedding-gold-light text-xs font-bold uppercase tracking-wider shadow-lg animate-pulse shadow-wedding-gold-accent/5">
                <Music className="w-4 h-4 animate-spin text-wedding-gold-light" />
                <span>Simulating Premium Shehnai/Instrumental Wedding Theme playing...</span>
              </div>
            )}

            {/* Slider progress label */}
            <p className="text-xs font-extrabold uppercase tracking-widest text-[#E2B755]">
              PAGE {activeIndex + 1} of {pages.length} • {currentPage?.name}
            </p>
          </div>
        ) : (
          /* Desktop Grid Layout View representing the storyboard flow */
          <div className="w-full max-w-7xl mx-auto space-y-8 py-6">
            <div className="text-center space-y-2">
              <h4 className="text-lg font-extrabold text-wedding-gold-light uppercase tracking-widest">
                Designed Storyboard Pipeline
              </h4>
              <p className="text-xs text-gray-400">
                Observe the elegant sequential wedding cards compiled across all 7 pages.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-6 justify-center">
              {pages.map((p, idx) => (
                <div 
                  key={p.id} 
                  className="flex flex-col items-center gap-3 bg-[#181113]/90 border border-white/5 p-4 rounded-3xl hover:border-wedding-pink-medium/40 transition-all hover:shadow-2xl hover:scale-[1.03] group duration-300 cursor-pointer"
                  onClick={() => {
                    setViewMode('mobile');
                    setActiveIndex(idx);
                  }}
                >
                  <div className="text-[10px] font-bold text-gray-400 group-hover:text-wedding-gold-light uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-4 h-4 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-[8px] text-gray-300">
                      {idx + 1}
                    </span>
                    {p.name}
                  </div>

                  {/* Thumbnail Scaled view box */}
                  <div 
                    style={{ width: `${desktopCardWidth}px`, height: `${desktopCardHeight}px` }} 
                    className="relative overflow-hidden bg-[#0A0507] border border-white/10 rounded-2xl shadow-md pointer-events-none select-none"
                  >
                    {p.backgroundImage && (
                      <img 
                        src={`http://localhost:5000${p.backgroundImage}`} 
                        alt="Bg template" 
                        className="absolute inset-0 w-full h-full object-cover pointer-events-none" 
                      />
                    )}

                    {p.elements && p.elements.map((elem) => {
                      const elementText = elem.translations?.[selectedLanguage] ?? elem.text ?? '';
                      return (
                        <div
                          key={elem.id}
                          style={{
                            position: 'absolute',
                            left: `${elem.x * desktopScale}px`,
                            top: `${elem.y * desktopScale}px`,
                            width: `${elem.width * desktopScale}px`,
                            height: `${elem.height * desktopScale}px`,
                            transform: `rotate(${elem.rotation}deg)`,
                            opacity: elem.opacity,
                            zIndex: elem.zIndex,
                          }}
                          className="flex items-center justify-center origin-center select-none"
                        >
                          {elem.type === 'text' ? (
                            <div
                              style={{
                                fontFamily: elem.fontFamily || 'Rasa',
                                fontSize: `${(elem.fontSize || 36) * desktopScale}px`,
                                color: elem.color || '#4A2E35',
                                lineHeight: elem.lineHeight || 1.2,
                                textAlign: elem.alignment || 'center',
                                fontWeight: elem.fontWeight || 'normal',
                                letterSpacing: elem.letterSpacing ? `${elem.letterSpacing * desktopScale}px` : undefined,
                                textShadow: elem.textShadow || undefined,
                              }}
                              className="w-full h-full break-words whitespace-pre-wrap flex items-center justify-center font-medium leading-none select-none"
                            >
                              {elementText}
                            </div>
                          ) : (
                            <img 
                              src={`http://localhost:5000${elem.imagePath}`} 
                              alt="Element Graphic icon" 
                              className="w-full h-full object-contain pointer-events-none select-none"
                              onError={(e) => {
                                e.currentTarget.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100' height='100' fill='%23FFD1D7'/><text x='50' y='55' font-size='24' text-anchor='middle'>🌺</text></svg>";
                              }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
