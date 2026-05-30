import { create } from 'zustand';
import { Template, TemplatePage, CanvasElement } from '../types';

const COMMON_WEDDING_TRANSLATIONS: Record<string, Record<string, string>> = {
  "wedding invitation": {
    English: "WEDDING INVITATION",
    Gujarati: "લગ્ન આમંત્રણ",
    Hindi: "विवाह आमंत्रण",
    Marathi: "लग्न आमंत्रण",
    Tamil: "திருமண அழைப்பிதழ்",
    Urdu: "دعوتِ شادی"
  },
  "shubh vivah": {
    English: "SHUBH VIVAH",
    Gujarati: "શુભ વિવાહ",
    Hindi: "शुभ विवाह",
    Marathi: "शुभ विवाह",
    Tamil: "மங்கள திருமணம்",
    Urdu: "شادی مبارک"
  },
  "mangal parinay": {
    English: "MANGAL PARINAY",
    Gujarati: "મંગલ પરિણય",
    Hindi: "मंगल परिणय",
    Marathi: "मंगळ परिणय",
    Tamil: "மங்கள பரிணயம்",
    Urdu: "منگل پرینائے"
  },
  "harmi weds kishan": {
    English: "Harmi  Weds  Kishan",
    Gujarati: "ચિ. હાર્મી સંગ ચિ. કિશન",
    Hindi: "चि. हार्मी संग चि. किशन",
    Marathi: "चि. हार्मी संग चि. किशन",
    Tamil: "ஹார்மி & கிஷன்",
    Urdu: "ہارمی سنگ کشن"
  },
  "harmi & kishan": {
    English: "Harmi & Kishan",
    Gujarati: "ચિ. હાર્મી  સંગ  ચિ. કિશન",
    Hindi: "चि. हार्मी  संग  चि. किशन",
    Marathi: "चि. हार्मी  संग  चि. किशन",
    Tamil: "ஹார்மி & கிஷன்",
    Urdu: "ہارمی سنگ کشن"
  },
  "friday, may 26, 2026": {
    English: "Friday, May 26, 2026",
    Gujarati: "તા. ૨૬/૦૫/૨૦૨૬, શુક્રવાર",
    Hindi: "दिनांक: २६/૦૫/२०२६, शुक्रवार",
    Marathi: "दिनांक: २६/૦૫/२०२६, शुक्रवार",
    Tamil: "மே 26, 2026, வெள்ளிக்கிழமை",
    Urdu: "جمعہ، 26 مئی 2026"
  },
  "you are cordially invited to join the celebration": {
    English: "You are cordially invited to join the celebration",
    Gujarati: "આપને પરિવાર સહ પધારવા ભાવભીનું આમંત્રણ છે",
    Hindi: "आप सपरिवार सादर आमंत्रित हैं",
    Marathi: "आपणास सहकुटुंब सस्नेह आमंत्रण",
    Tamil: "தாங்கள் குடும்பத்துடன் வருகை தந்து சிறப்பிக்குமாறு வேண்டுகிறோம்",
    Urdu: "آپ باہمی خاندان دعوت نامہ قبول فرمائیں"
  },
  "save the date": {
    English: "Save The Date",
    Gujarati: "તારીખ યાદ રાખજો",
    Hindi: "तारीख याद रखें",
    Marathi: "तारीख लक्षात ठेवा",
    Tamil: "தேதியை குறித்துக் கொள்ளுங்கள்",
    Urdu: "तारीख याद रखें"
  },
  "we cordially invite you to celebrate the wedding ceremony of our children. please join us for dinner at 8 pm onwards.": {
    English: "We cordially invite you to celebrate the wedding ceremony of our children. Please join us for dinner at 8 PM onwards.",
    Gujarati: "અમારા બાળકોના શુભ લગ્ન મહોત્સવ પ્રસંગે આપને સ્નેહભર્યું નિમંત્રણ છે. કૃપા કરીને સાંજે ૮:૦૦ વાગ્યાથી ભોજન સમારંભમાં સામેલ થવા વિનંતી.",
    Hindi: "हमारे बच्चों के शुभ विवाह समारोह की खुशी में आप सपरिवार सादर आमंत्रित हैं। कृपया शाम ८:०० बजे से प्रीतिभोज में सम्मिलित हों।",
    Marathi: "आमच्या मुलांच्या शुभ विवाह सोहळ्यानिमित्त आपण सहकुटुंब सस्नेह आमंत्रित आहात. कृपया संध्याकाळी ८:०० वाजल्यापासून प्रीतिभोजनास उपस्थित राहावे.",
    Tamil: "எங்கள் பிள்ளைகளின் திருமண விழாவைக் கொண்டாட உங்களை அன்போடு அழைக்கிறோம். மாலை 8:00 மணி முதல் திருமண விருந்தில் கலந்து கொள்ள வேண்டுகிறோம்.",
    Urdu: "ہمارے بچوں کی تقریبِ سعید میں آپ مع اہل و عیال सादर आमंत्रित ہیں۔ برائے مہربانی شام 8:00 بجے سے رات کے کھانے میں شرکت فرما کر شکریہ کا موقع دیں۔"
  }
};

function getCommonTranslation(text: string): Record<string, string> | null {
  const normalized = text.trim().toLowerCase().replace(/\s+/g, ' ');
  return COMMON_WEDDING_TRANSLATIONS[normalized] || null;
}

