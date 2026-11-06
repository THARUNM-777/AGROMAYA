import React, { createContext, useContext, useState } from 'react';

type Language = 'en' | 'kn';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    home: 'Home',
    myFarm: 'My Farm',
    myRequests: 'My Requests',
    feedstockCollection: 'Feedstock Collection',
    myCredits: 'My Credits & Wallet',
    marketplace: 'Agri Marketplace',
    myOrders: 'My Orders',
    cashback: 'Cashback & Payments',
    notifications: 'Notifications',
    profile: 'Profile',
    logout: 'Logout',
    // Farmer Home
    farmerGreeting: 'Namaskara, Farmer Partner!',
    feedstockSupplied: 'Total Feedstock Supplied',
    creditsEarned: 'Total Credits Earned',
    availableBalance: 'Available Credits',
    cashReceived: 'Cash Received',
    pendingCollections: 'Pending Collections',
    activeRequests: 'Active Requests',
    // Field terms
    fieldCode: 'Field ID',
    cropType: 'Crop Type',
    surveyNumber: 'Survey Number',
    landArea: 'Land Area',
    harvestReadiness: 'Harvest Readiness',
    estimatedResidue: 'Estimated Residue',
    status: 'Status',
    harvestReady: 'Harvest Ready',
    harvestApproaching: 'Harvest Approaching',
    collected: 'Collected',
    growing: 'Growing / In-Field',
    // Actions
    accept: 'Accept Offer',
    reject: 'Decline Offer',
    viewOnMap: 'View on Map',
    buyNow: 'Redeem with Credits',
    addToCart: 'Add to Cart',
    cart: 'Shopping Cart',
    tonnes: 'Tonnes',
    acres: 'Acres',
    credits: 'Credits',
    rupees: '₹',
  },
  kn: {
    // Navigation
    home: 'ಮುಖಪುಟ',
    myFarm: 'ನನ್ನ ಜಮೀನು',
    myRequests: 'ಕಂಪನಿ ಬೇಡಿಕೆಗಳು',
    feedstockCollection: 'ಕೃಷಿ ತ್ಯಾಜ್ಯ ಸಂಗ್ರಹಣೆ',
    myCredits: 'ನನ್ನ ಕೃಷಿ ಕ್ರೆಡಿಟ್ ವಾಲೆಟ್',
    marketplace: 'ಕೃಷಿ ಮಾರುಕಟ್ಟೆ',
    myOrders: 'ನನ್ನ ಆರ್ಡರ್‌ಗಳು',
    cashback: 'ನಗದು ಪಾವತಿಗಳು',
    notifications: 'ಸೂಚನೆಗಳು',
    profile: 'ಪ್ರೊಫೈಲ್',
    logout: 'ನಿರ್ಗಮಿಸಿ',
    // Farmer Home
    farmerGreeting: 'ನಮಸ್ಕಾರ, ರೈತ ಮಿತ್ರರೆ!',
    feedstockSupplied: 'ಒಟ್ಟು ಪೂರೈಸಿದ ತ್ಯಾಜ್ಯ',
    creditsEarned: 'ಗಳಿಸಿದ ಕೃಷಿ ಕ್ರೆಡಿಟ್‌ಗಳು',
    availableBalance: 'ಲಭ್ಯವಿರುವ ಕ್ರೆಡಿಟ್ ಮೊತ್ತ',
    cashReceived: 'ಖಾತೆಗೆ ಜಮೆಯಾದ ನಗದು',
    pendingCollections: 'ಬಾಕಿ ಸಂಗ್ರಹಣೆಗಳು',
    activeRequests: 'ಸಕ್ರಿಯ ಬೇಡಿಕೆಗಳು',
    // Field terms
    fieldCode: 'ಜಮೀನು ಸಂಖ್ಯೆ',
    cropType: 'ಬೆಳೆ ಪ್ರಕಾರ',
    surveyNumber: 'ಸರ್ವೆ ನಂಬರ್',
    landArea: 'ವಿಸ್ತೀರ್ಣ',
    harvestReadiness: 'ಕೊಯ್ಲಿನ ಸಿದ್ಧತೆ',
    estimatedResidue: 'ಅಂದಾಜು ಕೃಷಿ ತ್ಯಾಜ್ಯ',
    status: 'ಸ್ಥಿತಿ',
    harvestReady: 'ಕೊಯ್ಲಿಗೆ ಸಿದ್ಧವಾಗಿದೆ',
    harvestApproaching: 'ಕೊಯ್ಲು ಸಮೀಪಿಸುತ್ತಿದೆ',
    collected: 'ಸಂಗ್ರಹಿಸಲಾಗಿದೆ',
    growing: 'ಬೆಳೆಯುತ್ತಿದೆ',
    // Actions
    accept: 'ಒಪ್ಪಿಕೊಳ್ಳಿ',
    reject: 'ತಿರಸ್ಕರಿಸಿ',
    viewOnMap: 'ನಕ್ಷೆಯಲ್ಲಿ ವೀಕ್ಷಿಸಿ',
    buyNow: 'ಕ್ರೆಡಿಟ್‌ಗಳಿಂದ ಖರೀದಿಸಿ',
    addToCart: 'ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸಿ',
    cart: 'ಕಾರ್ಟ್',
    tonnes: 'ಟನ್',
    acres: 'ಎಕರೆ',
    credits: 'ಕ್ರೆಡಿಟ್ಸ್',
    rupees: 'ರೂ.',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('agromaya_lang') as Language) || 'en';
  });

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('agromaya_lang', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
