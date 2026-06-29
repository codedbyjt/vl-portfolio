import { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./app/Layout.tsx";
import { CartProvider } from "./app/CartContext.tsx";
import "./styles/index.css";

const basename = import.meta.env.BASE_URL === "/" ? undefined : import.meta.env.BASE_URL;
const AdminPage = lazy(() => import("./app/AdminPage.tsx"));
const LandingPage = lazy(() => import("./app/LandingPage.tsx"));
const PhotographyPage = lazy(() => import("./app/PhotographyPage.tsx"));
const CommercialPage = lazy(() => import("./app/CommercialPage.tsx"));
const CustomPage = lazy(() => import("./app/CustomPage.tsx"));
const FilmPage = lazy(() => import("./app/FilmPage.tsx"));
const AboutPage = lazy(() => import("./app/AboutPage.tsx"));
const ShopPage = lazy(() => import("./app/ShopPage.tsx"));
const ProductPage = lazy(() => import("./app/ProductPage.tsx"));
const SeoMeta = lazy(() => import("./app/SeoMeta.tsx"));

function PageLoader() {
  return (
    <div className="min-h-screen bg-white px-6 py-8 text-xs uppercase tracking-widest text-gray-400 md:pl-[292px]">
      Loading...
    </div>
  );
}

function AdminRoute() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 px-6 py-8 text-xs uppercase tracking-widest text-gray-400">
          Loading admin...
        </div>
      }
    >
      <AdminPage />
    </Suspense>
  );
}

function App() {
  return (
    <CartProvider>
      <Suspense fallback={null}>
        <SeoMeta />
      </Suspense>
      <BrowserRouter basename={basename}>
        <Routes>
          <Route path="/admin" element={<AdminRoute />} />
          <Route path="*" element={
            <Layout>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/photography" element={<PhotographyPage />} />
                  <Route path="/photography/commercial" element={<CommercialPage />} />
                  <Route path="/pages/:slug" element={<CustomPage />} />
                  <Route path="/video" element={<FilmPage />} />
                  <Route path="/film" element={<FilmPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/shop" element={<ShopPage />} />
                  <Route path="/shop/:id" element={<ProductPage />} />
                </Routes>
              </Suspense>
            </Layout>
          } />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
