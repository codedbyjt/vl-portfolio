import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "../lib/supabase";
import {
  getPhotoAlbumIds,
  loadPhotoAlbumLinks,
  mergePhotoAlbumIds,
  photoBelongsToAlbum,
  sortPhotosForAlbum,
} from "../lib/photoAlbums";
import { getDisplayImageUrl } from "../lib/mediaStorage";

interface AlbumRow {
  id: string;
  title: string;
  description: string;
  cover_url: string;
  sort_order: number;
  visible: boolean;
  album_type?: string;
  show_thumbnails?: boolean;
  show_title?: boolean;
}
interface PhotoRow {
  id: string;
  url: string;
  caption: string;
  sort_order: number;
  album_id: string | null;
  album_ids?: string[];
  album_sort_orders?: Record<string, number>;
  display_single?: boolean;
  visible: boolean;
  visibility: "public" | "portfolio_only" | "hidden";
}

interface CarouselSlide {
  photos: PhotoRow[];
}

interface SharedPortfolioPayload {
  album: AlbumRow;
  photos: PhotoRow[];
  links: {
    photo_id: string;
    album_id: string;
    sort_order?: number | null;
  }[];
}

const publicAsset = (path: string) =>
  `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;

const FALLBACK_IMAGES = [
  "/hwa-1.webp",
  "/hwa-2.webp",
  "/hwa-3.webp",
  "/hwa-4.webp",
  "/hwa-5.webp",
  "/hwa-6.webp",
  "/landing-pic-2.webp",
].map(publicAsset);

// ─── Portfolio Splash ────────────────────────────────────────────────────────

function PortfolioSplash({
  clientName,
  message,
  onEnter,
}: {
  clientName: string;
  message: string;
  onEnter: () => void;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center px-8 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <motion.img
        src={`${import.meta.env.BASE_URL}logo-tight.png`}
        alt="Vic Lentaigne"
        className="h-12 w-auto mb-12 opacity-90"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: visible ? 0.9 : 0, y: visible ? 0 : 8 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      />
      <motion.h1
        className="text-4xl sm:text-5xl font-light tracking-tight text-gray-900 mb-5 leading-snug max-w-xl"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 12 }}
        transition={{ delay: 0.5, duration: 0.7 }}
      >
        A portfolio prepared for
        <br />
        <span className="font-medium">{clientName}</span>
      </motion.h1>
      {message && (
        <motion.p
          className="text-base text-gray-500 max-w-md leading-relaxed mb-14"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 8 }}
          transition={{ delay: 0.75, duration: 0.6 }}
        >
          {message}
        </motion.p>
      )}
      <motion.button
        onClick={onEnter}
        className="text-[12px] uppercase tracking-widest border border-gray-300 text-gray-600 px-10 py-4 hover:border-gray-900 hover:text-gray-900 transition-colors"
        initial={{ opacity: 0 }}
        animate={{ opacity: visible ? 1 : 0 }}
        transition={{ delay: 1.1, duration: 0.5 }}
      >
        View portfolio
      </motion.button>
    </motion.div>
  );
}

// ─── Album Carousel ──────────────────────────────────────────────────────────

function AlbumCarousel({
  albumTitle,
  photos,
  erroredIds,
  markErrored,
  showThumbnails,
  showTitle,
}: {
  albumTitle: string;
  photos: PhotoRow[];
  erroredIds: Set<string>;
  markErrored: (id: string) => void;
  showThumbnails: boolean;
  showTitle: boolean;
}) {
  const [slideIndex, setSlideIndex] = useState(0);
  const [slideDir, setSlideDir] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);
  const [imageSizes, setImageSizes] = useState<
    Record<string, { width: number; height: number }>
  >({});
  const dragStartX = useRef<number | null>(null);

  const visible = photos.filter((p) => !erroredIds.has(p.id) && p.url);
  const visiblePhotoKey = visible.map((p) => p.id).join("|");

  useEffect(() => {
    const media = window.matchMedia(
      "(min-width: 1024px) and (hover: hover) and (pointer: fine)",
    );
    const update = () => setIsDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const slides = useMemo<CarouselSlide[]>(() => {
    const built: CarouselSlide[] = [];

    for (let index = 0; index < visible.length; ) {
      const photo = visible[index];
      const size = imageSizes[photo.id];
      const isLandscape = size ? size.width > size.height : false;

      if (!isDesktop || isLandscape || photo.display_single) {
        built.push({
          photos: [photo],
        });
        index += 1;
        continue;
      }

      const next = visible[index + 1];
      const nextSize = next ? imageSizes[next.id] : undefined;
      const nextIsLandscape = nextSize
        ? nextSize.width > nextSize.height
        : false;

      built.push({
        photos:
          next && !nextIsLandscape && !next.display_single
            ? [photo, next]
            : [photo],
      });
      index += next && !nextIsLandscape && !next.display_single ? 2 : 1;
    }

    return built;
  }, [imageSizes, isDesktop, visible, visiblePhotoKey]);

  useEffect(() => {
    if (slideIndex >= slides.length)
      setSlideIndex(Math.max(slides.length - 1, 0));
  }, [slideIndex, slides.length]);

  const go = (dir: number) => {
    const next = slideIndex + dir;
    if (next < 0 || next >= slides.length) return;
    setSlideDir(dir);
    setSlideIndex(next);
  };

  const slideVariants = {
    enter: () => ({ opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: () => ({ opacity: 0 }),
  };

  if (slides.length === 0) return null;

  const slide = slides[slideIndex];
  const slidePhotoIds = new Set(slide.photos.map((p) => p.id));
  const caption = slide.photos
    .map((p) => p.caption)
    .filter(Boolean)
    .join(" / ");
  const imageClass =
    "block h-full w-full object-contain transition-opacity duration-300";

  return (
    <div className="select-none">
      {showTitle && albumTitle && (
        <div className="mb-2 flex items-baseline gap-3">
          <h2 className="text-[11px] font-medium uppercase tracking-widest text-gray-900">
            {albumTitle}
          </h2>
        </div>
      )}
      {/* Full-width slide area */}
      <div
        className="relative h-[70vh] overflow-hidden touch-pan-y sm:h-[82vh] lg:h-[84vh]"
        onMouseDown={(e) => {
          dragStartX.current = e.clientX;
        }}
        onMouseUp={(e) => {
          if (dragStartX.current === null) return;
          const delta = dragStartX.current - e.clientX;
          dragStartX.current = null;
          if (Math.abs(delta) > 40) go(delta > 0 ? 1 : -1);
        }}
        onTouchStart={(e) => {
          dragStartX.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (dragStartX.current === null) return;
          const delta = dragStartX.current - e.changedTouches[0].clientX;
          dragStartX.current = null;
          if (Math.abs(delta) > 40) go(delta > 0 ? 1 : -1);
        }}
      >
        <AnimatePresence custom={slideDir} initial={false}>
          <motion.div
            key={slide.photos.map((p) => p.id).join("-")}
            custom={slideDir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.18, ease: "easeOut" }}
            className={`absolute inset-0 grid gap-2 ${
              slide.photos.length === 2 ? "grid-cols-2" : "grid-cols-1"
            }`}
          >
            {slide.photos.map((photo) => (
              <figure
                key={photo.id}
                className="flex h-full min-w-0 items-center justify-center overflow-hidden bg-white"
              >
                <div className="flex h-full w-full items-center justify-center bg-white">
                  <img
                    src={getDisplayImageUrl(photo.url)}
                    alt={photo.caption}
                    className={imageClass}
                    onError={() => markErrored(photo.id)}
                    onLoad={(e) => {
                      const img = e.currentTarget;
                      if (img.naturalWidth === 0 || img.naturalHeight === 0) {
                        markErrored(photo.id);
                        return;
                      }
                      setImageSizes((prev) => {
                        const existing = prev[photo.id];
                        if (
                          existing?.width === img.naturalWidth &&
                          existing?.height === img.naturalHeight
                        ) {
                          return prev;
                        }
                        return {
                          ...prev,
                          [photo.id]: {
                            width: img.naturalWidth,
                            height: img.naturalHeight,
                          },
                        };
                      });
                    }}
                  />
                </div>
              </figure>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      <figcaption className="mt-1 h-4 truncate text-[10px] leading-4 text-gray-400">
        {caption}
      </figcaption>

      {/* Counter + arrows on one line, below the image */}
      {slides.length > 1 && (
        <div className="mt-2 flex items-center justify-center gap-4">
          <button
            onClick={() => go(-1)}
            disabled={slideIndex === 0}
            className="w-7 h-7 flex items-center justify-center border border-gray-200 text-gray-500 hover:border-gray-900 hover:text-gray-900 transition-colors disabled:opacity-20 disabled:pointer-events-none"
            aria-label="Previous"
          >
            <ChevronLeft size={13} />
          </button>
          <span className="text-[10px] tracking-widest text-gray-400 tabular-nums">
            {slideIndex + 1} / {slides.length}
          </span>
          <button
            onClick={() => go(1)}
            disabled={slideIndex === slides.length - 1}
            className="w-7 h-7 flex items-center justify-center border border-gray-200 text-gray-500 hover:border-gray-900 hover:text-gray-900 transition-colors disabled:opacity-20 disabled:pointer-events-none"
            aria-label="Next"
          >
            <ChevronRight size={13} />
          </button>
        </div>
      )}

      {showThumbnails && visible.length > 1 && (
        <div className="mt-5 flex gap-3 overflow-x-auto border-t border-gray-200 pt-4 pb-1">
          {visible.map((photo) => {
            const targetSlideIndex = slides.findIndex((candidate) =>
              candidate.photos.some(
                (candidatePhoto) => candidatePhoto.id === photo.id,
              ),
            );
            const isActive = slidePhotoIds.has(photo.id);

            return (
              <button
                key={photo.id}
                type="button"
                onClick={() => {
                  if (targetSlideIndex < 0) return;
                  setSlideDir(targetSlideIndex > slideIndex ? 1 : -1);
                  setSlideIndex(targetSlideIndex);
                }}
                className={`flex h-20 max-w-28 shrink-0 items-center justify-center overflow-hidden border bg-white p-1 transition-opacity sm:h-24 sm:max-w-36 ${
                  isActive
                    ? "border-gray-900 opacity-100"
                    : "border-transparent opacity-45 hover:opacity-80"
                }`}
                aria-label={
                  photo.caption ? `Show ${photo.caption}` : "Show photo"
                }
              >
                <img
                  src={photo.url}
                  alt=""
                  className="h-full w-auto max-w-full object-contain"
                  loading="lazy"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Photography Page ─────────────────────────────────────────────────────────

export default function PhotographyPage() {
  const [searchParams] = useSearchParams();
  const [albums, setAlbums] = useState<AlbumRow[]>([]);
  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [useFallback, setUseFallback] = useState(false);
  const [erroredIds, setErroredIds] = useState<Set<string>>(new Set());
  const [splashDismissed, setSplashDismissed] = useState(false);

  const markErrored = (id: string) =>
    setErroredIds((prev) => new Set([...prev, id]));
  const shareToken = searchParams.get("share");
  const sharedAlbumId =
    !shareToken && searchParams.get("ref") === "shared"
      ? searchParams.get("album")
      : null;
  const clientName = searchParams.get("client") ?? "";
  const clientMessage = searchParams.get("msg") ?? "";

  useEffect(() => {
    const load = async () => {
      try {
        if (shareToken) {
          const { data, error } = await supabase.rpc("get_portfolio_share", {
            p_token: shareToken,
          });
          if (error) throw error;
          const shared = data as SharedPortfolioPayload | null;
          if (!shared?.album) {
            setAlbums([]);
            setPhotos([]);
            setUseFallback(false);
            return;
          }
          setAlbums([shared.album]);
          setPhotos(mergePhotoAlbumIds(shared.photos ?? [], shared.links ?? []));
          setUseFallback(false);
          return;
        }

        const [{ data: albumData }, { data: photoData }, albumLinks] =
          await Promise.all([
            supabase
              .from("albums")
              .select("*")
              .order("sort_order", { ascending: true }),
            supabase
              .from("photos")
              .select("*")
              .order("sort_order", { ascending: true }),
            loadPhotoAlbumLinks(),
          ]);
        if (photoData && photoData.length > 0) {
          setAlbums(albumData ?? []);
          setPhotos(mergePhotoAlbumIds(photoData, albumLinks));
        } else {
          setUseFallback(!sharedAlbumId);
        }
      } catch {
        setUseFallback(!sharedAlbumId && !shareToken);
      }
    };
    load();
  }, [sharedAlbumId, shareToken]);

  const resolveVis = (p: PhotoRow) =>
    p.visibility ?? (p.visible ? "public" : "hidden");

  const activeSharedAlbumId = shareToken ? albums[0]?.id : sharedAlbumId;
  const sharedAlbum = activeSharedAlbumId
    ? (albums.find((a) => a.id === activeSharedAlbumId) ?? null)
    : null;
  const splashName = clientName || sharedAlbum?.title || "this portfolio";
  const showSplash = !!((shareToken || sharedAlbumId) && !splashDismissed);
  const pageTitle = "Photography";

  // Public page: only visible gallery albums and public photos.
  // Shared link: only the requested visible album, including portfolio-only photos.
  const galleryAlbums = albums.filter(
    (a) => a.visible !== false && (a.album_type ?? "gallery") === "gallery",
  );
  const publicPhotos = useFallback
    ? FALLBACK_IMAGES.map((url, i) => ({
        id: String(i),
        url,
        caption: "",
        sort_order: i,
        album_id: null,
        album_ids: [],
        visible: true,
        visibility: "public" as const,
      }))
    : photos.filter((p) => resolveVis(p) === "public");
  const sharedPhotos =
    sharedAlbum && sharedAlbum.visible !== false
      ? sortPhotosForAlbum(
          photos.filter(
            (p) =>
              photoBelongsToAlbum(p, sharedAlbum.id) &&
              resolveVis(p) !== "hidden",
          ),
          sharedAlbum.id,
        )
      : [];

  // Group by album. Only show standalone public photos when there are no albums;
  // otherwise unassigned photos can look like they belong to the previous album.
  const albumGroups: { album: AlbumRow | null; photos: PhotoRow[] }[] = [];
  if (shareToken || sharedAlbumId) {
    albumGroups.push({ album: sharedAlbum, photos: sharedPhotos });
  } else if (!useFallback) {
    for (const album of galleryAlbums) {
      const grouped = sortPhotosForAlbum(
        publicPhotos.filter((p) => photoBelongsToAlbum(p, album.id)),
        album.id,
      );
      if (grouped.length > 0) albumGroups.push({ album, photos: grouped });
    }
    const standalone = publicPhotos.filter(
      (p) => getPhotoAlbumIds(p).length === 0,
    );
    if (albumGroups.length === 0 && standalone.length > 0)
      albumGroups.push({ album: null, photos: standalone });
  } else {
    albumGroups.push({ album: null, photos: publicPhotos });
  }

  return (
    <div className="min-h-screen bg-white">
      <AnimatePresence>
        {showSplash && (
          <PortfolioSplash
            clientName={splashName}
            message={clientMessage}
            onEnter={() => setSplashDismissed(true)}
          />
        )}
      </AnimatePresence>

      {/* Albums as carousels */}
      <div className="w-full px-4 pt-1 pb-4 md:px-6 md:pt-2 md:pb-5">
        {albumGroups.map(({ album, photos: groupPhotos }) => (
          <div key={album?.id ?? "standalone"} className="mb-12 last:mb-0">
            <AlbumCarousel
              photos={groupPhotos}
              erroredIds={erroredIds}
              markErrored={markErrored}
              albumTitle={album?.title ?? ""}
              showThumbnails={album?.show_thumbnails !== false}
              showTitle={album?.show_title !== false}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
