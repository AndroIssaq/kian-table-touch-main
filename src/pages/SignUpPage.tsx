import { SignUp } from '@clerk/clerk-react';
import { useLocation, useNavigate } from "react-router-dom";

const signUpAppearance = {
  layout: {
    socialButtonsVariant: 'iconButton',
    logoPlacement: 'inside',
    logoImageUrl: '/favicon.ico',
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
    navigate("/ChooseTable");
    return null;
  }
  return (
    <>
      {/* زر رجوع لصفحة اختيار الترابيزة مع تمرير رقم الترابيزة */}
      <button onClick={() => navigate(`/ChooseTable?table=${table}`)}>
        رجوع لاختيار الترابيزة
      </button>
      <SignUp appearance={signUpAppearance} />
    </>
  );
}
