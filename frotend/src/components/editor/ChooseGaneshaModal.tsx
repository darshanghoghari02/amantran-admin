import React, { useState, useEffect, useRef } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { useCanvasStore } from '../../store/canvasStore';

export default function ChooseGaneshaModal() {
  const {
    template,
    selectedPageIndex,
    imageChooserElementId,
    isImageChooserOpen,
    setImageChooserOpen,
    updateElement
  } = useCanvasStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [customImage, setCustomImage] = useState<string | null>(null);

  // Look up the active element's current image path to pre-select it
  const currentPage = template?.pages[selectedPageIndex];
  const targetElement = currentPage?.elements.find(el => el.id === imageChooserElementId);
  const currentImagePath = targetElement?.imagePath || '';

  // Determine active selected option key
  const [selectedKey, setSelectedKey] = useState<string>('');

  useEffect(() => {
    if (isImageChooserOpen && currentImagePath) {
      // 1. Map paths to their corresponding mockup preset cards
      if (currentImagePath === '/assets/images/stickers/ganesh4.png') {
        setSelectedKey('preset1');
        setSelectedImage('/assets/images/stickers/ganesh4.png');
      } else if (
        currentImagePath === '/assets/images/stickers/ganesh.png' || 
        currentImagePath === '/assets/images/stickers/ganesh1.png' || 
        currentImagePath === '/assets/images/stickers/ganesh2.png'
      ) {
        setSelectedKey('preset2');
        setSelectedImage('/assets/images/stickers/ganesh2.png'); // Use the high fidelity colorful asset
      } else if (currentImagePath === '/assets/images/stickers/ganesh3.png') {
        setSelectedKey('preset3');
        setSelectedImage('/assets/images/stickers/ganesh3.png');
      } else {
        // Truly custom uploaded file
        setSelectedKey('uploaded');
        setSelectedImage(currentImagePath);
        setCustomImage(currentImagePath);
      }
    }
  }, [isImageChooserOpen, currentImagePath]);

  if (!isImageChooserOpen || !template || !imageChooserElementId) return null;

  const handleSelectPreset = (key: string, path: string) => {
    setSelectedKey(key);
    setSelectedImage(path);
  };

  const handleConfirmSelection = () => {
    if (selectedImage) {
      updateElement(imageChooserElementId, { imagePath: selectedImage });
    }
    setImageChooserOpen(false);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`http://localhost:5000/api/uploads/single?type=template&categorySlug=wedding&templateSlug=${template.slug}`, {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      if (data.success) {
        setCustomImage(data.filePath);
        setSelectedKey('uploaded');
        setSelectedImage(data.filePath);
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch (err) {
      console.error('Image upload error:', err);
      alert('Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0E090B]/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
      {/* Dialogue box matches flutter AlertDialog decoration */}
      <div className="bg-white w-[320px] rounded-[24px] shadow-2xl p-5 overflow-hidden flex flex-col space-y-4">
        
        {/* Title */}
        <div className="text-center space-y-2 shrink-0">
          <h4 className="font-extrabold text-[15px] text-gray-800 tracking-tight">
            Choose Lord Ganesha Image
          </h4>
          <hr className="border-gray-200 w-full" />
        </div>

        {/* Option row matching buildOptionCard */}
        <div className="flex flex-row justify-between items-center gap-2 pt-1 shrink-0">
          {/* Preset 1 (Red outline Ganesha - ganesh4.png) */}
          <button
            onClick={() => handleSelectPreset('preset1', '/assets/images/stickers/ganesh4.png')}
            className={`w-[58px] h-[58px] p-1 bg-white border rounded-[10px] flex items-center justify-center transition-all ${
              selectedKey === 'preset1'
                ? 'border-[#F94C66] border-[1.5px]'
                : 'border-gray-300 border-[1.0px]'
            }`}
          >
            <img
              src="http://localhost:5000/assets/images/stickers/ganesh4.png"
              alt="Ganesha Red Outline"
              className="w-full h-full object-contain"
              onError={(e) => {
                e.currentTarget.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100' height='100' fill='%23FFD1D7'/><text x='50' y='55' font-size='24' text-anchor='middle'>🌺</text></svg>";
              }}
            />
          </button>

          {/* Preset 2 (Colorful sitting Ganesha - ganesh2.png) */}
          <button
            onClick={() => handleSelectPreset('preset2', '/assets/images/stickers/ganesh2.png')}
            className={`w-[58px] h-[58px] p-1 bg-white border rounded-[10px] flex items-center justify-center transition-all ${
              selectedKey === 'preset2'
                ? 'border-[#F94C66] border-[1.5px]'
                : 'border-gray-300 border-[1.0px]'
            }`}
          >
            <img
              src="http://localhost:5000/assets/images/stickers/ganesh2.png"
              alt="Ganesha Colorful"
              className="w-full h-full object-contain"
              onError={(e) => {
                e.currentTarget.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100' height='100' fill='%23FFD1D7'/><text x='50' y='55' font-size='24' text-anchor='middle'>🌺</text></svg>";
              }}
            />
          </button>

          {/* Preset 3 (Golden Ganesha - ganesh3.png) */}
          <button
            onClick={() => handleSelectPreset('preset3', '/assets/images/stickers/ganesh3.png')}
            className={`w-[58px] h-[58px] p-1 bg-white border rounded-[10px] flex items-center justify-center transition-all ${
              selectedKey === 'preset3'
                ? 'border-[#F94C66] border-[1.5px]'
                : 'border-gray-300 border-[1.0px]'
            }`}
          >
            <img
              src="http://localhost:5000/assets/images/stickers/ganesh3.png"
              alt="Ganesha Golden"
              className="w-full h-full object-contain"
              onError={(e) => {
                e.currentTarget.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100' height='100' fill='%23FFD1D7'/><text x='50' y='55' font-size='24' text-anchor='middle'>🌺</text></svg>";
              }}
            />
          </button>

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />

          {/* Upload Button Tile / Custom preview */}
          <button
            onClick={handleUploadClick}
            disabled={uploading}
            className={`w-[58px] h-[58px] p-1 bg-white border rounded-[10px] flex flex-col items-center justify-center transition-all ${
              selectedKey === 'uploaded'
                ? 'border-[#F94C66] border-[1.5px]'
                : 'border-gray-300 border-[1.0px]'
            }`}
          >
            {uploading ? (
              <Loader2 className="w-[18px] h-[18px] animate-spin text-[#F94C66]" />
            ) : selectedKey === 'uploaded' && customImage ? (
              <img
                src={`http://localhost:5000${customImage}`}
                alt="Custom uploaded"
                className="w-full h-full object-contain"
              />
            ) : (
              <>
                <Upload className="w-[18px] h-[18px] text-gray-700 stroke-[2.5]" />
                <span className="text-[9px] text-gray-700 font-medium mt-[2px] leading-none">
                  Upload
                </span>
              </>
            )}
          </button>
        </div>

        {/* Dialogue Actions */}
        <div className="flex flex-row justify-between gap-3 pt-3 shrink-0">
          <button
            type="button"
            onClick={() => setImageChooserOpen(false)}
            className="flex-1 py-2.5 rounded-full border border-gray-400 bg-white text-black hover:bg-gray-50 text-xs font-bold transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmSelection}
            disabled={!selectedImage || uploading}
            className="flex-1 py-2.5 rounded-full bg-[#F94C66] hover:bg-[#d83650] disabled:opacity-40 text-white text-xs font-extrabold shadow-sm transition-all"
          >
            Select
          </button>
        </div>

      </div>
    </div>
  );
}
