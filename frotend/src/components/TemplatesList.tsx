import { API_URL, getImageUrl } from '@/config';
import React, { useState, useEffect, useRef } from 'react';
import {
  PlusCircle,
  Copy,
  Trash2,
  Edit3,
  Sparkles,
  Eye,
  EyeOff,
  FolderHeart,
  Languages,
  Type,
  Upload,
  Palette,
  Search,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Template, Category, CustomFont, Language, User, SubscriptionPlan } from '../types';
import { useToastStore } from '../store/toastStore';

interface TemplatesListProps {
  onOpenEditor: (template: Template) => void;
  currentUser?: User;
}

export default function TemplatesList({ onOpenEditor, currentUser }: TemplatesListProps) {
  const hasPermission = (perm: string): boolean => {
    if (!currentUser) return false;
    const rId = currentUser.roleId || currentUser.role || 'user';
    if (rId === 'super_admin') return true;
    if (currentUser.permissions?.includes('*')) return true;
    return currentUser.permissions?.includes(perm) || false;
  };

  const authHeaders = {
    'Content-Type': 'application/json',
    'x-user-id': currentUser?.id || 'admin_super'
  };

  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [fonts, setFonts] = useState<CustomFont[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);

  const [loading, setLoading] = useState(true);
  const [selectedCatId, setSelectedCatId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const [showArrows, setShowArrows] = useState(false);

  const checkScrollable = () => {
    if (categoryScrollRef.current) {
      const { scrollWidth, clientWidth } = categoryScrollRef.current;
      setShowArrows(scrollWidth > clientWidth);
    }
  };

  useEffect(() => {
    checkScrollable();
    const timer = setTimeout(checkScrollable, 100);
    window.addEventListener('resize', checkScrollable);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkScrollable);
    };
  }, [categories]);

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      categoryScrollRef.current.scrollBy({ left: direction === 'left' ? -200 : 200, behavior: 'smooth' });
    }
  };
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isPremium, setIsPremium] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [selectedFonts, setSelectedFonts] = useState<string[]>([]);
  const [selectedLangs, setSelectedLangs] = useState<string[]>([]);

  // Pricing & Access State
  const [singlePurchasePrice, setSinglePurchasePrice] = useState(49);
  const [includedInMonthlyPlan, setIncludedInMonthlyPlan] = useState(true);
  const [includedInYearlyPlan, setIncludedInYearlyPlan] = useState(true);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlanIds, setSelectedPlanIds] = useState<string[]>([]);

  // File Upload State
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPath, setThumbnailPath] = useState('');
  const [bgFiles, setBgFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchInitialData();
  }, [selectedCatId]);

  async function fetchInitialData() {
    try {
      const catParam = selectedCatId ? `?categoryId=${selectedCatId}` : '';
      const headers = { 'x-user-id': currentUser?.id || 'admin_super' };
      const [resTpl, resCat, resFont, resLang, resPlans] = await Promise.all([
        fetch(`${API_URL}/api/templates${catParam}`, { headers }),
        fetch(`${API_URL}/api/categories`, { headers }),
        fetch(`${API_URL}/api/fonts`, { headers }),
        fetch(`${API_URL}/api/languages`, { headers }),
        fetch(`${API_URL}/api/subscriptions`, { headers })
      ]);

      const tplData = await resTpl.json();
      const catData = await resCat.json();
      const fontData = await resFont.json();
      const langData = await resLang.json();
      const plansData = await resPlans.json();

      setTemplates(Array.isArray(tplData) ? tplData : []);
      setCategories(Array.isArray(catData) ? catData : []);
      setFonts(Array.isArray(fontData) ? fontData.filter((f: any) => f.isActive) : []);
      setLanguages(Array.isArray(langData) ? langData.filter((l: any) => l.isActive) : []);
      setPlans(Array.isArray(plansData) ? plansData : []);
    } catch (error) {
      console.error('Failed to load templates data:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleNameChange = (val: string) => {
    setName(val);
    setSlug(val.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_'));
  };

  const handleFontSelect = (font: string) => {
    setSelectedFonts(prev =>
      prev.includes(font) ? prev.filter(f => f !== font) : [...prev, font]
    );
  };

  const handleLangSelect = (lang: string) => {
    setSelectedLangs(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  const handlePlanToggle = (planId: string) => {
    setSelectedPlanIds(prev =>
      prev.includes(planId) ? prev.filter(id => id !== planId) : [...prev, planId]
    );
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) {
      newErrors.name = 'Template name is required.';
    }
    if (!slug.trim()) {
      newErrors.slug = 'Slug is required.';
    } else if (!/^[a-z0-9_]+$/.test(slug)) {
      newErrors.slug = 'Slug can only contain lowercase letters, numbers, and underscores.';
    }
    if (!categoryId) {
      newErrors.categoryId = 'Category selection is required.';
    }
    if (isPremium) {
      const priceNum = Number(singlePurchasePrice);
      if (singlePurchasePrice === undefined || singlePurchasePrice === null || isNaN(priceNum) || priceNum < 0) {
        newErrors.singlePurchasePrice = 'Single purchase price must be a non-negative number.';
      }
    }
    
    // Thumbnail and page background checks
    if (!editingTemplate) {
      if (!thumbnailFile) {
        newErrors.thumbnailFile = 'Thumbnail file is required for new templates.';
      }
      if (!bgFiles || bgFiles.length === 0) {
        newErrors.bgFiles = 'At least one page background file is required for new templates.';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTemplate) {
      if (!hasPermission('templates.edit')) {
        useToastStore.getState().addToast('Access Denied. You lack the "templates.edit" permission.', 'warning');
        return;
      }
    } else {
      if (!hasPermission('templates.create')) {
        useToastStore.getState().addToast('Access Denied. You lack the "templates.create" permission.', 'warning');
        return;
      }
    }

    if (!validateForm()) {
      useToastStore.getState().addToast('Please resolve the errors in the form.', 'warning');
      return;
    }

    setUploading(true);

    try {
      // Find category slug to create dynamic folder structures
      const selectedCategory = categories.find(c => c.id === categoryId);
      const catSlug = selectedCategory ? selectedCategory.slug : 'uncategorized';
      const cleanTplSlug = slug;

      let finalThumbnail = '';
      let finalBgs: string[] = [];

      // 1. Upload Thumbnail Image
      if (thumbnailFile) {
        const thumbData = new FormData();
        thumbData.append('file', thumbnailFile);
        const resThumb = await fetch(`${API_URL}/api/uploads/single?type=template&categorySlug=${catSlug}&templateSlug=${cleanTplSlug}`, {
          method: 'POST',
          body: thumbData,
          headers: { 'x-user-id': currentUser?.id || 'admin_super' }
        });
        const thumbJson = await resThumb.json();
        if (thumbJson.success) {
          finalThumbnail = thumbJson.filePath;
        }
      }

      // 2. Upload Multi Page Background Images
      if (bgFiles && bgFiles.length > 0) {
        const bgData = new FormData();
        for (let i = 0; i < bgFiles.length; i++) {
          bgData.append('files', bgFiles[i]);
        }
        const resBg = await fetch(`${API_URL}/api/uploads/multiple?type=template&categorySlug=${catSlug}&templateSlug=${cleanTplSlug}`, {
          method: 'POST',
          body: bgData,
          headers: { 'x-user-id': currentUser?.id || 'admin_super' }
        });
        const bgJson = await resBg.json();
        if (bgJson.success) {
          finalBgs = bgJson.files.map((fileObj: any) => fileObj.filePath);
        }
      }

      // 3. Construct Pages array based on uploaded background images
      let initialPages = [];
      let finalBgsLocal = bgFiles && bgFiles.length > 0 ? [...finalBgs] : [];

      if (catSlug === 'wedding') {
        const defaultWeddingBgs = [
          '/assets/images/wedding/wedding/wedding_card1_1779500671593.jpg',
          '/assets/images/wedding/wedding/wedding_card2_1779500677943.jpg',
          '/assets/images/wedding/wedding/wedding_card3_1779500682145.jpg',
          '/assets/images/wedding/wedding/wedding_card4_1779500686841.jpg',
          '/assets/images/wedding/wedding/wedding_card5_1779500690915.jpg',
          '/assets/images/wedding/wedding/wedding_card6_1779500695707.jpg',
          '/assets/images/wedding/wedding/wedding_card7_1779500702094.jpg'
        ];

        if (finalBgsLocal.length === 0) {
          finalBgsLocal = defaultWeddingBgs;
        }

        initialPages = finalBgsLocal.map((bgUrl, index) => {
          switch (index) {
            case 0:
              return {
                id: `page_${Math.random().toString(36).substr(2, 9)}`,
                name: 'Cover Page',
                backgroundImage: bgUrl,
                elements: [
                  {
                    id: `elem_ganesh_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'sticker',
                    x: 440,
                    y: 180,
                    width: 200,
                    height: 200,
                    rotation: 0,
                    opacity: 1,
                    zIndex: 1,
                    isLocked: false,
                    imagePath: '/assets/images/stickers/ganesh.png'
                  },
                  {
                    id: `elem_cover_mantra_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'text',
                    x: 100,
                    y: 400,
                    width: 880,
                    height: 60,
                    rotation: 0,
                    opacity: 1,
                    zIndex: 2,
                    isLocked: false,
                    text: '|| શ્રી ગણેશાય નમઃ ||',
                    fontFamily: 'Hind Vadodara',
                    fontSize: 22,
                    color: '#AA820A',
                    lineHeight: 1.2,
                    alignment: 'center',
                    fontWeight: '600',
                    letterSpacing: 2,
                    translations: {
                      English: '|| OM SHREE GANESHAYA NAMAH ||',
                      Gujarati: '|| શ્રી ગણેશાય નમઃ ||',
                      Hindi: '|| શ્રી ગણેશાય નમઃ ||',
                      Marathi: '|| શ્રી ગણેશાય નમઃ ||',
                      Tamil: '|| શ્રી ગણેશાય નમઃ ||',
                      Urdu: '|| શ્રી ગણેશાય નમઃ ||'
                    }
                  },
                  {
                    id: `elem_cover_title_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'text',
                    x: 100,
                    y: 480,
                    width: 880,
                    height: 100,
                    rotation: 0,
                    opacity: 1,
                    zIndex: 3,
                    isLocked: false,
                    text: 'શુભ વિવાહ',
                    fontFamily: 'KAP011',
                    fontSize: 56,
                    color: '#8A1E2B',
                    lineHeight: 1.2,
                    alignment: 'center',
                    fontWeight: '700',
                    letterSpacing: 2,
                    translations: {
                      English: 'SHUBH VIVAH',
                      Gujarati: 'શુભ વિવાહ',
                      Hindi: 'શુભ વિવાહ',
                      Marathi: 'શુભ વિવાહ',
                      Tamil: 'શુભ વિવાહ',
                      Urdu: 'શુભ વિવાહ'
                    }
                  },
                  {
                    id: `elem_cover_bride_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'text',
                    x: 80,
                    y: 600,
                    width: 400,
                    height: 100,
                    rotation: 0,
                    opacity: 1,
                    zIndex: 4,
                    isLocked: false,
                    text: 'ચિ. હાર્મી',
                    fontFamily: 'KAP011',
                    fontSize: 44,
                    color: '#3E603B',
                    lineHeight: 1.2,
                    alignment: 'right',
                    fontWeight: '700',
                    letterSpacing: 0,
                    translations: {
                      English: 'Harmi',
                      Gujarati: 'ચિ. હાર્મી',
                      Hindi: 'ચિ. હાર્મી',
                      Marathi: 'ચિ. હાર્મી',
                      Tamil: 'ચિ. હાર્મી',
                      Urdu: 'ચિ. હાર્મી'
                    }
                  },
                  {
                    id: `elem_cover_weds_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'text',
                    x: 480,
                    y: 600,
                    width: 120,
                    height: 100,
                    rotation: 0,
                    opacity: 1,
                    zIndex: 4,
                    isLocked: false,
                    text: 'સંગ',
                    fontFamily: 'KAP011',
                    fontSize: 36,
                    color: '#3E603B',
                    lineHeight: 1.2,
                    alignment: 'center',
                    fontWeight: '700',
                    letterSpacing: 0,
                    translations: {
                      English: 'Weds',
                      Gujarati: 'સંગ',
                      Hindi: 'સંગ',
                      Marathi: 'સંગ',
                      Tamil: 'સંગ',
                      Urdu: 'સંગ'
                    }
                  },
                  {
                    id: `elem_cover_groom_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'text',
                    x: 600,
                    y: 600,
                    width: 400,
                    height: 100,
                    rotation: 0,
                    opacity: 1,
                    zIndex: 4,
                    isLocked: false,
                    text: 'ચિ. કિશન',
                    fontFamily: 'KAP011',
                    fontSize: 44,
                    color: '#3E603B',
                    lineHeight: 1.2,
                    alignment: 'left',
                    fontWeight: '700',
                    letterSpacing: 0,
                    translations: {
                      English: 'Kishan',
                      Gujarati: 'ચિ. કિશન',
                      Hindi: 'ચિ. કિશન',
                      Marathi: 'ચિ. કિશન',
                      Tamil: 'ચિ. કિશન',
                      Urdu: 'ચિ. કિશન'
                    }
                  },
                  {
                    id: `elem_cover_date_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'text',
                    x: 100,
                    y: 740,
                    width: 880,
                    height: 80,
                    rotation: 0,
                    opacity: 1,
                    zIndex: 5,
                    isLocked: false,
                    text: 'તા. ૨૩/૦૧/૨૦૨૬, શુક્રવાર',
                    fontFamily: 'Hind Vadodara',
                    fontSize: 24,
                    color: '#3D3B3C',
                    lineHeight: 1.3,
                    alignment: 'center',
                    fontWeight: '500',
                    letterSpacing: 1,
                    translations: {
                      English: 'Friday, January 23, 2026',
                      Gujarati: 'તા. ૨૩/૦૧/૨૦૨૬, શુક્રવાર',
                      Hindi: 'તા. ૨૩/૦૧/૨૦૨૬, શુક્રવાર',
                      Marathi: 'તા. ૨૩/૦૧/૨૦૨૬, શુક્રવાર',
                      Tamil: 'તા. ૨૩/૦૧/૨૦૨૬, શુક્રવાર',
                      Urdu: 'તા. ૨૩/૦૧/૨૦૨૬, શુક્રવાર'
                    }
                  },
                  {
                    id: `elem_cover_guest_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'text',
                    x: 100,
                    y: 840,
                    width: 880,
                    height: 80,
                    rotation: 0,
                    opacity: 1,
                    zIndex: 6,
                    isLocked: false,
                    text: 'સ્નેહી શ્રી, ...........................................',
                    fontFamily: 'Rasa',
                    fontSize: 22,
                    color: '#8A1E2B',
                    lineHeight: 1.2,
                    alignment: 'center',
                    fontWeight: '500',
                    letterSpacing: 0,
                    translations: {
                      English: 'To, ...........................................',
                      Gujarati: 'સ્નેહી શ્રી, ...........................................'
                    }
                  },
                  {
                    id: `elem_cover_inviter_title_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'text',
                    x: 100,
                    y: 940,
                    width: 880,
                    height: 60,
                    rotation: 0,
                    opacity: 1,
                    zIndex: 7,
                    isLocked: false,
                    text: 'નિમંત્રક',
                    fontFamily: 'Rasa',
                    fontSize: 26,
                    color: '#3E603B',
                    lineHeight: 1.2,
                    alignment: 'center',
                    fontWeight: 'bold',
                    letterSpacing: 0,
                    translations: {
                      English: 'Inviter',
                      Gujarati: 'નિમંત્રક'
                    }
                  },
                  {
                    id: `elem_cover_inviter_details_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'text',
                    x: 100,
                    y: 1010,
                    width: 880,
                    height: 200,
                    rotation: 0,
                    opacity: 1,
                    zIndex: 8,
                    isLocked: false,
                    text: 'કમલેશકુમાર કાંતિલાલ પટેલ\nવિણાબેન કમલેશકુમાર પટેલ\n૧૨, વિશ્વદૂપા સોસાયટી,\nસુમુલડેરી રોડ, સુરત.',
                    fontFamily: 'Rasa',
                    fontSize: 22,
                    color: '#8A1E2B',
                    lineHeight: 1.5,
                    alignment: 'center',
                    fontWeight: '500',
                    letterSpacing: 0,
                    translations: {
                      English: 'Kamleshkumar Kantilal Patel\nVinaben Kamleshkumar Patel\n12, Vishvadupa Society,\nSumul Dairy Road, Surat.',
                      Gujarati: 'કમલેશકુમાર કાંતિલાલ પટેલ\nવિણાબેન કમલેશકુમાર પટેલ\n૧૨, વિશ્વદૂપા સોસાયટી,\nસુમુલડેરી રોડ, સુરત.'
                    }
                  }
                ]
              };
            case 1:
              return {
                id: `page_${Math.random().toString(36).substr(2, 9)}`,
                name: 'Welcome Page',
                backgroundImage: bgUrl,
                elements: [
                  {
                    id: `elem_welcome_mantra_left_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'text',
                    x: 80,
                    y: 80,
                    width: 440,
                    height: 60,
                    rotation: 0,
                    opacity: 1,
                    zIndex: 1,
                    isLocked: false,
                    text: '|| શ્રી ગણેશાય નમઃ ||',
                    fontFamily: 'Hind Vadodara',
                    fontSize: 18,
                    color: '#AA820A',
                    lineHeight: 1.2,
                    alignment: 'left',
                    fontWeight: '600',
                    translations: {
                      English: '|| OM SHREE GANESHAYA NAMAH ||',
                      Gujarati: '|| શ્રી ગણેશાય નમઃ ||'
                    }
                  },
                  {
                    id: `elem_welcome_mantra_right_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'text',
                    x: 560,
                    y: 80,
                    width: 440,
                    height: 60,
                    rotation: 0,
                    opacity: 1,
                    zIndex: 2,
                    isLocked: false,
                    text: '|| ૐ નમઃ શિવાય ||',
                    fontFamily: 'Hind Vadodara',
                    fontSize: 18,
                    color: '#AA820A',
                    lineHeight: 1.2,
                    alignment: 'right',
                    fontWeight: '600',
                    translations: {
                      English: '|| OM NAMAH SHIVAYA ||',
                      Gujarati: '|| ૐ નમઃ શિવાય ||'
                    }
                  },
                  {
                    id: `elem_welcome_title_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'text',
                    x: 100,
                    y: 180,
                    width: 880,
                    height: 120,
                    rotation: 0,
                    opacity: 1,
                    zIndex: 3,
                    isLocked: false,
                    text: 'લગ્નોત્સવ',
                    fontFamily: 'KAP011',
                    fontSize: 58,
                    color: '#3E603B',
                    lineHeight: 1.2,
                    alignment: 'center',
                    fontWeight: '700',
                    letterSpacing: 1,
                    translations: {
                      English: 'Wedding Celebration',
                      Gujarati: 'લગ્નોત્સવ'
                    }
                  },
                  {
                    id: `elem_welcome_inviter_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'text',
                    x: 100,
                    y: 340,
                    width: 880,
                    height: 290,
                    rotation: 0,
                    opacity: 1,
                    zIndex: 4,
                    isLocked: false,
                    text: 'સહર્ષ ખુશાલી સાથે જણાવવાનું કે\nઅમારા કુલદેવી શ્રી વિંઝીઆ માતાની અસીમ કૃપા થી\n(વાનપ્રસ્થ નિવાસી) (હાલ સુરત)\nકમલેશકુમાર કાંતિલાલ પટેલ અને વિણાબેન કમલેશકુમાર પટેલ\nની સુપુત્રી',
                    fontFamily: 'Rasa',
                    fontSize: 22,
                    color: '#8A1E2B',
                    lineHeight: 1.6,
                    alignment: 'center',
                    fontWeight: '400',
                    letterSpacing: 0,
                    translations: {
                      English: 'With the blessings of family deity,\nwe are happy to announce the wedding ceremony of the daughter of\nKamleshkumar Kantilal Patel & Vinaben Kamleshkumar Patel',
                      Gujarati: 'સહર્ષ ખુશાલી સાથે જણાવવાનું કે\nઅમારા કુલદેવી શ્રી વિંઝીઆ માતાની અસીમ કૃપા થી\n(વાનપ્રસ્થ નિવાસી) (હાલ સુરત)\nકમલેશકુમાર કાંતિલાલ પટેલ અને વિણાબેન કમલેશકુમાર પટેલ\nની સુપુત્રી'
                    }
                  },
                  {
                    id: `elem_welcome_bride_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'text',
                    x: 80,
                    y: 650,
                    width: 400,
                    height: 100,
                    rotation: 0,
                    opacity: 1,
                    zIndex: 5,
                    isLocked: false,
                    text: 'ચિ. હાર્મી',
                    fontFamily: 'KAP011',
                    fontSize: 44,
                    color: '#3E603B',
                    lineHeight: 1.2,
                    alignment: 'right',
                    fontWeight: '700',
                    translations: {
                      English: 'Harmi',
                      Gujarati: 'ચિ. હાર્મી',
                      Hindi: 'ચિ. હાર્મી',
                      Marathi: 'ચિ. હાર્મી',
                      Tamil: 'ચિ. હાર્મી',
                      Urdu: 'ચિ. હાર્મી'
                    }
                  },
                  {
                    id: `elem_welcome_weds_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'text',
                    x: 480,
                    y: 650,
                    width: 120,
                    height: 100,
                    rotation: 0,
                    opacity: 1,
                    zIndex: 5,
                    isLocked: false,
                    text: 'સંગ',
                    fontFamily: 'KAP011',
                    fontSize: 36,
                    color: '#3E603B',
                    lineHeight: 1.2,
                    alignment: 'center',
                    fontWeight: '700',
                    translations: {
                      English: 'Weds',
                      Gujarati: 'સંગ',
                      Hindi: 'સંગ',
                      Marathi: 'સંગ',
                      Tamil: 'સંગ',
                      Urdu: 'સંગ'
                    }
                  },
                  {
                    id: `elem_welcome_groom_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'text',
                    x: 600,
                    y: 650,
                    width: 400,
                    height: 100,
                    rotation: 0,
                    opacity: 1,
                    zIndex: 5,
                    isLocked: false,
                    text: 'ચિ. કિશન',
                    fontFamily: 'KAP011',
                    fontSize: 44,
                    color: '#3E603B',
                    lineHeight: 1.2,
                    alignment: 'left',
                    fontWeight: '700',
                    translations: {
                      English: 'Kishan',
                      Gujarati: 'ચિ. કિશન',
                      Hindi: 'ચિ. કિશન',
                      Marathi: 'ચિ. કિશન',
                      Tamil: 'ચિ. કિશન',
                      Urdu: 'ચિ. કિશન'
                    }
                  },
                  {
                    id: `elem_welcome_groom_details_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'text',
                    x: 100,
                    y: 780,
                    width: 880,
                    height: 380,
                    rotation: 0,
                    opacity: 1,
                    zIndex: 6,
                    isLocked: false,
                    text: 'જોષીપુરા નિવાસી (ஹાલ સુરત)\nઅ.સૌ. નીલાબેન અને શ્રી રાજેશભાઈ નરસિંહભાઈ પટેલ\nના સુપુત્ર સાથે\nસંવત ૨૦૮૨ ને મહાસુદ ૬ ને શનિવાર તા. ૨૪/૦૧/૨૦૨૬\nના શુભદિને નિર્ધાર્યા છે.\nઆ શુભ પ્રસંગે નવદંપતિને આશીર્વાદ થી ભીંજવવા\nઆપશ્રી ને પધારવા ભાવભર્યું નમ્રું તેડું પાઠવી એ છીએ.',
                    fontFamily: 'Rasa',
                    fontSize: 22,
                    color: '#8A1E2B',
                    lineHeight: 1.6,
                    alignment: 'center',
                    fontWeight: '500',
                    translations: {
                      English: 'With the son of\nNilaben & Rajeshbhai Narsinhbhai Patel (Surat)\nScheduled on Saturday, Jan 24, 2026.\nWe cordially invite you to bless the newlywed couple.',
                      Gujarati: 'જોષીપુરા નિવાસી (હાલ સુરત)\nઅ.સૌ. નીલાબેન અને શ્રી રાજેશભાઈ નરસિંહભાઈ પટેલ\nના સુપુત્ર સાથે\nસંવત ૨૦૮૨ ને મહાસુદ ૬ ને શનિવાર તા. ૨૪/૦૧/૨૦૨૬\nના શુભદિને નિર્ધાર્યા છે.\nઆ શુભ પ્રસંગે નવદંપતિને આશીર્વાદ થી ભીંજવવા\nઆપશ્રી ને પધારવા ભાવભર્યું નમ્રું તેડું પાઠવી એ છીએ.'
                    }
                  }
                ]
              };
            case 2:
              return {
                id: `page_${Math.random().toString(36).substr(2, 9)}`,
                name: 'Mangalik Prasango Page',
                backgroundImage: bgUrl,
                elements: [
                  {
                    id: `elem_mangal_title_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'text',
                    x: 100,
                    y: 200,
                    width: 880,
                    height: 100,
                    rotation: 0,
                    opacity: 1,
                    zIndex: 1,
                    isLocked: false,
                    text: 'માંગલિક પ્રસંગો',
                    fontFamily: 'KAP011',
                    fontSize: 46,
                    color: '#3E603B',
                    lineHeight: 1.2,
                    alignment: 'center',
                    fontWeight: '700',
                    translations: {
                      English: 'Auspicious Ceremonies',
                      Gujarati: 'માંગલિક પ્રસંગો'
                    }
                  },
                  {
                    id: `elem_mangal_event1_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'text',
                    x: 80,
                    y: 360,
                    width: 440,
                    height: 250,
                    rotation: 0,
                    opacity: 1,
                    zIndex: 2,
                    isLocked: false,
                    text: 'ગણેશ સ્થાપના\nતા. ૨૩/૦૧/૨૦૨૬ ને શુક્રવાર\nસવારે ૯:૩૦ કલાકે',
                    fontFamily: 'Rasa',
                    fontSize: 24,
                    color: '#3E603B',
                    lineHeight: 1.4,
                    alignment: 'center',
                    fontWeight: '500',
                    translations: {
                      English: 'Ganesh Sthapana\nFriday, Jan 23, 2026\nTime: 9:30 AM',
                      Gujarati: 'ગણેશ સ્થાપના\nતા. ૨૩/૦૧/૨૦૨૬ ને શુક્રવાર\nસવારે ૯:૩૦ કલાકે'
                    }
                  },
                  {
                    id: `elem_mangal_event2_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'text',
                    x: 560,
                    y: 360,
                    width: 440,
                    height: 250,
                    rotation: 0,
                    opacity: 1,
                    zIndex: 3,
                    isLocked: false,
                    text: 'મંડપ મુહૂર્ત\nતા. ૨૩/૦૧/૨૦૨૬ ને શુક્રવાર\nસવારે ૯:૩૦ કલાકે',
                    fontFamily: 'Rasa',
                    fontSize: 24,
                    color: '#3E603B',
                    lineHeight: 1.4,
                    alignment: 'center',
                    fontWeight: '500',
                    translations: {
                      English: 'Mandap Muhurat\nFriday, Jan 23, 2026\nTime: 9:30 AM',
                      Gujarati: 'મંડપ મુહૂર્ત\nતા. ૨૩/૦૧/૨૦૨૬ ને શુક્રવાર\nસવારે ૯:૩૦ કલાકે'
                    }
                  },
                  {
                    id: `elem_mangal_event3_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'text',
                    x: 100,
                    y: 650,
                    width: 880,
                    height: 250,
                    rotation: 0,
                    opacity: 1,
                    zIndex: 4,
                    isLocked: false,
                    text: 'ગ્રહશાંતિ\nતા. ૨૩/૦૧/૨૦૨૬ ને શુક્રવાર\nસવારે ૧૦:૩૦ કલાકે\nઆ શુભ પ્રસંગે યોજેલ ભોજન સમારંભ\nબપોરે ૧૨:૦૦ કલાકે\nઆપ શ્રી ........ પધારશોજી',
                    fontFamily: 'Rasa',
                    fontSize: 24,
                    color: '#8A1E2B',
                    lineHeight: 1.5,
                    alignment: 'center',
                    fontWeight: '500',
                    translations: {
                      English: 'Grah Shanti\nFriday, Jan 23, 2026\nTime: 10:30 AM\nLunch: 12:00 PM\nYou are cordially invited',
                      Gujarati: 'ગ્રહશાંતિ\nતા. ૨૩/૦૧/૨૦૨૬ ને શુક્રવાર\nસવારે ૧૦:૩૦ કલાકે\nઆ શુભ પ્રસંગે યોજેલ ભોજન સમારંભ\nબપોરે ૧૨:૦૦ કલાકે\nઆપ શ્રી ........ પધારશોજી'
                    }
                  },
                  {
                    id: `elem_mangal_venue_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'text',
                    x: 100,
                    y: 930,
                    width: 880,
                    height: 200,
                    rotation: 0,
                    opacity: 1,
                    zIndex: 5,
                    isLocked: false,
                    text: 'શુભ સ્થળ\nકામધેનુ ગૌ જતન લોન્સ & રીસોર્ટ,\nબાયોનિક્સ સ્કુલની બાજુમાં,\nકેનાલ રોડ, લાડવી ગામ, સુરત.',
                    fontFamily: 'Rasa',
                    fontSize: 24,
                    color: '#8A1E2B',
                    lineHeight: 1.5,
                    alignment: 'center',
                    fontWeight: '500',
                    translations: {
                      English: 'Venue\nKamdhenu Gau Jatan Lawns & Resort,\nNext to Bionics School,\nCanal Road, Ladvi, Surat.',
                      Gujarati: 'શુભ સ્થળ\nકામધેનુ ગૌ જતન લોન્સ & રીસોર્ટ,\nબાયોનિક્સ સ્કુલની બાજુમાં,\nકેનાલ રોડ, લાડવી ગામ, સુરત.'
                    }
                  }
                ]
              };
            case 3:
              return {
                id: `page_${Math.random().toString(36).substr(2, 9)}`,
                name: 'Sangeet Sandhya Page',
                backgroundImage: bgUrl,
                elements: [
                  {
                    id: `elem_sangeet_title_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'text',
                    x: 100,
                    y: 200,
                    width: 880,
                    height: 100,
                    rotation: 0,
                    opacity: 1,
                    zIndex: 1,
                    isLocked: false,
                    text: 'સંગીત સંધ્યા',
                    fontFamily: 'KAP011',
                    fontSize: 46,
                    color: '#3E603B',
                    lineHeight: 1.2,
                    alignment: 'center',
                    fontWeight: '700',
                    translations: {
                      English: 'Sangeet Sandhya',
                      Gujarati: 'સંગીત સંધ્યા'
                    }
                  },
                  {
                    id: `elem_sangeet_poem_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'text',
                    x: 100,
                    y: 320,
                    width: 880,
                    height: 300,
                    rotation: 0,
                    opacity: 1,
                    zIndex: 2,
                    isLocked: false,
                    text: 'તંત્રીલા સૂર શરણાઈના સુરમાં ઉમંગા અજીજ છે,\nહાર્મી-કિશન તણા શાદી બહેન-સુજીજ્ઞા\nપ્રેમના તાંતણે ગુંથવા આતુર છે, આ "રાસ લીલા" માં\nઅવસરે તમારા સંગાથ સંગ રમવા "ચિ.હાર્મી" આતુર છે.\n"સંગીત સંધ્યા" ના મધુર પ્રસંગે આપણા આગમનને વધાવવા\nપટેલ પરિવાર આતુર છે.',
                    fontFamily: 'Rasa',
                    fontSize: 22,
                    color: '#8A1E2B',
                    lineHeight: 1.5,
                    alignment: 'center',
                    fontWeight: '400',
                    translations: {
                      English: "Join us for a beautiful musical night!\nThe family is excited to welcome you and dance together to celebrate Harmi and Kishan's pre-wedding festivities.",
                      Gujarati: 'તંત્રીલા સૂર શરણાઈના સુરમાં ઉમંગા અજીજ છે,\nહાર્મી-કિશન તણા શાદી બહેન-સુજીજ્ઞા\nપ્રેમના તાંતણે ગુંથવા આતુર છે, આ "રાસ લીલા" માં\nઅવસરે તમારા સંગાથ સંગ રમવા "ચિ.હાર્મી" આતુર છે.\n"સંગીત સંધ્યા" ના મધુર પ્રસંગે આપણા આગમનને વધાવવા\nપટેલ પરિવાર આતુર છે.'
                    }
                  },
                  {
                    id: `elem_sangeet_bride_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'text',
                    x: 80,
                    y: 640,
                    width: 400,
                    height: 100,
                    rotation: 0,
                    opacity: 1,
                    zIndex: 3,
                    isLocked: false,
                    text: 'ચિ. હાર્મી',
                    fontFamily: 'KAP011',
                    fontSize: 44,
                    color: '#3E603B',
                    lineHeight: 1.2,
                    alignment: 'right',
                    fontWeight: '700',
                    translations: {
                      English: 'Harmi',
                      Gujarati: 'ચિ. હાર્મી',
                      Hindi: 'ચિ. હાર્મી',
                      Marathi: 'ચિ. હાર્મી',
                      Tamil: 'ચિ. હાર્મી',
                      Urdu: 'ચિ. હાર્મી'
                    }
                  },
                  {
                    id: `elem_sangeet_weds_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'text',
                    x: 480,
                    y: 640,
                    width: 120,
                    height: 100,
                    rotation: 0,
                    opacity: 1,
                    zIndex: 3,
                    isLocked: false,
                    text: 'સંગ',
                    fontFamily: 'KAP011',
                    fontSize: 36,
                    color: '#3E603B',
                    lineHeight: 1.2,
                    alignment: 'center',
                    fontWeight: '700',
                    translations: {
                      English: 'Weds',
                      Gujarati: 'સંગ',
                      Hindi: 'સંગ',
                      Marathi: 'સંગ',
                      Tamil: 'સંગ',
                      Urdu: 'સંગ'
                    }
                  },
                  {
                    id: `elem_sangeet_groom_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'text',
                    x: 600,
                    y: 640,
                    width: 400,
                    height: 100,
                    rotation: 0,
                    opacity: 1,
                    zIndex: 3,
                    isLocked: false,
                    text: 'ચિ. કિશન',
                    fontFamily: 'KAP011',
                    fontSize: 44,
                    color: '#3E603B',
                    lineHeight: 1.2,
                    alignment: 'left',
                    fontWeight: '700',
                    translations: {
                      English: 'Kishan',
                      Gujarati: 'ચિ. કિશન',
                      Hindi: 'ચિ. કિશન',
                      Marathi: 'ચિ. કિશન',
                      Tamil: 'ચિ. કિશન',
                      Urdu: 'ચિ. કિશન'
                    }
                  },
                  {
                    id: `elem_sangeet_details_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'text',
                    x: 100,
                    y: 760,
                    width: 880,
                    height: 160,
                    rotation: 0,
                    opacity: 1,
                    zIndex: 4,
                    isLocked: false,
                    text: 'સૂર હિલોળે ઝુલાવશું, સૂર નૃત્ય સંધ્યામાં\nઆપવાનું ભાવભર્યું નિમંત્રણ છે.\nશુક્રવાર, તા. ૨૩-૦૧-૨૦૨૬ નાં રોજ\nસાંજે ૬:૦0 કલાકે',
                    fontFamily: 'Rasa',
                    fontSize: 22,
                    color: '#8A1E2B',
                    lineHeight: 1.5,
                    alignment: 'center',
                    fontWeight: '500',
                    translations: {
                      English: 'Join us for musical & dance night\nFriday, January 23, 2026\nTime: 6:00 PM',
                      Gujarati: 'સૂર હિલોળે ઝુલાવશું, સૂર નૃત્ય સંધ્યામાં\nઆપવાનું ભાવભર્યું નિમંત્રણ છે.\nશુક્રવાર, તા. ૨૩-૦૧-૨૦૨૬ નાં રોજ\nસાંજે ૬:૦0 કલાકે'
                    }
                  },
                  {
                    id: `elem_sangeet_bhojan_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'text',
                    x: 100,
                    y: 910,
                    width: 880,
                    height: 120,
                    rotation: 0,
                    opacity: 1,
                    zIndex: 5,
                    isLocked: false,
                    text: 'સ્વરૂચિ ભોજન સમારંભ\nસાંજે ૭:૩૦ કલાકે\nઆપશ્રી .......... પધારશોજી',
                    fontFamily: 'Rasa',
                    fontSize: 22,
                    color: '#8A1E2B',
                    lineHeight: 1.4,
                    alignment: 'center',
                    fontWeight: '500',
                    translations: {
                      English: 'Svaruchi Bhojan\nTime: 7:30 PM\nPlease join us',
                      Gujarati: 'સ્વરૂચિ ભોજન સમારંભ\nસાંજે ૭:૩૦ કલાકે\nઆપશ્રી .......... પધારશોજી'
                    }
                  },
                  {
                    id: `elem_sangeet_venue_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'text',
                    x: 100,
                    y: 1030,
                    width: 880,
                    height: 160,
                    rotation: 0,
                    opacity: 1,
                    zIndex: 6,
                    isLocked: false,
                    text: 'શુભ સ્થળ\nકામધેનુ ગૌ જતન લોન્સ & રીસોર્ટ,\nબાયોનિક્સ સ્કુલની બાજુમાં,\nકેનાલ રોડ, લાડવી ગામ, સુરત.',
                    fontFamily: 'Rasa',
                    fontSize: 22,
                    color: '#8A1E2B',
                    lineHeight: 1.5,
                    alignment: 'center',
                    fontWeight: '500',
                    translations: {
                      English: 'Venue\nKamdhenu Gau Jatan Lawns & Resort,\nNext to Bionics School,\nCanal Road, Ladvi, Surat.',
                      Gujarati: 'શુભ સ્થળ\nકામધેનુ ગૌ જતન લોન્સ & રીસોર્ટ,\nબાયોનિક્સ સ્કુલની બાજુમાં,\nકેનાલ રોડ, લાડવી ગામ, સુરત.'
                    }
                  }
                ]
              };
            case 4:
              return {
                id: `page_${Math.random().toString(36).substr(2, 9)}`,
                name: 'Parinay Utsav Page',
                backgroundImage: bgUrl,
                elements: [
                  {
                    id: `elem_parinay_title_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'text',
                    x: 100,
                    y: 200,
                    width: 880,
                    height: 100,
                    rotation: 0,
                    opacity: 1,
                    zIndex: 1,
                    isLocked: false,
                    text: 'પરિણય ઉત્સવ',
                    fontFamily: 'KAP011',
                    fontSize: 46,
                    color: '#3E603B',
                    lineHeight: 1.2,
                    alignment: 'center',
                    fontWeight: '700',
                    translations: {
                      English: 'Wedding Ceremony',
                      Gujarati: 'પરિણય ઉત્સવ'
                    }
                  },
                  {
                    id: `elem_parinay_intro_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'text',
                    x: 100,
                    y: 310,
                    width: 880,
                    height: 100,
                    rotation: 0,
                    opacity: 1,
                    zIndex: 2,
                    isLocked: false,
                    text: 'લગ્ન એ બે આત્માનું મિલન છે.\nસ્વર્ગમાં રચાય છે. અને પૃથ્વી પર ઉજવાય છે.',
                    fontFamily: 'Rasa',
                    fontSize: 22,
                    color: '#8A1E2B',
                    lineHeight: 1.5,
                    alignment: 'center',
                    fontWeight: '500',
                    translations: {
                      English: 'Marriage is a union of two souls.\nMade in heaven, celebrated on earth.',
                      Gujarati: 'લગ્ન એ બે આત્માનું મિલન છે.\nસ્વર્ગમાં રચાય છે. અને પૃથ્વી પર ઉજવાય છે.'
                    }
                  },
                  {
                    id: `elem_parinay_bride_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'text',
                    x: 80,
                    y: 430,
                    width: 400,
                    height: 100,
                    rotation: 0,
                    opacity: 1,
                    zIndex: 3,
                    isLocked: false,
                    text: 'ચિ. હાર્મી',
                    fontFamily: 'KAP011',
                    fontSize: 44,
                    color: '#3E603B',
                    lineHeight: 1.2,
                    alignment: 'right',
                    fontWeight: '700',
                    translations: {
                      English: 'Harmi',
                      Gujarati: 'ચિ. હાર્મી',
                      Hindi: 'ચિ. હાર્મી',
                      Marathi: 'ચિ. હાર્મી',
                      Tamil: 'ચિ. હાર્મી',
                      Urdu: 'ચિ. હાર્મી'
                    }
                  },
                  {
                    id: `elem_parinay_weds_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'text',
                    x: 480,
                    y: 430,
                    width: 120,
                    height: 100,
                    rotation: 0,
                    opacity: 1,
                    zIndex: 3,
                    isLocked: false,
                    text: 'સંગ',
                    fontFamily: 'KAP011',
                    fontSize: 36,
                    color: '#3E603B',
                    lineHeight: 1.2,
                    alignment: 'center',
                    fontWeight: '700',
                    translations: {
                      English: 'Weds',
                      Gujarati: 'સંગ',
                      Hindi: 'સંગ',
                      Marathi: 'સંગ',
                      Tamil: 'સંગ',
                      Urdu: 'સંગ'
                    }
                  },
                  {
                    id: `elem_parinay_groom_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'text',
                    x: 600,
                    y: 430,
                    width: 400,
                    height: 100,
                    rotation: 0,
                    opacity: 1,
                    zIndex: 3,
                    isLocked: false,
                    text: 'ચિ. કિશન',
                    fontFamily: 'KAP011',
                    fontSize: 44,
                    color: '#3E603B',
                    lineHeight: 1.2,
                    alignment: 'left',
                    fontWeight: '700',
                    translations: {
                      English: 'Kishan',
                      Gujarati: 'ચિ. કિશન',
                      Hindi: 'ચિ. કિશન',
                      Marathi: 'ચિ. કિશન',
                      Tamil: 'ચિ. કિશન',
                      Urdu: 'ચિ. કિશન'
                    }
                  },
                  {
                    id: `elem_parinay_under_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'text',
                    x: 100,
                    y: 540,
                    width: 880,
                    height: 100,
                    rotation: 0,
                    opacity: 1,
                    zIndex: 4,
                    isLocked: false,
                    text: 'ના શુભ લગ્ન પ્રસંગે આશીર્ભૂત શુભવિવાહ સમારંભ માં\nશનિવાર તા. ૨૪/૦૧/૨૦૨૬ ના રોજ',
                    fontFamily: 'Rasa',
                    fontSize: 22,
                    color: '#8A1E2B',
                    lineHeight: 1.5,
                    alignment: 'center',
                    fontWeight: '500',
                    translations: {
                      English: 'On their auspicious wedding ceremony\nSaturday, January 24, 2026',
                      Gujarati: 'ના શુભ લગ્ન પ્રસંગે આશીર્ભૂત શુભવિવાહ સમારંભ માં\nશનિવાર તા. ૨૪/૦૧/૨૦૨૬ ના રોજ'
                    }
                  },
                  {
                    id: `elem_parinay_left_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'text',
                    x: 80,
                    y: 670,
                    width: 440,
                    height: 160,
                    rotation: 0,
                    opacity: 1,
                    zIndex: 5,
                    isLocked: false,
                    text: 'જાન આગમન\nતા. ૨૪/૦૧/૨૦૨૬ ને શનિવાર\nસાંજે ૫:૦૦ કલાકે',
                    fontFamily: 'Rasa',
                    fontSize: 22,
                    color: '#3E603B',
                    lineHeight: 1.4,
                    alignment: 'center',
                    translations: {
                      English: 'Jaan Aagman\nSaturday, Jan 24, 2026\nTime: 5:00 PM',
                      Gujarati: 'જાન આગમન\nતા. ૨૪/૦૧/૨૦૨૬ ને શનિવાર\nસાંજે ૫:૦૦ કલાકે'
                    }
                  },
                  {
                    id: `elem_parinay_right_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'text',
                    x: 560,
                    y: 670,
                    width: 440,
                    height: 160,
                    rotation: 0,
                    opacity: 1,
                    zIndex: 6,
                    isLocked: false,
                    text: 'હસ્ત મેળાપ\nતા. ૨૪/૦૧/૨૦૨૬ ને શનિવાર\nસાંજે ૬:૩૦ કલાકે',
                    fontFamily: 'Rasa',
                    fontSize: 22,
                    color: '#3E603B',
                    lineHeight: 1.4,
                    alignment: 'center',
                    translations: {
                      English: 'Hast Melap\nSaturday, Jan 24, 2026\nTime: 6:30 PM',
                      Gujarati: 'હસ્ત મેળાપ\nતા. ૨૪/૦૧/૨૦૨૬ ને શનિવાર\nસાંજે ૬:૩૦ કલાકે'
                    }
                  },
                  {
                    id: `elem_parinay_bhojan_left_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'text',
                    x: 80,
                    y: 860,
                    width: 440,
                    height: 180,
                    rotation: 0,
                    opacity: 1,
                    zIndex: 7,
                    isLocked: false,
                    text: 'સ્વરૂચિ ભોજન\nસાંજે ૭:૩૦ કલાકે\nઆપશ્રી .......... પધારશોજી',
                    fontFamily: 'Rasa',
                    fontSize: 22,
                    color: '#8A1E2B',
                    lineHeight: 1.4,
                    alignment: 'center',
                    translations: {
                      English: 'Feast Invitation\nTime: 7:30 PM\nPlease join us',
                      Gujarati: 'સ્વરૂચિ ભોજન\nસાંજે ૭:૩૦ કલાકે\nઆપશ્રી .......... પધારશોજી'
                    }
                  },
                  {
                    id: `elem_parinay_sthala_right_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'text',
                    x: 560,
                    y: 860,
                    width: 440,
                    height: 180,
                    rotation: 0,
                    opacity: 1,
                    zIndex: 8,
                    isLocked: false,
                    text: 'લગ્ન સ્થળ\nકામધેનુ ગૌ જતન લોન્સ & રીસોર્ટ,\nબાયોનિક્સ સ્કુલની બાજુમાં,\nકેનાલ રોડ, લાડવી ગામ, સુરત.',
                    fontFamily: 'Rasa',
                    fontSize: 22,
                    color: '#8A1E2B',
                    lineHeight: 1.4,
                    alignment: 'center',
                    translations: {
                      English: 'Venue\nKamdhenu Gau Jatan Lawns & Resort,\nNext to Bionics School,\nCanal Road, Ladvi, Surat.',
                      Gujarati: 'લગ્ન સ્થળ\nકામધેનુ ગૌ જતન લોન્સ & રીસોર્ટ,\nબાયોનિક્સ સ્કુલની બાજુમાં,\nકેનાલ રોડ, લાડવી ગામ, સુરત.'
                    }
                  }
                ]
              };
            case 5:
              return {
                id: `page_${Math.random().toString(36).substr(2, 9)}`,
                name: 'Family Details Page',
                backgroundImage: bgUrl,
                elements: [
                  {
                    id: `elem_welcome_mantra_page6_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'text',
                    x: 100,
                    y: 60,
                    width: 880,
                    height: 60,
                    rotation: 0,
                    opacity: 1,
                    zIndex: 1,
                    isLocked: false,
                    text: '|| શ્રી ગણેશાય નમઃ ||',
                    fontFamily: 'Hind Vadodara',
                    fontSize: 18,
                    color: '#AA820A',
                    lineHeight: 1.2,
                    alignment: 'center',
                    fontWeight: '600',
                    translations: {
                      English: '|| OM SHREE GANESHAYA NAMAH ||',
                      Gujarati: '|| શ્રી ગણેશાય નમઃ ||'
                    }
                  },
                  {
                    id: `elem_family_snehadhin_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'text',
                    x: 100,
                    y: 130,
                    width: 880,
                    height: 50,
                    rotation: 0,
                    opacity: 1,
                    zIndex: 2,
                    isLocked: false,
                    text: ':: સ્નેહાધીન ::',
                    fontFamily: 'KAP011',
                    fontSize: 32,
                    color: '#3E603B',
                    lineHeight: 1.2,
                    alignment: 'center',
                    fontWeight: '700',
                    translations: {
                      English: ':: Snehadhin ::',
                      Gujarati: ':: સ્નેહાધીન ::'
                    }
                  },
                  {
                    id: `elem_family_snehadhin_left_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'text',
                    x: 80,
                    y: 190,
                    width: 440,
                    height: 250,
                    rotation: 0,
                    opacity: 1,
                    zIndex: 3,
                    isLocked: false,
                    text: 'સ્વ. રામભાઈ સોમાભાઈ પટેલ\nસ્વ. કેશવલાલ સોમાભાઈ પટેલ\nસ્વ. મણિલાલ સોમાભાઈ પટેલ\nશ્રી શંભુભાઈ કાશીરામ પટેલ\nશ્રી મહાદેવભાઈ અંબાલાલ પટેલ\nશ્રી ભગુભાઈ જગજીવનભાઈ પટેલ\nશ્રી ભરતભાઈ કેશવલાલ પટેલ',
                    fontFamily: 'Rasa',
                    fontSize: 22,
                    color: '#8A1E2B',
                    lineHeight: 1.5,
                    alignment: 'center',
                    translations: {
                      English: 'Late Rambhai Somabhai Patel\nLate Keshavlal Somabhai Patel\nLate Manilal Somabhai Patel\nShri Shambhubhai Kashiram Patel\nShri Mahadevbhai Ambalal Patel\nShri Bhagubhai Jagjivanbhai Patel\nShri Bharatbhai Keshavlal Patel',
                      Gujarati: 'સ્વ. રામભાઈ સોમાભાઈ પટેલ\nસ્વ. કેશવલાલ સોમાભાઈ પટેલ\nસ્વ. મણિલાલ સોમાભાઈ પટેલ\nશ્રી શંભુભાઈ કાશીરામ પટેલ\nશ્રી મહાદેવભાઈ અંબાલાલ પટેલ\nશ્રી ભગુભાઈ જગજીવનભાઈ પટેલ\nશ્રી ભરતભાઈ કેશવલાલ પટેલ'
                    }
                  },
                  {
                    id: `elem_family_snehadhin_right_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'text',
                    x: 560,
                    y: 190,
                    width: 440,
                    height: 250,
                    rotation: 0,
                    opacity: 1,
                    zIndex: 4,
                    isLocked: false,
                    text: 'સ્વ. સોમાભાઈ બોયદાસ પટેલ\nસ્વ. અંબાલાલ સોમાભાઈ પટેલ\nસ્વ. આશાભાઈ સોમાભાઈ પટેલ\nસ્વ. ધનજીભાઈ રવજીભાઈ પટેલ\nશ્રી વિનોદભાઈ શંભુભાઈ પટેલ\nશ્રી વસંતભાઈ રમણભાઈ પટેલ\nશ્રી ચેતનભાઈ કેશવલાલ પટેલ',
                    fontFamily: 'Rasa',
                    fontSize: 22,
                    color: '#8A1E2B',
                    lineHeight: 1.5,
                    alignment: 'center',
                    translations: {
                      English: 'Late Somabhai Boydas Patel\nLate Ambalal Somabhai Patel\nLate Ashabhai Somabhai Patel\nLate Dhanjibhai Ravjibhai Patel\nShri Vinodbhai Shambhubhai Patel\nShri Vasantbhai Ramanbhai Patel\nShri Chetanbhai Keshavlal Patel',
                      Gujarati: 'સ્વ. સોમાભાઈ બોયદાસ પટેલ\nસ્વ. અંબાલાલ સોમાભાઈ પટેલ\nસ્વ. આશાભાઈ સોમાભાઈ પટેલ\nસ્વ. ધનજીભાઈ રવજીભાઈ પટેલ\nશ્રી વિનોદભાઈ શંભુભાઈ પટેલ\nશ્રી વસંતભાઈ રમણભાઈ પટેલ\nશ્રી ચેતનભાઈ કેશવલાલ પટેલ'
                    }
                  },
                  {
                    id: `elem_family_darshnabhilashi_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'text',
                    x: 100,
                    y: 460,
                    width: 880,
                    height: 50,
                    rotation: 0,
                    opacity: 1,
                    zIndex: 5,
                    isLocked: false,
                    text: ':: દર્શનાભિલાષી ::',
                    fontFamily: 'KAP011',
                    fontSize: 32,
                    color: '#3E603B',
                    lineHeight: 1.2,
                    alignment: 'center',
                    fontWeight: '700',
                    translations: {
                      English: ':: Darshnabhilashi ::',
                      Gujarati: ':: દર્શનાભિલાષી ::'
                    }
                  },
                  {
                    id: `elem_family_darshna_left_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'text',
                    x: 80,
                    y: 520,
                    width: 440,
                    height: 250,
                    rotation: 0,
                    opacity: 1,
                    zIndex: 6,
                    isLocked: false,
                    text: 'શ્રી યોગેશ ભગવાનભાઈ પટેલ\nશ્રી વિપુલ બળદેવભાઈ પટેલ\nશ્રી પ્રીતેશ બળદેવભાઈ પટેલ\nશ્રી હર્ષદ ભગવાનભાઈ પટેલ\nત્વ. કાર્તિક મનુભાઈ પટેલ\nશ્રી સાગર ભરતભાઈ પટેલ\nશ્રી ગૌતમ ભરતભાઈ પટેલ',
                    fontFamily: 'Rasa',
                    fontSize: 22,
                    color: '#8A1E2B',
                    lineHeight: 1.5,
                    alignment: 'center',
                    translations: {
                      English: 'Shri Yogesh Bhagwanbhai Patel\nShri Vipul Baldevbhai Patel\nShri Pritesh Baldevbhai Patel\nShri Harshad Bhagwanbhai Patel\nLate Kartik Manubhai Patel\nShri Sagar Bharatbhai Patel\nShri Gautam Bharatbhai Patel',
                      Gujarati: 'શ્રી યોગેશ ભગવાનભાઈ પટેલ\nશ્રી વિપુલ બળદેવભાઈ પટેલ\nશ્રી પ્રીતેશ બળદેવભાઈ પટેલ\nશ્રી હર્ષદ ભગવાનભાઈ પટેલ\nત્વ. કાર્તિક મનુભાઈ પટેલ\nશ્રી સાગર ભરતભાઈ પટેલ\nશ્રી ગૌતમ ભરતભાઈ પટેલ'
                    }
                  },
                  {
                    id: `elem_family_darshna_right_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'text',
                    x: 560,
                    y: 520,
                    width: 440,
                    height: 250,
                    rotation: 0,
                    opacity: 1,
                    zIndex: 7,
                    isLocked: false,
                    text: 'શ્રી આકાશ વિનોદભાઈ પટેલ\nશ્રી હર્ષ ચેતનભાઈ પટેલ\nશ્રી સાર્થક રાકેશભાઈ પટેલ\nશ્રી દેવ વિપુલભાઈ પટેલ\nશ્રી અનંત યોગેશભાઈ પટેલ\nશ્રી હેત હર્ષદભાઈ પટેલ\nશ્રી સ્વયં વસંતભાઈ પટેલ',
                    fontFamily: 'Rasa',
                    fontSize: 22,
                    color: '#8A1E2B',
                    lineHeight: 1.5,
                    alignment: 'center',
                    translations: {
                      English: 'Shri Akash Vinodbhai Patel\nShri Harsh Chetanbhai Patel\nShri Sarthak Rakeshbhai Patel\nShri Dev Vipulbhai Patel\nShri Anant Yogeshbhai Patel\nShri Het Harshadbhai Patel\nShri Swayam Vasantbhai Patel',
                      Gujarati: 'શ્રી આકાશ વિનોદભાઈ પટેલ\nશ્રી હર્ષ ચેતનભાઈ પટેલ\nશ્રી સાર્થક રાકેશભાઈ પટેલ\nશ્રી દેવ વિપુલભાઈ પટેલ\nશ્રી અનંત યોગેશભાઈ પટેલ\nશ્રી હેત હર્ષદભાઈ પટેલ\nશ્રી સ્વયં વસંતભાઈ પટેલ'
                    }
                  },
                  {
                    id: `elem_family_mosalu_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'text',
                    x: 100,
                    y: 790,
                    width: 880,
                    height: 180,
                    rotation: 0,
                    opacity: 1,
                    zIndex: 8,
                    isLocked: false,
                    text: ':: મામેરૂ મોસાળ ::\n\nપટેલ હર્ષદભાઈ કાંતિલાલ\nસ્વ. પટેલ મનીષભાઈ કાંતિલાલ\nપટેલ દેવેન્દ્રભાઈ અંબાલાલ',
                    fontFamily: 'Rasa',
                    fontSize: 22,
                    color: '#8A1E2B',
                    lineHeight: 1.4,
                    alignment: 'center',
                    translations: {
                      English: ':: Mameru Mosal ::\n\nPatel Harshadbhai Kantilal\nLate Patel Manishbhai Kantilal\nPatel Devendrabhai Ambalal',
                      Gujarati: ':: મામેરૂ મોસાળ ::\n\nપટેલ હર્ષદભાઈ કાંતિલાલ\nસ્વ. પટેલ મનીષભાઈ કાંતિલાલ\nપટેલ દેવેન્દ્રભાઈ અંબાલાલ'
                    }
                  },
                  {
                    id: `elem_family_ladla_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'text',
                    x: 100,
                    y: 990,
                    width: 880,
                    height: 180,
                    rotation: 0,
                    opacity: 1,
                    zIndex: 9,
                    isLocked: false,
                    text: ':: માસી અને ફોઈ ના લાડલા ::\n\nશૌર્ય ભાવિનકુમાર પટેલ\nરીવાંશ ભાવિનકુમાર પટેલ\nઅંશાંશ ચિંતનભાઈ પટેલ',
                    fontFamily: 'Rasa',
                    fontSize: 22,
                    color: '#8A1E2B',
                    lineHeight: 1.4,
                    alignment: 'center',
                    translations: {
                      English: ':: Dear Children (Masi & Foi) ::\n\nShaurya Bhavinkumar Patel\nRivansh Bhavinkumar Patel\nAnshansh Chintanbhai Patel',
                      Gujarati: ':: માસી અને ફોઈ ના લાડલા ::\n\nશૌર્ય ભાવિનકુમાર પટેલ\nરીવાંશ ભાવિનકુમાર પટેલ\nઅંશાંશ ચિંતનભાઈ પટેલ'
                    }
                  },
                  {
                    id: `elem_family_tahuko_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'text',
                    x: 100,
                    y: 1190,
                    width: 880,
                    height: 200,
                    rotation: 0,
                    opacity: 1,
                    zIndex: 10,
                    isLocked: false,
                    text: ':: ટહુકો ::\n\nદુમક દુમક ચાલતા જાય, લગ્ન ગીત ગાતા જાય,\nકોઈ પુછે ક્યાં ચાલ્યા\nઆ જીજ્ઞાસા માસીની શાદી કહેતા જાય,\nઅમે તો અમારા ફોઈ અને દીદી ના લગ્ન માં જઈએ છીએ .......\nખુશી, કીર્તલ, કેવલ, ક્રિષ્ના, હેત્વી, રુદ્ર, નિતાંશ',
                    fontFamily: 'Rasa',
                    fontSize: 20,
                    color: '#8A1E2B',
                    lineHeight: 1.4,
                    alignment: 'center',
                    translations: {
                      English: ":: Tahuko ::\n\nWalking with tiny steps, singing wedding songs,\nIf anyone asks where we go,\nWe tell them we are going to our Foi and Didi's wedding...\nKhushi, Kirtal, Keval, Krishna, Hetvi, Rudra, Nitansh",
                      Gujarati: ':: ટહુકો ::\n\nદુમક દુમક ચાલતા જાય, લગ્ન ગીત ગાતા જાય,\nકોઈ પુછે ક્યાં ચાલ્યા\nઆ જીજ્ઞાસા માસીની શાદી કહેતા જાય,\nઅમે તો અમારા ફોઈ અને દીદી ના લગ્ન માં જઈએ છીએ .......\nખુશી, કીર્તલ, કેવલ, ક્રિષ્ના, હેત્વી, રુદ્ર, નિતાંશ'
                    }
                  }
                ]
              };
            case 6:
              return {
                id: `page_${Math.random().toString(36).substr(2, 9)}`,
                name: 'Contact / Thanks Page',
                backgroundImage: bgUrl,
                elements: [
                  {
                    id: `elem_thanks_mantra_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'text',
                    x: 100,
                    y: 80,
                    width: 880,
                    height: 60,
                    rotation: 0,
                    opacity: 1,
                    zIndex: 1,
                    isLocked: false,
                    text: '|| શ્રી ગણેશાય નમઃ ||',
                    fontFamily: 'Hind Vadodara',
                    fontSize: 18,
                    color: '#AA820A',
                    lineHeight: 1.2,
                    alignment: 'center',
                    fontWeight: '600',
                    translations: {
                      English: '|| OM SHREE GANESHAYA NAMAH ||',
                      Gujarati: '|| શ્રી ગણેશાય નમઃ ||'
                    }
                  },
                  {
                    id: `elem_thanks_pratiksha_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'text',
                    x: 100,
                    y: 150,
                    width: 880,
                    height: 60,
                    rotation: 0,
                    opacity: 1,
                    zIndex: 2,
                    isLocked: false,
                    text: 'આપ સ્નેહીજનોની પ્રતિક્ષામાં',
                    fontFamily: 'Rasa',
                    fontSize: 24,
                    color: '#8A1E2B',
                    lineHeight: 1.2,
                    alignment: 'center',
                    fontWeight: '500',
                    translations: {
                      English: 'Waiting for your presence',
                      Gujarati: 'આપ સ્નેહીજનોની પ્રતિક્ષામાં'
                    }
                  },
                  {
                    id: `elem_thanks_title_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'text',
                    x: 100,
                    y: 220,
                    width: 880,
                    height: 100,
                    rotation: 0,
                    opacity: 1,
                    zIndex: 3,
                    isLocked: false,
                    text: 'શ્રી પટેલ પરિવાર',
                    fontFamily: 'KAP011',
                    fontSize: 48,
                    color: '#3E603B',
                    lineHeight: 1.2,
                    alignment: 'center',
                    fontWeight: '700',
                    translations: {
                      English: 'Shree Patel Family',
                      Gujarati: 'શ્રી પટેલ પરિવાર'
                    }
                  },
                  {
                    id: `elem_thanks_desc_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'text',
                    x: 100,
                    y: 350,
                    width: 880,
                    height: 220,
                    rotation: 0,
                    opacity: 1,
                    zIndex: 4,
                    isLocked: false,
                    text: 'આ ભાવભર્યું આમંત્રણ રુબરૂ મળ્યા તુલ્ય સમજવું\nOK\nએવો જવાબ આપશો.\nઆ ડિજીટલ આમંત્રણ સ્વીકાર્યું તે બદલ\nઆપનો ખૂબ ખૂબ આભાર...',
                    fontFamily: 'Rasa',
                    fontSize: 22,
                    color: '#8A1E2B',
                    lineHeight: 1.5,
                    alignment: 'center',
                    fontWeight: '500',
                    translations: {
                      English: 'Please consider this digital invitation as personal.\nPlease reply with OK.\nThank you for accepting our digital invitation.',
                      Gujarati: 'આ ભાવભર્યું આમંત્રણ રુબરૂ મળ્યા તુલ્ય સમજવું\nOK\nએવો જવાબ આપશો.\nઆ ડિજીટલ આમંત્રણ સ્વીકાર્યું તે બદલ\nઆપનો ખૂબ ખૂબ આભાર...'
                    }
                  },
                  {
                    id: `elem_thanks_nimantrak_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'text',
                    x: 100,
                    y: 600,
                    width: 880,
                    height: 250,
                    rotation: 0,
                    opacity: 1,
                    zIndex: 5,
                    isLocked: false,
                    text: ':: નિમંત્રક ::\n\nસ્વ. ચંદ્રકાન્તભાઈ રામભાઈ પટેલ\nશ્રી પિયુષભાઈ રામભાઈ પટેલ\nશ્રી ચિંતનભાઈ પિયુષભાઈ પટેલ',
                    fontFamily: 'Rasa',
                    fontSize: 22,
                    color: '#8A1E2B',
                    lineHeight: 1.5,
                    alignment: 'center',
                    fontWeight: '500',
                    translations: {
                      English: ':: Inviters ::\n\nLate Chandrakantbhai Rambhai Patel\nShri Piyushbhai Rambhai Patel\nShri Chintanbhai Piyushbhai Patel',
                      Gujarati: ':: નિમંત્રક ::\n\nસ્વ. ચંદ્રકાન્તભાઈ રામભાઈ પટેલ\nશ્રી પિયુષભાઈ રામભાઈ પટેલ\nશ્રી ચિંતનભાઈ પિયુષભાઈ પટેલ'
                    }
                  },
                  {
                    id: `elem_thanks_bottom_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'text',
                    x: 100,
                    y: 880,
                    width: 880,
                    height: 80,
                    rotation: 0,
                    opacity: 1,
                    zIndex: 6,
                    isLocked: false,
                    text: 'ચાંદલો અને ભેટ અસ્વીકાર્ય છે.',
                    fontFamily: 'Rasa',
                    fontSize: 22,
                    color: '#8A1E2B',
                    lineHeight: 1.2,
                    alignment: 'center',
                    fontWeight: 'bold',
                    translations: {
                      English: 'Gift and Cash not accepted.',
                      Gujarati: 'ચાંદલો અને ભેટ અસ્વીકાર્ય છે.'
                    }
                  }
                ]
              };
            default:
              return {
                id: `page_${Math.random().toString(36).substr(2, 9)}`,
                name: `Details Page ${index + 1}`,
                backgroundImage: bgUrl,
                elements: [
                  {
                    id: `elem_generic_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'text',
                    x: 100,
                    y: 400,
                    width: 880,
                    height: 100,
                    rotation: 0,
                    opacity: 1,
                    zIndex: 1,
                    isLocked: false,
                    text: 'Double click to edit text',
                    fontFamily: 'Rasa',
                    fontSize: 36,
                    color: '#4A2E35',
                    lineHeight: 1.2,
                    alignment: 'center',
                    translations: {
                      English: 'Double click to edit text',
                      Gujarati: 'લખાણ બદલવા માટે બે વાર ક્લિક કરો',
                      Hindi: 'બદલને કે લિયે દો બાર ક્લિક કરેં',
                      Marathi: 'બદલણ્યાસાઠી દોનદા ક્લિક કરા',
                      Tamil: 'திருத்த இருமுறை கிளிக் செய்யவும்',
                      Urdu: 'تبدیલ کرنے کے لئے ڈبل کلک کریں'
                    }
                  }
                ]
              };
          }
        });
      } else {
        initialPages = finalBgs.map((bgUrl, index) => ({
          id: `page_${Math.random().toString(36).substr(2, 9)}`,
          name: index === 0 ? 'Cover Page' : index === 1 ? 'Ceremony Page' : `Details Page ${index}`,
          backgroundImage: bgUrl,
          elements: [
            {
              id: `elem_welcome_${Math.random().toString(36).substr(2, 9)}`,
              type: 'text',
              x: 100,
              y: 400,
              width: 880,
              height: 100,
              rotation: 0,
              opacity: 1,
              zIndex: 1,
              isLocked: false,
              text: index === 0 ? 'WEDDING INVITATION' : 'Join Us on the Ceremony',
              fontFamily: selectedFonts[0] || 'KAP011',
              fontSize: 48,
              color: '#D4AF37',
              lineHeight: 1.2,
              alignment: 'center',
              translations: {
                English: index === 0 ? 'WEDDING INVITATION' : 'Join Us on the Ceremony'
              }
            }
          ]
        }));

        if (initialPages.length === 0) {
          initialPages.push({
            id: `page_blank_${Math.random().toString(36).substr(2, 9)}`,
            name: 'Cover Page',
            backgroundImage: '',
            elements: [
              {
                id: `elem_blank_${Math.random().toString(36).substr(2, 9)}`,
                type: 'text',
                x: 100,
                y: 400,
                width: 880,
                height: 100,
                rotation: 0,
                opacity: 1,
                zIndex: 1,
                isLocked: false,
                text: 'Double click to edit text',
                fontFamily: 'Rasa',
                fontSize: 36,
                color: '#4A2E35',
                lineHeight: 1.2,
                alignment: 'center',
                translations: {
                  English: 'Double click to edit text'
                }
              }
            ]
          });
        }
      }

      // Assemble all uploaded paths for Flutter local loading
      const localAssetPaths = [
        finalThumbnail.replace(/^\//, ''),
        ...finalBgsLocal.map(bg => bg.replace(/^\//, ''))
      ].filter(Boolean);

      const payload = editingTemplate ? {
        categoryId,
        name,
        slug: cleanTplSlug,
        thumbnail: finalThumbnail || editingTemplate.thumbnail,
        isPremium,
        isActive,
        fonts: selectedFonts,
        languages: selectedLangs,
        singlePurchasePrice: Number(singlePurchasePrice) || 0,
        includedInMonthlyPlan: selectedPlanIds.includes('monthly'),
        includedInYearlyPlan: selectedPlanIds.includes('yearly')
      } : {
        categoryId,
        name,
        slug: cleanTplSlug,
        thumbnail: finalThumbnail || '/assets/images/wedding/royal_wedding/thumbnail.png',
        previewImages: finalBgs,
        localAssetPaths,
        isPremium,
        isActive,
        fonts: selectedFonts,
        languages: selectedLangs,
        pages: initialPages,
        singlePurchasePrice: Number(singlePurchasePrice) || 0,
        includedInMonthlyPlan: selectedPlanIds.includes('monthly'),
        includedInYearlyPlan: selectedPlanIds.includes('yearly')
      };

      const url = editingTemplate ? `${API_URL}/api/templates/${editingTemplate.id}` : `${API_URL}/api/templates`;
      const method = editingTemplate ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: authHeaders,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const savedTemplate = await res.json();
        const templateId = savedTemplate.id || (editingTemplate ? editingTemplate.id : null);
        
        if (templateId) {
          // Update the plan inclusions for this template!
          await Promise.all(plans.map(async (plan) => {
            const isPlanSelected = selectedPlanIds.includes(plan.id);
            const currentTemplateIds = plan.includedTemplateIds || [];
            const isTemplateAlreadyInPlan = currentTemplateIds.includes(templateId);
            
            let newTemplateIds = [...currentTemplateIds];
            if (isPlanSelected && !isTemplateAlreadyInPlan) {
              newTemplateIds.push(templateId);
            } else if (!isPlanSelected && isTemplateAlreadyInPlan) {
              newTemplateIds = newTemplateIds.filter(id => id !== templateId);
            } else {
              return;
            }
            
            await fetch(`${API_URL}/api/subscriptions/${plan.id}`, {
              method: 'PUT',
              headers: authHeaders,
              body: JSON.stringify({
                ...plan,
                includedTemplateIds: newTemplateIds
              })
            });
          }));
        }

        setIsModalOpen(false);
        setEditingTemplate(null);
        fetchInitialData();
        useToastStore.getState().addToast(
          editingTemplate ? 'Template updated successfully!' : 'Template created successfully!',
          'success'
        );
      } else {
        const err = await res.json();
        useToastStore.getState().addToast(err.error || 'Save failed', 'error');
      }
    } catch (error) {
      console.error('Submit template error:', error);
      useToastStore.getState().addToast(
        editingTemplate ? 'Error updating template.' : 'Error creating template.',
        'error'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDuplicate = async (id: string) => {
    if (!hasPermission('templates.create')) {
      useToastStore.getState().addToast('Access Denied. You lack the "templates.create" permission.', 'warning');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/templates/${id}/duplicate`, {
        method: 'POST',
        headers: { 'x-user-id': currentUser?.id || 'admin_super' }
      });
      if (res.ok) {
        fetchInitialData();
        useToastStore.getState().addToast('Template duplicated successfully!', 'success');
      } else {
        const err = await res.json();
        useToastStore.getState().addToast(err.error || 'Failed to duplicate template.', 'error');
      }
    } catch (error) {
      console.error('Duplicate template error:', error);
      useToastStore.getState().addToast('Failed to duplicate template.', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!hasPermission('templates.delete')) {
      useToastStore.getState().addToast('Access Denied. You lack the "templates.delete" permission.', 'warning');
      return;
    }
    if (!confirm('Are you sure you want to delete this template? All designed card pages and elements will be lost.')) return;

    try {
      const res = await fetch(`${API_URL}/api/templates/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': currentUser?.id || 'admin_super' }
      });
      if (res.ok) {
        fetchInitialData();
        useToastStore.getState().addToast('Template deleted successfully!', 'success');
      } else {
        const err = await res.json();
        useToastStore.getState().addToast(err.error || 'Failed to delete template.', 'error');
      }
    } catch (error) {
      console.error('Delete template error:', error);
      useToastStore.getState().addToast('Failed to delete template.', 'error');
    }
  };

  const handleToggleState = async (id: string, activeState: boolean) => {
    // Optimistically update templates state immediately
    setTemplates(prev =>
      prev.map(tpl => (tpl.id === id ? { ...tpl, isActive: !activeState } : tpl))
    );

    try {
      if (!hasPermission('templates.publish')) {
        setTemplates(prev =>
          prev.map(tpl => (tpl.id === id ? { ...tpl, isActive: activeState } : tpl))
        );
        useToastStore.getState().addToast('Access Denied. You lack the "templates.publish" permission.', 'warning');
        return;
      }
      const res = await fetch(`${API_URL}/api/templates/${id}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ isActive: !activeState })
      });

      if (res.ok) {
        useToastStore.getState().addToast('Template status updated successfully!', 'success');
      } else {
        // Rollback state if the update failed on the server
        setTemplates(prev =>
          prev.map(tpl => (tpl.id === id ? { ...tpl, isActive: activeState } : tpl))
        );
        const err = await res.json();
        useToastStore.getState().addToast(err.error || 'Failed to toggle status.', 'error');
      }
    } catch (error) {
      console.error('Toggle template state error:', error);
      // Rollback state on network error
      setTemplates(prev =>
        prev.map(tpl => (tpl.id === id ? { ...tpl, isActive: activeState } : tpl))
      );
      useToastStore.getState().addToast('Network error. Failed to toggle status.', 'error');
    }
  };

  const openEditModal = (tpl: Template) => {
    setEditingTemplate(tpl);
    setName(tpl.name);
    setSlug(tpl.slug);
    setCategoryId(tpl.categoryId);
    setIsPremium(tpl.isPremium);
    setIsActive(tpl.isActive);
    setSelectedFonts(tpl.fonts || []);
    const activeNames = languages.map(l => l.name);
    const filteredLangs = (tpl.languages || []).filter(lang => activeNames.includes(lang) || lang === 'English');
    setSelectedLangs(filteredLangs);
    setSinglePurchasePrice(tpl.singlePurchasePrice ?? 49);
    setIncludedInMonthlyPlan(tpl.includedInMonthlyPlan ?? true);
    setIncludedInYearlyPlan(tpl.includedInYearlyPlan ?? true);
    setThumbnailFile(null);
    setBgFiles(null);
    setErrors({});

    const initialSelectedPlans: string[] = [];
    if (tpl.includedInMonthlyPlan !== false) initialSelectedPlans.push('monthly');
    if (tpl.includedInYearlyPlan !== false) initialSelectedPlans.push('yearly');
    plans.forEach(p => {
      if (p.id !== 'monthly' && p.id !== 'yearly' && p.includedTemplateIds && p.includedTemplateIds.includes(tpl.id)) {
        initialSelectedPlans.push(p.id);
      }
    });
    setSelectedPlanIds(initialSelectedPlans);

    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingTemplate(null);
    setName('');
    setSlug('');
    setCategoryId(categories[0]?.id || '');
    setIsPremium(true);
    setIsActive(true);
    setSelectedFonts(fonts.slice(0, 2).map(f => f.family));
    setSelectedLangs(languages.slice(0, 3).map(l => l.name));
    setSinglePurchasePrice(49);
    setIncludedInMonthlyPlan(true);
    setIncludedInYearlyPlan(true);
    setThumbnailFile(null);
    setBgFiles(null);
    setSelectedPlanIds(['monthly', 'yearly']);
    setErrors({});
    setIsModalOpen(true);
  };

  // Filtered templates based on search query and category
  const filteredTemplates = templates.filter((tpl) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      tpl.name.toLowerCase().includes(query) ||
      tpl.slug.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Toolbar: Search bar + Create Template button on top, Category filters below */}
      <div className="bg-wedding-card p-4 sm:p-6 rounded-3xl border border-wedding-pink-medium/10 shadow-md flex flex-col gap-4">
        {/* Row 1: Search Bar + Create Template Button */}
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-wedding-pink-dark/60" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates by name or slug..."
              className="w-full pl-11 pr-10 py-3 bg-wedding-bg border border-wedding-pink-medium/20 rounded-2xl text-sm font-medium text-wedding-charcoal-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-wedding-pink-dark/30 focus:border-wedding-pink-dark/40 transition-all duration-300 shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-3 flex items-center px-1 text-gray-400 hover:text-wedding-pink-dark transition-colors"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Create Template Button */}
          {hasPermission('templates.create') && (
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-5 py-3 bg-wedding-pink-dark hover:bg-[#a0525e] text-white text-sm font-bold rounded-2xl shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 shrink-0"
            >
              <PlusCircle className="w-5 h-5" />
              Create Template
            </button>
          )}
        </div>

        {/* Row 2: All Invitations fixed + Category Scroll */}
        <div className="flex items-center gap-0">
          {/* Fixed: All Invitations button */}
          <button
            onClick={() => setSelectedCatId('')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 shrink-0 border ${!selectedCatId
              ? 'bg-wedding-pink-dark text-white border-transparent shadow-md shadow-wedding-pink-dark/15'
              : 'bg-wedding-pink-light/40 text-wedding-charcoal-light/85 border-wedding-pink-medium/30 hover:bg-wedding-pink-light/90 hover:text-wedding-pink-dark hover:border-wedding-pink-medium/60'
              }`}
          >
            All Invitations
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-wedding-pink-medium/20 mx-3 shrink-0" />

          {/* Left Arrow */}
          {showArrows && (
            <button
              onClick={() => scrollCategories('left')}
              className="shrink-0 p-2 rounded-xl bg-wedding-pink-light/40 text-wedding-charcoal-light/75 border border-wedding-pink-medium/20 hover:bg-wedding-pink-light/90 hover:text-wedding-pink-dark hover:border-wedding-pink-medium/50 transition-all duration-200 mr-2 animate-fadeIn"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {/* Scrollable Categories */}
          <div
            ref={categoryScrollRef}
            className="flex gap-2 items-center overflow-x-auto flex-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCatId(cat.id)}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 shrink-0 border ${selectedCatId === cat.id
                  ? 'bg-wedding-pink-dark text-white border-transparent shadow-md shadow-wedding-pink-dark/15'
                  : 'bg-wedding-pink-light/40 text-wedding-charcoal-light/85 border-wedding-pink-medium/30 hover:bg-wedding-pink-light/90 hover:text-wedding-pink-dark hover:border-wedding-pink-medium/60'
                  }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Right Arrow */}
          {showArrows && (
            <button
              onClick={() => scrollCategories('right')}
              className="shrink-0 p-2 rounded-xl bg-wedding-pink-light/40 text-wedding-charcoal-light/75 border border-wedding-pink-medium/20 hover:bg-wedding-pink-light/90 hover:text-wedding-pink-dark hover:border-wedding-pink-medium/50 transition-all duration-200 ml-2 animate-fadeIn"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search Results Count */}
        {searchQuery && (
          <p className="text-xs font-semibold text-wedding-charcoal-light/70">
            {filteredTemplates.length === 0
              ? 'No templates found'
              : `${filteredTemplates.length} template${filteredTemplates.length !== 1 ? 's' : ''} found for "${searchQuery}"`
            }
          </p>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <div className="w-10 h-10 border-4 border-wedding-pink-medium border-t-wedding-pink-dark rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-wedding-pink-dark">Fetching template assets...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-fadeIn">
          {filteredTemplates.length === 0 ? (
            <div className="col-span-full py-16 text-center text-gray-400 font-semibold bg-wedding-card border rounded-3xl border-wedding-pink-medium/10 shadow-md">
              {searchQuery ? `No templates found for "${searchQuery}"` : 'No invitation templates inside this category directory yet.'}
            </div>
          ) : (
            filteredTemplates.map((tpl) => (
              <div
                key={tpl.id}
                className="group bg-wedding-card border border-wedding-pink-medium/10 rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                {/* Visual Thumbnail Frame */}
                <div className="aspect-[2/3] w-full bg-gray-50 border-b border-wedding-pink-medium/20 relative overflow-hidden flex items-center justify-center">
                  <img
                    src={getImageUrl(tpl.thumbnail)}
                    alt={tpl.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Premium Lock Banner */}
                  <div className="absolute left-3 top-3 flex flex-wrap gap-1 max-w-[calc(100%-24px)]">
                    {tpl.isPremium ? (
                      <>
                        {tpl.includedInMonthlyPlan && plans.find(p => p.id === 'monthly')?.isActive !== false && (
                          <span className="flex items-center gap-0.5 px-2 py-0.5 bg-blue-600 text-white text-[9px] font-extrabold rounded-md uppercase shadow-sm">
                            Monthly
                          </span>
                        )}
                        {tpl.includedInYearlyPlan && plans.find(p => p.id === 'yearly')?.isActive !== false && (
                          <span className="flex items-center gap-0.5 px-2 py-0.5 bg-purple-600 text-white text-[9px] font-extrabold rounded-md uppercase shadow-sm">
                            Yearly
                          </span>
                        )}
                        {plans.map((p) => {
                          if (p.isActive && p.id !== 'monthly' && p.id !== 'yearly' && p.includedTemplateIds && p.includedTemplateIds.includes(tpl.id)) {
                            return (
                              <span key={p.id} className="flex items-center gap-0.5 px-2 py-0.5 bg-emerald-600 text-white text-[9px] font-extrabold rounded-md uppercase shadow-sm">
                                {p.name}
                              </span>
                            );
                          }
                          return null;
                        })}
                        {tpl.singlePurchasePrice && tpl.singlePurchasePrice > 0 ? (
                          <span className="flex items-center gap-0.5 px-2 py-0.5 bg-amber-600 text-white text-[9px] font-extrabold rounded-md uppercase shadow-sm font-mono">
                            ₹{tpl.singlePurchasePrice}
                          </span>
                        ) : (
                          !tpl.includedInMonthlyPlan && !tpl.includedInYearlyPlan && (
                            <span className="flex items-center gap-1 px-2.5 py-0.5 bg-wedding-gold-dark text-white text-[9px] font-bold rounded-md uppercase shadow-sm">
                              <Sparkles className="w-2.5 h-2.5 text-wedding-gold-light fill-wedding-gold-light" /> Premium
                            </span>
                          )
                        )}
                      </>
                    ) : (
                      <span className="px-2 py-0.5 bg-wedding-charcoal-light/95 text-white text-[9px] font-bold rounded-md uppercase shadow-sm">
                        Free
                      </span>
                    )}

                    {tpl.isActive ? (
                      <span className="flex items-center gap-0.5 px-3 py-1 bg-green-600 text-white text-[10px] font-bold rounded-lg uppercase shadow">
                        <Eye className="w-3 h-3" /> Live
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5 px-3 py-1 bg-amber-600 text-white text-[10px] font-bold rounded-lg uppercase shadow">
                        <EyeOff className="w-3 h-3" /> Draft
                      </span>
                    )}
                  </div>

                  {/* Design in Canvas Button overlay */}
                  {hasPermission('templates.edit') && (
                    <div className="absolute inset-0 bg-wedding-charcoal-dark/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                      <button
                        onClick={() => onOpenEditor(tpl)}
                        className="px-6 py-3.5 bg-white hover:bg-wedding-pink-light text-wedding-charcoal-dark text-xs font-extrabold rounded-2xl shadow-xl transition-all duration-200 transform scale-90 group-hover:scale-100 hover:scale-105 flex items-center gap-2"
                      >
                        <Palette className="w-4 h-4 text-wedding-pink-dark" />
                        Design in Canvas
                      </button>
                    </div>
                  )}
                </div>

                {/* Details Footer */}
                <div className="p-4 space-y-3 bg-wedding-card">
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-wedding-pink-dark uppercase tracking-wider">
                        {categories.find(c => c.id === tpl.categoryId)?.name || 'General'}
                      </span>
                      <span className="text-[10px] font-bold text-wedding-pink-dark bg-wedding-pink-light border border-wedding-pink-medium/20 px-2 py-0.5 rounded-md font-mono shadow-xs">{tpl.pages?.length || 0} pages</span>
                    </div>
                    <h4 className="text-sm font-extrabold text-wedding-charcoal-dark truncate" title={tpl.name}>{tpl.name}</h4>
                    <p className="text-[10px] text-gray-500 font-mono truncate">{tpl.slug}</p>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-wedding-pink-medium/15">
                    {!hasPermission('templates.edit') ? (
                      <span className="flex-1 py-2 border border-wedding-pink-medium/20 text-wedding-charcoal-light/60 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 bg-gray-50/50 select-none">
                        Read-Only View
                      </span>
                    ) : (
                      <button
                        onClick={() => onOpenEditor(tpl)}
                        className="flex-1 py-2 bg-wedding-charcoal-dark hover:bg-wedding-charcoal-light text-white text-xs font-extrabold rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all duration-300 transform hover:-translate-y-0.5 shrink-0"
                      >
                        <Palette className="w-3.5 h-3.5 text-wedding-pink-dark" />
                        Design
                      </button>
                    )}

                    {(hasPermission('templates.edit') || hasPermission('templates.publish') || hasPermission('templates.create') || hasPermission('templates.delete')) && (
                      <div className="flex items-center gap-1">
                        {hasPermission('templates.edit') && (
                          <button
                            onClick={() => openEditModal(tpl)}
                            className="p-2 text-wedding-charcoal-light hover:text-wedding-pink-dark hover:bg-wedding-pink-light/50 rounded-lg transition-colors border border-wedding-pink-medium/10 animate-scaleIn"
                            title="Edit Template Details"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {hasPermission('templates.publish') && (
                          <button
                            onClick={() => handleToggleState(tpl.id, tpl.isActive)}
                            className={`p-2 rounded-lg border transition-all duration-200 ${tpl.isActive
                              ? 'border-amber-200 text-amber-600 bg-amber-50/50 hover:bg-amber-100/50'
                              : 'border-green-200 text-green-600 bg-green-50/50 hover:bg-green-100/50'
                              }`}
                            title={tpl.isActive ? 'Revert to Draft' : 'Publish to Live'}
                          >
                            {tpl.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        )}
                        {hasPermission('templates.create') && (
                          <button
                            onClick={() => handleDuplicate(tpl.id)}
                            className="p-2 text-wedding-charcoal-light hover:text-wedding-pink-dark hover:bg-wedding-pink-light/50 rounded-lg transition-colors border border-wedding-pink-medium/10 animate-scaleIn"
                            title="Clone Template"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {hasPermission('templates.delete') && (
                          <button
                            onClick={() => handleDelete(tpl.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                            title="Delete Template"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Creation Wizard Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-wedding-charcoal-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-wedding-bg border border-wedding-pink-medium/40 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden my-8 animate-slideUp">
            <div className="p-6 bg-wedding-charcoal-dark text-white flex justify-between items-center">
              <h4 className="font-bold text-lg text-wedding-gold-light flex items-center gap-2">
                <Palette className="w-5 h-5 text-wedding-pink-medium" />
                {editingTemplate ? 'Edit Template Details' : 'Initialize Wedding Template'}
              </h4>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white font-bold text-sm bg-wedding-charcoal-light px-3 py-1.5 rounded-xl transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Row 1: Name and Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-wedding-charcoal-light uppercase tracking-wider">Template Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      handleNameChange(e.target.value);
                      if (errors.name) {
                        setErrors(prev => {
                          const copy = { ...prev };
                          delete copy.name;
                          return copy;
                        });
                      }
                      if (errors.slug) {
                        setErrors(prev => {
                          const copy = { ...prev };
                          delete copy.slug;
                          return copy;
                        });
                      }
                    }}
                    placeholder="e.g. Royal Gold Wedding"
                    className={`w-full px-4 py-3 rounded-2xl bg-white border text-wedding-charcoal-dark text-sm focus:outline-none focus:ring-2 ${
                      errors.name 
                        ? 'border-red-500 focus:ring-red-500/20' 
                        : 'border-wedding-pink-medium/40 focus:ring-wedding-pink-dark/20'
                    }`}
                  />
                  {errors.name && (
                    <p className="text-xs text-red-500 font-semibold mt-1">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-wedding-charcoal-light uppercase tracking-wider">Asset Slug (automatic)</label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => {
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'));
                      if (errors.slug) {
                        setErrors(prev => {
                          const copy = { ...prev };
                          delete copy.slug;
                          return copy;
                        });
                      }
                    }}
                    placeholder="e.g. royal_gold_wedding"
                    className={`w-full px-4 py-3 rounded-2xl text-sm font-mono focus:outline-none focus:ring-2 ${
                      errors.slug 
                        ? 'bg-white border-red-500 focus:ring-red-500/20 text-wedding-charcoal-dark' 
                        : 'bg-gray-50 border border-wedding-pink-medium/30 text-wedding-charcoal-dark/70'
                    }`}
                  />
                  {errors.slug && (
                    <p className="text-xs text-red-500 font-semibold mt-1">{errors.slug}</p>
                  )}
                </div>
              </div>

              {/* Row 2: Category and Options */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-wedding-charcoal-light uppercase tracking-wider">Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => {
                      setCategoryId(e.target.value);
                      if (errors.categoryId) {
                        setErrors(prev => {
                          const copy = { ...prev };
                          delete copy.categoryId;
                          return copy;
                        });
                      }
                    }}
                    className={`w-full px-4 py-3 rounded-2xl bg-white border text-wedding-charcoal-dark text-sm focus:outline-none focus:ring-2 ${
                      errors.categoryId 
                        ? 'border-red-500 focus:ring-red-500/20' 
                        : 'border-wedding-pink-medium/40 focus:ring-wedding-pink-dark/20'
                    }`}
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  {errors.categoryId && (
                    <p className="text-xs text-red-500 font-semibold mt-1">{errors.categoryId}</p>
                  )}
                </div>

                <div className="space-y-1.5 flex flex-col justify-center pl-2">
                  <label className="text-xs font-bold text-wedding-charcoal-light uppercase tracking-wider mb-2">Access Type</label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPremium}
                      onChange={(e) => setIsPremium(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-wedding-pink-dark"></div>
                    <span className="ml-3 text-sm font-semibold text-wedding-charcoal-dark">
                      {isPremium ? 'Premium Lock' : 'Free Access'}
                    </span>
                  </label>
                </div>

                <div className="space-y-1.5 flex flex-col justify-center pl-2">
                  <label className="text-xs font-bold text-wedding-charcoal-light uppercase tracking-wider mb-2">Display State</label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-wedding-pink-dark"></div>
                    <span className="ml-3 text-sm font-semibold text-wedding-charcoal-dark">
                      {isActive ? 'Published' : 'Hidden Draft'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Row 3: Fonts Multi-select */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-wedding-charcoal-light uppercase tracking-wider block">Assigned Layout Fonts</label>
                <div className="flex gap-2 flex-wrap bg-white p-4 border border-wedding-pink-medium/30 rounded-2xl">
                  {fonts.map((f) => {
                    const isChecked = selectedFonts.includes(f.family);
                    return (
                      <button
                        type="button"
                        key={f.id}
                        onClick={() => handleFontSelect(f.family)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${isChecked
                          ? 'bg-wedding-pink-light border-wedding-pink-dark text-wedding-pink-dark'
                          : 'border-wedding-pink-medium/35 text-wedding-charcoal-light hover:bg-wedding-pink-light/10'
                          }`}
                      >
                        {f.family}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 4: Languages Multi-select */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-wedding-charcoal-light uppercase tracking-wider block">Assigned Languages</label>
                <div className="flex gap-2 flex-wrap bg-white p-4 border border-wedding-pink-medium/30 rounded-2xl">
                  {languages.map((l) => {
                    const isChecked = selectedLangs.includes(l.name);
                    return (
                      <button
                        type="button"
                        key={l.id}
                        onClick={() => handleLangSelect(l.name)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${isChecked
                          ? 'bg-wedding-pink-light border-wedding-pink-dark text-wedding-pink-dark'
                          : 'border-wedding-pink-medium/35 text-wedding-charcoal-light hover:bg-wedding-pink-light/10'
                          }`}
                      >
                        {l.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pricing & Access Control — shown only when isPremium = true */}
              {isPremium && (
                <div className="space-y-3 p-4 bg-gradient-to-br from-amber-50 to-yellow-50/30 border border-amber-200/50 rounded-2xl animate-fadeIn">
                  <h5 className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-700 fill-amber-300" />
                    Pricing & Subscription Plans
                  </h5>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                    {/* Single Purchase Price */}
                    <div className="space-y-1.5 sm:col-span-1">
                      <label className="text-[10px] font-bold text-wedding-charcoal-light uppercase tracking-wider block">Single Purchase Price (INR)</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-3.5 flex items-center text-gray-500 font-bold text-sm">₹</span>
                        <input
                          type="number"
                          min="0"
                          value={singlePurchasePrice}
                          onChange={(e) => {
                            setSinglePurchasePrice(Math.max(0, parseInt(e.target.value) || 0));
                            if (errors.singlePurchasePrice) {
                              setErrors(prev => {
                                const copy = { ...prev };
                                delete copy.singlePurchasePrice;
                                return copy;
                              });
                            }
                          }}
                          className={`w-full pl-8 pr-4 py-2.5 rounded-xl bg-white border text-wedding-charcoal-dark text-sm focus:outline-none focus:ring-2 font-semibold ${
                            errors.singlePurchasePrice 
                              ? 'border-red-500 focus:ring-red-500/20' 
                              : 'border-wedding-pink-medium/30 focus:ring-wedding-pink-dark/20'
                          }`}
                        />
                      </div>
                      {errors.singlePurchasePrice && (
                        <p className="text-xs text-red-500 font-semibold mt-1">{errors.singlePurchasePrice}</p>
                      )}
                    </div>

                    {/* Dynamic Plan Inclusion Checkboxes */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-[10px] font-bold text-wedding-charcoal-light uppercase tracking-wider block mb-1">Include in Subscription Plans</label>
                      <div className="flex gap-2 flex-wrap bg-white p-2.5 border border-wedding-pink-medium/30 rounded-2xl">
                        {plans.filter(p => p.isActive).length === 0 ? (
                          <span className="text-xs text-gray-400 font-medium p-1">No active plans available. Add one in Subscription Settings.</span>
                        ) : (
                          plans.filter(p => p.isActive).map((plan) => {
                            const isChecked = selectedPlanIds.includes(plan.id);
                            return (
                              <button
                                type="button"
                                key={plan.id}
                                onClick={() => handlePlanToggle(plan.id)}
                                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border ${isChecked
                                  ? 'bg-blue-50 border-blue-500 text-blue-700 font-black shadow-xs'
                                  : 'border-wedding-pink-medium/35 text-wedding-charcoal-light hover:bg-wedding-pink-light/10 bg-white'
                                  }`}
                              >
                                {plan.name}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Row 5: Media Files Multi Uploads */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-wedding-charcoal-light uppercase tracking-wider">Template Thumbnail</label>
                  <label className={`border cursor-pointer p-4 rounded-2xl flex flex-col items-center justify-center transition-all bg-white ${
                    errors.thumbnailFile 
                      ? 'border-red-500 hover:bg-red-50/10' 
                      : 'border-wedding-pink-medium/40 hover:bg-wedding-pink-light/20'
                  }`}>
                    <Upload className="w-5 h-5 text-wedding-pink-dark mb-1" />
                    <span className="text-[11px] font-bold text-wedding-charcoal-dark text-center">
                      {thumbnailFile ? thumbnailFile.name : 'Choose Thumbnail File'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files ? e.target.files[0] : null;
                        setThumbnailFile(file);
                        if (file && errors.thumbnailFile) {
                          setErrors(prev => {
                            const copy = { ...prev };
                            delete copy.thumbnailFile;
                            return copy;
                          });
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                  {errors.thumbnailFile && (
                    <p className="text-xs text-red-500 font-semibold mt-1">{errors.thumbnailFile}</p>
                  )}
                </div>

                {!editingTemplate && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-wedding-charcoal-light uppercase tracking-wider">Page Backgrounds (Multiple)</label>
                    <label className={`border cursor-pointer p-4 rounded-2xl flex flex-col items-center justify-center transition-all bg-white ${
                      errors.bgFiles 
                        ? 'border-red-500 hover:bg-red-50/10' 
                        : 'border-wedding-pink-medium/40 hover:bg-wedding-pink-light/20'
                    }`}>
                      <Upload className="w-5 h-5 text-wedding-pink-dark mb-1" />
                      <span className="text-[11px] font-bold text-wedding-charcoal-dark text-center">
                        {bgFiles ? `${bgFiles.length} files selected` : 'Select Page Backgrounds'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          const files = e.target.files;
                          setBgFiles(files);
                          if (files && files.length > 0 && errors.bgFiles) {
                            setErrors(prev => {
                              const copy = { ...prev };
                              delete copy.bgFiles;
                              return copy;
                            });
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                    {errors.bgFiles && (
                      <p className="text-xs text-red-500 font-semibold mt-1">{errors.bgFiles}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-wedding-pink-medium/20 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-3 rounded-2xl bg-gray-100 text-wedding-charcoal-light hover:bg-gray-200 text-sm font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-6 py-3 rounded-2xl bg-wedding-pink-dark hover:bg-[#a0525e] text-white text-sm font-bold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Updating details...' : editingTemplate ? 'Update Details' : 'Generate Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
