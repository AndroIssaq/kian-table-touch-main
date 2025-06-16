import { SignUp } from '@clerk/clerk-react';
import { useLocation, useNavigate } from "react-router-dom";

const signUpAppearance = {
  layout: {
    socialButtonsVariant: 'iconButton',
    logoPlacement: 'inside',
    logoImageUrl: '/',
    showOptionalFields: true,
    termsPageUrl: '/terms',
    privacyPageUrl: '/privacy',
  },
  variables: {
    colorPrimary: '#8B1E3F', // Burgundy
    colorText: '#23243a',
    colorBackground: '#f9f6ff',
    colorInputBackground: '#fff',
    colorInputText: '#23243a',
    colorAlphaShade: '#e8eaf6',
    colorDanger: '#b91c1c',
    fontFamily: 'Cairo, sans-serif',
    borderRadius: '1.5rem',
    shadowShimmer: '0 4px 32px 0 rgba(139,30,63,0.08)',
  },
  elements: {
    card: 'rounded-3xl shadow-2xl border-0 bg-gradient-to-br from-white via-[#f9f6ff] to-[#e8eaf6] p-8',
    formButtonPrimary: 'bg-gold hover:bg-gold/90 text-black font-bold rounded-full py-3',
    headerTitle: 'text-3xl font-extrabold text-kian-burgundy',
    headerSubtitle: 'text-base text-gray-500',
    socialButtonsBlockButton: 'rounded-full',
    input: 'rounded-xl',
    footerAction: 'text-center',
  },
};

export default function SignUpPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const table = new URLSearchParams(location.search).get("table");

  // إذا لم يوجد table، أعد التوجيه
  if (!table) {
    navigate("/choose-table");
    return null;
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff8f0] via-[#f9f6ff] to-[#e8eaf6] flex items-center justify-center relative py-10">
            {/* زر رجوع لصفحة اختيار الترابيزة مع تمرير رقم الترابيزة */}
      <button
        onClick={() => navigate(`/choose-table?table=${table}`)}
        className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 rounded-full shadow-2xl bg-gradient-to-r from-gold via-yellow-300 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-kian-burgundy font-extrabold border-2 border-yellow-600 transition-all duration-200 hover:scale-105"
      >
        <span className="hidden sm:inline">رجوع لاختيار الترابيزة</span>
        <span className="sm:hidden">رجوع</span>
      </button>
      <SignUp
        appearance={signUpAppearance}
        routing="path"
        path="/sign-up"
        signInUrl={`/sign-in?table=${table}`}
        afterSignUpUrl={`/user-home?table=${table}`}
      />
    </div>
  );
}
