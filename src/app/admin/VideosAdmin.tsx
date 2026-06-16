import { useEffect, useRef, useState } from "react";
import {
  closestCenter,
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, ArrowUp, GripVertical } from "lucide-react";
import { deleteMedia, uploadMedia } from "../../lib/mediaStorage";
import { supabase } from "../../lib/supabase";

interface VideoRow {
  id: string;
  url: string;
  title: string;
  created_at: string;
  sort_order?: number | null;
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

export function VideosAdmin() {
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
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 120, tolerance: 8 },
    }),
  );

  const load = async () => {
    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .order("sort_order", { ascending: true, nullsFirst: false })
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
        sort_order: videos.length,
      });

      if (dbError) {
        await deleteMedia({ bucket: "Videos", url: upload.url });
        throw dbError;
      }

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
      sort_order: videos.length,
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

  const saveVideoOrder = async (reordered: VideoRow[]) => {
    const updates = await Promise.all(
      reordered.map((video, sortOrder) =>
        supabase
          .from("videos")
          .update({ sort_order: sortOrder })
          .eq("id", video.id),
      ),
    );
    const failed = updates.find((result) => result.error);
    if (failed?.error) throw failed.error;
  };

  const moveVideo = async (videoId: string, direction: -1 | 1) => {
    const currentIndex = videos.findIndex((video) => video.id === videoId);
    const nextIndex = currentIndex + direction;
    if (currentIndex === -1 || nextIndex < 0 || nextIndex >= videos.length) {
      return;
    }

    const reordered = arrayMove(videos, currentIndex, nextIndex);
    setVideos(reordered);
    try {
      await saveVideoOrder(reordered);
      setMessage("✓ Video order saved");
    } catch (err: unknown) {
      setMessage(`Error: ${err instanceof Error ? err.message : String(err)}`);
      load();
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = videos.findIndex((video) => video.id === active.id);
    const newIndex = videos.findIndex((video) => video.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(videos, oldIndex, newIndex);
    setVideos(reordered);

    try {
      await saveVideoOrder(reordered);
      setMessage("✓ Video order saved");
    } catch (err: unknown) {
      setMessage(`Error: ${err instanceof Error ? err.message : String(err)}`);
      load();
    }
  };

  const deleteVideo = async (video: VideoRow) => {
    if (!confirm("Delete this video?")) return;
    const { error } = await supabase.from("videos").delete().eq("id", video.id);
    if (error) {
      setMessage(`Error deleting video: ${error.message}`);
      return;
    }

    if (!isYouTubeUrl(video.url)) {
      const cleanup = await deleteMedia({ bucket: "Videos", url: video.url });
      if (cleanup.warning) {
        setMessage(`✓ Video removed from site. ${cleanup.warning}`);
        load();
        return;
      }
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

      {videos.length > 0 && (
        <p className="mb-3 mt-6 text-[11px] uppercase tracking-widest text-gray-400">
          Drag the handle or use arrows to rearrange
        </p>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={videos.map((video) => video.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-4">
            {videos.map((video, index) => (
              <SortableVideoTile
                key={video.id}
                video={video}
                onEdit={startEditVideo}
                onDelete={deleteVideo}
                onMoveUp={() => moveVideo(video.id, -1)}
                onMoveDown={() => moveVideo(video.id, 1)}
                canMoveUp={index > 0}
                canMoveDown={index < videos.length - 1}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {videos.length === 0 && !uploading && (
        <p className="text-xs text-gray-400 mt-4">
          No videos yet. Upload your first video above.
        </p>
      )}
    </div>
  );
}

function SortableVideoTile({
  video,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: {
  video: VideoRow;
  onEdit: (video: VideoRow) => void;
  onDelete: (video: VideoRow) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const youtubeId = getYouTubeId(video.url);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: video.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative flex flex-col gap-3 bg-white border border-gray-200 p-4 pl-14 sm:flex-row sm:items-center sm:gap-4"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="absolute left-3 top-4 flex h-9 w-9 cursor-grab touch-none items-center justify-center rounded bg-white text-gray-600 shadow-sm ring-1 ring-gray-200 select-none active:cursor-grabbing"
        aria-label={`Drag to reorder ${video.title}`}
        title="Drag to reorder"
      >
        <GripVertical size={17} aria-hidden="true" />
      </button>

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
      <div className="flex flex-wrap gap-2 sm:justify-end">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={!canMoveUp}
          className="flex h-8 w-8 items-center justify-center bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30"
          aria-label={`Move ${video.title} up`}
          title="Move up"
        >
          <ArrowUp size={14} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={!canMoveDown}
          className="flex h-8 w-8 items-center justify-center bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30"
          aria-label={`Move ${video.title} down`}
          title="Move down"
        >
          <ArrowDown size={14} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => onEdit(video)}
          className="text-xs uppercase tracking-widest bg-gray-900 text-white px-3 py-1.5 hover:bg-gray-700 transition-colors"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(video)}
          className="text-xs uppercase tracking-widest bg-white border border-gray-200 px-3 py-1.5 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
