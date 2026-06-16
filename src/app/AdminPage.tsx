import { useState, useEffect, useRef, useCallback } from "react";
import JSZip from "jszip";
import { supabase } from "../lib/supabase";
import { formatShopPrice } from "../lib/formatPrice";
import {
  loadPhotoAlbumLinks,
  mergePhotoAlbumIds,
  photoBelongsToAlbum,
  savePhotoAlbumOrder,
  savePhotoAlbumLinks,
  sortPhotosForAlbum,
} from "../lib/photoAlbums";
import {
  getDisplayImageUrl,
  isCloudinaryUrl,
  uploadMedia,
} from "../lib/mediaStorage";
import {
  defaultAboutContent,
  getErrorMessage,
  loadAboutContent,
  sanitizeRichText,
  saveAboutContent,
  type AboutContent,
} from "../lib/aboutContent";
import { loadSiteSettings } from "../lib/siteSettings";
import ReactCrop, {
  type Crop,
  centerCrop,
  makeAspectCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CreateAlbumModal } from "./components/CreateAlbumModal";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowUp,
  Bold,
  Check,
  Eraser,
  GripVertical,
  Italic,
  Underline,
} from "lucide-react";
import { MediaStorageUsagePanel } from "./admin/MediaStorageUsagePanel";
import { SiteSettingsAdmin } from "./admin/SiteSettingsAdmin";
import { SubscribersAdmin } from "./admin/SubscribersAdmin";
import { VideosAdmin } from "./admin/VideosAdmin";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab =
  | "photography"
  | "portfolio"
  | "videos"
  | "shop"
  | "about"
  | "subscribers"
  | "settings"
  | "storage";
type AllPhotosSort = "" | "date-added" | "home-featured" | "hidden";

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
  home_featured: boolean;
  created_at: string;
}

interface AlbumRow {
  id: string;
  title: string;
  description: string;
  cover_url: string;
  sort_order: number;
  visible: boolean;
  album_type: "gallery" | "portfolio";
  show_title?: boolean;
  created_at: string;
}

interface ShopRow {
  id: string;
  title: string;
  price: string;
  stock: string;
  checkout_url?: string;
  description?: string;
  image_url: string;
  created_at: string;
  sort_order?: number | null;
}

interface PortfolioShareRow {
  token: string;
  copied_at: string | null;
}

function portfolioShareUrl(token: string) {
  const basePath =
    import.meta.env.BASE_URL === "/" ? "/" : import.meta.env.BASE_URL;
  const url = new URL(`${basePath}photography`, window.location.origin);
  url.searchParams.set("share", token);
  return url.toString();
}

function formatCopiedAt(value: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

async function loadPortfolioShare(albumId: string) {
  const { data, error } = await supabase
    .from("portfolio_shares")
    .select("token,copied_at")
    .eq("album_id", albumId)
    .maybeSingle();

  if (error) throw error;
  return data as PortfolioShareRow | null;
}

async function createOrRefreshPortfolioShare(albumId: string) {
  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();

  if (sessionError) throw sessionError;
  if (!sessionData.session) {
    throw new Error("Your admin session has expired. Sign out, then sign in again.");
  }

  const { data, error } = await supabase.rpc(
    "create_or_refresh_portfolio_share",
    { p_album_id: albumId },
  );

  if (error) throw error;
  const share = Array.isArray(data) ? data[0] : data;
  if (!share?.token) throw new Error("Supabase did not return a share token.");
  return share as PortfolioShareRow;
}

async function copyTextToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    try {
      const copied = document.execCommand("copy");
      textarea.remove();
      return copied;
    } catch {
      textarea.remove();
      return false;
    }
  }
}

// ─── Admin Page ───────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [session, setSession] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [tab, setTab] = useState<Tab>("photography");
  const [portfolioPageHref, setPortfolioPageHref] = useState<string | null>(
    null,
  );
  const pageHref =
    tab === "photography"
      ? `${import.meta.env.BASE_URL}photography`
      : tab === "portfolio"
        ? portfolioPageHref
        : tab === "videos"
          ? `${import.meta.env.BASE_URL}film`
          : tab === "shop"
            ? `${import.meta.env.BASE_URL}shop`
            : tab === "about"
              ? `${import.meta.env.BASE_URL}about`
              : tab === "settings"
                ? `${import.meta.env.BASE_URL}`
                : null;

  // Check existing session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(!!data.session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(!!s);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setLoginError(error.message);
  };

  const handleLogout = () => supabase.auth.signOut();

  // ── Loading state ──
  if (session === null) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-xs uppercase tracking-widest text-gray-400">
          Loading…
        </p>
      </div>
    );
  }

  // ── Login screen ──
  if (!session) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <h1 className="text-xs uppercase tracking-widest text-gray-900 font-medium mb-2">
            Admin
          </h1>
          <p className="text-xs text-gray-400 mb-6">Vic Lentaigne</p>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-900 transition-colors"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-900 transition-colors"
              required
            />
            {loginError && <p className="text-red-500 text-xs">{loginError}</p>}
            <button
              type="submit"
              className="bg-gray-900 text-white text-xs uppercase tracking-widest py-3 hover:bg-gray-700 transition-colors"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Dashboard ──
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between sm:px-6">
        <div className="flex items-center gap-6">
          <span className="text-xs uppercase tracking-widest font-medium text-gray-900">
            Admin
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors"
        >
          Sign Out
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-4 flex items-center gap-5 overflow-x-auto sm:px-6 sm:gap-6">
        {(
          [
            "photography",
            "portfolio",
            "videos",
            "shop",
            "about",
            "subscribers",
            "settings",
            "storage",
          ] as Tab[]
        ).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`py-4 text-xs uppercase tracking-widest border-b-2 transition-colors ${
              tab === t
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            {t === "portfolio" ? "portfolios" : t}
          </button>
        ))}
        {pageHref && (
          <a
            href={pageHref}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1.5 py-2 px-3 text-xs uppercase tracking-widest text-gray-400 hover:text-gray-900 border border-gray-200 rounded transition-colors whitespace-nowrap"
          >
            <span aria-hidden="true">↗</span>
            View{" "}
            {tab === "videos"
              ? "film"
              : tab === "portfolio"
                ? "portfolio"
                : tab}{" "}
            page
          </a>
        )}
      </div>

      {/* Content */}
      <div className="px-4 py-6 max-w-4xl sm:px-6 sm:py-8">
        {tab === "photography" ? (
          <PhotographyAdmin />
        ) : tab === "portfolio" ? (
          <PortfolioAdmin onViewPageHrefChange={setPortfolioPageHref} />
        ) : tab === "videos" ? (
          <VideosAdmin />
        ) : tab === "shop" ? (
          <ShopAdmin />
        ) : tab === "about" ? (
          <AboutAdmin />
        ) : tab === "subscribers" ? (
          <SubscribersAdmin />
        ) : tab === "settings" ? (
          <SiteSettingsAdmin />
        ) : (
          <MediaStorageUsagePanel />
        )}
      </div>
    </div>
  );
}

// ─── Photography Admin ────────────────────────────────────────────────────────

// ─── Sortable Photo Card ─────────────────────────────────────────────────────

function SortablePhoto({
  photo,
  onDelete,
  onEdit,
  onToggleHome,
  onToggleVis,
  albums,
  onViewAlbum,
  sortable = true,
}: {
  photo: PhotoRow;
  onDelete: (p: PhotoRow) => void;
  onEdit: (p: PhotoRow) => void;
  onToggleHome?: (p: PhotoRow) => void;
  onToggleVis: (p: PhotoRow) => void;
  albums?: AlbumRow[];
  onViewAlbum?: (albumId: string) => void;
  sortable?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: photo.id, disabled: !sortable });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
  const dragHandleStyle = {
    touchAction: "none",
  };
  const [landscape, setLandscape] = useState(false);

  const vis = photo.visibility ?? (photo.visible ? "public" : "hidden");
  const photoSrc = getDisplayImageUrl(photo.url);
  const albumName =
    albums && photo.album_id
      ? albums.find((a) => a.id === photo.album_id)?.title
      : null;

  // Cycle: public → portfolio_only → hidden → public
  const visLabel =
    vis === "public"
      ? "Public"
      : vis === "portfolio_only"
        ? "Portfolio"
        : "Hidden";
  const visColour =
    vis === "public"
      ? "bg-green-500"
      : vis === "portfolio_only"
        ? "bg-indigo-500"
        : "bg-gray-500";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group bg-gray-100 ${vis === "hidden" ? "opacity-40" : ""}`}
    >
      {sortable && (
        <button
          type="button"
          {...attributes}
          {...listeners}
          style={dragHandleStyle}
          className="absolute top-1 left-1 z-10 flex h-10 w-10 cursor-grab touch-none items-center justify-center rounded bg-white/90 text-[18px] leading-none text-gray-600 shadow-sm select-none active:cursor-grabbing md:h-7 md:w-7 md:text-[14px]"
          aria-label="Drag to reorder photo"
          title="Drag to reorder"
        >
          ⠿
        </button>
      )}
      {/* Visibility badge — always visible, click to cycle */}
      <button
        title="Click to cycle visibility: Public → Portfolio → Hidden"
        onClick={(e) => {
          e.stopPropagation();
          onToggleVis(photo);
        }}
        className={`absolute top-1 right-1 z-10 text-white text-[9px] uppercase tracking-widest px-2 py-1 rounded select-none transition-opacity md:px-1.5 md:py-0.5 ${visColour} ${vis === "public" ? "opacity-90 md:opacity-0 md:group-hover:opacity-80" : "opacity-90"} hover:opacity-100`}
      >
        {visLabel}
      </button>
      {onToggleHome && (
        <button
          title={
            photo.home_featured ? "Remove from homepage" : "Feature on homepage"
          }
          onClick={(e) => {
            e.stopPropagation();
            onToggleHome(photo);
          }}
          className={`hidden md:block absolute bottom-10 right-1 z-10 text-[11px] px-1.5 py-0.5 rounded transition-colors select-none ${
            photo.home_featured
              ? "bg-amber-400 text-white"
              : "bg-white/90 text-gray-500 opacity-0 group-hover:opacity-100"
          }`}
        >
          ⌂
        </button>
      )}
      <img
        src={photoSrc}
        alt={photo.caption}
        onLoad={(e) =>
          setLandscape(
            e.currentTarget.naturalWidth > e.currentTarget.naturalHeight,
          )
        }
        className={`w-full bg-white object-contain ${landscape ? "aspect-video" : "aspect-[3/4]"}`}
      />
      <div className="flex items-center justify-between px-2 py-1 gap-1 min-h-[24px]">
        {photo.caption && (
          <p className="text-[10px] text-gray-500 truncate flex-1">
            {photo.caption}
          </p>
        )}
        {albumName && onViewAlbum && photo.album_id ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewAlbum(photo.album_id!);
            }}
            className="text-[9px] uppercase tracking-widest bg-gray-200 hover:bg-gray-900 hover:text-white text-gray-500 px-1.5 py-0.5 rounded transition-colors shrink-0 whitespace-nowrap"
          >
            {albumName} →
          </button>
        ) : albumName ? (
          <span className="text-[9px] uppercase tracking-widest text-gray-400 shrink-0">
            {albumName}
          </span>
        ) : null}
      </div>
      <div className="flex items-center justify-end gap-2 border-t border-gray-200 bg-white px-2 py-2 md:absolute md:inset-0 md:border-0 md:bg-black/50 md:opacity-0 md:group-hover:opacity-100 md:transition-opacity md:items-end md:p-2">
        {/* Home feature toggle — mobile only, lives in the action bar */}
        {onToggleHome && (
          <button
            title={
              photo.home_featured
                ? "Remove from homepage"
                : "Feature on homepage"
            }
            onClick={(e) => {
              e.stopPropagation();
              onToggleHome(photo);
            }}
            className={`md:hidden text-[10px] uppercase tracking-widest px-3 py-1.5 border transition-colors mr-auto ${
              photo.home_featured
                ? "bg-amber-400 text-white border-amber-400"
                : "bg-white border-gray-200 text-gray-500"
            }`}
          >
            ⌂
          </button>
        )}
        <button
          onClick={() => onEdit(photo)}
          className="text-[10px] uppercase tracking-widest bg-gray-900 text-white px-3 py-1.5 hover:bg-gray-700 transition-colors md:bg-white md:text-gray-900 md:px-2 md:py-1 md:hover:bg-gray-200"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(photo)}
          className="text-[10px] uppercase tracking-widest bg-white border border-gray-200 text-gray-700 px-3 py-1.5 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors md:border-0 md:text-gray-900 md:px-2 md:py-1"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

// ─── Crop modal ───────────────────────────────────────────────────────────────

type AspectOption = "free" | "portrait" | "square" | "landscape";
const ASPECT_OPTIONS: {
  label: string;
  value: AspectOption;
  ratio: number | undefined;
}[] = [
  { label: "Free", value: "free", ratio: undefined },
  { label: "3:4 Portrait", value: "portrait", ratio: 3 / 4 },
  { label: "1:1 Square", value: "square", ratio: 1 },
  { label: "16:9 Landscape", value: "landscape", ratio: 16 / 9 },
];

