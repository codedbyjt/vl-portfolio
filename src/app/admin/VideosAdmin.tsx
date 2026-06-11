import { useEffect, useRef, useState } from "react";
import { isCloudinaryUrl, uploadMedia } from "../../lib/mediaStorage";
import { supabase } from "../../lib/supabase";

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
