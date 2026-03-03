import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./app/LandingPage.tsx";
import PhotographyPage from "./app/PhotographyPage.tsx";
import FilmPage from "./app/FilmPage.tsx";
import AboutPage from "./app/AboutPage.tsx";
import ShopPage from "./app/ShopPage.tsx";
import ProductPage from "./app/ProductPage.tsx";
import { CartProvider } from "./app/CartContext.tsx";
import "./styles/index.css";
import { SpeedInsights } from "@vercel/speed-insights/react";

createRoot(document.getElementById("root")!).render(
  <CartProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/photography" element={<PhotographyPage />} />
        <Route path="/film" element={<FilmPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/shop/:id" element={<ProductPage />} />
      </Routes>
    </BrowserRouter>
    <SpeedInsights />
  </CartProvider>
);