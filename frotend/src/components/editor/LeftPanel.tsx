import { API_URL, getImageUrl } from '@/config';
import React, { useState, useEffect } from 'react';
import { 
  Type, 
  Image as ImageIcon, 
  Layers, 
  Sparkles, 
  Info, 
  PlusCircle, 
  Trash2, 
  Upload, 
  Sticker,
  ArrowUp,
  ArrowDown,
  Copy,
  Languages,
  Plus
} from 'lucide-react';
import { useCanvasStore } from '../../store/canvasStore';
import { translateToAll } from '../../utils/translate';

const PROPER_WEDDING_PRESETS = [
  {
    name: "Ganesh Mantra",
    text: "OM SHREE GANESHAYA NAMAH",
    description: "Opening mantra for auspicious beginnings",
    fontFamily: "Rasa",
    fontSize: 28,
    fontWeight: "600",
    color: "#4A2E35",
    letterSpacing: 2
  },
  {
    name: "Wedding Title (Subh)",
    text: "SHUBH VIVAH",
    description: "Traditional Shubh Vivah header",
    fontFamily: "KAP011",
    fontSize: 48,
    fontWeight: "700",
    color: "#AA820A",
    letterSpacing: 1
  },
  {
    name: "Ceremony Header",
    text: "MANGAL PARINAY",
    description: "Mangal Parinay headline block",
    fontFamily: "KAP011",
    fontSize: 48,
    fontWeight: "700",
    color: "#AA820A",
    letterSpacing: 1
  },
  {
    name: "Couple Display Name",
    text: "Harmi  Weds  Kishan",
    description: "Perfect couples name placeholder",
    fontFamily: "Rasa",
    fontSize: 42,
    fontWeight: "700",
    color: "#B86B77"
  },
  {
    name: "Invitation Phrase",
    text: "Together with their families, they invite you to celebrate the wedding ceremony of their children.",
    description: "Formal wedding invitation detail block",
    fontFamily: "Rasa",
    fontSize: 26,
    fontWeight: "400",
    color: "#3D3B3C"
  },
  {
    name: "Events & Timeline",
    text: "Ganesh Sthapana - May 24, 2026\nMandap Muhurat - Time: 10:30 AM",
    description: "Ganesh sthapana schedule",
    fontFamily: "Rasa",
    fontSize: 26,
    fontWeight: "500",
    color: "#3D3B3C"
  },
  {
    name: "Ceremony Schedule",
    text: "Hast Melap: 5:30 PM\nWedding Feast: 7:00 PM Onwards",
    description: "Ceremony and feast timings",
    fontFamily: "Rasa",
    fontSize: 26,
    fontWeight: "500",
    color: "#3D3B3C"
  },
  {
    name: "Regards & RSVP Block",
    text: "With Warm Regards\nPatel Family | RSVP: +91 98765 43210",
    description: "Warm regards RSVP panel",
    fontFamily: "Rasa",
    fontSize: 26,
    fontWeight: "500",
    color: "#4A2E35"
  }
];

