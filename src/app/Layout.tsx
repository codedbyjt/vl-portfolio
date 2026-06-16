import { useEffect, useState } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Menu, X } from "lucide-react";

const NAV_ITEMS = [
  { label: "Video", path: "/video" },
  { label: "Shop", path: "/shop" },
  { label: "Instagram", path: "https://www.instagram.com/viclentaigne/", external: true },
  { label: "About", path: "/about" },
];

const publicAsset = (path: string) =>
  `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isHome = location.pathname === "/";
  const isPhotographySection = location.pathname.startsWith("/photography");
  const shouldCollapsePhotographyNav =
    isPhotographySection &&
    (location.state as { collapsePhotographyNav?: boolean } | null)
      ?.collapsePhotographyNav === true;
  const [photographyOpen, setPhotographyOpen] = useState(
    isPhotographySection && !shouldCollapsePhotographyNav,
  );
  const isSharedPortfolio =
    location.pathname === "/photography" &&
    (searchParams.has("share") || searchParams.get("ref") === "shared");
  const isSharedAbout =
    location.pathname === "/about" && searchParams.get("ref") === "album";
  const hideSiteNav = isSharedPortfolio || isSharedAbout;

  useEffect(() => {
    if (isPhotographySection) {
      setPhotographyOpen(!shouldCollapsePhotographyNav);
    }
  }, [isPhotographySection, shouldCollapsePhotographyNav]);

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <ul className="flex flex-col gap-1">
      <li>
        <button
          onClick={() => setPhotographyOpen((open) => !open)}
          aria-expanded={photographyOpen}
          className={`flex w-full items-center justify-between text-[14px] leading-7 tracking-wide transition-colors text-left uppercase ${
            isPhotographySection
              ? "text-gray-900 underline underline-offset-2"
              : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <span>Photography</span>
          <ChevronDown
            size={14}
            className={`transition-transform ${
              photographyOpen ? "rotate-180" : ""
            }`}
            aria-hidden="true"
          />
        </button>
        <AnimatePresence initial={false}>
          {photographyOpen && (
            <motion.ul
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden pl-4"
            >
              <li>
                <button
                  onClick={() => {
                    navigate("/photography");
                    onClick?.();
                  }}
                  className={`block w-full text-left text-[12px] leading-6 tracking-wide uppercase transition-colors ${
                    location.pathname === "/photography"
                      ? "text-gray-900"
                      : "text-gray-400 hover:text-gray-900"
                  }`}
                >
                  Main Portfolio
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    navigate("/photography/commercial");
                    onClick?.();
                  }}
                  className={`block w-full text-left text-[12px] leading-6 tracking-wide uppercase transition-colors ${
                    location.pathname === "/photography/commercial"
                      ? "text-gray-900"
                      : "text-gray-400 hover:text-gray-900"
                  }`}
                >
                  Commercial
                </button>
              </li>
            </motion.ul>
          )}
        </AnimatePresence>
      </li>
      {NAV_ITEMS.map(({ label, path, external }) => {
        const active = !external && location.pathname.startsWith(path);
        return (
          <li key={label}>
            {external ? (
              <a
                href={path}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClick}
                className="block text-[14px] leading-7 tracking-wide text-gray-500 hover:text-gray-900 transition-colors uppercase"
              >
                {label}.
              </a>
            ) : (
              <button
                onClick={() => {
                  navigate(path);
                  onClick?.();
                }}
                className={`block text-[14px] leading-7 tracking-wide transition-colors text-left w-full uppercase ${
                  active
                    ? "text-gray-900 underline underline-offset-2"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {label}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* ── Shared portfolio minimal bar ── */}
      {(isSharedPortfolio || isSharedAbout) && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-white flex items-center justify-between gap-4 px-4 py-4 border-b border-gray-100 sm:px-6">
          <img
            src={publicAsset("/logo-tight.png")}
            alt="Vic Lentaigne"
            className="h-auto w-[clamp(170px,58vw,220px)] max-w-[calc(100vw-7rem)] flex-none object-contain"
          />
          {isSharedAbout ? (
            <button
              onClick={() => navigate(-1)}
              className="text-[12px] uppercase tracking-widest text-gray-500 hover:text-gray-900 transition-colors"
            >
              ← Back
            </button>
          ) : (
            <button
              onClick={() => navigate("/about?ref=album")}
              className="text-[12px] uppercase tracking-widest text-gray-500 hover:text-gray-900 transition-colors"
            >
              About
            </button>
          )}
        </div>
      )}

      {/* ── Desktop left nav (always visible ≥ md) ── */}
      {!hideSiteNav && (
        <nav className="hidden md:flex fixed top-0 left-0 h-full w-[260px] flex-col pt-10 z-40 bg-white">
          <button
            onClick={() => navigate("/")}
            className="mb-10 w-full px-6 text-left hover:opacity-60 transition-opacity"
          >
            <img
              src={publicAsset("/logo-tight.png")}
              alt="Vic Lentaigne"
              className="w-full max-w-[212px] h-auto"
            />
          </button>
          <div className="px-8">
            <NavLinks />
          </div>
        </nav>
      )}

      {/* ── Mobile header ── */}
      {!hideSiteNav && (
        <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <button
            onClick={() => navigate("/")}
            className="hover:opacity-60 transition-opacity"
          >
            <img
              src={publicAsset("/logo-tight.png")}
              alt="Vic Lentaigne"
              className="w-[170px] h-auto"
            />
          </button>
          <button onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu size={20} className="text-gray-700" />
          </button>
        </div>
      )}

      {/* ── Mobile drawer ── */}
      {!hideSiteNav && (
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/30 z-50 md:hidden"
                onClick={() => setMobileOpen(false)}
              />
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 220 }}
                className="fixed top-0 left-0 h-full w-64 bg-white z-50 md:hidden pt-12 pl-8"
              >
                <button
                  onClick={() => setMobileOpen(false)}
                  className="absolute top-4 right-4"
                  aria-label="Close"
                >
                  <X size={20} className="text-gray-600" />
                </button>
                <button
                  onClick={() => {
                    navigate("/");
                    setMobileOpen(false);
                  }}
                  className="mb-10 block hover:opacity-60 transition-opacity"
                >
                  <img
                    src={publicAsset("/logo-tight.png")}
                    alt="Vic Lentaigne"
                    className="w-[170px] h-auto"
                  />
                </button>
                <NavLinks onClick={() => setMobileOpen(false)} />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      )}

      {/* ── Page content ── */}
      {isSharedPortfolio ? (
        <main className="min-h-screen pt-[57px]">{children}</main>
      ) : isSharedAbout ? (
        <main className="min-h-screen pt-[57px]">{children}</main>
      ) : isHome ? (
        // Landing: sits flush beside the left nav, full viewport height
        <div className="md:ml-[260px] h-[100dvh] overflow-hidden pt-[56px] md:pt-0">
          {children}
        </div>
      ) : (
        <main className="md:ml-[260px] pt-[56px] md:pt-0 min-h-screen">
          {children}
        </main>
      )}
    </div>
  );
}
