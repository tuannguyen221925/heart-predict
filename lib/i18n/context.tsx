"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "vi" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  vi: {
    // Auth
    "auth.login": "Đăng nhập",
    "auth.register": "Đăng ký",
    "auth.logout": "Đăng xuất",
    "auth.email": "Email",
    "auth.password": "Mật khẩu",
    "auth.confirmPassword": "Xác nhận mật khẩu",
    "auth.fullName": "Họ và tên",
    "auth.noAccount": "Chưa có tài khoản?",
    "auth.hasAccount": "Đã có tài khoản?",
    "auth.loginSuccess": "Đăng nhập thành công!",
    "auth.registerSuccess": "Đăng ký thành công!",
    "auth.loginError": "Email hoặc mật khẩu không đúng",
    "auth.registerError": "Đăng ký thất bại. Vui lòng thử lại.",
    "auth.emailExists": "Email đã tồn tại",
    "auth.passwordMismatch": "Mật khẩu không khớp",
    
    // Navigation
    "nav.home": "Trang chủ",
    "nav.predict": "Dự đoán",
    "nav.history": "Lịch sử",
    "nav.profile": "Hồ sơ",
    
    // Home
    "home.title": "HeartGuard AI",
    "home.subtitle": "Dự đoán nguy cơ bệnh tim mạch",
    "home.description": "Sử dụng trí tuệ nhân tạo để phân tích và dự đoán nguy cơ mắc bệnh tim mạch dựa trên các chỉ số sức khỏe của bạn.",
    "home.startPrediction": "Bắt đầu dự đoán",
    "home.features.accurate": "Độ chính xác cao",
    "home.features.accurateDesc": "Mô hình ML được huấn luyện trên dữ liệu UCI Heart Disease",
    "home.features.fast": "Nhanh chóng",
    "home.features.fastDesc": "Kết quả dự đoán trong vài giây",
    "home.features.secure": "Bảo mật",
    "home.features.secureDesc": "Dữ liệu được mã hóa và bảo vệ",
    
    // Prediction Form
    "predict.title": "Dự đoán bệnh tim mạch",
    "predict.subtitle": "Nhập các chỉ số sức khỏe để nhận kết quả dự đoán",
    "predict.submit": "Dự đoán ngay",
    "predict.reset": "Làm mới",
    "predict.result": "Kết quả dự đoán",
    "predict.riskHigh": "Nguy cơ cao",
    "predict.riskLow": "Nguy cơ thấp",
    "predict.probability": "Xác suất",
    "predict.saveResult": "Lưu kết quả",
    "predict.saved": "Đã lưu!",
    
    // Form fields
    "field.age": "Tuổi",
    "field.sex": "Giới tính",
    "field.sex.male": "Nam",
    "field.sex.female": "Nữ",
    "field.cp": "Loại đau ngực",
    "field.cp.typical": "Đau thắt ngực điển hình",
    "field.cp.atypical": "Đau thắt ngực không điển hình",
    "field.cp.nonAnginal": "Đau không do tim",
    "field.cp.asymptomatic": "Không có triệu chứng",
    "field.trestbps": "Huyết áp nghỉ (mm Hg)",
    "field.chol": "Cholesterol (mg/dl)",
    "field.fbs": "Đường huyết lúc đói > 120 mg/dl",
    "field.fbs.yes": "Có",
    "field.fbs.no": "Không",
    "field.restecg": "Kết quả điện tâm đồ nghỉ",
    "field.restecg.normal": "Bình thường",
    "field.restecg.sttwave": "Bất thường ST-T",
    "field.restecg.lvh": "Phì đại thất trái",
    "field.thalch": "Nhịp tim tối đa",
    "field.exang": "Đau ngực khi gắng sức",
    "field.oldpeak": "ST depression",
    "field.slope": "Độ dốc ST",
    "field.slope.upsloping": "Dốc lên",
    "field.slope.flat": "Bằng phẳng",
    "field.slope.downsloping": "Dốc xuống",
    "field.ca": "Số mạch máu chính (0-3)",
    "field.thal": "Thalassemia",
    "field.thal.normal": "Bình thường",
    "field.thal.fixed": "Khuyết cố định",
    "field.thal.reversable": "Khuyết có thể hồi phục",
    
    // History
    "history.title": "Lịch sử dự đoán",
    "history.empty": "Chưa có lịch sử dự đoán nào",
    "history.date": "Ngày",
    "history.result": "Kết quả",
    "history.probability": "Xác suất",
    "history.details": "Chi tiết",
    "history.delete": "Xóa",
    
    // Common
    "common.loading": "Đang tải...",
    "common.error": "Có lỗi xảy ra",
    "common.success": "Thành công",
    "common.cancel": "Hủy",
    "common.save": "Lưu",
    "common.delete": "Xóa",
    "common.confirm": "Xác nhận",
    "common.back": "Quay lại",
  },
  en: {
    // Auth
    "auth.login": "Login",
    "auth.register": "Register",
    "auth.logout": "Logout",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.confirmPassword": "Confirm Password",
    "auth.fullName": "Full Name",
    "auth.noAccount": "Don't have an account?",
    "auth.hasAccount": "Already have an account?",
    "auth.loginSuccess": "Login successful!",
    "auth.registerSuccess": "Registration successful!",
    "auth.loginError": "Invalid email or password",
    "auth.registerError": "Registration failed. Please try again.",
    "auth.emailExists": "Email already exists",
    "auth.passwordMismatch": "Passwords do not match",
    
    // Navigation
    "nav.home": "Home",
    "nav.predict": "Predict",
    "nav.history": "History",
    "nav.profile": "Profile",
    
    // Home
    "home.title": "HeartGuard AI",
    "home.subtitle": "Heart Disease Risk Prediction",
    "home.description": "Using artificial intelligence to analyze and predict cardiovascular disease risk based on your health indicators.",
    "home.startPrediction": "Start Prediction",
    "home.features.accurate": "High Accuracy",
    "home.features.accurateDesc": "ML model trained on UCI Heart Disease dataset",
    "home.features.fast": "Fast Results",
    "home.features.fastDesc": "Get predictions in seconds",
    "home.features.secure": "Secure",
    "home.features.secureDesc": "Data is encrypted and protected",
    
    // Prediction Form
    "predict.title": "Heart Disease Prediction",
    "predict.subtitle": "Enter your health indicators to get a prediction",
    "predict.submit": "Predict Now",
    "predict.reset": "Reset",
    "predict.result": "Prediction Result",
    "predict.riskHigh": "High Risk",
    "predict.riskLow": "Low Risk",
    "predict.probability": "Probability",
    "predict.saveResult": "Save Result",
    "predict.saved": "Saved!",
    
    // Form fields
    "field.age": "Age",
    "field.sex": "Sex",
    "field.sex.male": "Male",
    "field.sex.female": "Female",
    "field.cp": "Chest Pain Type",
    "field.cp.typical": "Typical Angina",
    "field.cp.atypical": "Atypical Angina",
    "field.cp.nonAnginal": "Non-anginal Pain",
    "field.cp.asymptomatic": "Asymptomatic",
    "field.trestbps": "Resting Blood Pressure (mm Hg)",
    "field.chol": "Cholesterol (mg/dl)",
    "field.fbs": "Fasting Blood Sugar > 120 mg/dl",
    "field.fbs.yes": "Yes",
    "field.fbs.no": "No",
    "field.restecg": "Resting ECG Results",
    "field.restecg.normal": "Normal",
    "field.restecg.sttwave": "ST-T Abnormality",
    "field.restecg.lvh": "Left Ventricular Hypertrophy",
    "field.thalch": "Maximum Heart Rate",
    "field.exang": "Exercise Induced Angina",
    "field.oldpeak": "ST Depression",
    "field.slope": "ST Slope",
    "field.slope.upsloping": "Upsloping",
    "field.slope.flat": "Flat",
    "field.slope.downsloping": "Downsloping",
    "field.ca": "Number of Major Vessels (0-3)",
    "field.thal": "Thalassemia",
    "field.thal.normal": "Normal",
    "field.thal.fixed": "Fixed Defect",
    "field.thal.reversable": "Reversible Defect",
    
    // History
    "history.title": "Prediction History",
    "history.empty": "No prediction history yet",
    "history.date": "Date",
    "history.result": "Result",
    "history.probability": "Probability",
    "history.details": "Details",
    "history.delete": "Delete",
    
    // Common
    "common.loading": "Loading...",
    "common.error": "An error occurred",
    "common.success": "Success",
    "common.cancel": "Cancel",
    "common.save": "Save",
    "common.delete": "Delete",
    "common.confirm": "Confirm",
    "common.back": "Back",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("vi");

  useEffect(() => {
    const savedLang = localStorage.getItem("language") as Language;
    if (savedLang && (savedLang === "vi" || savedLang === "en")) {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
