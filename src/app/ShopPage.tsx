import { useNavigate } from 'react-router-dom';

const publicAsset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;

const SHOP_ITEMS = [
  {
    id: 1,
    title: "17th Boys Zine",
    price: "£18",
    stock: "Limited Edition",
    image: publicAsset("/17thboys.webp"),
  },
  {
    id: 2,
    title: "Wrestle A3 Poster",
    price: "£50",
    stock: "Edition of 25",
    image: publicAsset("/wrestlea3poster.webp"),
  },
  {
    id: 3,
    title: "Torso A3 Poster",
    price: "£35",
    stock: "Edition of 50",
    image: publicAsset("/torsoa3poster.webp"),
  },
];

export default function ShopPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <div className="px-6 pt-8 pb-4 border-b border-gray-100">
        <h1 className="text-[13px] uppercase tracking-widest text-gray-400 font-medium">Shop</h1>
      </div>

      <div className="px-6 py-8 grid grid-cols-2 md:grid-cols-3 gap-6 max-w-3xl">
        {SHOP_ITEMS.map((item) => (
          <div
            key={item.id}
            className="cursor-pointer group"
            onClick={() => navigate(`/shop/${item.id}`)}
          >
            <div className="overflow-hidden bg-gray-50 mb-3 aspect-[3/4]">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover group-hover:opacity-80 transition-opacity duration-300"
              />
            </div>
            <p className="text-[13px] text-gray-900">{item.title}</p>
            <p className="text-[12px] text-gray-400 mt-0.5">{item.price} · {item.stock}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
