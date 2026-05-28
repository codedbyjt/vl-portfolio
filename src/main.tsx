import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./app/LandingPage.tsx";
import PhotographyPage from "./app/PhotographyPage.tsx";
import FilmPage from "./app/FilmPage.tsx";
import AboutPage from "./app/AboutPage.tsx";
import ShopPage from "./app/ShopPage.tsx";
import ProductPage from "./app/ProductPage.tsx";
import Layout from "./app/Layout.tsx";
import { CartProvider } from "./app/CartContext.tsx";
import AdminPage from "./app/AdminPage.tsx";
import "./styles/index.css";

const basename = import.meta.env.BASE_URL === "/" ? undefined : import.meta.env.BASE_URL;

function App() {
  return (
    <CartProvider>
      <BrowserRouter basename={basename}>
        <Routes>
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={
            <Layout>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/photography" element={<PhotographyPage />} />
                <Route path="/video" element={<FilmPage />} />
                <Route path="/film" element={<FilmPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/shop" element={<ShopPage />} />
                <Route path="/shop/:id" element={<ProductPage />} />
              </Routes>
            </Layout>
          } />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