export default function LeftPanel() {
  const { 
    template, 
    selectedPageIndex, 
    selectPage, 
    addElement, 
    addPage, 
    deletePage, 
    updatePageBackground,
    duplicatePage,
    reorderPages,
    selectedLanguage
  } = useCanvasStore();

  const [activeTab, setActiveTab] = useState<'info' | 'text' | 'stickers' | 'photos' | 'pages'>('text');
  const [stickers, setStickers] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  
  // Custom text states
  const [customText, setCustomText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    // Fill initial local stickers from assets
    setStickers([
      '/assets/images/stickers/ganesh1.png',
      '/assets/images/stickers/ganesh2.png',
      '/assets/images/stickers/ganesh3.png',
      '/assets/images/stickers/ganesh4.png'
    ]);
  }, []);

  if (!template) return null;

  const handleAddText = async (preset: 'heading' | 'subheading' | 'body') => {
    setIsTranslating(true);
    let textVal = '';
    let fontFamily = 'Rasa';
    let fontSize = 32;
    let fontWeight = 'normal';
    let color = '#4A2E35';
    let yPos = 500;

    if (preset === 'heading') {
      textVal = 'MANGAL PARINAY';
      fontFamily = template.fonts[0] || 'KAP011';
      fontSize = 54;
      fontWeight = '700';
      color = '#D4AF37';
      yPos = 350;
    } else if (preset === 'subheading') {
      textVal = 'Save The Date';
      fontFamily = template.fonts[1] || 'Hind Vadodara';
      fontSize = 32;
      fontWeight = '600';
      color = '#B86B77';
      yPos = 500;
    } else {
      textVal = 'We cordially invite you to celebrate the wedding ceremony of our children. Please join us for dinner at 8 PM onwards.';
      fontFamily = 'Rasa';
      fontSize = 28;
      fontWeight = '400';
      color = '#4A2E35';
      yPos = 700;
    }

    try {
      const langs = template.languages && template.languages.length > 0 
        ? template.languages 
        : ['English', 'Hindi', 'Gujarati', 'Marathi', 'Tamil', 'Urdu'];
      
      const translations = await translateToAll(textVal, 'English', langs);

      addElement({
        type: 'text',
        x: 100,
        y: yPos,
        width: 880,
        height: preset === 'body' ? 200 : 100,
        rotation: 0,
        opacity: 1,
        isLocked: false,
        text: textVal,
        fontFamily,
        fontSize,
        color,
        fontWeight,
        alignment: 'center',
        translations
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleAddCustomText = async () => {
    if (!customText.trim()) return;
    setIsTranslating(true);

    try {
      const currentLang = selectedLanguage || 'English';
      const langs = template.languages && template.languages.length > 0 
        ? template.languages 
        : ['English', 'Hindi', 'Gujarati', 'Marathi', 'Tamil', 'Urdu'];

      const translations = await translateToAll(customText.trim(), currentLang, langs);

      addElement({
        type: 'text',
        x: 100,
        y: 600,
        width: 880,
        height: 150,
        rotation: 0,
        opacity: 1,
        isLocked: false,
        text: translations['English'] || customText.trim(),
        fontFamily: 'Rasa',
        fontSize: 32,
        color: '#4A2E35',
        fontWeight: 'normal',
        alignment: 'center',
        translations
      });

      setCustomText('');
    } catch (err) {
      console.error('Failed to add custom text:', err);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleAddPresetText = async (preset: typeof PROPER_WEDDING_PRESETS[0]) => {
    setIsTranslating(true);
    try {
      const langs = template.languages && template.languages.length > 0 
        ? template.languages 
        : ['English', 'Hindi', 'Gujarati', 'Marathi', 'Tamil', 'Urdu'];
      
      const translations = await translateToAll(preset.text, 'English', langs);

      addElement({
        type: 'text',
        x: 100,
        y: 450,
        width: 880,
        height: preset.text.includes('\n') ? 220 : 120,
        rotation: 0,
        opacity: 1,
        isLocked: false,
        text: preset.text,
        fontFamily: preset.fontFamily,
        fontSize: preset.fontSize,
        color: preset.color,
        fontWeight: preset.fontWeight,
        alignment: 'center',
        letterSpacing: preset.letterSpacing || 0,
        translations
      });
    } catch (err) {
      console.error('Failed to add preset text:', err);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleAddSticker = (imagePath: string) => {
    addElement({
      type: 'sticker',
      x: 440,
      y: 200,
      width: 200,
      height: 200,
      rotation: 0,
      opacity: 1,
      isLocked: false,
      imagePath
    });
  };

  const handleAddPhoto = (imagePath: string) => {
    addElement({
      type: 'image',
      x: 340,
      y: 400,
      width: 400,
      height: 400,
      rotation: 0,
      opacity: 1,
      isLocked: false,
      imagePath
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Direct call to local asset upload system (routes to backend/assets/images/wedding/royal_wedding)
      const res = await fetch(`${API_URL}/api/uploads/single?type=template&categorySlug=wedding&templateSlug=${template.slug}`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setUploadedPhotos(prev => [data.filePath, ...prev]);
        handleAddPhoto(data.filePath);
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch (err) {
      console.error('Photo upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_URL}/api/uploads/single?type=template&categorySlug=wedding&templateSlug=${template.slug}`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        updatePageBackground(data.filePath);
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch (err) {
      console.error('BG upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const tabs = [
    { id: 'info', name: 'Details', icon: Info },
    { id: 'text', name: 'Text Presets', icon: Type },
    { id: 'stickers', name: 'Stickers', icon: Sticker },
    { id: 'photos', name: 'Uploads', icon: ImageIcon },
    { id: 'pages', name: 'Page Setup', icon: Layers },
  ] as const;

  return (
    <div className="w-80 bg-white border-r border-wedding-pink-medium/40 flex shrink-0 shadow-sm z-10">
      {/* Icon Selector Left Column */}
      <div className="w-20 bg-wedding-charcoal-dark border-r border-[#3d2e31]/60 flex flex-col items-center py-6 gap-5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-300 ${
                isActive
                  ? 'bg-wedding-pink-dark text-wedding-gold-light'
                  : 'text-gray-400 hover:bg-wedding-charcoal-light hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="text-[9px] font-bold">{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* Tabs Drawer Details Column */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6">
        {activeTab === 'info' && (
          <div className="space-y-4">
            <h4 className="font-extrabold text-sm text-wedding-charcoal-dark uppercase tracking-wider">Template Information</h4>
            <div className="p-4 bg-wedding-pink-light/35 border border-wedding-pink-medium/30 rounded-2xl space-y-3">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Invitation Name</p>
                <p className="text-sm font-bold text-wedding-charcoal-dark">{template.name}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Identifier Slug</p>
                <p className="text-xs font-mono text-gray-600">{template.slug}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Assigned Fonts</p>
                <p className="text-xs text-gray-600 font-semibold">{template.fonts.join(', ')}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Assigned Languages</p>
                <p className="text-xs text-gray-600 font-semibold">{template.languages.join(', ')}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'text' && (
          <div className="space-y-4">
            <h4 className="font-extrabold text-sm text-wedding-charcoal-dark uppercase tracking-wider">Text Typographies</h4>
            <p className="text-xs text-gray-500 leading-relaxed">Insert custom text nodes into the current page.</p>

            {/* Auto Translation loading feedback banner */}
            {isTranslating && (
              <div className="p-3 bg-wedding-gold-accent/15 border border-wedding-gold-accent/45 text-wedding-gold-dark text-[10px] font-bold rounded-xl flex items-center justify-center gap-2 animate-pulse">
                <Languages className="w-3.5 h-3.5 animate-spin" />
                <span>✨ Auto-translating text across all languages...</span>
              </div>
            )}

            {/* Custom Text Area */}
            <div className="p-4 bg-wedding-pink-light/25 border border-wedding-pink-medium/30 rounded-2xl space-y-3">
              <label className="text-[10px] font-extrabold text-wedding-pink-dark uppercase tracking-wider block">
                ✨ Add Custom Text Box
              </label>
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Type your own custom wedding invitation text here..."
                rows={3}
                disabled={isTranslating}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-wedding-pink-medium/35 text-wedding-charcoal-dark focus:outline-none focus:ring-2 focus:ring-wedding-pink-dark/20 resize-none font-medium leading-relaxed"
              />
              <button
                onClick={handleAddCustomText}
                disabled={isTranslating || !customText.trim()}
                className="w-full py-2.5 px-4 bg-wedding-pink-dark hover:bg-wedding-pink-medium disabled:opacity-40 disabled:hover:bg-wedding-pink-dark text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-wedding-pink-dark/5"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                Add to Card
              </button>
            </div>

            {/* Predefined Heading/Subheading Typographies */}
            <div className="space-y-2.5 pt-1">
              <label className="text-[10px] font-extrabold text-wedding-charcoal-light uppercase tracking-wider block">
                Standard Styles
              </label>
              
              <div className="space-y-3">
                <button
                  onClick={() => handleAddText('heading')}
                  disabled={isTranslating}
                  className="w-full text-left p-4 border border-wedding-pink-medium/35 hover:border-wedding-pink-dark bg-white hover:bg-wedding-pink-light/10 rounded-2xl shadow-sm hover:shadow transition-all group disabled:opacity-50"
                >
                  <span className="block font-bold text-lg text-wedding-gold-dark font-accent leading-none group-hover:scale-105 transition-transform origin-left">
                    MANGAL PARINAY
                  </span>
                  <span className="text-[10px] text-gray-500 mt-1 block">Luxury Heading (Kap011 style)</span>
                </button>

                <button
                  onClick={() => handleAddText('subheading')}
                  disabled={isTranslating}
                  className="w-full text-left p-4 border border-wedding-pink-medium/35 hover:border-wedding-pink-dark bg-white hover:bg-wedding-pink-light/10 rounded-2xl shadow-sm hover:shadow transition-all group disabled:opacity-50"
                >
                  <span className="block font-bold text-sm text-wedding-pink-dark tracking-wide font-sans leading-none">
                    Save The Date
                  </span>
                  <span className="text-[10px] text-gray-500 mt-1 block">Subheading (Hind Vadodara style)</span>
                </button>

                <button
                  onClick={() => handleAddText('body')}
                  disabled={isTranslating}
                  className="w-full text-left p-4 border border-wedding-pink-medium/35 hover:border-wedding-pink-dark bg-white hover:bg-wedding-pink-light/10 rounded-2xl shadow-sm hover:shadow transition-all group disabled:opacity-50"
                >
                  <span className="block text-xs text-wedding-charcoal-light font-serif leading-relaxed line-clamp-2">
                    We cordially invite you to celebrate the wedding ceremony...
                  </span>
                  <span className="text-[10px] text-gray-500 mt-1 block">Body Invitation details (Rasa style)</span>
                </button>
              </div>
            </div>

            {/* Proper Wedding Presets */}
            <div className="space-y-2.5 pt-2">
              <label className="text-[10px] font-extrabold text-wedding-charcoal-light uppercase tracking-wider block">
                👑 Premium Wedding Card Presets
              </label>
              <div className="grid grid-cols-1 gap-2.5 max-h-[350px] overflow-y-auto pr-1">
                {PROPER_WEDDING_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAddPresetText(p)}
                    disabled={isTranslating}
                    className="w-full text-left p-3.5 border border-wedding-pink-medium/35 hover:border-wedding-pink-dark bg-white hover:bg-wedding-pink-light/10 rounded-2xl shadow-sm hover:shadow transition-all group flex flex-col justify-between disabled:opacity-50"
                  >
                    <span className="text-[10px] font-extrabold text-wedding-pink-dark uppercase tracking-wider">
                      {p.name}
                    </span>
                    <span className="block text-xs text-wedding-charcoal-dark font-semibold mt-1 font-serif line-clamp-2 leading-relaxed whitespace-pre-wrap">
                      {p.text}
                    </span>
                    <span className="text-[9px] text-gray-400 mt-1 block">
                      {p.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stickers' && (
          <div className="space-y-4">
            <h4 className="font-extrabold text-sm text-wedding-charcoal-dark uppercase tracking-wider">Wedding stickers</h4>
            <p className="text-xs text-gray-500 leading-relaxed">Add stamps, decals, frames, and vectors.</p>
            
            <div className="grid grid-cols-2 gap-3 pt-2">
              {stickers.map((st, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAddSticker(st)}
                  className="aspect-square p-4 bg-wedding-pink-light/20 hover:bg-wedding-pink-light/40 border border-wedding-pink-medium/30 hover:border-wedding-pink-dark rounded-2xl flex items-center justify-center transition-all group relative"
                >
                  <img 
                    src={getImageUrl(st)} 
                    alt="Sticker stamp" 
                    className="w-16 h-16 object-contain group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                      // Fallback SVG representation
                      e.currentTarget.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100' height='100' fill='%23FFD1D7'/><text x='50' y='55' font-size='24' text-anchor='middle'>🌺</text></svg>";
                    }}
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'photos' && (
          <div className="space-y-4">
            <h4 className="font-extrabold text-sm text-wedding-charcoal-dark uppercase tracking-wider">Custom Decals</h4>
            <p className="text-xs text-gray-500 leading-relaxed">Upload transparent PNG ornaments, banners, or family pictures.</p>
            
            <label className="w-full border-2 border-dashed border-wedding-pink-medium/40 hover:bg-wedding-pink-light/10 cursor-pointer p-6 rounded-2xl flex flex-col items-center justify-center transition-all bg-white">
              <Upload className="w-6 h-6 text-wedding-pink-dark mb-1" />
              <span className="text-[11px] font-bold text-wedding-charcoal-dark">
                {uploading ? 'Uploading...' : 'Upload Image Ornament'}
              </span>
              <input 
                type="file" 
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden" 
              />
            </label>

            {uploadedPhotos.length > 0 && (
              <div className="space-y-2.5">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Uploaded Photos</p>
                <div className="grid grid-cols-2 gap-3">
                  {uploadedPhotos.map((photo, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAddPhoto(photo)}
                      className="aspect-square bg-gray-50 border border-wedding-pink-medium/30 hover:border-wedding-pink-dark rounded-xl overflow-hidden shadow-sm flex items-center justify-center p-1 transition-all group"
                    >
                      <img 
                        src={getImageUrl(photo)} 
                        alt="Uploaded" 
                        className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform" 
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'pages' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-extrabold text-sm text-wedding-charcoal-dark uppercase tracking-wider">Page List</h4>
              <button
                onClick={() => addPage()}
                className="text-wedding-pink-dark hover:text-[#a0525e] font-extrabold text-xs flex items-center gap-0.5"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Add Page
              </button>
            </div>
            
            {/* List of designed pages */}
            <div className="space-y-3">
              {template.pages.map((p, idx) => {
                const isActive = selectedPageIndex === idx;
                return (
                  <div
                    key={p.id}
                    onClick={() => selectPage(idx)}
                    className={`p-3.5 border rounded-2xl cursor-pointer flex justify-between items-center group transition-all duration-300 ${
                      isActive
                        ? 'border-wedding-pink-dark bg-wedding-pink-light/35 shadow-sm font-bold text-wedding-pink-dark'
                        : 'border-wedding-pink-medium/25 hover:border-wedding-pink-medium/60 text-wedding-charcoal-light'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 bg-white border border-wedding-pink-medium/40 rounded-full flex items-center justify-center text-[10px] font-bold text-wedding-charcoal-light">
                        {idx + 1}
                      </span>
                      <span className="text-xs truncate max-w-[80px]">{p.name}</span>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Move Up */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (idx > 0) {
                            const newPages = [...template.pages];
                            const temp = newPages[idx];
                            newPages[idx] = newPages[idx - 1];
                            newPages[idx - 1] = temp;
                            reorderPages(newPages);
                            selectPage(idx - 1);
                          }
                        }}
                        disabled={idx === 0}
                        className="p-1 text-wedding-charcoal-light hover:bg-wedding-pink-light disabled:opacity-20 rounded-lg transition-colors"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      {/* Move Down */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (idx < template.pages.length - 1) {
                            const newPages = [...template.pages];
                            const temp = newPages[idx];
                            newPages[idx] = newPages[idx + 1];
                            newPages[idx + 1] = temp;
                            reorderPages(newPages);
                            selectPage(idx + 1);
                          }
                        }}
                        disabled={idx === template.pages.length - 1}
                        className="p-1 text-wedding-charcoal-light hover:bg-wedding-pink-light disabled:opacity-20 rounded-lg transition-colors"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Duplicate Page */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicatePage(idx);
                        }}
                        className="p-1 text-wedding-charcoal-light hover:bg-wedding-pink-light rounded-lg transition-colors"
                        title="Duplicate Page"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Page */}
                      {template.pages.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deletePage(idx);
                          }}
                          className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Page"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Current Page Background Controller */}
            <div className="pt-4 border-t border-wedding-pink-medium/20 space-y-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Page Background</p>
              
              {template.pages[selectedPageIndex]?.backgroundImage ? (
                <div className="relative group rounded-2xl overflow-hidden border border-wedding-pink-medium/40 aspect-[9/16] max-h-48 bg-gray-50 flex items-center justify-center">
                  <img 
                    src={getImageUrl(template.pages[selectedPageIndex].backgroundImage)} 
                    alt="Background" 
                    className="w-full h-full object-cover" 
                  />
                  <button
                    type="button"
                    onClick={() => updatePageBackground('')}
                    className="absolute inset-0 bg-red-950/40 opacity-0 group-hover:opacity-100 text-white text-[10px] font-bold flex items-center justify-center transition-opacity"
                  >
                    Clear Background
                  </button>
                </div>
              ) : (
                <div className="h-20 rounded-2xl border-2 border-dashed border-wedding-pink-medium/30 flex items-center justify-center bg-wedding-pink-light/10 text-xs text-wedding-pink-dark font-medium">
                  No Page Background
                </div>
              )}

              <label className="w-full border border-wedding-pink-medium/40 hover:bg-wedding-pink-light/20 cursor-pointer p-4 rounded-2xl flex items-center justify-center gap-2 transition-all text-xs font-bold text-wedding-charcoal-dark bg-white">
                <Upload className="w-4 h-4 text-wedding-pink-dark" />
                <span>Replace BG Image</span>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleBgUpload}
                  className="hidden" 
                />
              </label>

              {/* Background scale and fit guidelines card */}
              <div className="p-3.5 bg-wedding-pink-light/35 border border-wedding-pink-medium/30 rounded-2xl space-y-2 text-[10px] text-gray-600">
                <p className="font-extrabold uppercase tracking-wider text-wedding-pink-dark flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  Aspect Fit Standard
                </p>
                <p className="leading-relaxed">
                  Invitation backgrounds are constrained to a strict **1080x1920 (9:16) aspect ratio** to maintain premium Full HD portrait display and allow seamless printing templates.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
