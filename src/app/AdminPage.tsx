import { useState, useEffect, useRef, useCallback } from "react";
import JSZip from "jszip";
import { supabase } from "../lib/supabase";
import {
  loadPhotoAlbumLinks,
  mergePhotoAlbumIds,
  photoBelongsToAlbum,
  savePhotoAlbumOrder,
  savePhotoAlbumLinks,
  sortPhotosForAlbum,
} from "../lib/photoAlbums";
import { isCloudinaryUrl, uploadMedia } from "../lib/mediaStorage";
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

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "photography" | "portfolio" | "videos" | "shop" | "storage";

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
  created_at: string;
}

interface ShopRow {
  id: string;
  title: string;
  price: string;
  stock: string;
  image_url: string;
  created_at: string;
}

interface MediaUsageSnapshot {
  source: "cloudinary";
  plan?: string;
  last_updated?: string;
  checked_at?: string;
  error?: string;
  credits?: {
    usage?: number;
    limit?: number;
    used_percent?: number;
  };
}

function formatCheckedAt(checkedAt?: string, fallbackDate?: string) {
  const value = checkedAt ?? fallbackDate;
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function MediaStorageUsagePanel() {
  const [snapshot, setSnapshot] = useState<MediaUsageSnapshot | null>(null);
  const [snapshotError, setSnapshotError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadUsage = useCallback(async (refreshLive = false) => {
    setLoading(true);
    setSnapshotError("");

    try {
      const usageUrl =
        refreshLive && import.meta.env.DEV
          ? "/api/media-usage/refresh"
          : `${import.meta.env.BASE_URL}media-usage.json`;
      const response = await fetch(
        usageUrl,
        {
          cache: "no-store",
        },
      );

      const data = (await response.json()) as MediaUsageSnapshot;
      if (!response.ok) {
        throw new Error(data.error || "No usage snapshot found");
      }
      setSnapshot(data);
    } catch (error: unknown) {
      setSnapshotError(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsage();
  }, [loadUsage]);

  const creditUsage = snapshot?.credits?.usage;
  const creditLimit = snapshot?.credits?.limit;
  const creditsLeft =
    typeof creditUsage === "number" && typeof creditLimit === "number"
      ? Math.max(creditLimit - creditUsage, 0)
      : null;
  const usedPercent = snapshot?.credits?.used_percent;
  const hasCredits =
    typeof creditUsage === "number" && typeof creditLimit === "number";
  const checkedAt = formatCheckedAt(
    snapshot?.checked_at,
    snapshot?.last_updated,
  );

  return (
    <section className="bg-white border border-gray-200 p-4 mb-6 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xs uppercase tracking-widest text-gray-900 font-medium">
            Media Storage
          </h2>
          <p className="mt-1 text-xs text-gray-400">
            Current media allowance for photos, videos, and shop images.
          </p>
        </div>
        <button
          onClick={() => loadUsage(true)}
          disabled={loading}
          className="self-start border border-gray-200 px-3 py-2 text-xs uppercase tracking-widest text-gray-500 hover:text-gray-900 hover:border-gray-300 disabled:cursor-wait disabled:opacity-60"
        >
          {loading ? "Checking…" : "Refresh"}
        </button>
      </div>

      <div className="mt-5 border border-gray-100 p-4">
        <p className="text-[10px] uppercase tracking-widest text-gray-400">
          Used / Limit
        </p>
        <p className="mt-2 text-2xl font-medium text-gray-900">
          {hasCredits
            ? `${creditUsage} / ${creditLimit} credits`
            : "Not available"}
        </p>
        <p className="mt-1 text-xs text-gray-400">
          {typeof usedPercent === "number" && creditsLeft !== null
            ? `${creditsLeft.toFixed(2)} credits left, ${usedPercent}% used`
            : snapshotError || "Usage limit unavailable"}
        </p>
      </div>

      {checkedAt && (
        <p className="mt-4 text-[11px] text-gray-400">
          Last checked {checkedAt}.
        </p>
      )}
    </section>
  );
}

// ─── Admin Page ───────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [session, setSession] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [tab, setTab] = useState<Tab>("photography");
  const [portfolioPageHref, setPortfolioPageHref] = useState<string | null>(null);
  const pageHref =
    tab === "photography"
      ? `${import.meta.env.BASE_URL}photography`
      : tab === "portfolio"
        ? portfolioPageHref
        : tab === "videos"
          ? `${import.meta.env.BASE_URL}film`
          : tab === "shop"
            ? `${import.meta.env.BASE_URL}shop`
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
        {(["photography", "portfolio", "videos", "shop", "storage"] as Tab[]).map((t) => (
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
            View {tab === "videos" ? "film" : tab === "portfolio" ? "portfolio" : tab} page
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
        src={photo.url}
        alt={photo.caption}
        onLoad={(e) =>
          setLandscape(
            e.currentTarget.naturalWidth > e.currentTarget.naturalHeight,
          )
        }
        className={`w-full object-cover ${landscape ? "aspect-video" : "aspect-[3/4]"}`}
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
              photo.home_featured ? "Remove from homepage" : "Feature on homepage"
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

function CropModal({
  src,
  onUpload,
  onSkip,
  onCancel,
  uploading,
  message,
}: {
  src: string;
  onUpload: (crop: Crop, aspectMode: AspectOption, caption: string) => void;
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
      <p className="text-white text-xs uppercase tracking-widest">Crop Image</p>
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
          className="text-xs uppercase tracking-widest border border-white/40 text-white px-5 py-2 hover:border-white disabled:opacity-50"
        >
          Upload as-is
        </button>
        <button
          onClick={() => crop && onUpload(crop, aspectMode, caption)}
          disabled={uploading || !crop}
          className="text-xs uppercase tracking-widest bg-white text-gray-900 px-5 py-2 hover:bg-gray-200 disabled:opacity-50"
        >
          {uploading ? "Uploading…" : "Apply Crop & Upload"}
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

  const visOptions: {
    value: "public" | "portfolio_only" | "hidden";
    label: string;
    desc: string;
  }[] = [
    { value: "public", label: "Public", desc: "Visible everywhere" },
    { value: "portfolio_only", label: "Portfolio only", desc: "Only via shared link" },
    { value: "hidden", label: "Hidden", desc: "Not shown anywhere" },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center overflow-y-auto p-4">
      <div className="my-4 bg-white w-full max-w-md max-h-[calc(100dvh-2rem)] flex min-h-0 flex-col overflow-hidden">
        {/* Sticky header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
          <h3 className="text-xs uppercase tracking-widest text-gray-400">Edit Photo</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 text-lg leading-none">×</button>
        </div>
        {/* Scrollable body */}
        <div className="min-h-0 overflow-y-auto px-5 pb-5 flex flex-col gap-4">
          <img src={photo.url} alt="" className="w-full max-h-48 object-contain bg-gray-50" />
          <input
            type="text"
            placeholder="Caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="w-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-900"
          />
          {/* Multi-select album checkboxes */}
          <div className="border border-gray-200 p-3">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">Albums</p>
            <div className="flex flex-col gap-2">
              {albums.map((a) => (
                <label key={a.id} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={albumIds.includes(a.id)}
                    onChange={() => toggleAlbum(a.id)}
                    className="w-4 h-4 accent-gray-900"
                  />
                  <div>
                    <p className="text-sm text-gray-900 leading-none">{a.title}</p>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 mt-0.5">
                      {a.album_type ?? "gallery"}
                    </p>
                  </div>
                </label>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-2">Leave all unchecked to keep this photo standalone.</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Visibility</p>
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
                  <div className="uppercase tracking-widest font-medium">{opt.label}</div>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5">
              {visOptions.find((o) => o.value === visibility)?.desc}
            </p>
          </div>
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setHomeFeatured((v) => !v)}
                className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${homeFeatured ? "bg-amber-400" : "bg-gray-200"}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${homeFeatured ? "translate-x-4" : "translate-x-0"}`} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-700 leading-none">Feature on homepage</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Shown in the rotating homepage grid</p>
              </div>
            </label>
          </div>
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setDisplaySingle((v) => !v)}
                className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${displaySingle ? "bg-gray-900" : "bg-gray-200"}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${displaySingle ? "translate-x-4" : "translate-x-0"}`} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-700 leading-none">Display as single</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Stops this portrait photo pairing with another portrait</p>
              </div>
            </label>
          </div>
          <div className="sticky bottom-0 -mx-5 mt-2 flex gap-3 border-t border-gray-100 bg-white px-5 py-4">
            <button
              onClick={() => onSave(photo.id, caption, albumIds, visibility, homeFeatured, displaySingle)}
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
  ) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(album.title);
  const [description, setDescription] = useState(album.description);
  const [albumType, setAlbumType] = useState<"gallery" | "portfolio">(
    album.album_type ?? "gallery",
  );

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
        <div className="flex gap-3">
          <button
            onClick={() => onSave(album.id, title, description, albumType)}
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
  const [state, setState] = useState<"idle" | "copied" | "warn">("idle");

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const basePath =
      import.meta.env.BASE_URL === "/" ? "/" : import.meta.env.BASE_URL;
    const url = new URL(`${basePath}photography`, window.location.origin);
    url.searchParams.set("album", albumId);
    url.searchParams.set("ref", "shared");
    navigator.clipboard.writeText(url.toString());
    setState(visible ? "copied" : "warn");
    setTimeout(() => setState("idle"), 3500);
  };

  return (
    <div className="relative flex flex-col items-start">
      <button
        onClick={handleClick}
        className={`text-[9px] uppercase tracking-widest bg-white border px-2 py-1 transition-colors ${
          state === "copied"
            ? "border-green-400 text-green-600"
            : state === "warn"
              ? "border-amber-400 text-amber-600"
              : "border-gray-200 text-gray-500 hover:bg-gray-50"
        }`}
      >
        {state === "idle" ? "Copy link" : "✓ Copied"}
      </button>
      {state === "warn" && (
        <div className="absolute bottom-full mb-1 left-0 bg-amber-50 border border-amber-300 text-amber-700 text-[9px] leading-snug px-2 py-1.5 w-[200px] shadow z-20">
          ⚠ Album is hidden — turn on visibility before sending or clients won't
          see any photos.
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
    supabase.from("photos").select("*").order("sort_order", { ascending: true }),
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
  const imgRef = useRef<HTMLImageElement>(null);
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
  }, []);
  useEffect(() => {
    if (selectedAlbum) loadPhotos(selectedAlbum.id);
  }, [selectedAlbum]);

  const handleFiles = (files: FileList | null) => {
    if (!files?.[0]) return;
    setPendingFile(files[0]);
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(files[0]);
  };

  const doUpload = async (fileOrBlob: File | Blob, caption: string) => {
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
        sort_order: currentPhotos.length,
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

  const getCroppedBlob = (crop: Crop): Promise<Blob> =>
    new Promise((resolve, reject) => {
      const img = imgRef.current;
      if (!img || !crop) return reject("No crop");
      const canvas = document.createElement("canvas");
      const scaleX = img.naturalWidth / img.width;
      const scaleY = img.naturalHeight / img.height;
      const pw = (crop.width / 100) * img.width * scaleX;
      const ph = (crop.height / 100) * img.height * scaleY;
      canvas.width = pw;
      canvas.height = ph;
      canvas
        .getContext("2d")!
        .drawImage(
          img,
          (crop.x / 100) * img.width * scaleX,
          (crop.y / 100) * img.height * scaleY,
          pw,
          ph,
          0,
          0,
          pw,
          ph,
        );
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject("Failed")),
        "image/jpeg",
        0.92,
      );
    });

  const handleCropUpload = async (
    crop: Crop,
    _aspect: AspectOption,
    caption: string,
  ) => {
    setUploading(true);
    setMessage("");
    try {
      const blob = await getCroppedBlob(crop);
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
  ) => {
    if (!title.trim()) {
      showToast("Album title is required");
      return;
    }
    const { error } = await supabase
      .from("albums")
      .update({ title, description, album_type: type })
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
          <img ref={imgRef} src={cropSrc} style={{ display: "none" }} alt="" />
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
                  {sectionAlbums.map((album) => (
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
                          <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-300 text-xs uppercase tracking-widest">
                            No cover
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
                  ))}

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
              <p className="text-xs text-gray-400 mb-3 uppercase tracking-widest">
                {view === "all"
                  ? "Library view · order photos inside albums and portfolios"
                  : "Drag the handle to reorder this album · tap edit or delete"}
              </p>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={currentPhotos.map((p) => p.id)}
                  strategy={rectSortingStrategy}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {currentPhotos.map((photo) => (
                      <SortablePhoto
                        key={photo.id}
                        photo={photo}
                        onDelete={deletePhoto}
                        onEdit={setEditingPhoto}
                        onToggleHome={toggleHomeFeatured}
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
  const imgRef = useRef<HTMLImageElement>(null);
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
      const messageText = error instanceof Error ? error.message : String(error);
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
    const basePath =
      import.meta.env.BASE_URL === "/" ? "/" : import.meta.env.BASE_URL;
    onViewPageHrefChange(
      selectedAlbum
        ? `${basePath}photography?ref=shared&album=${selectedAlbum.id}`
        : null,
    );
    return () => onViewPageHrefChange(null);
  }, [onViewPageHrefChange, selectedAlbum]);

  const handleFiles = (files: FileList | null) => {
    if (!files?.[0]) return;
    if (messageTimer.current) clearTimeout(messageTimer.current);
    setMessage("");
    setPendingFile(files[0]);
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(files[0]);
  };

  const uploadPortfolioPhoto = async (fileOrBlob: File | Blob, caption: string) => {
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
        sort_order: photos.length,
        album_id: selectedAlbum.id,
        visibility: "portfolio_only",
        visible: true,
      })
      .select("id")
      .single();
    if (error) throw error;
    if (data) await savePhotoAlbumLinks(data.id, [selectedAlbum.id]);
  };

  const getCroppedBlob = (crop: Crop): Promise<Blob> =>
    new Promise((resolve, reject) => {
      const img = imgRef.current;
      if (!img || !crop) return reject("No crop");
      const canvas = document.createElement("canvas");
      const scaleX = img.naturalWidth / img.width;
      const scaleY = img.naturalHeight / img.height;
      const pw = (crop.width / 100) * img.width * scaleX;
      const ph = (crop.height / 100) * img.height * scaleY;
      canvas.width = pw;
      canvas.height = ph;
      canvas
        .getContext("2d")!
        .drawImage(
          img,
          (crop.x / 100) * img.width * scaleX,
          (crop.y / 100) * img.height * scaleY,
          pw,
          ph,
          0,
          0,
          pw,
          ph,
        );
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject("Failed")),
        "image/jpeg",
        0.92,
      );
    });

  const handleCropUpload = async (
    crop: Crop,
    _aspect: AspectOption,
    caption: string,
  ) => {
    setUploading(true);
    setMessage("");
    try {
      const blob = await getCroppedBlob(crop);
      await uploadPortfolioPhoto(blob, caption);
      setTimedMessage("✓ Uploaded", "success");
      showToast("Photo uploaded", "success");
      setCropSrc(null);
      setPendingFile(null);
      if (fileRef.current) fileRef.current.value = "";
      if (selectedAlbum) loadPhotos(selectedAlbum.id);
    } catch (error) {
      const messageText = error instanceof Error ? error.message : String(error);
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
      const messageText = error instanceof Error ? error.message : String(error);
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
  ) => {
    const current = albums.find((album) => album.id === id);
    const { error } = await supabase
      .from("albums")
      .update({
        title,
        description,
        album_type: type,
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
      });
    }
  };

  const deleteAlbum = async (album: AlbumRow) => {
    if (!confirm(`Delete album "${album.title}"? Photos will stay in the library.`))
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
      const messageText = error instanceof Error ? error.message : String(error);
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
          <img ref={imgRef} src={cropSrc} style={{ display: "none" }} alt="" />
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

// ─── Videos Admin ─────────────────────────────────────────────────────────────

interface VideoRow {
  id: string;
  url: string;
  title: string;
  created_at: string;
}

function getYouTubeId(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) return parsed.pathname.slice(1);
    if (parsed.hostname.includes("youtube.com")) {
      if (parsed.pathname.startsWith("/shorts/"))
        return parsed.pathname.split("/")[2];
      if (parsed.pathname.startsWith("/embed/"))
        return parsed.pathname.split("/")[2];
      return parsed.searchParams.get("v");
    }
  } catch {
    return null;
  }
  return null;
}

function isYouTubeUrl(url: string) {
  return Boolean(getYouTubeId(url));
}

function VideosAdmin() {
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [editingVideo, setEditingVideo] = useState<VideoRow | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingUrl, setEditingUrl] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [message, setMessage] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      setMessage(`Error loading videos: ${error.message}`);
      return;
    }
    if (data) setVideos(data);
  };

  useEffect(() => {
    load();
  }, []);

  const uploadFile = async (file: File) => {
    setUploading(true);
    setMessage("");
    try {
      const ext = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const upload = await uploadMedia({
        bucket: "Videos",
        folder: "videos",
        file,
        fileName,
        contentType: file.type,
        resourceType: "video",
      });

      const { error: dbError } = await supabase.from("videos").insert({
        url: upload.url,
        title: title || file.name,
      });

      if (dbError) throw dbError;

      setTitle("");
      setMessage("✓ Uploaded successfully");
      if (fileRef.current) fileRef.current.value = "";
      load();
    } catch (err: unknown) {
      setMessage(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setUploading(false);
    }
  };

  const addYouTubeVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUrl = youtubeUrl.trim();
    if (!getYouTubeId(trimmedUrl)) {
      setMessage("Error: enter a valid YouTube URL");
      return;
    }

    const { error } = await supabase.from("videos").insert({
      url: trimmedUrl,
      title: title.trim() || "YouTube video",
    });

    if (error) {
      setMessage(`Error: ${error.message}`);
      return;
    }

    setTitle("");
    setYoutubeUrl("");
    setMessage("✓ YouTube video added");
    load();
  };

  const deleteVideo = async (video: VideoRow) => {
    if (!confirm("Delete this video?")) return;
    const fileName = !isYouTubeUrl(video.url)
      ? video.url.split("/").pop()
      : null;
    if (fileName && !isCloudinaryUrl(video.url)) {
      const { error: storageError } = await supabase.storage
        .from("Videos")
        .remove([fileName]);
      if (storageError)
        setMessage(
          `Warning: could not delete file from storage — ${storageError.message}`,
        );
    }
    const { error } = await supabase.from("videos").delete().eq("id", video.id);
    if (error) {
      setMessage(`Error deleting video: ${error.message}`);
      return;
    }
    setMessage("✓ Video deleted");
    load();
  };

  const startEditVideo = (video: VideoRow) => {
    setEditingVideo(video);
    setEditingTitle(video.title);
    setEditingUrl(video.url);
  };

  const saveVideoEdit = async () => {
    if (!editingVideo) return;
    const trimmedTitle = editingTitle.trim();
    const trimmedUrl = editingUrl.trim();
    if (!trimmedUrl) {
      setMessage("Error saving video: URL is required");
      return;
    }

    const { error } = await supabase
      .from("videos")
      .update({ title: trimmedTitle || editingVideo.title, url: trimmedUrl })
      .eq("id", editingVideo.id);

    if (error) {
      setMessage(`Error saving video: ${error.message}`);
      return;
    }

    setMessage("✓ Video updated");
    setEditingVideo(null);
    setEditingTitle("");
    setEditingUrl("");
    load();
  };

  return (
    <div>
      <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-6">
        Videos
      </h2>

      {/* Upload area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files[0]) uploadFile(e.dataTransfer.files[0]);
        }}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed p-6 text-center cursor-pointer transition-colors mb-4 sm:p-12 ${
          dragOver
            ? "border-gray-900 bg-gray-100"
            : "border-gray-300 hover:border-gray-500"
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])}
        />
        {uploading ? (
          <p className="text-xs uppercase tracking-widest text-gray-400 animate-pulse">
            Uploading… this may take a moment
          </p>
        ) : (
          <>
            <p className="text-sm text-gray-500">Drag & drop a video here</p>
            <p className="text-xs text-gray-400 mt-1">
              or click to browse — MP4, MOV, WEBM
            </p>
          </>
        )}
      </div>

      <input
        type="text"
        placeholder="Title (optional — defaults to filename)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-900 mb-4"
      />

      <form
        onSubmit={addYouTubeVideo}
        className="bg-white border border-gray-200 p-4 mb-6"
      >
        <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">
          Add YouTube video
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="url"
            placeholder="YouTube URL"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            className="min-w-0 flex-1 border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-900"
          />
          <button
            type="submit"
            className="bg-gray-900 text-white text-xs uppercase tracking-widest px-4 py-2 hover:bg-gray-700"
          >
            Add
          </button>
        </div>
      </form>

      {message && (
        <p
          className={`text-xs mb-6 ${message.startsWith("✓") ? "text-green-600" : "text-red-500"}`}
        >
          {message}
        </p>
      )}

      {editingVideo && (
        <div className="bg-white border border-gray-200 p-4 mb-6 max-w-md">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">
            Edit video
          </p>
          <input
            type="text"
            value={editingTitle}
            onChange={(e) => setEditingTitle(e.target.value)}
            className="w-full border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-900 mb-3"
            placeholder="Video title"
          />
          <input
            type="text"
            value={editingUrl}
            onChange={(e) => setEditingUrl(e.target.value)}
            className="w-full border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-900 mb-3"
            placeholder="Video file or YouTube URL"
          />
          <div className="flex gap-2">
            <button
              onClick={saveVideoEdit}
              className="bg-gray-900 text-white text-xs uppercase tracking-widest px-4 py-2 hover:bg-gray-700"
            >
              Save
            </button>
            <button
              onClick={() => {
                setEditingVideo(null);
                setEditingTitle("");
                setEditingUrl("");
              }}
              className="text-xs text-gray-400 hover:text-gray-900 px-3 py-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Existing videos */}
      <div className="flex flex-col gap-4 mt-6">
        {videos.map((video) => {
          const youtubeId = getYouTubeId(video.url);
          return (
            <div
              key={video.id}
              className="flex flex-col gap-3 bg-white border border-gray-200 p-4 sm:flex-row sm:items-center sm:gap-4"
            >
              {youtubeId ? (
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}`}
                  title={video.title}
                  className="w-full aspect-video bg-black sm:w-40 sm:h-24"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={video.url}
                  className="w-full aspect-video object-contain bg-black sm:w-40 sm:h-24"
                  controls
                  muted
                  preload="metadata"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {video.title}
                </p>
                <a
                  href={video.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-gray-400 hover:text-gray-700 truncate block"
                >
                  View file ↗
                </a>
              </div>
              <div className="flex gap-2 sm:justify-end">
                <button
                  onClick={() => startEditVideo(video)}
                  className="text-xs uppercase tracking-widest bg-gray-900 text-white px-3 py-1.5 hover:bg-gray-700 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteVideo(video)}
                  className="text-xs uppercase tracking-widest bg-white border border-gray-200 px-3 py-1.5 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {videos.length === 0 && !uploading && (
        <p className="text-xs text-gray-400 mt-4">
          No videos yet. Upload your first video above.
        </p>
      )}
    </div>
  );
}

// ─── Shop Admin ───────────────────────────────────────────────────────────────

function ShopAdmin() {
  const [items, setItems] = useState<ShopRow[]>([]);
  const [form, setForm] = useState({ title: "", price: "", stock: "" });
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const { data } = await supabase
      .from("shop_items")
      .select("*")
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingFile) {
      setMessage("Please select an image");
      return;
    }
    setUploading(true);
    setMessage("");
    try {
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

      const { error: dbError } = await supabase.from("shop_items").insert({
        title: form.title,
        price: form.price,
        stock: form.stock,
        image_url: upload.url,
      });

      if (dbError) throw dbError;

      setForm({ title: "", price: "", stock: "" });
      setPendingFile(null);
      setPreview("");
      setMessage("✓ Item added successfully");
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
      await supabase.storage.from("Shop").remove([fileName]);
    }
    await supabase.from("shop_items").delete().eq("id", item.id);
    load();
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
          Add New Item
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
            className="border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-900 md:col-span-2"
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
              Drag & drop product image or click to browse
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

        <button
          type="submit"
          disabled={uploading}
          className="bg-gray-900 text-white text-xs uppercase tracking-widest px-6 py-3 hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          {uploading ? "Uploading…" : "Add Item"}
        </button>
      </form>

      {/* Existing items */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-gray-200 group relative"
          >
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
              <p className="text-xs text-gray-500">
                {item.price} · {item.stock}
              </p>
            </div>
            <button
              onClick={() => deleteItem(item)}
              className="absolute top-2 right-2 bg-white border border-gray-200 text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white hover:border-red-500"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {items.length === 0 && !uploading && (
        <p className="text-xs text-gray-400">No shop items yet.</p>
      )}
    </div>
  );
}
