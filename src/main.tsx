import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./app/LandingPage.tsx";
import PhotographyPage from "./app/PhotographyPage.tsx";
import FilmPage from "./app/FilmPage.tsx";
import AboutPage from "./app/AboutPage.tsx";
import ShopPage from "./app/ShopPage.tsx";
import ProductPage from "./app/ProductPage.tsx";
import LoadingDemo from "./app/LoadingDemo.tsx";
import TestImport from "./app/TestImport.tsx";
import { CartProvider } from "./app/CartContext.tsx";
import "./styles/index.css";

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/photography" element={<PhotographyPage />} />
          <Route path="/film" element={<FilmPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/shop/:id" element={<ProductPage />} />
          <Route path="/loading-demo" element={<LoadingDemo />} />
          <Route path="/test" element={<TestImport />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
}

createRoot(document.getElementById("root")!).render(<App />);