function createCroppedImageBlob(
  img: HTMLImageElement | null,
  crop: Crop | undefined,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (!img || !crop || !crop.width || !crop.height) {
      reject(new Error("Choose a crop area first."));
      return;
    }

    const canvas = document.createElement("canvas");
    const renderedWidth = img.width || img.naturalWidth;
    const renderedHeight = img.height || img.naturalHeight;
    const scaleX = img.naturalWidth / renderedWidth;
    const scaleY = img.naturalHeight / renderedHeight;
    const sourceX = (crop.x / 100) * renderedWidth * scaleX;
    const sourceY = (crop.y / 100) * renderedHeight * scaleY;
    const sourceWidth = (crop.width / 100) * renderedWidth * scaleX;
    const sourceHeight = (crop.height / 100) * renderedHeight * scaleY;

    canvas.width = Math.round(sourceWidth);
    canvas.height = Math.round(sourceHeight);
    canvas
      .getContext("2d")!
      .drawImage(
        img,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        canvas.width,
        canvas.height,
      );
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error("Could not create cropped image.")),
      "image/jpeg",
      0.92,
    );
  });
}

function sortAllPhotos(
  photos: PhotoRow[],
  _albums: AlbumRow[],
  sort: AllPhotosSort,
) {
  if (sort === "home-featured") {
    return photos.filter((photo) => photo.home_featured);
  }

  if (sort === "date-added") {
    return [...photos].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }

  if (sort === "hidden") {
    return photos.filter(
      (photo) =>
        (photo.visibility ?? (photo.visible ? "public" : "hidden")) ===
        "hidden",
    );
  }

  return photos;
}

function CropModal({
  src,
  onUpload,
  onSkip,
  onCancel,
  uploading,
  message,
}: {
  src: string;
  onUpload: (
    crop: Crop,
    aspectMode: AspectOption,
    caption: string,
    image: HTMLImageElement | null,
  ) => void;
  onSkip: (caption: string) => void;
  onCancel: () => void;
  uploading: boolean;
  message: string;
}) {
  const [crop, setCrop] = useState<Crop>();
  const [aspectMode, setAspectMode] = useState<AspectOption>("free");
  const [caption, setCaption] = useState("");
  const imgRef = useRef<HTMLImageElement>(null);

  const applyAspect = (mode: AspectOption) => {
    setAspectMode(mode);
    if (!imgRef.current) return;
    const { width, height } = imgRef.current;
    const ratio = ASPECT_OPTIONS.find((a) => a.value === mode)?.ratio;
    setCrop(
      ratio
        ? centerCrop(
            makeAspectCrop({ unit: "%", width: 90 }, ratio, width, height),
            width,
            height,
          )
        : { unit: "%", x: 0, y: 0, width: 100, height: 100 },
    );
  };

  return (
    <div className="fixed inset-0 bg-black/85 z-50 flex flex-col items-center justify-center p-6 gap-4 overflow-auto">
      <p className="text-white text-xs uppercase tracking-widest">
        Preview Image
      </p>
      <div className="flex gap-2 flex-wrap justify-center">
        {ASPECT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => applyAspect(opt.value)}
            className={`text-xs px-3 py-1 border transition-colors ${aspectMode === opt.value ? "bg-white text-gray-900 border-white" : "bg-transparent text-white border-white/40 hover:border-white"}`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <div className="max-h-[50vh] overflow-auto">
        <ReactCrop
          crop={crop}
          onChange={(c) => setCrop(c)}
          aspect={ASPECT_OPTIONS.find((a) => a.value === aspectMode)?.ratio}
        >
          <img
            ref={imgRef}
            src={src}
            onLoad={(e) => applyAspect(aspectMode)}
            className="max-w-[80vw] max-h-[45vh] object-contain"
            alt="crop"
          />
        </ReactCrop>
      </div>
      <input
        type="text"
        placeholder="Caption (optional)"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        className="w-full max-w-md border border-white/30 bg-transparent text-white placeholder-white/50 px-4 py-2 text-sm outline-none focus:border-white"
      />
      <div className="flex gap-3 flex-wrap justify-center">
        <button
          onClick={() => onSkip(caption)}
          disabled={uploading}
          className="text-xs uppercase tracking-widest bg-white text-gray-900 px-5 py-2 hover:bg-gray-200 disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Upload Original"}
        </button>
        <button
          onClick={() =>
            crop && onUpload(crop, aspectMode, caption, imgRef.current)
          }
          disabled={uploading || !crop}
          className="text-xs uppercase tracking-widest border border-white/40 text-white px-5 py-2 hover:border-white disabled:opacity-50"
        >
          Apply Crop & Upload
        </button>
        <button
          onClick={onCancel}
          className="text-xs uppercase tracking-widest text-white/50 hover:text-white px-3 py-2"
        >
          Cancel
        </button>
      </div>
      {message && (
        <p
          className={`text-xs ${message.startsWith("✓") ? "text-green-400" : "text-red-400"}`}
        >
          {message}
        </p>
      )}
    </div>
  );
}

// ─── Edit Photo Modal ─────────────────────────────────────────────────────────

