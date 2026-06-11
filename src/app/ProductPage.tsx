import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { supabase } from "../lib/supabase";

interface ShopItem {
  id: string;
  title: string;
  price: string;
  stock: string;
  description: string;
  image_url: string;
  checkout_url: string;
}

export default function ProductPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [product, setProduct] = useState<ShopItem | null>(null);
  const [loading, setLoading] = useState(true);
  const isStripeLink =
    product?.checkout_url?.includes("stripe.com") ||
    product?.checkout_url?.includes("stripe.link");

  useEffect(() => {
    if (!id) return;
    supabase
      .from("shop_items")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        setProduct(data ?? null);
        setLoading(false);
      });
  }, [id]);

  if (loading)
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-xs uppercase tracking-widest text-gray-400">
          Loading…
        </p>
      </div>
    );

  if (!product)
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-400 text-sm">Product not found.</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-white">
      <div className="px-6 pt-8 pb-4 border-b border-gray-100 flex items-center gap-4">
        <button
          onClick={() => navigate("/shop")}
          className="text-gray-400 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <h1 className="text-[13px] uppercase tracking-widest text-gray-400 font-medium">
          Shop
        </h1>
      </div>

      <div className="px-6 py-10 max-w-2xl flex flex-col md:flex-row gap-10">
        <div className="md:w-64 flex-shrink-0 bg-gray-50">
          <img
            src={product.image_url}
            alt={product.title}
            className="w-full h-auto object-cover"
          />
        </div>

        <div className="flex flex-col justify-between">
          <div>
            <h2 className="text-[18px] text-gray-900 font-medium mb-1">
              {product.title}
            </h2>
            {product.stock && (
              <p className="text-[12px] uppercase tracking-widest text-gray-400 mb-6">
                {product.stock}
              </p>
            )}
            {product.description && (
              <p className="text-[14px] text-gray-600 leading-relaxed mb-8">
                {product.description}
              </p>
            )}
          </div>

          <div>
            <p className="text-[20px] text-gray-900 font-medium mb-4">
              {product.price}
            </p>
            {product.checkout_url ? (
              <a
                href={product.checkout_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-3 border border-gray-900 text-[13px] uppercase tracking-widest text-gray-900 hover:bg-gray-900 hover:text-white transition-colors duration-200"
              >
                {isStripeLink ? "Checkout with Stripe" : "Buy Now"}
              </a>
            ) : (
              <p className="text-[13px] text-gray-400 uppercase tracking-widest">
                Contact to purchase
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
