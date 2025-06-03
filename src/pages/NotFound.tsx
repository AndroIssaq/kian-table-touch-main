import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // إذا لم يوجد رقم ترابيزة في الرابط، إعادة التوجيه لاختيار الترابيزة
    const params = new URLSearchParams(location.search);
    const table = params.get("table") || params.get("tableNumber");
    if (!table) {
      navigate("/choose-table");
    }
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname, location.search, navigate]);

  const params = new URLSearchParams(location.search);
  const tableNumber = params.get("table") || params.get("tableNumber");
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-4">Oops! Page not found</p>
        <p className="mb-4"></p>
        <a
          href={`/user-home?table=${tableNumber}`}
          className="text-blue-500 hover:text-blue-700 underline"
        >
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