function EditPhotoModal({
  photo,
  albums,
  onSave,
  onReplaceImage,
  showHomeFeature = false,
  onClose,
}: {
  photo: PhotoRow;
  albums: AlbumRow[];
  onSave: (
    id: string,
    caption: string,
    albumIds: string[],
    visibility: "public" | "portfolio_only" | "hidden",
    homeFeatured: boolean,
    displaySingle: boolean,
  ) => void;
  onReplaceImage: (photo: PhotoRow, blob: Blob) => Promise<void>;
  showHomeFeature?: boolean;
  onClose: () => void;
}) {
  const [caption, setCaption] = useState(photo.caption);
  const [albumIds, setAlbumIds] = useState<string[]>(
    photo.album_id ? [photo.album_id] : [],
  );
  const [visibility, setVisibility] = useState<
    "public" | "portfolio_only" | "hidden"
  >(photo.visibility ?? (photo.visible ? "public" : "hidden"));
  const [homeFeatured, setHomeFeatured] = useState(!!photo.home_featured);
  const [displaySingle, setDisplaySingle] = useState(!!photo.display_single);
  const [cropOpen, setCropOpen] = useState(false);
  const [crop, setCrop] = useState<Crop>();
  const [aspectMode, setAspectMode] = useState<AspectOption>("free");
  const [replaceMessage, setReplaceMessage] = useState("");
  const [replaceUploading, setReplaceUploading] = useState(false);
  const cropImgRef = useRef<HTMLImageElement>(null);
  const photoSrc = getDisplayImageUrl(photo.url);

  // Load existing multi-album links on open
  useEffect(() => {
    loadPhotoAlbumLinks().then((links) => {
      const ids = links
        .filter((l) => l.photo_id === photo.id)
        .map((l) => l.album_id);
      if (ids.length > 0) setAlbumIds(ids);
    });
  }, [photo.id]);

  const toggleAlbum = (id: string) =>
    setAlbumIds((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
    );

  const applyCropAspect = (mode: AspectOption) => {
    setAspectMode(mode);
    if (!cropImgRef.current) return;
    const { width, height } = cropImgRef.current;
    const ratio = ASPECT_OPTIONS.find((a) => a.value === mode)?.ratio;
    setCrop(
      ratio
        ? centerCrop(
            makeAspectCrop({ unit: "%", width: 90 }, ratio, width, height),
            width,
            height,
          )
        : { unit: "%", x: 0, y: 0, width: 100, height: 100 },
    );
  };

  const replaceImageWithCrop = async () => {
    setReplaceUploading(true);
    setReplaceMessage("");
    try {
      const blob = await createCroppedImageBlob(cropImgRef.current, crop);
      await onReplaceImage(photo, blob);
      setReplaceMessage("✓ Crop saved");
      setCropOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setReplaceMessage(`Crop failed: ${message}`);
    } finally {
      setReplaceUploading(false);
    }
  };

  const visOptions: {
    value: "public" | "portfolio_only" | "hidden";
    label: string;
    desc: string;
  }[] = [
    { value: "public", label: "Public", desc: "Visible everywhere" },
    {
      value: "portfolio_only",
      label: "Portfolio only",
      desc: "Only via shared link",
    },
    { value: "hidden", label: "Hidden", desc: "Not shown anywhere" },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center overflow-y-auto p-4">
      <div className="my-4 bg-white w-full max-w-md max-h-[calc(100dvh-2rem)] flex min-h-0 flex-col overflow-hidden">
        {/* Sticky header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
          <h3 className="text-xs uppercase tracking-widest text-gray-400">
            Edit Photo
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-900 text-lg leading-none"
          >
            ×
          </button>
        </div>
        {/* Scrollable body */}
        <div className="min-h-0 overflow-y-auto px-5 pb-5 flex flex-col gap-4">
          {cropOpen ? (
            <div className="border border-gray-200 p-3">
              <div className="mb-3 flex flex-wrap gap-2">
                {ASPECT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => applyCropAspect(opt.value)}
                    disabled={replaceUploading}
                    className={`text-[10px] px-3 py-1 border uppercase tracking-widest transition-colors ${
                      aspectMode === opt.value
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 text-gray-500 hover:border-gray-400"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <ReactCrop
                crop={crop}
                onChange={(nextCrop) => setCrop(nextCrop)}
                aspect={
                  ASPECT_OPTIONS.find((a) => a.value === aspectMode)?.ratio
                }
              >
                <img
                  ref={cropImgRef}
                  src={photoSrc}
                  crossOrigin="anonymous"
                  onLoad={() => applyCropAspect(aspectMode)}
                  alt=""
                  className="w-full max-h-64 object-contain bg-gray-50"
                />
              </ReactCrop>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={replaceImageWithCrop}
                  disabled={replaceUploading || !crop}
                  className="bg-gray-900 text-white text-xs uppercase tracking-widest px-4 py-2 hover:bg-gray-700 disabled:opacity-50"
                >
                  {replaceUploading ? "Saving…" : "Save Crop"}
                </button>
                <button
                  onClick={() => {
                    setCropOpen(false);
                    setReplaceMessage("");
                  }}
                  disabled={replaceUploading}
                  className="text-xs uppercase tracking-widest text-gray-400 hover:text-gray-900 px-3 py-2"
                >
                  Cancel Crop
                </button>
              </div>
              {replaceMessage && (
                <p
                  className={`mt-2 text-xs ${replaceMessage.startsWith("✓") ? "text-green-600" : "text-red-600"}`}
                >
                  {replaceMessage}
                </p>
              )}
            </div>
          ) : (
            <div className="border border-gray-100 bg-gray-50 p-2">
              <img
                src={photoSrc}
                alt=""
                className="w-full max-h-48 object-contain"
              />
              <button
                onClick={() => {
                  setCropOpen(true);
                  setReplaceMessage("");
                }}
                className="mt-2 w-full border border-gray-200 bg-white px-4 py-2 text-xs uppercase tracking-widest text-gray-600 hover:border-gray-900 hover:text-gray-900"
              >
                Adjust Crop
              </button>
              {replaceMessage && (
                <p
                  className={`mt-2 text-xs ${replaceMessage.startsWith("✓") ? "text-green-600" : "text-red-600"}`}
                >
                  {replaceMessage}
                </p>
              )}
            </div>
          )}
          <input
            type="text"
            placeholder="Caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="w-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-900"
          />
          {/* Multi-select album checkboxes */}
          <div className="border border-gray-200 p-3">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">
              Albums
            </p>
            <div className="flex flex-col gap-2">
              {albums.map((a) => (
                <label
                  key={a.id}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={albumIds.includes(a.id)}
                    onChange={() => toggleAlbum(a.id)}
                    className="w-4 h-4 accent-gray-900"
                  />
                  <div>
                    <p className="text-sm text-gray-900 leading-none">
                      {a.title}
                    </p>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 mt-0.5">
                      {a.album_type ?? "gallery"}
                    </p>
                  </div>
                </label>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-2">
              Leave all unchecked to keep this photo standalone.
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">
              Visibility
            </p>
            <div className="flex gap-2">
              {visOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setVisibility(opt.value)}
                  className={`flex-1 text-center py-2 border text-xs transition-colors ${
                    visibility === opt.value
                      ? "border-gray-900 text-gray-900 bg-gray-50"
                      : "border-gray-200 text-gray-400 hover:text-gray-700"
                  }`}
                >
                  <div className="uppercase tracking-widest font-medium">
                    {opt.label}
                  </div>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5">
              {visOptions.find((o) => o.value === visibility)?.desc}
            </p>
          </div>
          {showHomeFeature && (
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setHomeFeatured((v) => !v)}
                  className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${homeFeatured ? "bg-amber-400" : "bg-gray-200"}`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${homeFeatured ? "translate-x-4" : "translate-x-0"}`}
                  />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-gray-700 leading-none">
                    Feature on homepage
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Shown in the rotating homepage grid
                  </p>
                </div>
              </label>
            </div>
          )}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setDisplaySingle((v) => !v)}
                className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${displaySingle ? "bg-gray-900" : "bg-gray-200"}`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${displaySingle ? "translate-x-4" : "translate-x-0"}`}
                />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-700 leading-none">
                  Display as single
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Stops this portrait photo pairing with another portrait
                </p>
              </div>
            </label>
          </div>
          <div className="sticky bottom-0 -mx-5 mt-2 flex gap-3 border-t border-gray-100 bg-white px-5 py-4">
            <button
              onClick={() =>
                onSave(
                  photo.id,
                  caption,
                  albumIds,
                  visibility,
                  homeFeatured,
                  displaySingle,
                )
              }
              className="bg-gray-900 text-white text-xs uppercase tracking-widest px-5 py-2 hover:bg-gray-700"
            >
              Save
            </button>
            <button
              onClick={onClose}
              className="text-xs uppercase tracking-widest text-gray-400 hover:text-gray-900 px-3 py-2"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Album Modal ─────────────────────────────────────────────────────────

function EditAlbumModal({
  album,
  onSave,
  onClose,
}: {
  album: AlbumRow;
  onSave: (
    id: string,
    title: string,
    description: string,
    type: "gallery" | "portfolio",
    showTitle: boolean,
  ) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(album.title);
  const [description, setDescription] = useState(album.description);
  const [albumType, setAlbumType] = useState<"gallery" | "portfolio">(
    album.album_type ?? "gallery",
  );
  const [showTitle, setShowTitle] = useState(album.show_title !== false);

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md p-6">
        <h3 className="text-xs uppercase tracking-widest text-gray-400 mb-4">
          Edit Album
        </h3>
        <input
          type="text"
          placeholder="Album title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-900 mb-3"
        />
        <input
          type="text"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-900 mb-4"
        />
        <div className="mb-5">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">
            Type
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setAlbumType("gallery")}
              className={`text-xs uppercase tracking-widest px-4 py-2 border transition-colors ${albumType === "gallery" ? "border-gray-900 text-gray-900 bg-gray-50" : "border-gray-200 text-gray-400 hover:text-gray-700"}`}
            >
              Gallery
            </button>
            <button
              onClick={() => setAlbumType("portfolio")}
              className={`text-xs uppercase tracking-widest px-4 py-2 border transition-colors ${albumType === "portfolio" ? "border-gray-900 text-gray-900 bg-gray-50" : "border-gray-200 text-gray-400 hover:text-gray-700"}`}
            >
              Portfolio
            </button>
          </div>
          <p className="text-[10px] text-gray-400 mt-2">
            {albumType === "gallery"
              ? "Shown publicly on the Photography page."
              : "Hidden from the public site — share via link only."}
          </p>
        </div>
        <label className="mb-5 flex items-start gap-3 border border-gray-200 p-3 cursor-pointer hover:border-gray-400 transition-colors">
          <input
            type="checkbox"
            checked={showTitle}
            onChange={(e) => setShowTitle(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            <span className="block text-xs uppercase tracking-widest text-gray-700">
              Show album name
            </span>
            <span className="block text-[10px] text-gray-400 mt-1">
              Controls the title shown above this gallery carousel.
            </span>
          </span>
        </label>
        <div className="flex gap-3">
          <button
            onClick={() =>
              onSave(album.id, title, description, albumType, showTitle)
            }
            className="bg-gray-900 text-white text-xs uppercase tracking-widest px-5 py-2 hover:bg-gray-700"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="text-xs uppercase tracking-widest text-gray-400 hover:text-gray-900 px-3 py-2"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Copy Link Button ─────────────────────────────────────────────────────────

function CopyLinkButton({
  albumId,
  visible,
}: {
  albumId: string;
  visible: boolean;
}) {
  const [state, setState] = useState<
    "idle" | "loading" | "copied" | "warn" | "manual" | "error"
  >("idle");
  const [copiedAt, setCopiedAt] = useState<string | null>(null);
  const [manualCopyUrl, setManualCopyUrl] = useState<string | null>(null);
  const manualCopyInputRef = useRef<HTMLInputElement | null>(null);
  const [errorMessage, setErrorMessage] = useState(
    "Could not copy the link. Check your admin session and try again.",
  );

  useEffect(() => {
    let mounted = true;
    loadPortfolioShare(albumId)
      .then((share) => {
        if (!mounted) return;
        setCopiedAt(share?.copied_at ?? null);
      })
      .catch(() => {
        if (mounted) setCopiedAt(null);
      });
    return () => {
      mounted = false;
    };
  }, [albumId]);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setState("loading");
    setManualCopyUrl(null);
    setErrorMessage("Could not copy the link. Check your admin session and try again.");
    let showManualCopy = false;
    try {
      const share = await createOrRefreshPortfolioShare(albumId);
      const shareUrl = portfolioShareUrl(share.token);
      const copied = await copyTextToClipboard(shareUrl);
      setCopiedAt(share.copied_at);
      if (copied) {
        setState(visible ? "copied" : "warn");
      } else {
        showManualCopy = true;
        setManualCopyUrl(shareUrl);
        setState("manual");
        setErrorMessage("Copy was blocked. Select and copy this link instead.");
      }
    } catch (error) {
      console.error("Could not copy portfolio link:", error);
      setErrorMessage(error instanceof Error ? error.message : String(error));
      setState("error");
    } finally {
      setTimeout(() => {
        setState("idle");
        setManualCopyUrl(null);
      }, showManualCopy ? 10000 : 3500);
    }
  };

  const copiedLabel = formatCopiedAt(copiedAt);

  useEffect(() => {
    if (state !== "manual") return;
    requestAnimationFrame(() => {
      manualCopyInputRef.current?.focus();
      manualCopyInputRef.current?.select();
    });
  }, [state, manualCopyUrl]);

  return (
    <div className="relative flex flex-col items-start">
      <button
        onClick={handleClick}
        disabled={state === "loading"}
        className={`text-[9px] uppercase tracking-widest bg-white border px-2 py-1 transition-colors ${
          state === "copied"
            ? "border-green-400 text-green-600"
            : state === "warn"
              ? "border-amber-400 text-amber-600"
              : state === "manual"
                ? "border-gray-300 text-gray-700"
              : state === "error"
                ? "border-red-400 text-red-600"
              : "border-gray-200 text-gray-500 hover:bg-gray-50"
        }`}
      >
        {state === "loading"
          ? "Copying..."
          : state === "idle"
            ? "Copy link"
            : state === "manual"
              ? "Copy manually"
            : state === "error"
              ? "Try again"
              : "✓ Copied"}
      </button>
      {copiedLabel && (
        <span className="mt-1 text-[9px] text-gray-400">
          Last copied {copiedLabel}
        </span>
      )}
      {state === "warn" && (
        <div className="absolute bottom-full mb-1 left-0 bg-amber-50 border border-amber-300 text-amber-700 text-[9px] leading-snug px-2 py-1.5 w-[200px] shadow z-20">
          ⚠ Album is hidden — turn on visibility before sending or clients won't
          see any photos.
        </div>
      )}
      {state === "error" && (
        <div className="absolute bottom-full mb-1 left-0 bg-red-50 border border-red-300 text-red-700 text-[9px] leading-snug px-2 py-1.5 w-[200px] shadow z-20">
          <p>{errorMessage}</p>
        </div>
      )}
      {state === "manual" && manualCopyUrl && (
        <div className="absolute bottom-full mb-1 left-0 bg-gray-50 border border-gray-200 text-gray-700 text-[9px] leading-snug px-2 py-1.5 w-[240px] shadow z-20">
          <p>Link created. Press Cmd+C or Ctrl+C to copy it.</p>
          <input
            ref={manualCopyInputRef}
            readOnly
            value={manualCopyUrl}
            onFocus={(event) => event.currentTarget.select()}
            onClick={(event) => event.currentTarget.select()}
            className="mt-2 w-full border border-gray-200 bg-white px-1 py-1 text-[9px] text-gray-700 outline-none"
          />
        </div>
      )}
    </div>
  );
}

// ─── Download Portfolio ZIP Button ───────────────────────────────────────────

function slugifyFileName(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "portfolio"
  );
}

function getFileExtension(url: string, contentType: string | null) {
  const path = new URL(url).pathname;
  const match = path.match(/\.([a-z0-9]+)$/i);
  if (match) return match[1].toLowerCase();
  if (contentType?.includes("png")) return "png";
  if (contentType?.includes("webp")) return "webp";
  return "jpg";
}

async function loadPhotosWithAlbumIds() {
  const [{ data, error }, links] = await Promise.all([
    supabase
      .from("photos")
      .select("*")
      .order("sort_order", { ascending: true }),
    loadPhotoAlbumLinks(),
  ]);

  if (error) throw error;
  return mergePhotoAlbumIds(data ?? [], links);
}

function DownloadZipButton({ album }: { album: AlbumRow }) {
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setState("loading");

    try {
      const allPhotos = await loadPhotosWithAlbumIds();
      const photos = sortPhotosForAlbum(
        allPhotos.filter(
          (photo) =>
            photoBelongsToAlbum(photo, album.id) &&
            (photo.visibility ?? (photo.visible ? "public" : "hidden")) !==
              "hidden",
        ),
        album.id,
      );
      if (photos.length === 0)
        throw new Error("No downloadable photos in this portfolio.");

      const zip = new JSZip();
      const albumSlug = slugifyFileName(album.title);

      for (const [index, photo] of photos.entries()) {
        const response = await fetch(photo.url);
        if (!response.ok)
          throw new Error(`Could not fetch ${photo.caption || photo.url}`);

        const blob = await response.blob();
        const extension = getFileExtension(
          photo.url,
          response.headers.get("content-type"),
        );
        const name = slugifyFileName(photo.caption || `image-${index + 1}`);
        zip.file(
          `${String(index + 1).padStart(2, "0")}-${name}.${extension}`,
          blob,
        );
      }

      const archive = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(archive);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${albumSlug}.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setState("idle");
    } catch (err) {
      console.error("download zip failed:", err);
      setState("error");
      setTimeout(() => setState("idle"), 4000);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={state === "loading"}
      className={`text-[9px] uppercase tracking-widest border px-2 py-1 transition-colors disabled:cursor-wait disabled:opacity-60 ${
        state === "error"
          ? "border-red-300 text-red-500"
          : "border-gray-200 text-gray-500 hover:bg-gray-50"
      }`}
    >
      {state === "loading"
        ? "Zipping…"
        : state === "error"
          ? "Zip failed"
          : "Download ZIP"}
    </button>
  );
}

// ─── Photography Admin ────────────────────────────────────────────────────────

function PhotographyAdmin() {
  const [view, setView] = useState<"albums" | "all">("albums");
  const [allPhotosSort, setAllPhotosSort] = useState<AllPhotosSort>("");
  const [homeFeatureEnabled, setHomeFeatureEnabled] = useState(false);
  const [albums, setAlbums] = useState<AlbumRow[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<AlbumRow | null>(null);
  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [allPhotos, setAllPhotos] = useState<PhotoRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [message, setMessage] = useState("");
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [editingPhoto, setEditingPhoto] = useState<PhotoRow | null>(null);
  const [editingAlbum, setEditingAlbum] = useState<AlbumRow | null>(null);
  const [newAlbumTitle, setNewAlbumTitle] = useState("");
  const [newAlbumDesc, setNewAlbumDesc] = useState("");
  const [newAlbumType, setNewAlbumType] = useState<"gallery" | "portfolio">(
    "gallery",
  );
  const [showNewAlbum, setShowNewAlbum] = useState(false);
  const [showCreateConfirm, setShowCreateConfirm] = useState(false);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const newAlbumFormRef = useRef<HTMLDivElement | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 120, tolerance: 8 },
    }),
  );

  const showToast = (msg: string, type: "success" | "error" = "error") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(
      () => setToast(null),
      type === "error" ? 6000 : 3000,
    );
  };

  const loadAlbums = async () => {
    const { data, error } = await supabase
      .from("albums")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) {
      showToast(`Failed to load albums: ${error.message}`);
      return;
    }
    if (data) setAlbums(data);
  };

  const loadPhotos = async (albumId?: string) => {
    try {
      const mergedPhotos = await loadPhotosWithAlbumIds();
      if (albumId) {
        setPhotos(
          sortPhotosForAlbum(
            mergedPhotos.filter((photo) => photoBelongsToAlbum(photo, albumId)),
            albumId,
          ),
        );
      } else {
        setAllPhotos(mergedPhotos);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      showToast(`Failed to load photos: ${message}`);
      return;
    }
  };

  useEffect(() => {
    loadAlbums();
    loadPhotos();
    loadSiteSettings()
      .then((settings) =>
        setHomeFeatureEnabled(settings.home_page_mode === "landing"),
      )
      .catch((error) => {
        console.error("Failed to load homepage setting:", error);
        setHomeFeatureEnabled(false);
      });
  }, []);
  useEffect(() => {
    if (selectedAlbum) loadPhotos(selectedAlbum.id);
  }, [selectedAlbum]);
  useEffect(() => {
    if (!homeFeatureEnabled && allPhotosSort === "home-featured") {
      setAllPhotosSort("");
    }
  }, [allPhotosSort, homeFeatureEnabled]);

  const handleFiles = (files: FileList | null) => {
    const imageFiles = Array.from(files ?? []).filter((file) =>
      file.type.startsWith("image/"),
    );
    if (imageFiles.length === 0) return;

    if (imageFiles.length > 1) {
      uploadFilesBatch(imageFiles);
      return;
    }

    setPendingFile(imageFiles[0]);
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(imageFiles[0]);
  };

  const doUpload = async (
    fileOrBlob: File | Blob,
    caption: string,
    sortOrder?: number,
  ) => {
    const ext =
      fileOrBlob instanceof File ? fileOrBlob.name.split(".").pop() : "jpg";
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const upload = await uploadMedia({
      bucket: "Photographs",
      folder:
        selectedAlbum?.album_type === "portfolio" ? "portfolio" : "photographs",
      file: fileOrBlob,
      fileName,
      contentType: fileOrBlob instanceof File ? fileOrBlob.type : "image/jpeg",
      resourceType: "image",
    });
    const currentPhotos = selectedAlbum ? photos : allPhotos;
    const visibility =
      selectedAlbum?.album_type === "portfolio" ? "portfolio_only" : "public";
    const { data: insertedPhoto, error: dErr } = await supabase
      .from("photos")
      .insert({
        url: upload.url,
        caption,
        sort_order: sortOrder ?? currentPhotos.length,
        album_id: selectedAlbum?.id ?? null,
        visibility,
        visible: visibility === "public",
      })
      .select("id")
      .single();
    if (dErr) throw dErr;
    if (selectedAlbum && insertedPhoto?.id) {
      await savePhotoAlbumLinks(insertedPhoto.id, [selectedAlbum.id]);
    }
  };

  const uploadFilesBatch = async (files: File[]) => {
    setUploading(true);
    setMessage("");
    try {
      const currentPhotos = selectedAlbum ? photos : allPhotos;
      for (const [index, file] of files.entries()) {
        await doUpload(file, "", currentPhotos.length + index);
      }
      setMessage(`✓ Uploaded ${files.length} photos`);
      showToast(`✓ Uploaded ${files.length} photos`, "success");
      if (fileRef.current) fileRef.current.value = "";
      selectedAlbum ? loadPhotos(selectedAlbum.id) : loadPhotos();
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      setMessage(`Error: ${msg}`);
      showToast(`Batch upload failed: ${msg}`);
    } finally {
      setUploading(false);
    }
  };

  const replacePhotoImage = async (photo: PhotoRow, blob: Blob) => {
    const folder =
      selectedAlbum?.album_type === "portfolio" ||
      photo.visibility === "portfolio_only"
        ? "portfolio"
        : "photographs";
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
    const upload = await uploadMedia({
      bucket: "Photographs",
      folder,
      file: blob,
      fileName,
      contentType: "image/jpeg",
      resourceType: "image",
    });
    const { error } = await supabase
      .from("photos")
      .update({ url: upload.url })
      .eq("id", photo.id);
    if (error) throw error;

    setEditingPhoto((current) =>
      current?.id === photo.id ? { ...current, url: upload.url } : current,
    );
    showToast("✓ Crop saved", "success");
    selectedAlbum ? loadPhotos(selectedAlbum.id) : loadPhotos();
  };

  const handleCropUpload = async (
    crop: Crop,
    _aspect: AspectOption,
    caption: string,
    image: HTMLImageElement | null,
  ) => {
    setUploading(true);
    setMessage("");
    try {
      const blob = await createCroppedImageBlob(image, crop);
      await doUpload(blob, caption);
      setMessage("✓ Uploaded");
      showToast("✓ Photo uploaded", "success");
      setCropSrc(null);
      setPendingFile(null);
      selectedAlbum ? loadPhotos(selectedAlbum.id) : loadPhotos();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setMessage(`Error: ${msg}`);
      showToast(`Upload failed: ${msg}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSkipCrop = async (caption: string) => {
    if (!pendingFile) return;
    setUploading(true);
    setMessage("");
    try {
      await doUpload(pendingFile, caption);
      setMessage("✓ Uploaded");
      showToast("✓ Photo uploaded", "success");
      setCropSrc(null);
      setPendingFile(null);
      selectedAlbum ? loadPhotos(selectedAlbum.id) : loadPhotos();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setMessage(`Error: ${msg}`);
      showToast(`Upload failed: ${msg}`);
    } finally {
      setUploading(false);
    }
  };

  const deletePhoto = async (photo: PhotoRow) => {
    if (!confirm("Delete this photo?")) return;
    const fileName = photo.url.split("/").pop();
    if (fileName && !isCloudinaryUrl(photo.url)) {
      const { error: sErr } = await supabase.storage
        .from("Photographs")
        .remove([fileName]);
      if (sErr)
        showToast(
          `Warning: could not delete file from storage — ${sErr.message}`,
        );
    }
    const { error } = await supabase.from("photos").delete().eq("id", photo.id);
    if (error) {
      showToast(`Failed to delete photo: ${error.message}`);
      return;
    }
    showToast("✓ Photo deleted", "success");
    selectedAlbum ? loadPhotos(selectedAlbum.id) : loadPhotos();
  };

  const saveEdit = async (
    id: string,
    caption: string,
    albumIds: string[],
    visibility: "public" | "portfolio_only" | "hidden",
    homeFeatured: boolean,
    displaySingle: boolean,
  ) => {
    const uniqueAlbumIds = Array.from(new Set(albumIds.filter(Boolean)));
    const { error } = await supabase
      .from("photos")
      .update({
        caption,
        album_id: uniqueAlbumIds[0] ?? null,
        visibility,
        visible: visibility === "public",
        home_featured: homeFeatured,
        display_single: displaySingle,
      })
      .eq("id", id);
    if (error) {
      console.error("saveEdit error:", error);
      showToast(`Save failed: ${error.message}`);
      return;
    }
    try {
      await savePhotoAlbumLinks(id, uniqueAlbumIds);
    } catch (linkError) {
      const message =
        linkError instanceof Error ? linkError.message : String(linkError);
      showToast(`Saved photo, but album links failed: ${message}`);
      return;
    }
    showToast("✓ Photo saved", "success");
    setEditingPhoto(null);
    selectedAlbum ? loadPhotos(selectedAlbum.id) : loadPhotos();
  };

  const toggleHomeFeatured = async (photo: PhotoRow) => {
    const { error } = await supabase
      .from("photos")
      .update({ home_featured: !photo.home_featured })
      .eq("id", photo.id);
    if (error) {
      showToast(`Failed to update: ${error.message}`);
      return;
    }
    showToast(
      photo.home_featured ? "Removed from homepage" : "✓ Added to homepage",
      photo.home_featured ? "error" : "success",
    );
    selectedAlbum ? loadPhotos(selectedAlbum.id) : loadPhotos();
  };

  const cycleVisibility = async (photo: PhotoRow) => {
    const vis = photo.visibility ?? (photo.visible ? "public" : "hidden");
    const next =
      vis === "public"
        ? "portfolio_only"
        : vis === "portfolio_only"
          ? "hidden"
          : "public";
    const { error } = await supabase
      .from("photos")
      .update({ visibility: next, visible: next === "public" })
      .eq("id", photo.id);
    if (error) {
      showToast(`Failed to update: ${error.message}`);
      return;
    }
    const label =
      next === "public"
        ? "Public"
        : next === "portfolio_only"
          ? "Portfolio only"
          : "Hidden";
    showToast(`✓ Set to ${label}`, "success");
    selectedAlbum ? loadPhotos(selectedAlbum.id) : loadPhotos();
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    if (!selectedAlbum) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const list = selectedAlbum ? photos : allPhotos;
    const setter = selectedAlbum ? setPhotos : setAllPhotos;
    const oldIndex = list.findIndex((p) => p.id === active.id);
    const newIndex = list.findIndex((p) => p.id === over.id);
    const reordered = arrayMove(list, oldIndex, newIndex);
    setter(reordered);
    if (selectedAlbum) {
      try {
        await savePhotoAlbumOrder(
          selectedAlbum.id,
          reordered.map((photo) => photo.id),
        );
        showToast("✓ Album order saved", "success");
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        showToast(`Failed to save order: ${message}`);
        loadPhotos(selectedAlbum.id);
      }
    }
  };

  const createAlbum = async () => {
    if (!newAlbumTitle.trim()) {
      showToast("Album title is required");
      return;
    }
    const { error } = await supabase.from("albums").insert({
      title: newAlbumTitle.trim(),
      description: newAlbumDesc.trim(),
      sort_order: albums.length,
      album_type: newAlbumType,
    });
    if (error) {
      showToast(`Failed to create album: ${error.message}`);
      return;
    }
    setNewAlbumTitle("");
    setNewAlbumDesc("");
    setNewAlbumType("gallery");
    setShowNewAlbum(false);
    setShowCreateConfirm(false);
    showToast("✓ Album created", "success");
    loadAlbums();
  };

  const saveAlbum = async (
    id: string,
    title: string,
    description: string,
    type: "gallery" | "portfolio",
    showTitle: boolean,
  ) => {
    if (!title.trim()) {
      showToast("Album title is required");
      return;
    }
    const { error } = await supabase
      .from("albums")
      .update({ title, description, album_type: type, show_title: showTitle })
      .eq("id", id);
    if (error) {
      showToast(`Failed to save album: ${error.message}`);
      return;
    }
    showToast("✓ Album saved", "success");
    setEditingAlbum(null);
    loadAlbums();
  };

  const deleteAlbum = async (album: AlbumRow) => {
    if (
      !confirm(`Delete album "${album.title}"? Photos will become unassigned.`)
    )
      return;
    const { error: unlinkError } = await supabase
      .from("photos")
      .update({ album_id: null })
      .eq("album_id", album.id);
    if (unlinkError) {
      showToast(`Failed to unlink photos: ${unlinkError.message}`);
      return;
    }
    const { error: linkError } = await supabase
      .from("photo_album_links")
      .delete()
      .eq("album_id", album.id);
    if (linkError) {
      showToast(`Failed to delete album links: ${linkError.message}`);
      return;
    }
    const { error } = await supabase.from("albums").delete().eq("id", album.id);
    if (error) {
      showToast(`Failed to delete album: ${error.message}`);
      return;
    }
    showToast("✓ Album deleted", "success");
    if (selectedAlbum?.id === album.id) setSelectedAlbum(null);
    loadAlbums();
  };

  const handleViewAlbum = (albumId: string) => {
    const album = albums.find((a) => a.id === albumId);
    if (album) {
      setSelectedAlbum(album);
      setView("albums");
    }
  };

  const currentPhotos = selectedAlbum ? photos : allPhotos;
  const displayedPhotos =
    view === "all"
      ? sortAllPhotos(currentPhotos, albums, allPhotosSort)
      : currentPhotos;

  const scrollToNewAlbumForm = useCallback(() => {
    // Wait a tick so the form exists in the DOM after state updates.
    requestAnimationFrame(() => {
      newAlbumFormRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, []);

  useEffect(() => {
    if (showNewAlbum && view === "albums" && !selectedAlbum) {
      scrollToNewAlbumForm();
    }
  }, [scrollToNewAlbumForm, selectedAlbum, showNewAlbum, view]);

  return (
    <div>
      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-5 py-3 text-sm shadow-lg transition-all ${
            toast.type === "error"
              ? "bg-red-600 text-white"
              : "bg-gray-900 text-white"
          }`}
        >
          <span>{toast.msg}</span>
          <button
            onClick={() => setToast(null)}
            className="opacity-60 hover:opacity-100 ml-2 text-base leading-none"
          >
            ×
          </button>
        </div>
      )}

      <CreateAlbumModal
        open={showCreateConfirm}
        titleValue={newAlbumTitle}
        typeValue={newAlbumType}
        onClose={() => setShowCreateConfirm(false)}
        onConfirm={createAlbum}
      />

      {/* Mobile-only FAB: New album */}
      {view === "albums" && !selectedAlbum && (
        <button
          type="button"
          onClick={() => {
            setNewAlbumType("gallery");
            setShowNewAlbum(true);
            scrollToNewAlbumForm();
          }}
          className="fixed bottom-5 right-5 z-[90] md:hidden bg-gray-900 text-white rounded-full w-14 h-14 shadow-lg flex items-center justify-center text-2xl leading-none"
          aria-label="Create new album"
          title="New album"
        >
          +
        </button>
      )}

      {/* Crop modal */}
      {cropSrc && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50 }}>
          <CropModal
            src={cropSrc}
            onUpload={handleCropUpload}
            onSkip={handleSkipCrop}
            onCancel={() => {
              setCropSrc(null);
              setPendingFile(null);
            }}
            uploading={uploading}
            message={message}
          />
        </div>
      )}

      {/* Edit album modal */}
      {editingAlbum && (
        <EditAlbumModal
          album={editingAlbum}
          onSave={saveAlbum}
          onClose={() => setEditingAlbum(null)}
        />
      )}

      {/* Edit photo modal */}
      {editingPhoto && (
        <EditPhotoModal
          photo={editingPhoto}
          albums={albums}
          onSave={saveEdit}
          onReplaceImage={replacePhotoImage}
          showHomeFeature={homeFeatureEnabled}
          onClose={() => setEditingPhoto(null)}
        />
      )}

      {/* View toggle */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-xs uppercase tracking-widest text-gray-400">
          {/* Subsection header removed (was duplicating the top Photography tab label). */}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setView("albums");
              setSelectedAlbum(null);
            }}
            className={`text-xs uppercase tracking-widest px-3 py-1 border transition-colors ${view === "albums" && !selectedAlbum ? "border-gray-900 text-gray-900" : "border-gray-200 text-gray-400 hover:text-gray-700"}`}
          >
            Albums
          </button>
          <button
            onClick={() => {
              setView("all");
              setSelectedAlbum(null);
            }}
            className={`text-xs uppercase tracking-widest px-3 py-1 border transition-colors ${view === "all" ? "border-gray-900 text-gray-900" : "border-gray-200 text-gray-400 hover:text-gray-700"}`}
          >
            All Photos
          </button>
        </div>
      </div>

      {/* ── Albums view ── */}
      {view === "albums" && !selectedAlbum && (
        <div>
          {(["gallery"] as const).map((sectionType) => {
            const sectionAlbums = albums.filter(
              (a) => (a.album_type ?? "gallery") === sectionType,
            );
            return (
              <div key={sectionType} className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-xs uppercase tracking-widest text-gray-900 font-medium">
                    {sectionType === "gallery" ? "Gallery" : "Portfolio"}
                  </h3>
                  <span className="text-[10px] text-gray-400">
                    {sectionType === "gallery"
                      ? "— shown publicly on Photography page"
                      : "— private, share via link only"}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {sectionAlbums.map((album) => {
                    const albumPhotoCount = allPhotos.filter((photo) =>
                      photoBelongsToAlbum(photo, album.id),
                    ).length;

                    return (
                      <div
                        key={album.id}
                        className={`relative group border bg-white transition-colors ${album.visible === false ? "border-gray-100 opacity-60" : "border-gray-200 hover:border-gray-400"}`}
                      >
                        {/* Cover — click to open */}
                        <div
                          className="aspect-video bg-white overflow-hidden cursor-pointer border-b border-gray-100"
                          onClick={() => setSelectedAlbum(album)}
                        >
                          {album.cover_url ? (
                            <img
                              src={album.cover_url}
                              alt={album.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-500">
                              <span className="text-4xl font-semibold tracking-tight text-gray-800">
                                {albumPhotoCount}
                              </span>
                              <span className="mt-2 text-xs uppercase tracking-widest text-gray-400">
                                {albumPhotoCount === 1 ? "Image" : "Images"}
                              </span>
                            </div>
                          )}
                        </div>
                        {/* Hidden badge */}
                        {album.visible === false && (
                          <div className="absolute top-2 left-2 bg-black/60 text-white text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded">
                            Hidden
                          </div>
                        )}
                        {/* Delete */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteAlbum(album);
                          }}
                          className="absolute top-2 right-2 bg-white border border-gray-200 text-xs w-8 h-8 flex items-center justify-center opacity-100 transition-opacity hover:bg-red-500 hover:text-white hover:border-red-500 z-10 sm:w-6 sm:h-6 sm:opacity-0 sm:group-hover:opacity-100"
                        >
                          ✕
                        </button>
                        {/* Info */}
                        <div
                          className="p-3 cursor-pointer"
                          onClick={() => setSelectedAlbum(album)}
                        >
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {album.title}
                          </p>
                          {album.description && (
                            <p className="text-xs text-gray-400 truncate">
                              {album.description}
                            </p>
                          )}
                        </div>
                        {/* Action row */}
                        <div className="px-3 pb-3 flex items-center gap-2 flex-wrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingAlbum(album);
                            }}
                            className="text-[9px] uppercase tracking-widest border border-gray-200 text-gray-500 px-2 py-1 hover:bg-gray-50 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              supabase
                                .from("albums")
                                .update({ visible: !(album.visible ?? true) })
                                .eq("id", album.id)
                                .then(() => loadAlbums());
                            }}
                            className="text-[9px] uppercase tracking-widest border border-gray-200 text-gray-500 px-2 py-1 hover:bg-gray-50 transition-colors"
                          >
                            {album.visible === false ? "Show" : "Hide"}
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  <div
                    onClick={() => {
                      setNewAlbumType("gallery");
                      setShowNewAlbum(true);
                      scrollToNewAlbumForm();
                    }}
                    className="hidden md:flex border-2 border-dashed border-gray-300 hover:border-gray-500 aspect-video flex-col items-center justify-center cursor-pointer transition-colors text-gray-400 hover:text-gray-600"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        setNewAlbumType("gallery");
                        setShowNewAlbum(true);
                        scrollToNewAlbumForm();
                      }
                    }}
                    aria-label="Create new album"
                    title="New album"
                  >
                    <span className="text-2xl mb-1">+</span>
                    <span className="text-xs uppercase tracking-widest">
                      New Album
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {showNewAlbum && (
            <div
              ref={newAlbumFormRef}
              className="bg-white border border-gray-200 p-4 mb-4 max-w-md"
            >
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">
                New Album
              </p>
              <input
                type="text"
                placeholder="Album title"
                value={newAlbumTitle}
                onChange={(e) => setNewAlbumTitle(e.target.value)}
                className="w-full border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-900 mb-2"
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={newAlbumDesc}
                onChange={(e) => setNewAlbumDesc(e.target.value)}
                className="w-full border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-900 mb-3"
              />
              <p className="text-[10px] text-gray-400 mb-3">
                Shown publicly on the Photography page.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCreateConfirm(true)}
                  className="bg-gray-900 text-white text-xs uppercase tracking-widest px-4 py-2 hover:bg-gray-700"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowNewAlbum(false)}
                  className="text-xs text-gray-400 hover:text-gray-900 px-3 py-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Inside an album / All Photos ── */}
      {(selectedAlbum || view === "all") && (
        <div>
          {selectedAlbum && (
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => setSelectedAlbum(null)}
                className="text-xs uppercase tracking-widest text-gray-400 hover:text-gray-900"
              >
                ← Albums
              </button>
              <span className="text-gray-300">|</span>
              <span className="text-sm font-medium text-gray-900">
                {selectedAlbum.title}
              </span>
            </div>
          )}

          {/* Drop zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFiles(e.dataTransfer.files);
            }}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed p-6 text-center cursor-pointer transition-colors mb-4 sm:p-10 ${dragOver ? "border-gray-900 bg-gray-100" : "border-gray-300 hover:border-gray-500"}`}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <p className="text-sm text-gray-500">Drag & drop images here</p>
            <p className="text-xs text-gray-400 mt-1">
              or click to browse — JPG, PNG, WEBP
            </p>
            {selectedAlbum && (
              <p className="text-xs text-gray-400 mt-1">
                Uploading into: <strong>{selectedAlbum.title}</strong>
              </p>
            )}
          </div>

          {message && !cropSrc && (
            <p
              className={`text-xs mb-4 ${message.startsWith("✓") ? "text-green-600" : "text-red-500"}`}
            >
              {message}
            </p>
          )}

          {currentPhotos.length > 0 && (
            <>
              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-gray-400 uppercase tracking-widest">
                  {view === "all"
                    ? "Library View"
                    : "Drag the handle to reorder this album · tap edit or delete"}
                </p>
                {view === "all" && (
                  <label className="flex items-center">
                    <select
                      value={allPhotosSort}
                      onChange={(event) =>
                        setAllPhotosSort(event.target.value as AllPhotosSort)
                      }
                      className="border border-gray-200 bg-white px-3 py-2 text-xs uppercase tracking-widest text-gray-700 outline-none focus:border-gray-900"
                    >
                      <option value="">Sort by</option>
                      <option value="date-added">Date added</option>
                      {homeFeatureEnabled && (
                        <option value="home-featured">Homepage featured</option>
                      )}
                      <option value="hidden">Hidden</option>
                    </select>
                  </label>
                )}
              </div>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={displayedPhotos.map((p) => p.id)}
                  strategy={rectSortingStrategy}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {displayedPhotos.map((photo) => (
                      <SortablePhoto
                        key={photo.id}
                        photo={photo}
                        onDelete={deletePhoto}
                        onEdit={setEditingPhoto}
                        onToggleHome={
                          homeFeatureEnabled ? toggleHomeFeatured : undefined
                        }
                        onToggleVis={cycleVisibility}
                        albums={view === "all" ? albums : undefined}
                        onViewAlbum={
                          view === "all" ? handleViewAlbum : undefined
                        }
                        sortable={!!selectedAlbum}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </>
          )}
          {currentPhotos.length === 0 && (
            <p className="text-xs text-gray-400 mt-4">No photos yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

function PortfolioCardPreview({ title }: { title: string }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-5 py-4 text-center">
      <img
        src={`${import.meta.env.BASE_URL}logo-tight.png`}
        alt="Vic Lentaigne"
        className="h-5 w-auto max-w-[78%] object-contain mb-4"
      />
      <p className="text-[8px] uppercase tracking-widest text-gray-400 mb-2">
        A portfolio prepared for
      </p>
      <p className="text-sm text-gray-900 mb-4 line-clamp-1">{title}</p>
      <span className="border border-gray-200 px-5 py-2 text-[8px] uppercase tracking-widest text-gray-500">
        View portfolio
      </span>
    </div>
  );
}

function PortfolioAdmin({
  onViewPageHrefChange,
}: {
  onViewPageHrefChange: (href: string | null) => void;
}) {
  const [albums, setAlbums] = useState<AlbumRow[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<AlbumRow | null>(null);
  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [message, setMessage] = useState("");
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showNewAlbum, setShowNewAlbum] = useState(false);
  const [newAlbumTitle, setNewAlbumTitle] = useState("");
  const [newAlbumDesc, setNewAlbumDesc] = useState("");
  const [editingAlbum, setEditingAlbum] = useState<AlbumRow | null>(null);
  const [editingPhoto, setEditingPhoto] = useState<PhotoRow | null>(null);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messageTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 120, tolerance: 8 },
    }),
  );

  const showToast = (msg: string, type: "success" | "error" = "error") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(
      () => setToast(null),
      type === "error" ? 6000 : 3000,
    );
  };

  const setTimedMessage = (
    msg: string,
    type: "success" | "error" = "error",
  ) => {
    if (messageTimer.current) clearTimeout(messageTimer.current);
    setMessage(msg);
    messageTimer.current = setTimeout(
      () => setMessage(""),
      type === "success" ? 3000 : 6000,
    );
  };

  const loadAlbums = async () => {
    const { data, error } = await supabase
      .from("albums")
      .select("*")
      .eq("album_type", "portfolio")
      .order("sort_order", { ascending: true });
    if (error) {
      showToast(`Failed to load albums: ${error.message}`);
      return;
    }
    if (data) setAlbums(data);
  };

  const loadPhotos = async (albumId: string) => {
    try {
      const mergedPhotos = await loadPhotosWithAlbumIds();
      setPhotos(
        sortPhotosForAlbum(
          mergedPhotos.filter((photo) => photoBelongsToAlbum(photo, albumId)),
          albumId,
        ),
      );
    } catch (error) {
      const messageText =
        error instanceof Error ? error.message : String(error);
      showToast(`Failed to load photos: ${messageText}`);
    }
  };

  useEffect(() => {
    loadAlbums();
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      if (messageTimer.current) clearTimeout(messageTimer.current);
    };
  }, []);

  useEffect(() => {
    if (selectedAlbum) loadPhotos(selectedAlbum.id);
  }, [selectedAlbum]);

  useEffect(() => {
    let mounted = true;
    if (!selectedAlbum) {
      onViewPageHrefChange(null);
      return () => {
        mounted = false;
        onViewPageHrefChange(null);
      };
    }

    loadPortfolioShare(selectedAlbum.id)
      .then((share) => {
        if (!mounted) return;
        onViewPageHrefChange(share?.token ? portfolioShareUrl(share.token) : null);
      })
      .catch(() => {
        if (mounted) onViewPageHrefChange(null);
      });

    return () => {
      mounted = false;
      onViewPageHrefChange(null);
    };
  }, [onViewPageHrefChange, selectedAlbum]);

  const handleFiles = (files: FileList | null) => {
    const imageFiles = Array.from(files ?? []).filter((file) =>
      file.type.startsWith("image/"),
    );
    if (imageFiles.length === 0) return;
    if (messageTimer.current) clearTimeout(messageTimer.current);
    setMessage("");

    if (imageFiles.length > 1) {
      uploadPortfolioPhotoBatch(imageFiles);
      return;
    }

    setPendingFile(imageFiles[0]);
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(imageFiles[0]);
  };

  const uploadPortfolioPhoto = async (
    fileOrBlob: File | Blob,
    caption: string,
    sortOrder?: number,
  ) => {
    if (!selectedAlbum) throw new Error("Choose a portfolio album first.");
    const ext =
      fileOrBlob instanceof File ? fileOrBlob.name.split(".").pop() : "jpg";
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const upload = await uploadMedia({
      bucket: "Photographs",
      folder: "portfolio",
      file: fileOrBlob,
      fileName,
      contentType: fileOrBlob instanceof File ? fileOrBlob.type : "image/jpeg",
      resourceType: "image",
    });
    const { data, error } = await supabase
      .from("photos")
      .insert({
        url: upload.url,
        caption,
        sort_order: sortOrder ?? photos.length,
        album_id: selectedAlbum.id,
        visibility: "portfolio_only",
        visible: true,
      })
      .select("id")
      .single();
    if (error) throw error;
    if (data) await savePhotoAlbumLinks(data.id, [selectedAlbum.id]);
  };

  const uploadPortfolioPhotoBatch = async (files: File[]) => {
    setUploading(true);
    setMessage("");
    try {
      for (const [index, file] of files.entries()) {
        await uploadPortfolioPhoto(file, "", photos.length + index);
      }
      setTimedMessage(`✓ Uploaded ${files.length} photos`, "success");
      showToast(`Uploaded ${files.length} photos`, "success");
      if (fileRef.current) fileRef.current.value = "";
      if (selectedAlbum) loadPhotos(selectedAlbum.id);
    } catch (error) {
      const messageText =
        error instanceof Error ? error.message : String(error);
      setTimedMessage(`Error: ${messageText}`);
      showToast(`Batch upload failed: ${messageText}`);
    } finally {
      setUploading(false);
    }
  };

  const replacePhotoImage = async (photo: PhotoRow, blob: Blob) => {
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
    const upload = await uploadMedia({
      bucket: "Photographs",
      folder: "portfolio",
      file: blob,
      fileName,
      contentType: "image/jpeg",
      resourceType: "image",
    });
    const { error } = await supabase
      .from("photos")
      .update({ url: upload.url })
      .eq("id", photo.id);
    if (error) throw error;

    setEditingPhoto((current) =>
      current?.id === photo.id ? { ...current, url: upload.url } : current,
    );
    showToast("Crop saved", "success");
    if (selectedAlbum) loadPhotos(selectedAlbum.id);
  };

  const handleCropUpload = async (
    crop: Crop,
    _aspect: AspectOption,
    caption: string,
    image: HTMLImageElement | null,
  ) => {
    setUploading(true);
    setMessage("");
    try {
      const blob = await createCroppedImageBlob(image, crop);
      await uploadPortfolioPhoto(blob, caption);
      setTimedMessage("✓ Uploaded", "success");
      showToast("Photo uploaded", "success");
      setCropSrc(null);
      setPendingFile(null);
      if (fileRef.current) fileRef.current.value = "";
      if (selectedAlbum) loadPhotos(selectedAlbum.id);
    } catch (error) {
      const messageText =
        error instanceof Error ? error.message : String(error);
      setTimedMessage(`Error: ${messageText}`);
      showToast(`Upload failed: ${messageText}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSkipCrop = async (caption: string) => {
    if (!pendingFile) return;
    setUploading(true);
    setMessage("");
    try {
      await uploadPortfolioPhoto(pendingFile, caption);
      setTimedMessage("✓ Uploaded", "success");
      showToast("Photo uploaded", "success");
      setCropSrc(null);
      setPendingFile(null);
      if (fileRef.current) fileRef.current.value = "";
      if (selectedAlbum) loadPhotos(selectedAlbum.id);
    } catch (error) {
      const messageText =
        error instanceof Error ? error.message : String(error);
      setTimedMessage(`Error: ${messageText}`);
      showToast(`Upload failed: ${messageText}`);
    } finally {
      setUploading(false);
    }
  };

  const createPortfolio = async () => {
    if (!newAlbumTitle.trim()) return;
    const { error } = await supabase.from("albums").insert({
      title: newAlbumTitle.trim(),
      description: newAlbumDesc.trim(),
      album_type: "portfolio",
      visible: true,
      sort_order: albums.length,
    });
    if (error) {
      showToast(`Error: ${error.message}`);
      return;
    }
    setNewAlbumTitle("");
    setNewAlbumDesc("");
    setShowNewAlbum(false);
    showToast("Album created", "success");
    loadAlbums();
  };

  const saveAlbum = async (
    id: string,
    title: string,
    description: string,
    type: "gallery" | "portfolio",
    showTitle: boolean,
  ) => {
    const current = albums.find((album) => album.id === id);
    const { error } = await supabase
      .from("albums")
      .update({
        title,
        description,
        album_type: type,
        show_title: showTitle,
        visible: current?.visible ?? true,
      })
      .eq("id", id);
    if (error) {
      showToast(`Error: ${error.message}`);
      return;
    }
    showToast("Saved", "success");
    setEditingAlbum(null);
    loadAlbums();
    if (selectedAlbum?.id === id) {
      setSelectedAlbum({
        ...(selectedAlbum as AlbumRow),
        title,
        description,
        album_type: type,
        show_title: showTitle,
      });
    }
  };

  const deleteAlbum = async (album: AlbumRow) => {
    if (
      !confirm(
        `Delete album "${album.title}"? Photos will stay in the library.`,
      )
    )
      return;
    await supabase
      .from("photos")
      .update({ album_id: null })
      .eq("album_id", album.id);
    await supabase.from("photo_album_links").delete().eq("album_id", album.id);
    const { error } = await supabase.from("albums").delete().eq("id", album.id);
    if (error) {
      showToast(`Error: ${error.message}`);
      return;
    }
    showToast("Album deleted", "success");
    if (selectedAlbum?.id === album.id) {
      setSelectedAlbum(null);
      setPhotos([]);
    }
    loadAlbums();
  };

  const cycleVisibility = async (photo: PhotoRow) => {
    const next =
      photo.visibility === "public"
        ? "portfolio_only"
        : photo.visibility === "portfolio_only"
          ? "hidden"
          : "public";
    const { error } = await supabase
      .from("photos")
      .update({ visibility: next, visible: next !== "hidden" })
      .eq("id", photo.id);
    if (error) {
      showToast(`Failed to update: ${error.message}`);
      return;
    }
    setPhotos((current) =>
      current.map((item) =>
        item.id === photo.id
          ? { ...item, visibility: next, visible: next !== "hidden" }
          : item,
      ),
    );
  };

  const saveEdit = async (
    id: string,
    caption: string,
    albumIds: string[],
    visibility: "public" | "portfolio_only" | "hidden",
    homeFeatured: boolean,
    displaySingle: boolean,
  ) => {
    const uniqueAlbumIds = Array.from(new Set(albumIds.filter(Boolean)));
    const { error } = await supabase
      .from("photos")
      .update({
        caption,
        album_id: uniqueAlbumIds[0] ?? null,
        visibility,
        visible: visibility !== "hidden",
        home_featured: homeFeatured,
        display_single: displaySingle,
      })
      .eq("id", id);
    if (error) {
      showToast(`Save failed: ${error.message}`);
      return;
    }
    try {
      await savePhotoAlbumLinks(id, uniqueAlbumIds);
    } catch (linkError) {
      const messageText =
        linkError instanceof Error ? linkError.message : String(linkError);
      showToast(`Album links failed: ${messageText}`);
      return;
    }
    showToast("Photo saved", "success");
    setEditingPhoto(null);
    if (selectedAlbum) loadPhotos(selectedAlbum.id);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    if (!selectedAlbum) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = photos.findIndex((photo) => photo.id === active.id);
    const newIndex = photos.findIndex((photo) => photo.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(photos, oldIndex, newIndex);
    setPhotos(reordered);
    try {
      await savePhotoAlbumOrder(
        selectedAlbum.id,
        reordered.map((photo) => photo.id),
      );
      showToast("Order saved", "success");
    } catch (error) {
      const messageText =
        error instanceof Error ? error.message : String(error);
      showToast(`Failed to save order: ${messageText}`);
      loadPhotos(selectedAlbum.id);
    }
  };

  const deletePhoto = async (photo: PhotoRow) => {
    if (!confirm("Delete this photo?")) return;
    const { error } = await supabase.from("photos").delete().eq("id", photo.id);
    if (error) {
      showToast(`Failed to delete photo: ${error.message}`);
      return;
    }
    setPhotos((current) => current.filter((item) => item.id !== photo.id));
    showToast("Photo deleted", "success");
  };

  return (
    <div className="space-y-8">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 text-sm text-white shadow-lg ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.msg}
        </div>
      )}

      {cropSrc && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50 }}>
          <CropModal
            src={cropSrc}
            onUpload={handleCropUpload}
            onSkip={handleSkipCrop}
            onCancel={() => {
              setCropSrc(null);
              setPendingFile(null);
              if (fileRef.current) fileRef.current.value = "";
            }}
            uploading={uploading}
            message={message}
          />
        </div>
      )}

      {editingPhoto && (
        <EditPhotoModal
          photo={editingPhoto}
          albums={albums}
          onSave={saveEdit}
          onReplaceImage={replacePhotoImage}
          onClose={() => setEditingPhoto(null)}
        />
      )}

      {selectedAlbum ? (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSelectedAlbum(null);
                setPhotos([]);
              }}
              className="text-xs uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors"
            >
              ← Albums
            </button>
            <span className="text-gray-200">/</span>
            <h2 className="text-xs uppercase tracking-widest text-gray-900">
              {selectedAlbum.title}
            </h2>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFiles(e.dataTransfer.files);
            }}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed p-6 text-center cursor-pointer transition-colors sm:p-10 ${
              dragOver
                ? "border-gray-900 bg-gray-100"
                : "border-gray-300 hover:border-gray-500"
            }`}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            {uploading ? (
              <p className="text-xs uppercase tracking-widest text-gray-400 animate-pulse">
                Uploading…
              </p>
            ) : (
              <>
                <p className="text-sm text-gray-500">Drag & drop images here</p>
                <p className="text-xs text-gray-400 mt-1">
                  or click to browse — JPG, PNG, WEBP
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Uploading into: <strong>{selectedAlbum.title}</strong>
                </p>
              </>
            )}
          </div>

          {message && !cropSrc && (
            <p
              className={`text-xs ${
                message.startsWith("✓") ? "text-green-600" : "text-red-500"
              }`}
            >
              {message}
            </p>
          )}

          {photos.length === 0 ? (
            <p className="text-sm text-gray-400">
              No photos in this album yet. Upload your first image above.
            </p>
          ) : (
            <>
              <p className="text-xs text-gray-400 uppercase tracking-widest">
                Drag to reorder · tap edit or delete
              </p>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={photos.map((photo) => photo.id)}
                  strategy={rectSortingStrategy}
                >
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {photos.map((photo) => (
                      <SortablePhoto
                        key={photo.id}
                        photo={photo}
                        onDelete={deletePhoto}
                        onEdit={setEditingPhoto}
                        onToggleVis={cycleVisibility}
                        albums={albums}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-widest text-gray-500">
              Portfolio Albums
            </h2>
            <button
              onClick={() => setShowNewAlbum((current) => !current)}
              className="text-xs uppercase tracking-widest border border-gray-300 px-3 py-1.5 hover:border-gray-900 transition-colors"
            >
              + New Portfolio
            </button>
          </div>

          {showNewAlbum && (
            <div className="border border-gray-200 p-4 space-y-3">
              <input
                type="text"
                placeholder="Album title"
                value={newAlbumTitle}
                onChange={(e) => setNewAlbumTitle(e.target.value)}
                className="w-full border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-900"
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={newAlbumDesc}
                onChange={(e) => setNewAlbumDesc(e.target.value)}
                className="w-full border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-900"
              />
              <div className="flex gap-2">
                <button
                  onClick={createPortfolio}
                  className="text-xs uppercase tracking-widest bg-gray-900 text-white px-4 py-2 hover:bg-gray-700 transition-colors"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowNewAlbum(false)}
                  className="text-xs uppercase tracking-widest border border-gray-200 px-4 py-2 hover:border-gray-900 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {albums.length === 0 && !showNewAlbum && (
            <p className="text-sm text-gray-400">
              No portfolio albums yet. Create one above.
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {albums.map((album) => (
              <div
                key={album.id}
                className={`relative group border bg-white transition-colors ${
                  album.visible === false
                    ? "border-gray-100 opacity-60"
                    : "border-gray-200 hover:border-gray-400"
                }`}
              >
                <div
                  onClick={() => setSelectedAlbum(album)}
                  className="aspect-video bg-white overflow-hidden cursor-pointer border-b border-gray-100"
                >
                  <PortfolioCardPreview title={album.title} />
                </div>
                {album.visible === false && (
                  <div className="absolute top-2 left-2 bg-black/60 text-white text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded">
                    Hidden
                  </div>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteAlbum(album);
                  }}
                  className="absolute top-2 right-2 bg-white border border-gray-200 text-xs w-8 h-8 flex items-center justify-center opacity-100 transition-opacity hover:bg-red-500 hover:text-white hover:border-red-500 z-10 sm:w-6 sm:h-6 sm:opacity-0 sm:group-hover:opacity-100"
                  aria-label={`Delete ${album.title}`}
                >
                  ✕
                </button>
                <div
                  className="p-3 cursor-pointer"
                  onClick={() => setSelectedAlbum(album)}
                >
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {album.title}
                  </p>
                  {album.description && (
                    <p className="text-xs text-gray-400 truncate">
                      {album.description}
                    </p>
                  )}
                </div>
                <div className="px-3 pb-3 flex flex-col gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingAlbum(album);
                      }}
                      className="text-[9px] uppercase tracking-widest border border-gray-200 text-gray-500 px-2 py-1 hover:bg-gray-50 transition-colors"
                    >
                      Edit
                    </button>
                    <DownloadZipButton album={album} />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        supabase
                          .from("albums")
                          .update({ visible: !(album.visible ?? true) })
                          .eq("id", album.id)
                          .then(() => loadAlbums());
                      }}
                      className="text-[9px] uppercase tracking-widest border border-gray-200 text-gray-500 px-2 py-1 hover:bg-gray-50 transition-colors"
                    >
                      {album.visible === false ? "Show" : "Hide"}
                    </button>
                  </div>
                  <CopyLinkButton
                    albumId={album.id}
                    visible={album.visible ?? true}
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setShowNewAlbum(true)}
              className="hidden md:flex border-2 border-dashed border-gray-300 hover:border-gray-500 aspect-video flex-col items-center justify-center cursor-pointer transition-colors text-gray-400 hover:text-gray-600"
              aria-label="Create portfolio album"
              title="New portfolio album"
            >
              <span className="text-2xl mb-1">+</span>
              <span className="text-xs uppercase tracking-widest">
                New Portfolio
              </span>
            </button>
          </div>
        </div>
      )}

      {editingAlbum && (
        <EditAlbumModal
          album={editingAlbum}
          onSave={saveAlbum}
          onClose={() => setEditingAlbum(null)}
        />
      )}

      {message && <p className="text-sm text-gray-500">{message}</p>}
    </div>
  );
}

// ─── About Admin ──────────────────────────────────────────────────────────────

function getAboutAdminErrorMessage(error: unknown) {
  const message = getErrorMessage(error);
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes("about_page") ||
    lowerMessage.includes("page_title") ||
    lowerMessage.includes("services_heading") ||
    lowerMessage.includes("clients_heading") ||
    lowerMessage.includes("contact_heading") ||
    lowerMessage.includes("about_styles")
  ) {
    return `Supabase needs the About page migration applied first. Details: ${message}`;
  }

  return message;
}

function RichTextEditor({
  label,
  value,
  onChange,
  minHeight = "min-h-24",
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  minHeight?: string;
  disabled: boolean;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [colourMenuOpen, setColourMenuOpen] = useState(false);
  const [selectedColour, setSelectedColour] = useState("#111827");
  const greyscaleColours = [
    "#000000",
    "#374151",
    "#6b7280",
    "#9ca3af",
    "#d1d5db",
    "#e5e7eb",
    "#f3f4f6",
    "#ffffff",
  ];
  const brightColours = [
    "#dc2626",
    "#f97316",
    "#facc15",
    "#22c55e",
    "#06b6d4",
    "#3b82f6",
    "#1d4ed8",
    "#9333ea",
    "#ec4899",
  ];
  const shadeRows = [
    [
      "#fee2e2",
      "#ffedd5",
      "#fef3c7",
      "#dcfce7",
      "#ccfbf1",
      "#dbeafe",
      "#ede9fe",
      "#fce7f3",
    ],
    [
      "#fecaca",
      "#fed7aa",
      "#fde68a",
      "#bbf7d0",
      "#99f6e4",
      "#bfdbfe",
      "#ddd6fe",
      "#fbcfe8",
    ],
    [
      "#f87171",
      "#fb923c",
      "#fbbf24",
      "#4ade80",
      "#2dd4bf",
      "#60a5fa",
      "#a78bfa",
      "#f472b6",
    ],
    [
      "#dc2626",
      "#ea580c",
      "#d97706",
      "#16a34a",
      "#0f766e",
      "#2563eb",
      "#7c3aed",
      "#db2777",
    ],
    [
      "#991b1b",
      "#9a3412",
      "#92400e",
      "#166534",
      "#134e4a",
      "#1e40af",
      "#5b21b6",
      "#9d174d",
    ],
  ];
  const themeColours = [
    "#111827",
    "#4b5563",
    "#f9fafb",
    "#f59e0b",
    "#111827",
    "#64748b",
    "#fb923c",
    "#0891b2",
    "#d9f99d",
  ];
  const customSlots = [
    "#ffffff",
    "#f9fafb",
    "#f3f4f6",
    "#e5e7eb",
    "#d1d5db",
    "#9ca3af",
    "#6b7280",
    "#374151",
    "#111827",
    "#000000",
  ];
  useEffect(() => {
    if (!editorRef.current) return;
    const nextValue = sanitizeRichText(value);
    if (editorRef.current.innerHTML !== nextValue) {
      editorRef.current.innerHTML = nextValue;
    }
  }, [value]);

  const emitChange = () => {
    if (!editorRef.current) return;
    onChange(sanitizeRichText(editorRef.current.innerHTML));
  };

  const selectionIsInsideEditor = () => {
    const selection = window.getSelection();
    const editor = editorRef.current;
    if (!selection || !editor || selection.rangeCount === 0) return false;
    return editor.contains(selection.getRangeAt(0).commonAncestorContainer);
  };

  const applyInlineStyle = (style: Partial<CSSStyleDeclaration>) => {
    const editor = editorRef.current;
    if (!editor || disabled) return;
    editor.focus();

    const selection = window.getSelection();
    if (
      !selection ||
      !selectionIsInsideEditor() ||
      selection.rangeCount === 0
    ) {
      const wrapper = document.createElement("span");
      Object.assign(wrapper.style, style);
      while (editor.firstChild) wrapper.appendChild(editor.firstChild);
      editor.appendChild(wrapper);
      emitChange();
      return;
    }

    const range = selection.getRangeAt(0);
    const span = document.createElement("span");
    Object.assign(span.style, style);
    span.appendChild(range.extractContents());
    range.insertNode(span);
    selection.removeAllRanges();
    const nextRange = document.createRange();
    nextRange.selectNodeContents(span);
    selection.addRange(nextRange);
    emitChange();
  };

  const applyColour = (colour: string) => {
    setSelectedColour(colour);
    applyInlineStyle({ color: colour });
    setColourMenuOpen(false);
  };

  const runCommand = (
    command:
      | "bold"
      | "italic"
      | "underline"
      | "justifyLeft"
      | "justifyCenter"
      | "justifyRight"
      | "removeFormat",
  ) => {
    if (disabled) return;
    editorRef.current?.focus();
    document.execCommand(command);
    emitChange();
  };

  return (
    <div className="mb-5">
      <span className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-2 border border-gray-200 border-b-0 bg-gray-50 p-2">
        <button
          type="button"
          onClick={() => runCommand("bold")}
          disabled={disabled}
          className="flex h-8 w-8 items-center justify-center border border-gray-200 bg-white text-gray-700 hover:border-gray-400 disabled:opacity-50"
          aria-label="Bold"
          title="Bold"
        >
          <Bold size={14} strokeWidth={2.4} />
        </button>
        <button
          type="button"
          onClick={() => runCommand("italic")}
          disabled={disabled}
          className="flex h-8 w-8 items-center justify-center border border-gray-200 bg-white text-gray-700 hover:border-gray-400 disabled:opacity-50"
          aria-label="Italic"
          title="Italic"
        >
          <Italic size={14} strokeWidth={2.4} />
        </button>
        <button
          type="button"
          onClick={() => runCommand("underline")}
          disabled={disabled}
          className="flex h-8 w-8 items-center justify-center border border-gray-200 bg-white text-gray-700 hover:border-gray-400 disabled:opacity-50"
          aria-label="Underline"
          title="Underline"
        >
          <Underline size={14} strokeWidth={2.4} />
        </button>
        <select
          onChange={(event) => {
            if (event.target.value) {
              applyInlineStyle({ fontSize: `${event.target.value}px` });
              event.target.value = "";
            }
          }}
          disabled={disabled}
          className="border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 outline-none focus:border-gray-900 disabled:opacity-50"
          defaultValue=""
        >
          <option value="" disabled>
            Size
          </option>
          <option value="12">12</option>
          <option value="14">14</option>
          <option value="16">16</option>
          <option value="18">18</option>
          <option value="22">22</option>
          <option value="28">28</option>
        </select>
        <select
          onChange={(event) => {
            if (event.target.value) {
              applyInlineStyle({ fontFamily: event.target.value });
              event.target.value = "";
            }
          }}
          disabled={disabled}
          className="border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 outline-none focus:border-gray-900 disabled:opacity-50"
          defaultValue=""
        >
          <option value="" disabled>
            Font
          </option>
          <option value="sans-serif">Clean Sans</option>
          <option value="serif">Editorial Serif</option>
          <option value="monospace">Mono</option>
        </select>
        <div className="relative">
          <button
            type="button"
            onClick={() => setColourMenuOpen((open) => !open)}
            disabled={disabled}
            className="flex h-8 w-8 flex-col items-center justify-center border border-gray-200 bg-white text-gray-700 hover:border-gray-400 disabled:opacity-50"
            aria-label="Text colour"
            title="Text colour"
          >
            <span className="text-sm font-semibold leading-none">A</span>
            <span
              className="mt-0.5 h-1 w-5"
              style={{ backgroundColor: selectedColour }}
            />
          </button>

          {colourMenuOpen && (
            <div className="absolute left-0 top-10 z-50 w-[300px] border border-gray-200 bg-white p-3 shadow-lg">
              <div className="mb-2 grid grid-cols-8 gap-1">
                {greyscaleColours.map((colour) => (
                  <button
                    key={colour}
                    type="button"
                    onClick={() => applyColour(colour)}
                    className="relative h-6 w-6 border border-gray-200"
                    style={{ backgroundColor: colour }}
                    aria-label={`Set text colour ${colour}`}
                    title={colour}
                  >
                    {selectedColour === colour && (
                      <Check
                        size={15}
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white drop-shadow"
                      />
                    )}
                  </button>
                ))}
              </div>

              <div className="mb-2 grid grid-cols-9 gap-1">
                {brightColours.map((colour) => (
                  <button
                    key={colour}
                    type="button"
                    onClick={() => applyColour(colour)}
                    className="relative h-6 w-6 border border-gray-200"
                    style={{ backgroundColor: colour }}
                    aria-label={`Set text colour ${colour}`}
                    title={colour}
                  >
                    {selectedColour === colour && (
                      <Check
                        size={15}
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white drop-shadow"
                      />
                    )}
                  </button>
                ))}
              </div>

              <div className="mb-3 flex flex-col gap-1">
                {shadeRows.map((row) => (
                  <div key={row.join("-")} className="grid grid-cols-8 gap-1">
                    {row.map((colour) => (
                      <button
                        key={colour}
                        type="button"
                        onClick={() => applyColour(colour)}
                        className="relative h-6 w-6 border border-gray-200"
                        style={{ backgroundColor: colour }}
                        aria-label={`Set text colour ${colour}`}
                        title={colour}
                      >
                        {selectedColour === colour && (
                          <Check
                            size={15}
                            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white drop-shadow"
                          />
                        )}
                      </button>
                    ))}
                  </div>
                ))}
              </div>

              <p className="mb-2 text-xs text-gray-500">Theme</p>
              <div className="mb-3 grid grid-cols-9 gap-1">
                {themeColours.map((colour, index) => (
                  <button
                    key={`${colour}-${index}`}
                    type="button"
                    onClick={() => applyColour(colour)}
                    className="relative h-6 w-6 border border-gray-200"
                    style={{ backgroundColor: colour }}
                    aria-label={`Set text colour ${colour}`}
                    title={colour}
                  >
                    {selectedColour === colour && (
                      <Check
                        size={15}
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white drop-shadow"
                      />
                    )}
                  </button>
                ))}
              </div>

              <label className="mb-3 flex cursor-pointer items-center justify-center border-t border-gray-100 pt-3 text-sm text-gray-600 hover:text-gray-900">
                Custom...
                <input
                  type="color"
                  onChange={(event) => applyColour(event.target.value)}
                  className="sr-only"
                  aria-label="Choose custom text colour"
                />
              </label>

              <div className="grid grid-cols-10 gap-1 border-t border-gray-100 pt-3">
                {customSlots.map((colour, index) => (
                  <button
                    key={`${colour}-${index}`}
                    type="button"
                    onClick={() => applyColour(colour)}
                    className="h-6 w-6 border border-gray-200"
                    style={{ backgroundColor: colour }}
                    aria-label={`Set text colour ${colour}`}
                    title={colour}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => runCommand("justifyLeft")}
          disabled={disabled}
          className="flex h-8 w-8 items-center justify-center border border-gray-200 bg-white text-gray-700 hover:border-gray-400 disabled:opacity-50"
          aria-label="Align left"
          title="Align left"
        >
          <AlignLeft size={15} strokeWidth={2.2} />
        </button>
        <button
          type="button"
          onClick={() => runCommand("justifyCenter")}
          disabled={disabled}
          className="flex h-8 w-8 items-center justify-center border border-gray-200 bg-white text-gray-700 hover:border-gray-400 disabled:opacity-50"
          aria-label="Align center"
          title="Align center"
        >
          <AlignCenter size={15} strokeWidth={2.2} />
        </button>
        <button
          type="button"
          onClick={() => runCommand("justifyRight")}
          disabled={disabled}
          className="flex h-8 w-8 items-center justify-center border border-gray-200 bg-white text-gray-700 hover:border-gray-400 disabled:opacity-50"
          aria-label="Align right"
          title="Align right"
        >
          <AlignRight size={15} strokeWidth={2.2} />
        </button>
        <button
          type="button"
          onClick={() => runCommand("removeFormat")}
          disabled={disabled}
          className="flex h-8 w-8 items-center justify-center border border-gray-200 bg-white text-gray-700 hover:border-gray-400 disabled:opacity-50"
          aria-label="Clear formatting"
          title="Clear formatting"
        >
          <Eraser size={14} strokeWidth={2.2} />
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable={!disabled}
        suppressContentEditableWarning
        onInput={emitChange}
        className={`w-full border border-gray-200 px-4 py-3 text-sm leading-relaxed outline-none focus:border-gray-900 ${minHeight}`}
      />
    </div>
  );
}

function AboutAdmin() {
  const [form, setForm] = useState<AboutContent>(defaultAboutContent);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    loadAboutContent()
      .then((content) => {
        if (!active) return;
        setForm(content);
      })
      .catch((error) => {
        if (!active) return;
        const messageText = getAboutAdminErrorMessage(error);
        setMessage(`Error loading about page: ${messageText}`);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      await saveAboutContent({
        ...form,
        id: "about",
        page_title:
          sanitizeRichText(form.page_title).trim() ||
          defaultAboutContent.page_title,
        intro: sanitizeRichText(form.intro).trim(),
        about_sections: form.about_sections
          .map((section) => ({
            id: section.id,
            heading: sanitizeRichText(section.heading).trim(),
            body: sanitizeRichText(section.body).trim(),
          }))
          .filter((section) => section.heading || section.body),
        contact_section: {
          id: "contact",
          heading:
            sanitizeRichText(form.contact_section.heading).trim() ||
            defaultAboutContent.contact_section.heading,
          body: sanitizeRichText(form.contact_section.body).trim(),
        },
        about_styles: form.about_styles,
      });
      setMessage("✓ About page saved");
    } catch (error) {
      const messageText = getAboutAdminErrorMessage(error);
      setMessage(`Error saving about page: ${messageText}`);
    } finally {
      setSaving(false);
    }
  };

  const updateSection = (
    sectionId: string,
    updates: Partial<{ heading: string; body: string }>,
  ) => {
    setForm((current) => ({
      ...current,
      about_sections: current.about_sections.map((section) =>
        section.id === sectionId ? { ...section, ...updates } : section,
      ),
    }));
  };

  const addSection = () => {
    setForm((current) => ({
      ...current,
      about_sections: [
        ...current.about_sections,
        {
          id: `section-${Date.now()}`,
          heading: "New heading",
          body: "<div>New body text</div>",
        },
      ],
    }));
  };

  const removeSection = (sectionId: string) => {
    setForm((current) => ({
      ...current,
      about_sections: current.about_sections.filter(
        (section) => section.id !== sectionId,
      ),
    }));
  };

  const updateContactSection = (
    updates: Partial<{ heading: string; body: string }>,
  ) => {
    setForm((current) => ({
      ...current,
      contact_section: {
        ...current.contact_section,
        ...updates,
      },
    }));
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-2">
          About Page
        </h2>
        <p className="text-xs text-gray-400">
          Edit the public title, headings, biography, lists, contact email, and
          text styling.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-200 p-4 sm:p-6"
      >
        <RichTextEditor
          label="Page Title"
          value={form.page_title}
          onChange={(pageTitle) =>
            setForm((current) => ({ ...current, page_title: pageTitle }))
          }
          minHeight="min-h-12"
          disabled={loading || saving}
        />

        <RichTextEditor
          label="Intro"
          value={form.intro}
          onChange={(intro) => setForm((current) => ({ ...current, intro }))}
          minHeight="min-h-40"
          disabled={loading || saving}
        />

        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-[10px] uppercase tracking-widest text-gray-400">
              Sections
            </p>
            <button
              type="button"
              onClick={addSection}
              disabled={loading || saving}
              className="border border-gray-200 px-3 py-2 text-[10px] uppercase tracking-widest text-gray-500 hover:border-gray-900 hover:text-gray-900 disabled:opacity-50"
            >
              Add Section
            </button>
          </div>

          <div className="flex flex-col gap-5">
            {form.about_sections.map((section, index) => (
              <div key={section.id} className="border border-gray-200 p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <p className="text-xs text-gray-500">Section {index + 1}</p>
                  <button
                    type="button"
                    onClick={() => removeSection(section.id)}
                    disabled={loading || saving}
                    className="text-[10px] uppercase tracking-widest text-gray-400 hover:text-red-500 disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>

                <RichTextEditor
                  label="Heading"
                  value={section.heading}
                  onChange={(heading) => updateSection(section.id, { heading })}
                  minHeight="min-h-12"
                  disabled={loading || saving}
                />

                <RichTextEditor
                  label="Body"
                  value={section.body}
                  onChange={(body) => updateSection(section.id, { body })}
                  minHeight="min-h-32"
                  disabled={loading || saving}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6 border border-gray-200 p-4">
          <p className="mb-4 text-xs text-gray-500">Contact Section</p>
          <RichTextEditor
            label="Heading"
            value={form.contact_section.heading}
            onChange={(heading) => updateContactSection({ heading })}
            minHeight="min-h-12"
            disabled={loading || saving}
          />

          <RichTextEditor
            label="Body"
            value={form.contact_section.body}
            onChange={(body) => updateContactSection({ body })}
            minHeight="min-h-24"
            disabled={loading || saving}
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={loading || saving}
            className="bg-gray-900 text-white text-xs uppercase tracking-widest px-5 py-3 hover:bg-gray-700 disabled:cursor-wait disabled:opacity-60"
          >
            {saving ? "Saving…" : loading ? "Loading…" : "Save About Page"}
          </button>
          {message && (
            <p
              className={`text-xs ${message.startsWith("✓") ? "text-green-600" : "text-red-500"}`}
            >
              {message}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}

// ─── Videos Admin ─────────────────────────────────────────────────────────────

// ─── Shop Admin ───────────────────────────────────────────────────────────────

function ShopAdmin() {
  const [items, setItems] = useState<ShopRow[]>([]);
  const [editingItem, setEditingItem] = useState<ShopRow | null>(null);
  const [form, setForm] = useState({
    title: "",
    price: "",
    stock: "",
    checkout_url: "",
    description: "",
  });
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 120, tolerance: 8 },
    }),
  );

  const load = async () => {
    const { data } = await supabase
      .from("shop_items")
      .select("*")
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });
    if (data) setItems(data);
  };

  useEffect(() => {
    load();
  }, []);

  const handleFileSelect = (file: File) => {
    setPendingFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const resetForm = () => {
    setEditingItem(null);
    setForm({
      title: "",
      price: "",
      stock: "",
      checkout_url: "",
      description: "",
    });
    setPendingFile(null);
    setPreview("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const startEdit = (item: ShopRow) => {
    setEditingItem(item);
    setForm({
      title: item.title,
      price: item.price,
      stock: item.stock ?? "",
      checkout_url: item.checkout_url ?? "",
      description: item.description ?? "",
    });
    setPendingFile(null);
    setPreview(item.image_url);
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingFile && !editingItem) {
      setMessage("Please select an image");
      return;
    }
    setUploading(true);
    setMessage("");
    try {
      let imageUrl = editingItem?.image_url ?? "";

      if (pendingFile) {
        const ext = pendingFile.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const upload = await uploadMedia({
          bucket: "Shop",
          folder: "shop",
          file: pendingFile,
          fileName,
          contentType: pendingFile.type,
          resourceType: "image",
        });
        imageUrl = upload.url;
      }

      const payload = {
        title: form.title,
        price: form.price,
        stock: form.stock,
        checkout_url: form.checkout_url.trim() || null,
        description: form.description.trim() || null,
        image_url: imageUrl,
      };

      const { error: dbError } = editingItem
        ? await supabase
            .from("shop_items")
            .update(payload)
            .eq("id", editingItem.id)
        : await supabase.from("shop_items").insert({
            ...payload,
            sort_order: items.length,
          });

      if (dbError) throw dbError;

      resetForm();
      setMessage(
        editingItem ? "✓ Item updated successfully" : "✓ Item added successfully",
      );
      load();
    } catch (err: unknown) {
      setMessage(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setUploading(false);
    }
  };

  const deleteItem = async (item: ShopRow) => {
    if (!confirm("Delete this item?")) return;
    const fileName = item.image_url.split("/").pop();
    if (fileName && !isCloudinaryUrl(item.image_url)) {
      await supabase.storage.from("Shop").remove([`shop/${fileName}`]);
    }
    await supabase.from("shop_items").delete().eq("id", item.id);
    load();
  };

  const saveShopOrder = async (reordered: ShopRow[]) => {
    const updates = await Promise.all(
      reordered.map((item, sortOrder) =>
        supabase
          .from("shop_items")
          .update({ sort_order: sortOrder })
          .eq("id", item.id),
      ),
    );
    const failed = updates.find((result) => result.error);
    if (failed?.error) throw failed.error;
  };

  const moveItem = async (itemId: string, direction: -1 | 1) => {
    const currentIndex = items.findIndex((item) => item.id === itemId);
    const nextIndex = currentIndex + direction;
    if (
      currentIndex === -1 ||
      nextIndex < 0 ||
      nextIndex >= items.length
    ) {
      return;
    }

    const reordered = arrayMove(items, currentIndex, nextIndex);
    setItems(reordered);
    try {
      await saveShopOrder(reordered);
      setMessage("✓ Shop order saved");
    } catch (err: unknown) {
      setMessage(`Error: ${err instanceof Error ? err.message : String(err)}`);
      load();
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);

    try {
      await saveShopOrder(reordered);
      setMessage("✓ Shop order saved");
    } catch (err: unknown) {
      setMessage(`Error: ${err instanceof Error ? err.message : String(err)}`);
      load();
    }
  };

  return (
    <div>
      <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-6">
        Shop Items
      </h2>

      {/* Add item form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-200 p-6 mb-8"
      >
        <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-4">
          {editingItem ? "Edit Item" : "Add New Item"}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input
            required
            type="text"
            placeholder="Title (e.g. 17th Boys Zine)"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-900"
          />
          <input
            required
            type="text"
            placeholder="Price (e.g. £18)"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-900"
          />
          <input
            type="text"
            placeholder="Stock info (e.g. Limited Edition)"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
            className="border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-900"
          />
          <input
            type="url"
            placeholder="Stripe payment link (optional)"
            value={form.checkout_url}
            onChange={(e) => setForm({ ...form, checkout_url: e.target.value })}
            className="border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-900"
          />
          <textarea
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="md:col-span-2 min-h-28 border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-900"
          />
        </div>

        {/* Image drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files[0])
              handleFileSelect(e.dataTransfer.files[0]);
          }}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed p-8 text-center cursor-pointer transition-colors mb-4 ${
            dragOver
              ? "border-gray-900 bg-gray-100"
              : "border-gray-300 hover:border-gray-500"
          }`}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) =>
              e.target.files?.[0] && handleFileSelect(e.target.files[0])
            }
          />
          {preview ? (
            <img
              src={preview}
              className="h-32 mx-auto object-cover"
              alt="preview"
            />
          ) : (
            <p className="text-xs text-gray-400">
              {editingItem
                ? "Drag & drop a new image or click to replace"
                : "Drag & drop product image or click to browse"}
            </p>
          )}
        </div>

        {message && (
          <p
            className={`text-xs mb-4 ${message.startsWith("✓") ? "text-green-600" : "text-red-500"}`}
          >
            {message}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={uploading}
            className="bg-gray-900 text-white text-xs uppercase tracking-widest px-6 py-3 hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {uploading ? "Saving…" : editingItem ? "Save Item" : "Add Item"}
          </button>
          {editingItem && (
            <button
              type="button"
              onClick={resetForm}
              className="border border-gray-200 text-gray-500 text-xs uppercase tracking-widest px-6 py-3 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Existing items */}
      {items.length > 0 && (
        <p className="mb-3 text-[11px] uppercase tracking-widest text-gray-400">
          Drag the handle or use arrows to rearrange
        </p>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((item) => item.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {items.map((item, index) => (
              <SortableShopItem
                key={item.id}
                item={item}
                onEdit={startEdit}
                onDelete={deleteItem}
                onMoveUp={() => moveItem(item.id, -1)}
                onMoveDown={() => moveItem(item.id, 1)}
                canMoveUp={index > 0}
                canMoveDown={index < items.length - 1}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {items.length === 0 && !uploading && (
        <p className="text-xs text-gray-400">No shop items yet.</p>
      )}
    </div>
  );
}

function SortableShopItem({
  item,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: {
  item: ShopRow;
  onEdit: (item: ShopRow) => void;
  onDelete: (item: ShopRow) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white border border-gray-200 group relative"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 z-10 flex h-9 w-9 cursor-grab touch-none items-center justify-center rounded bg-white/90 text-gray-600 shadow-sm select-none active:cursor-grabbing"
        aria-label={`Drag to reorder ${item.title}`}
        title="Drag to reorder"
      >
        <GripVertical size={17} aria-hidden="true" />
      </button>
      <div className="aspect-[3/4] overflow-hidden bg-gray-50">
        <img
          src={item.image_url}
          alt={item.title}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-3">
        <p className="text-sm font-medium text-gray-900 truncate">
          {item.title}
        </p>
        <p className="text-xs font-medium text-gray-900 tabular-nums">
          {formatShopPrice(item.price)}
        </p>
        {item.stock && (
          <p className="text-[11px] uppercase tracking-[0.14em] text-gray-400">
            {item.stock}
          </p>
        )}
      </div>
      <div className="absolute top-2 right-2 flex gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={!canMoveUp}
          className="flex h-8 w-8 items-center justify-center bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30"
          aria-label={`Move ${item.title} up`}
          title="Move up"
        >
          <ArrowUp size={14} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={!canMoveDown}
          className="flex h-8 w-8 items-center justify-center bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30"
          aria-label={`Move ${item.title} down`}
          title="Move down"
        >
          <ArrowDown size={14} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => onEdit(item)}
          className="bg-white border border-gray-200 text-[10px] uppercase tracking-widest px-2 py-1 hover:bg-gray-50"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(item)}
          className="bg-white border border-gray-200 text-xs px-2 py-1 hover:bg-red-500 hover:text-white hover:border-red-500"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
