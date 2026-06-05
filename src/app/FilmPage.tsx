import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

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

export default function FilmPage() {
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVideos = async () => {
      const { data } = await supabase
        .from("videos")
        .select("*")
        .order("sort_order", { ascending: true });

      setVideos(data ?? []);
      setLoading(false);
    };

    loadVideos();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div className="px-6 pt-8 pb-4 border-b border-gray-100">
        <h1 className="text-[13px] uppercase tracking-widest text-gray-400 font-medium">
          Video
        </h1>
      </div>
      <div className="px-6 py-10 max-w-4xl">
        {loading && (
          <p className="text-[12px] uppercase tracking-widest text-gray-400">
            Loading videos…
          </p>
        )}

        {!loading && videos.length === 0 && (
          <p className="text-[13px] text-gray-400">No videos yet.</p>
        )}

        {videos.map((video) => (
          <VideoItem key={video.id} video={video} />
        ))}
      </div>
    </div>
  );
}

function VideoItem({ video }: { video: VideoRow }) {
  const youtubeId = getYouTubeId(video.url);

  return (
    <div className="mb-12">
      <div className="aspect-video w-full bg-black mb-4">
        {youtubeId ? (
          <iframe
            className="w-full h-full"
            src={`https://www.youtube.com/embed/${youtubeId}`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video
            className="w-full h-full object-contain"
            src={video.url}
            controls
            preload="metadata"
          />
        )}
      </div>
      <p className="text-[13px] text-gray-900 tracking-wide">{video.title}</p>
    </div>
  );
}