function healTemplate(template: Template | null): Template | null {
  if (!template) return null;

  const cloned = JSON.parse(JSON.stringify(template)) as Template;
  const isWedding = cloned.categoryId === 'cat_wedding' || cloned.slug === 'wedding';
  const isEngagement = cloned.categoryId === 'cat_engagement' || cloned.slug === 'engagement' || cloned.categoryId === 'engagement';

  cloned.pages = cloned.pages.map((page, idx) => {
    // 1. If it's an engagement template and elements is empty, seed them!
    if (isEngagement && (!page.elements || page.elements.length === 0)) {
      switch (idx) {
        case 0:
          page.elements = [
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
              text: 'ચાંદલા વિધિ',
              fontFamily: 'KAP011',
              fontSize: 56,
              color: '#8A1E2B',
              lineHeight: 1.2,
              alignment: 'center',
              fontWeight: '700',
              letterSpacing: 2,
              translations: {
                English: 'CHANDLA VIDHI',
                Gujarati: 'ચાંદલા વિધિ',
                Hindi: 'चांदला विधि',
                Marathi: 'चांदला विधी',
                Tamil: 'சாந்தலா விதி',
                Urdu: 'چاندلا ودھی'
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
              text: 'ચિ. અંકિતા',
              fontFamily: 'KAP011',
              fontSize: 44,
              color: '#3E603B',
              lineHeight: 1.2,
              alignment: 'right',
              fontWeight: '700',
              letterSpacing: 0,
              translations: {
                English: 'Ankita',
                Gujarati: 'ચિ. અંકિતા',
                Hindi: 'चि. अंकिता',
                Marathi: 'चि. अंकिता',
                Tamil: 'அங்கிதா',
                Urdu: 'انکیتا'
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
              text: '💍',
              fontFamily: 'KAP011',
              fontSize: 36,
              color: '#3E603B',
              lineHeight: 1.2,
              alignment: 'center',
              fontWeight: '700',
              letterSpacing: 0,
              translations: {
                English: '💍',
                Gujarati: '💍',
                Hindi: '💍',
                Marathi: '💍',
                Tamil: '💍',
                Urdu: '💍'
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
              text: 'ચિ. અભિષેક',
              fontFamily: 'KAP011',
              fontSize: 44,
              color: '#3E603B',
              lineHeight: 1.2,
              alignment: 'left',
              fontWeight: '700',
              letterSpacing: 0,
              translations: {
                English: 'Abhishek',
                Gujarati: 'ચિ. અભિષેક',
                Hindi: 'चि. अभिषेक',
                Marathi: 'चि. अभिषेक',
                Tamil: 'அபிஷேக்',
                Urdu: 'অভিষেক'
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
              text: 'તા. ૧૯/૧૨/૨૦૨૫, રવિવાર',
              fontFamily: 'Hind Vadodara',
              fontSize: 24,
              color: '#3D3B3C',
              lineHeight: 1.3,
              alignment: 'center',
              fontWeight: '500',
              letterSpacing: 1,
              translations: {
                English: 'Sunday, December 19, 2025',
                Gujarati: 'તા. ૧૯/૧૨/૨૦૨૫, રવિવાર',
                Hindi: 'दिनांक: ૧૯/૧૨/૨૦૨૫, रविवार',
                Marathi: 'दिनांक: ૧૯/૧૨/૨૦૨૫, रविवार',
                Tamil: 'டிசம்பர் 19, 2025, ஞாயிற்றுக்கிழமை',
                Urdu: 'اتوار، 19 دسمبر 2025'
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
              text: 'સ્નેહી શ્રી, ............................................................',
              fontFamily: 'Rasa',
              fontSize: 22,
              color: '#8A1E2B',
              lineHeight: 1.2,
              alignment: 'center',
              fontWeight: '500',
              letterSpacing: 0,
              translations: {
                English: 'To, ............................................................',
                Gujarati: 'સ્નેહી શ્રી, ............................................................'
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
              text: 'ભરતભાઈ ગોપાલભાઈ દેસાઈ\nગોપાલભાઈ રાધેશ્યામભાઈ દેસાઈ\nસિલ્વર રેસિડન્સ સોસાયટી સામે,\nનાનાપુરા ગામ, સુરત.',
              fontFamily: 'Rasa',
              fontSize: 22,
              color: '#8A1E2B',
              lineHeight: 1.5,
              alignment: 'center',
              fontWeight: '500',
              letterSpacing: 0,
              translations: {
                English: 'Bharatbhai Gopalbhai Desai\nGopalbhai Radheshyambhai Desai\nOpp. Silver Residence Society,\nNanapura Village, Surat.',
                Gujarati: 'ભરતભાઈ ગોપાલભાઈ દેસાઈ\nગોપાલભાઈ રાધેશ્યામભાઈ દેસાઈ\nસિલ્વર રેસિડન્સ સોસાયટી સામે,\nનાનાપુરા ગામ, સુરત.'
              }
            }
          ];
          break;
        case 1:
          page.elements = [
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
              text: 'સગાઈ મહોત્સવ',
              fontFamily: 'KAP011',
              fontSize: 58,
              color: '#3E603B',
              lineHeight: 1.2,
              alignment: 'center',
              fontWeight: '700',
              letterSpacing: 1,
              translations: {
                English: 'Engagement Celebration',
                Gujarati: 'સગાઈ મહોત્સવ'
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
              text: 'સહર્ષ ખુશાલી સાથે જણાવવાનું કે અમારા કુટુંબની શુભ આશીર્વાદ મળવાથી અમારા પ્રિય સંતાનોના શુભ (સાદી) પ્રસંગે પાવનિની તથા શ્રી સત્યનારાયણ ભગવાનના દર્શન ની શુભના.',
              fontFamily: 'Rasa',
              fontSize: 22,
              color: '#8A1E2B',
              lineHeight: 1.6,
              alignment: 'center',
              fontWeight: '400',
              letterSpacing: 0,
              translations: {
                English: 'We are extremely pleased to announce that with the auspicious blessings of our family, the engagement of our beloved children is scheduled.',
                Gujarati: 'સહર્ષ ખુશાલી સાથે જણાવવાનું કે અમારા કુટુંબની શુભ આશીર્વાદ મળવાથી અમારા પ્રિય સંતાનોના શુભ (સાદી) પ્રસંગે પાવનિની તથા શ્રી સત્યનારાયણ ભગવાનના દર્શન ની શુભના.'
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
              text: 'ચિ. અંકિતા',
              fontFamily: 'KAP011',
              fontSize: 44,
              color: '#3E603B',
              lineHeight: 1.2,
              alignment: 'right',
              fontWeight: '700',
              translations: {
                English: 'Ankita',
                Gujarati: 'ચિ. અંકિતા'
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
              text: '💍',
              fontFamily: 'KAP011',
              fontSize: 36,
              color: '#3E603B',
              lineHeight: 1.2,
              alignment: 'center',
              fontWeight: '700',
              translations: {
                English: '💍',
                Gujarati: '💍'
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
              text: 'ચિ. અભિષેક',
              fontFamily: 'KAP011',
              fontSize: 44,
              color: '#3E603B',
              lineHeight: 1.2,
              alignment: 'left',
              fontWeight: '700',
              translations: {
                English: 'Abhishek',
                Gujarati: 'ચિ. અભિષેક'
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
              text: 'શિવનગર બજાર હોલ સામે, જલારામ ચૌક ની આજુબાજુ યોજાનાર સગાઈ ના શુભ અવસરે તારીખ ૨૦૨૫ ના પોષ વદ ૧ ના રવિવાર, ૧૯-ડિસેમ્બર-૨૦૨૫ ના રોજ વિધિ સાંજે ૫:૦૦ કલાકે રાખવામાં આવેલ છે. આ શુભ પ્રસંગે પધારી સ્નેહભોજન માણી અમોને કૃતાર્થ કરશો.',
              fontFamily: 'Rasa',
              fontSize: 22,
              color: '#8A1E2B',
              lineHeight: 1.6,
              alignment: 'center',
              fontWeight: '500',
              translations: {
                English: 'The auspicious Engagement Ceremony is scheduled on Sunday, 19-December-2025 at 5:00 PM at Shivnagar Bazar Hall, near Jalaram Chowk. Please join us for dinner and bless the couple.',
                Gujarati: 'શિવનગર બજાર હોલ સામે, જલારામ ચૌક ની આજુબાજુ યોજાનાર સગાઈ ના શુભ અવસરે તારીખ ૨૦૨૫ ના પોષ વદ ૧ ના રવિવાર, ૧૯-ડિસેમ્બર-૨૦૨૫ ના રોજ વિધિ સાંજે ૫:૦૦ કલાકે રાખવામાં આવેલ છે. આ શુભ પ્રસંગે પધારી સ્નેહભોજન માણી અમોને કૃતાર્થ કરશો.'
              }
            }
          ];
          break;
        case 2:
          page.elements = [
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
              text: 'ગણેશ સ્થાપના\nતા. ૧૯/12/૨૦૨૫ ને શુક્રવાર\nસવારે ૯:૩0 કલાકે',
              fontFamily: 'Rasa',
              fontSize: 24,
              color: '#3E603B',
              lineHeight: 1.4,
              alignment: 'center',
              fontWeight: '500',
              translations: {
                English: 'Ganesh Sthapana\nFriday, 19-Dec-2025\nTime: 9:30 AM',
                Gujarati: 'ગણેશ સ્થાપના\nતા. ૧૯/12/૨૦૨૫ ને શુક્રવાર\nસવારે ૯:૩0 કલાકે'
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
              text: 'ચાંદલા વિધિ\nતા. ૧૯/12/૨૦૨૫ ને રવિવાર\nસાંજે ૫:૦0 કલાકે',
              fontFamily: 'Rasa',
              fontSize: 24,
              color: '#3E603B',
              lineHeight: 1.4,
              alignment: 'center',
              fontWeight: '500',
              translations: {
                English: 'Chandla Vidhi\nSunday, 19-Dec-2025\nTime: 5:00 PM',
                Gujarati: 'ચાંદલા વિધિ\nતા. ૧૯/12/૨૦૨૫ ને રવિવાર\nસાંજે ૫:૦0 કલાકે'
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
              text: 'ભોજન સમારંભ\nતા. ૧૯/12/૨૦૨૫ ને રવિવાર\nસાંજે ૭:૩0 કલાકે\nઆ શુભ પ્રસંગે પધારી સ્નેહભોજન માણી અમોને કૃતાર્થ કરશો.',
              fontFamily: 'Rasa',
              fontSize: 24,
              color: '#8A1E2B',
              lineHeight: 1.5,
              alignment: 'center',
              fontWeight: '500',
              translations: {
                English: 'Dinner Feast\nSunday, 19-Dec-2025\nTime: 7:30 PM\nPlease join us for dinner and share the joy.',
                Gujarati: 'ભોજન સમારંભ\nતા. ૧૯/12/૨૦૨૫ ને રવિવાર\nસાંજે ૭:૩0 કલાકે\nઆ શુભ પ્રસંગે પધારી સ્નેહભોજન માણી અમોને કૃતાર્થ કરશો.'
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
              text: 'શુભ સ્થળ\nપ્લોટ નં.૧, બાપા સીતારામ ચોક, સુરત.',
              fontFamily: 'Rasa',
              fontSize: 24,
              color: '#8A1E2B',
              lineHeight: 1.5,
              alignment: 'center',
              fontWeight: '500',
              translations: {
                English: 'Venue\nPlot No. 1, Bapa Sitaram Chowk, Surat.',
                Gujarati: 'શુભ સ્થળ\nપ્લોટ નં.૧, બાપા સીતારામ ચોક, સુરત.'
              }
            }
          ];
          break;
        case 3:
          page.elements = [
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
              text: 'સ્નેહ મિલન',
              fontFamily: 'KAP011',
              fontSize: 46,
              color: '#3E603B',
              lineHeight: 1.2,
              alignment: 'center',
              fontWeight: '700',
              translations: {
                English: 'Sneha Milan',
                Gujarati: 'સ્નેહ મિલન'
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
              text: 'અમારા વ્હાલ સોયા સંતાનોના શુભ સગાઈના અવસરે આપને સ્નેહભર્યું નિમંત્રણ છે. આપની ઉપસ્થિતિ અમારા આનંદને દ્વિગુણિત કરશે.',
              fontFamily: 'Rasa',
              fontSize: 22,
              color: '#8A1E2B',
              lineHeight: 1.5,
              alignment: 'center',
              fontWeight: '400',
              translations: {
                English: 'We cordially invite you to join us in celebrating the sweet bond of engagement of our children. Your presence will multiply our joy.',
                Gujarati: 'અમારા વ્હાલ સોયા સંતાનોના શુભ સગાઈના અવસરે આપને સ્નેહભર્યું નિમંત્રણ છે. આપની ઉપસ્થિતિ અમારા આનંદને દ્વિગુણિત કરશે.'
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
              text: 'ચિ. અંકિતા',
              fontFamily: 'KAP011',
              fontSize: 44,
              color: '#3E603B',
              lineHeight: 1.2,
              alignment: 'right',
              fontWeight: '700',
              translations: {
                English: 'Ankita',
                Gujarati: 'ચિ. અંકિતા'
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
              text: '💍',
              fontFamily: 'KAP011',
              fontSize: 36,
              color: '#3E603B',
              lineHeight: 1.2,
              alignment: 'center',
              fontWeight: '700',
              translations: {
                English: '💍',
                Gujarati: '💍'
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
              text: 'ચિ. અભિષેક',
              fontFamily: 'KAP011',
              fontSize: 44,
              color: '#3E603B',
              lineHeight: 1.2,
              alignment: 'left',
              fontWeight: '700',
              translations: {
                English: 'Abhishek',
                Gujarati: 'ચિ. અભિષેક'
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
              text: 'શુભ સગાઈ ઉત્સવ પ્રસંગે\nરવિવાર, તા. ૧૯-૧૨-૨૦૨૫ નાં રોજ\nસાંજે ૬:૦0 કલાકે',
              fontFamily: 'Rasa',
              fontSize: 22,
              color: '#8A1E2B',
              lineHeight: 1.5,
              alignment: 'center',
              fontWeight: '500',
              translations: {
                English: 'On the celebration of auspicious engagement\nSunday, December 19, 2025\nTime: 6:00 PM',
                Gujarati: 'શુભ સગાઈ ઉત્સવ પ્રસંગે\nરવિવાર, તા. ૧૯-૧૨-૨૦૨૫ નાં રોજ\nસાંજે ૬:૦0 કલાકે'
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
              text: 'ભોજન સમારંભ\nસાંજે ૭:૩0 કલાકે\nઆપશ્રી .......... પધારશોજી',
              fontFamily: 'Rasa',
              fontSize: 22,
              color: '#8A1E2B',
              lineHeight: 1.4,
              alignment: 'center',
              fontWeight: '500',
              translations: {
                English: 'Dinner Feast\nTime: 7:30 PM\nYou are cordially invited',
                Gujarati: 'ભોજન સમારંભ\nસાંજે ૭:૩0 કલાકે\nઆપશ્રી .......... પધારશોજી'
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
              text: 'શુભ સ્થળ\nપ્લોટ નં.૧, બાપા સીતારામ ચોક, સુરત.',
              fontFamily: 'Rasa',
              fontSize: 22,
              color: '#8A1E2B',
              lineHeight: 1.5,
              alignment: 'center',
              fontWeight: '500',
              translations: {
                English: 'Venue\nPlot No. 1, Bapa Sitaram Chowk, Surat.',
                Gujarati: 'શુભ સ્થળ\nપ્લોટ નં.૧, બાપા સીતારામ ચોક, સુરત.'
              }
            }
          ];
          break;
        case 4:
          page.elements = [
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
              text: 'સગાઈ મહોત્સવ',
              fontFamily: 'KAP011',
              fontSize: 46,
              color: '#3E603B',
              lineHeight: 1.2,
              alignment: 'center',
              fontWeight: '700',
              translations: {
                English: 'Engagement Ceremony',
                Gujarati: 'સગાઈ મહોત્સવ'
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
              text: 'બે મનની સ્નેહભરી ગાંઠ એટલે સગાઈ પ્રસંગ.',
              fontFamily: 'Rasa',
              fontSize: 22,
              color: '#8A1E2B',
              lineHeight: 1.5,
              alignment: 'center',
              fontWeight: '500',
              translations: {
                English: 'Engagement is a union of two hearts tied with love.',
                Gujarati: 'બે મનની સ્નેહભરી ગાંઠ એટલે સગાઈ પ્રસંગ.'
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
              text: 'ચિ. અંકિતા',
              fontFamily: 'KAP011',
              fontSize: 44,
              color: '#3E603B',
              lineHeight: 1.2,
              alignment: 'right',
              fontWeight: '700',
              translations: {
                English: 'Ankita',
                Gujarati: 'ચિ. અંકિતા'
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
              text: '💍',
              fontFamily: 'KAP011',
              fontSize: 36,
              color: '#3E603B',
              lineHeight: 1.2,
              alignment: 'center',
              fontWeight: '700',
              translations: {
                English: '💍',
                Gujarati: '💍'
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
              text: 'ચિ. અભિષેક',
              fontFamily: 'KAP011',
              fontSize: 44,
              color: '#3E603B',
              lineHeight: 1.2,
              alignment: 'left',
              fontWeight: '700',
              translations: {
                English: 'Abhishek',
                Gujarati: 'ચિ. અભિષેક'
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
              text: 'ના શુભ સગાઈ અવસરે આશીર્ભૂત સગાઈ સમારંભ માં\nરવિવાર તા. ૧૯/૧૨/૨૦૨૫ ના રોજ',
              fontFamily: 'Rasa',
              fontSize: 22,
              color: '#8A1E2B',
              lineHeight: 1.5,
              alignment: 'center',
              fontWeight: '500',
              translations: {
                English: 'On their auspicious engagement ceremony\nSunday, December 19, 2025',
                Gujarati: 'ના શુભ સગાઈ અવસરે આશીર્ભૂત સગાઈ સમારંભ માં\nરવિવાર તા. ૧૯/૧૨/૨૦૨૫ ના રોજ'
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
              text: 'ચાંદલા વિધિ\nતા. ૧૯/૧૨/૨૦૨૫ ને રવિવાર\nસાંજે ૫:૦0 કલાકે',
              fontFamily: 'Rasa',
              fontSize: 22,
              color: '#3E603B',
              lineHeight: 1.4,
              alignment: 'center',
              translations: {
                English: 'Chandla Vidhi\nSunday, Dec 19, 2025\nTime: 5:00 PM',
                Gujarati: 'ચાંદલા વિધિ\nતા. ૧૯/૧૨/૨૦૨૫ ને રવિવાર\nસાંજે ૫:૦0 કલાકે'
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
              text: 'ભોજન સમારંભ\nતા. ૧૯/૧૨/૨૦૨૫ ને રવિવાર\nસાંજે ૭:૩0 કલાકે',
              fontFamily: 'Rasa',
              fontSize: 22,
              color: '#3E603B',
              lineHeight: 1.4,
              alignment: 'center',
              translations: {
                English: 'Dinner Feast\nSunday, Dec 19, 2025\nTime: 7:30 PM',
                Gujarati: 'ભોજન સમારંભ\nતા. ૧૯/૧૨/૨૦૨૫ ને રવિવાર\nસાંજે ૭:૩0 કલાકે'
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
              text: 'આપના ............ સહિત પધારવા વિનંતી.',
              fontFamily: 'Rasa',
              fontSize: 22,
              color: '#8A1E2B',
              lineHeight: 1.4,
              alignment: 'center',
              translations: {
                English: 'You are cordially requested to join with your family.',
                Gujarati: 'આપના ............ સહિત પધારવા વિનંતી.'
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
              text: 'શુભ સ્થળ\nપ્લોટ નં.૧, બાપા સીતારામ ચોક, સુરત.',
              fontFamily: 'Rasa',
              fontSize: 22,
              color: '#8A1E2B',
              lineHeight: 1.4,
              alignment: 'center',
              translations: {
                English: 'Venue\nPlot No. 1, Bapa Sitaram Chowk, Surat.',
                Gujarati: 'શુભ સ્થળ\nપ્લોટ નં.૧, બાપા સીતારામ ચોક, સુરત.'
              }
            }
          ];
          break;
        case 5:
          page.elements = [
            {
              id: `elem_thanks_mantra_page6_${Math.random().toString(36).substr(2, 9)}`,
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
              text: ':: નિમંત્રક ::',
              fontFamily: 'KAP011',
              fontSize: 32,
              color: '#3E603B',
              lineHeight: 1.2,
              alignment: 'center',
              fontWeight: '700',
              translations: {
                English: ':: Inviter ::',
                Gujarati: ':: નિમંત્રક ::'
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
              text: 'ભરતભાઈ ગોપાલભાઈ દેસાઈ\nગોપાલભાઈ રાધેશ્યામભાઈ દેસાઈ\nભરતભાઈ ગોપાલભાઈ દેસાઈ\nદરપણ રાજકુમાર, લક્ષ્મણ નગર',
              fontFamily: 'Rasa',
              fontSize: 22,
              color: '#8A1E2B',
              lineHeight: 1.5,
              alignment: 'center',
              translations: {
                English: 'Bharatbhai Gopalbhai Desai\nGopalbhai Radheshyambhai Desai\nBharatbhai Gopalbhai Desai\nDarpan Rajkumar, Laxman Nagar',
                Gujarati: 'ભરતભાઈ ગોપાલભાઈ દેસાઈ\nગોપાલભાઈ રાધેશ્યામભાઈ દેસાઈ\nભરતભાઈ ગોપાલભાઈ દેસાઈ\nદરપણ રાજકુમાર, લક્ષ્મણ નગર'
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
              text: 'પ્લોટ નં.૧, બાપા સીતારામ ચોક\nકૃષ્ણકુંજ એપાર્ટમેન્ટ,\nસિલ્વર રેસિડન્સ સોસાયટી સામે,\nનાનાપુરા ગામ, સુરત',
              fontFamily: 'Rasa',
              fontSize: 22,
              color: '#8A1E2B',
              lineHeight: 1.5,
              alignment: 'center',
              translations: {
                English: 'Plot No. 1, Bapa Sitaram Chowk\nKrishnakunj Apartment,\nOpp. Silver Residence Society,\nNanapura Village, Surat',
                Gujarati: 'પ્લોટ નં.૧, બાપા સીતારામ ચોક\nકૃષ્ણકુંજ એપાર્ટમેન્ટ,\nસિલ્વર રેસિડન્સ સોસાયટી સામે,\nનાનાપુરા ગામ, સુરત'
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
              text: ':: ભોજન સમારંભ ::',
              fontFamily: 'KAP011',
              fontSize: 32,
              color: '#3E603B',
              lineHeight: 1.2,
              alignment: 'center',
              fontWeight: '700',
              translations: {
                English: ':: Dinner Feast ::',
                Gujarati: ':: ભોજન સમારંભ ::'
              }
            },
            {
              id: `elem_family_darshna_left_${Math.random().toString(36).substr(2, 9)}`,
              type: 'text',
              x: 100,
              y: 520,
              width: 880,
              height: 250,
              rotation: 0,
              opacity: 1,
              zIndex: 6,
              isLocked: false,
              text: 'બા. ગ. સુ. રાઉભાઈ તથા કલ્પના બેન ના સુપુત્ર\nસૌરભ કુમાર\nઆપના ............ સહિત પધારવા વિનંતી.',
              fontFamily: 'Rasa',
              fontSize: 22,
              color: '#8A1E2B',
              lineHeight: 1.5,
              alignment: 'center',
              translations: {
                English: 'Son of Ba. Ga. Su. Raubhai & Kalpana Ben\nSaurabh Kumar\nYou are cordially requested to join with family.',
                Gujarati: 'બા. ગ. સુ. રાઉભાઈ તથા કલ્પના બેન ના સુપુત્ર\nસૌરભ કુમાર\nઆપના ............ સહિત પધારવા વિનંતી.'
              }
            }
          ];
          break;
        case 6:
          page.elements = [
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
          ];
          break;
        default:
          page.elements = [
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
          ];
      }
    } else if (isWedding && (!page.elements || page.elements.length === 0)) {
      switch (idx) {
        case 0:
          page.elements = [
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
              text: 'સ્નેહી શ્રી, ............................................................',
              fontFamily: 'Rasa',
              fontSize: 22,
              color: '#8A1E2B',
              lineHeight: 1.2,
              alignment: 'center',
              fontWeight: '500',
              letterSpacing: 0,
              translations: {
                English: 'To, ............................................................',
                Gujarati: 'સ્નેહી શ્રી, ............................................................'
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
          ];
          break;
        case 1:
          page.elements = [
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
          ];
          break;
        case 2:
          page.elements = [
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
          ];
          break;
        case 3:
          page.elements = [
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
          ];
          break;
        case 4:
          page.elements = [
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
          ];
          break;
        case 5:
          page.elements = [
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
          ];
          break;
        case 6:
          page.elements = [
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
          ];
          break;
        default:
          page.elements = [
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
          ];
      }
    }

    // 2. Ensure all text elements on all pages have complete and fully populated translations!
    if (page.elements && page.elements.length > 0) {
      page.elements = page.elements.map((elem) => {
        if (elem.type === 'text') {
          const textVal = elem.text || '';
          const match = getCommonTranslation(textVal);

          const translations: Record<string, string> = {
            ...(elem.translations || {})
          };

          const allLangs = cloned.languages && cloned.languages.length > 0
            ? cloned.languages
            : ['English', 'Hindi', 'Gujarati', 'Marathi', 'Tamil', 'Urdu'];

          allLangs.forEach((lang) => {
            const hasPlaceholderValue = !translations[lang] || (translations[lang] === textVal && lang !== 'English');
            if (hasPlaceholderValue) {
              if (match && match[lang]) {
                translations[lang] = match[lang];
              } else if (!translations[lang]) {
                translations[lang] = textVal;
              }
            }
          });

          return {
            ...elem,
            translations
          };
        }
        return elem;
      });
    }

    return page;
  });

  return cloned;
}

interface CanvasState {
  template: Template | null;
  selectedPageIndex: number;
  selectedElementId: string | null;
  zoom: number;
  undoStack: TemplatePage[][];
  redoStack: TemplatePage[][];
  autosaveStatus: 'idle' | 'saving' | 'saved' | 'error';
  selectedLanguage: string;
  imageChooserElementId: string | null;
  isImageChooserOpen: boolean;

  // Actions
  setTemplate: (template: Template | null) => void;
  selectPage: (index: number) => void;
  selectElement: (id: string | null) => void;
  setZoom: (zoom: number) => void;
  setAutosaveStatus: (status: 'idle' | 'saving' | 'saved' | 'error') => void;
  setSelectedLanguage: (lang: string) => void;
  setImageChooserOpen: (isOpen: boolean, elementId?: string | null) => void;

  // Element Actions
  addElement: (element: Omit<CanvasElement, 'id' | 'zIndex'>) => void;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  deleteElement: (id: string) => void;
  duplicateElement: (id: string) => void;

  // Layer & Lock Actions
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  toggleLock: (id: string) => void;

  // Page Actions
  addPage: (name?: string) => void;
  deletePage: (index: number) => void;
  duplicatePage: (index: number) => void;
  updatePageBackground: (imageUrl: string) => void;
  reorderPages: (pages: TemplatePage[]) => void;
  updateTemplatePages: (pages: TemplatePage[]) => void;

  // History Actions
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  template: null,
  selectedPageIndex: 0,
  selectedElementId: null,
  zoom: 50, // default 50% display zoom for standard 1080x1920 viewport in browser
  undoStack: [],
  redoStack: [],
  autosaveStatus: 'idle',
  selectedLanguage: 'English',
  imageChooserElementId: null,
  isImageChooserOpen: false,

  setImageChooserOpen: (isImageChooserOpen, imageChooserElementId = null) =>
    set({ isImageChooserOpen, imageChooserElementId }),

  setTemplate: (template) => {
    const healed = healTemplate(template);
    set({
      template: healed,
      selectedPageIndex: 0,
      selectedElementId: null,
      undoStack: [],
      redoStack: [],
      selectedLanguage: 'English'
    });
  },

  selectPage: (selectedPageIndex) => set({ selectedPageIndex, selectedElementId: null }),

  selectElement: (selectedElementId) => set({ selectedElementId }),

  setZoom: (zoom) => set({ zoom: Math.max(10, Math.min(200, zoom)) }),

  setAutosaveStatus: (autosaveStatus) => set({ autosaveStatus }),

  setSelectedLanguage: (selectedLanguage) => set({ selectedLanguage }),

  pushHistory: () => {
    const { template } = get();
    if (!template) return;

    // Deep clone pages to preserve state cleanly
    const pagesClone = JSON.parse(JSON.stringify(template.pages)) as TemplatePage[];

    set((state) => ({
      undoStack: [...state.undoStack, pagesClone],
      redoStack: [] // clear redo stack on new action
    }));
  },

  undo: () => {
    const { undoStack, template, redoStack } = get();
    if (!template || undoStack.length === 0) return;

    const currentPages = JSON.parse(JSON.stringify(template.pages)) as TemplatePage[];
    const previousPages = undoStack[undoStack.length - 1];

    set({
      template: { ...template, pages: previousPages },
      undoStack: undoStack.slice(0, -1),
      redoStack: [...redoStack, currentPages],
      selectedElementId: null
    });
  },

  redo: () => {
    const { redoStack, template, undoStack } = get();
    if (!template || redoStack.length === 0) return;

    const currentPages = JSON.parse(JSON.stringify(template.pages)) as TemplatePage[];
    const nextPages = redoStack[redoStack.length - 1];

    set({
      template: { ...template, pages: nextPages },
      redoStack: redoStack.slice(0, -1),
      undoStack: [...undoStack, currentPages],
      selectedElementId: null
    });
  },

  clearHistory: () => set({ undoStack: [], redoStack: [] }),

  addElement: (elem) => {
    const { template, selectedPageIndex, pushHistory } = get();
    if (!template) return;

    pushHistory();

    const pages = [...template.pages];
    const currentPage = pages[selectedPageIndex];
    if (!currentPage) return;

    const elements = currentPage.elements || [];
    const maxZIndex = elements.reduce((max, e) => Math.max(max, e.zIndex), 0);

    const elemText = elem.text || '';
    const translations: Record<string, string> = { ...(elem.translations || {}) };

    if (Object.keys(translations).length === 0) {
      const match = getCommonTranslation(elemText);
      const allLangs = template.languages && template.languages.length > 0 ? template.languages : ['English', 'Hindi', 'Gujarati', 'Marathi', 'Tamil', 'Urdu'];
      allLangs.forEach(lang => {
        if (match && match[lang]) {
          translations[lang] = match[lang];
        } else {
          translations[lang] = elemText;
        }
      });
    }

    const newElement: CanvasElement = {
      ...elem,
      id: `elem_${Math.random().toString(36).substr(2, 9)}`,
      zIndex: maxZIndex + 1,
      isLocked: false,
      translations
    };

    currentPage.elements = [...elements, newElement];

    set({
      template: { ...template, pages },
      selectedElementId: newElement.id
    });
  },

  updateElement: (id, updates) => {
    const { template, selectedPageIndex, pushHistory, selectedLanguage } = get();
    if (!template) return;

    const currentPage = template.pages[selectedPageIndex];
    const element = currentPage?.elements.find(e => e.id === id);
    if (!element) return;

    // Check if element is locked before modifying coordinates
    if (element.isLocked && (updates.x !== undefined || updates.y !== undefined || updates.width !== undefined || updates.height !== undefined || updates.rotation !== undefined)) {
      return; // Block coordinate movements on locked elements
    }

    pushHistory();

    const pages = [...template.pages];
    const page = pages[selectedPageIndex];
    if (!page) return;

    page.elements = page.elements.map((e) => {
      if (e.id === id) {
        let finalUpdates = { ...updates };

        // Multi-language text synchronization
        if (updates.text !== undefined && updates.translations === undefined) {
          const newText = updates.text;
          const oldText = e.text || '';
          const currentLang = selectedLanguage || 'English';
          const translations = { ...(e.translations || {}) };

          translations[currentLang] = newText;

          const allLangs = template.languages && template.languages.length > 0 ? template.languages : ['English', 'Hindi', 'Gujarati', 'Marathi', 'Tamil', 'Urdu'];

          // Only propagate if all languages currently match the old placeholder text (i.e. they are completely unedited)
          const allSame = allLangs.every(lang => !translations[lang] || translations[lang] === oldText);

          allLangs.forEach(lang => {
            if (lang !== currentLang) {
              const val = translations[lang];
              if (!val || allSame) {
                translations[lang] = newText;
              }
            }
          });

          finalUpdates.translations = translations;
          finalUpdates.text = translations['English'] || newText;
        }

        return { ...e, ...finalUpdates };
      }
      return e;
    });

    set({ template: { ...template, pages } });
  },

  deleteElement: (id) => {
    const { template, selectedPageIndex, pushHistory } = get();
    if (!template) return;

    pushHistory();

    const pages = [...template.pages];
    const page = pages[selectedPageIndex];
    if (!page) return;

    page.elements = page.elements.filter((e) => e.id !== id);

    set({
      template: { ...template, pages },
      selectedElementId: null
    });
  },

  duplicateElement: (id) => {
    const { template, selectedPageIndex, pushHistory } = get();
    if (!template) return;

    pushHistory();

    const pages = [...template.pages];
    const page = pages[selectedPageIndex];
    if (!page) return;

    const element = page.elements.find((e) => e.id === id);
    if (!element) return;

    const maxZ = page.elements.reduce((max, e) => Math.max(max, e.zIndex), 0);

    const clone: CanvasElement = {
      ...element,
      id: `elem_${Math.random().toString(36).substr(2, 9)}`,
      x: element.x + 40, // offset coordinates to reveal duplication
      y: element.y + 40,
      zIndex: maxZ + 1,
      isLocked: false
    };

    page.elements = [...page.elements, clone];

    set({
      template: { ...template, pages },
      selectedElementId: clone.id
    });
  },

  bringToFront: (id) => {
    const { template, selectedPageIndex, pushHistory } = get();
    if (!template) return;

    pushHistory();

    const pages = [...template.pages];
    const page = pages[selectedPageIndex];
    if (!page) return;

    const elements = [...page.elements];
    const maxZ = elements.reduce((max, e) => Math.max(max, e.zIndex), 0);

    page.elements = elements.map((e) => {
      if (e.id === id) {
        return { ...e, zIndex: maxZ + 1 };
      }
      return e;
    });

    set({ template: { ...template, pages } });
  },

  sendToBack: (id) => {
    const { template, selectedPageIndex, pushHistory } = get();
    if (!template) return;

    pushHistory();

    const pages = [...template.pages];
    const page = pages[selectedPageIndex];
    if (!page) return;

    const elements = [...page.elements];
    const minZ = elements.reduce((min, e) => Math.min(min, e.zIndex), 0);

    page.elements = elements.map((e) => {
      if (e.id === id) {
        return { ...e, zIndex: Math.max(0, minZ - 1) };
      }
      return e;
    });

    set({ template: { ...template, pages } });
  },

  toggleLock: (id) => {
    const { template, selectedPageIndex, pushHistory } = get();
    if (!template) return;

    pushHistory();

    const pages = [...template.pages];
    const page = pages[selectedPageIndex];
    if (!page) return;

    page.elements = page.elements.map((e) => {
      if (e.id === id) {
        return { ...e, isLocked: !e.isLocked };
      }
      return e;
    });

    set({ template: { ...template, pages } });
  },

  addPage: (name) => {
    const { template, pushHistory } = get();
    if (!template) return;

    pushHistory();

    const pages = [...template.pages];
    const newPage: TemplatePage = {
      id: `page_${Math.random().toString(36).substr(2, 9)}`,
      name: name || `Page ${pages.length + 1}`,
      backgroundImage: '',
      elements: []
    };

    set({
      template: { ...template, pages: [...pages, newPage] },
      selectedPageIndex: pages.length
    });
  },

  deletePage: (index) => {
    const { template, pushHistory } = get();
    if (!template || template.pages.length <= 1) return; // Keep at least 1 page

    pushHistory();

    const pages = template.pages.filter((_, i) => i !== index);

    set({
      template: { ...template, pages },
      selectedPageIndex: Math.max(0, index - 1),
      selectedElementId: null
    });
  },

  duplicatePage: (index) => {
    const { template, pushHistory } = get();
    if (!template) return;

    pushHistory();

    const pages = [...template.pages];
    const pageToDuplicate = pages[index];
    if (!pageToDuplicate) return;

    const duplicatedElements = (pageToDuplicate.elements || []).map(elem => ({
      ...elem,
      id: `elem_${Math.random().toString(36).substr(2, 9)}`
    }));

    const duplicatedPage: TemplatePage = {
      id: `page_${Math.random().toString(36).substr(2, 9)}`,
      name: `${pageToDuplicate.name} (Copy)`,
      backgroundImage: pageToDuplicate.backgroundImage,
      elements: duplicatedElements
    };

    // Insert right after the current index
    pages.splice(index + 1, 0, duplicatedPage);

    set({
      template: { ...template, pages },
      selectedPageIndex: index + 1,
      selectedElementId: null
    });
  },

  updatePageBackground: (imageUrl) => {
    const { template, selectedPageIndex, pushHistory } = get();
    if (!template) return;

    pushHistory();

    const pages = [...template.pages];
    const page = pages[selectedPageIndex];
    if (!page) return;

    page.backgroundImage = imageUrl;

    // Track dynamic background within template local assets list
    const localAssetPaths = [...template.localAssetPaths];
    const cleanUrl = imageUrl.replace(/^\//, ''); // Clean leading slash
    if (imageUrl && !localAssetPaths.includes(cleanUrl)) {
      localAssetPaths.push(cleanUrl);
    }

    set({
      template: {
        ...template,
        pages,
        localAssetPaths
      }
    });
  },

  reorderPages: (pages) => {
    const { template, pushHistory } = get();
    if (!template) return;

    pushHistory();

    set({
      template: { ...template, pages }
    });
  },

  updateTemplatePages: (pages) => {
    const { template, pushHistory } = get();
    if (!template) return;

    pushHistory();

    set({
      template: { ...template, pages }
    });
  }
}));
