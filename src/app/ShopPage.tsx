import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatShopPrice } from "../lib/formatPrice";
import { supabase } from "../lib/supabase";

interface ShopItem {
  id: string;
  title: string;
  price: string;
  stock: string;
  image_url: string;
}

export default function ShopPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("shop_items")
      .select("id, title, price, stock, image_url")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setItems(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div className="px-6 pt-8 pb-4 border-b border-gray-100">
        <h1 className="text-[13px] uppercase tracking-widest text-gray-400 font-medium">
          Shop
        </h1>
      </div>

      <div className="px-6 py-8 grid grid-cols-2 md:grid-cols-3 gap-6 max-w-3xl">
        {loading && (
          <>
            {[0, 1, 2].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-100 aspect-[3/4] mb-3" />
                <div className="h-3 bg-gray-100 rounded w-3/4 mb-1" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </>
        )}
        {!loading && items.length === 0 && (
          <p className="text-[13px] text-gray-400 col-span-full">
            No items in the shop yet.
          </p>
        )}
        {items.map((item) => (
          <div
            key={item.id}
            className="cursor-pointer group"
            onClick={() => navigate(`/shop/${item.id}`)}
          >
            <div className="overflow-hidden bg-gray-50 mb-3 aspect-[3/4]">
              <img
                src={item.image_url}
                alt={item.title}
                className="w-full h-full object-cover group-hover:opacity-80 transition-opacity duration-300"
              />
            </div>
            <p className="text-[13px] text-gray-900 leading-snug">
              {item.title}
            </p>
            <div className="mt-1 flex flex-col gap-0.5">
              <p className="text-[13px] font-medium text-gray-900 tabular-nums">
                {formatShopPrice(item.price)}
              </p>
              {item.stock && (
                <p className="text-[11px] uppercase tracking-[0.16em] text-gray-400">
                  {item.stock}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
