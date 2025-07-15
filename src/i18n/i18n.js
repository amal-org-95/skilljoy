import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as RNLocalize from 'react-native-localize';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGE_KEY = 'user-language';

const resources = {
  en: {
    translation: {
      welcome: "Welcome",
      login: "Login",
      logout: "Logout",
      email: "Email",
      password: "Password",
      signup: "Sign Up",
      googleSignIn: "Sign in with Google",
      error: "Error",
      cancel: "Cancelled",
      userInfo: "User Info",
      createdAt: "Created At",
      generalSettings: "General Settings",
      language: "Language",
      english: "English",
      arabic: "Arabic",
      darkMode: "Dark Mode",
      account: "Account",
      logoutError: "Error during logout",
      errorTitle: "Error",
      requestsTitle: "Exchange Requests",
      noRequests: "No requests at the moment.",
      skillLabel: "Skill",
      requesterLabel: "Requested by",
      statusLabel: "Status",
      accept: "Accept",
      reject: "Reject",
      acceptedTitle: "Accepted",
      acceptedMessage: "You have accepted the request.",
      rejectedTitle: "Rejected",
      rejectedMessage: "You have rejected the request.",
      acceptErrorMessage: "Could not accept the request.",
      rejectErrorMessage: "Could not reject the request.",
      pending: "Pending",
      accepted: "Accepted",
      rejected: "Rejected"
    }
  },
  ar: {
    translation: {
      welcome: "مرحباً",
      login: "تسجيل دخول",
      logout: "تسجيل خروج",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      signup: "إنشاء حساب",
      googleSignIn: "تسجيل الدخول بواسطة Google",
      error: "خطأ",
      cancel: "تم الإلغاء",
      userInfo: "معلومات المستخدم",
      createdAt: "تاريخ التسجيل",
      generalSettings: "الإعدادات العامة",
      language: "اللغة",
      english: "الإنجليزية",
      arabic: "العربية",
      darkMode: "الوضع الليلي",
      account: "الحساب",
      logoutError: "حدث خطأ أثناء تسجيل الخروج",
      errorTitle: "خطأ",
      requestsTitle: "طلبات التبادل",
      noRequests: "لا توجد طلبات حالياً.",
      skillLabel: "المهارة",
      requesterLabel: "مقدم الطلب",
      statusLabel: "الحالة",
      accept: "قبول",
      reject: "رفض",
      acceptedTitle: "تم القبول",
      acceptedMessage: "لقد قبلت الطلب.",
      rejectedTitle: "تم الرفض",
      rejectedMessage: "لقد رفضت الطلب.",
      acceptErrorMessage: "تعذر قبول الطلب.",
      rejectErrorMessage: "تعذر رفض الطلب.",
      pending: "قيد الانتظار",
      accepted: "تم القبول",
      rejected: "مرفوض"
    }
  }
};

const languageDetector = {
  type: 'languageDetector',
  async: true,
  detect: async (callback) => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (savedLanguage) {
        callback(savedLanguage);
      } else {
        const fallback = RNLocalize.getLocales()[0]?.languageCode || 'en';
        callback(fallback);
      }
    } catch (error) {
      console.error('Language detection error:', error);
      callback('en');
    }
  },
  init: () => {},
  cacheUserLanguage: async (lng) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, lng);
    } catch (error) {
      console.error('Language caching error:', error);
    }
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    compatibilityJSON: 'v3',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false, // ⬅️ هذا هو التعديل الأهم
    },
  });

export default i18n;
