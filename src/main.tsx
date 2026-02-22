import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./app/AppOption1SubTabs.tsx";
import AboutPage from "./app/AboutPage.tsx";
import ShopPage from "./app/ShopPage.tsx";
import ProductPage from "./app/ProductPage.tsx";
import { CartProvider } from "./app/CartContext.tsx";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <CartProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/shop/:id" element={<ProductPage />} />
      </Routes>
    </BrowserRouter>
  </CartProvider>
);