import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AlbumRow { id: string; title: string; description: string; cover_url: string; sort_order: number; visible: boolean; album_type?: string; }
interface PhotoRow { id: string; url: string; caption: string; sort_order: number; album_id: string | null; visible: boolean; visibility: 'public' | 'portfolio_only' | 'hidden'; }

interface Lightbox {
  photos: PhotoRow[];
  index: number;
  albumTitle: string;
}

const publicAsset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;

const FALLBACK_IMAGES = [
	'/hwa-1.webp', '/hwa-2.webp', '/hwa-3.webp', '/hwa-4.webp', '/hwa-5.webp', '/hwa-6.webp',
	'/landing-pic-2.webp', '/PERSONAL/VicLentaigne_capetown_176 (1).jpg',
	'/PERSONAL/VicLentaigne_capetown_24 copy (1).jpg', '/PERSONAL/greg-viclentaigne (1).jpg',
	'/PERSONAL/immy vicy.jpg', '/PERSONAL/VicLentaigne-Tboys-Roll6 1024.jpg', '/PERSONAL/35-14-final03.jpg',
].map(publicAsset);

export default function PhotographyPage() {
	const [searchParams] = useSearchParams();
	const [albums, setAlbums] = useState<AlbumRow[]>([]);
	const [photos, setPhotos] = useState<PhotoRow[]>([]);
	const [useFallback, setUseFallback] = useState(false);
	const [lightbox, setLightbox] = useState<Lightbox | null>(null);
	const [direction, setDirection] = useState(0);
	const [erroredIds, setErroredIds] = useState<Set<string>>(new Set());

	const markErrored = (id: string) => setErroredIds(prev => new Set([...prev, id]));
	const sharedAlbumId = searchParams.get('ref') === 'shared' ? searchParams.get('album') : null;

	useEffect(() => {
		const load = async () => {
			try {
				const [{ data: albumData }, { data: photoData }] = await Promise.all([
					supabase.from('albums').select('*').order('sort_order', { ascending: true }),
					supabase.from('photos').select('*').order('sort_order', { ascending: true }),
				]);
				if (photoData && photoData.length > 0) {
					setAlbums(albumData ?? []);
					setPhotos(photoData);
				} else {
					setUseFallback(!sharedAlbumId);
				}
			} catch {
				setUseFallback(!sharedAlbumId);
			}
		};
		load();
	}, [sharedAlbumId]);

	const resolveVis = (p: PhotoRow) => p.visibility ?? (p.visible ? 'public' : 'hidden');

	const sharedAlbum = sharedAlbumId ? albums.find(a => a.id === sharedAlbumId) ?? null : null;
	const pageTitle = sharedAlbum?.album_type === 'portfolio' ? 'Portfolio' : 'Photography';

	// Public page: only visible gallery albums and public photos.
	// Shared link: only the requested visible album, including portfolio-only photos.
	const galleryAlbums = albums.filter(a => a.visible !== false && (a.album_type ?? 'gallery') === 'gallery');
	const publicPhotos = useFallback
		? FALLBACK_IMAGES.map((url, i) => ({ id: String(i), url, caption: '', sort_order: i, album_id: null, visible: true, visibility: 'public' as const }))
		: photos.filter(p => resolveVis(p) === 'public');
	const sharedPhotos = sharedAlbum && sharedAlbum.visible !== false
		? photos.filter(p => p.album_id === sharedAlbum.id && resolveVis(p) !== 'hidden')
		: [];

	// Group: per gallery album, then standalone
	const albumGroups: { album: AlbumRow | null; photos: PhotoRow[] }[] = [];
	if (sharedAlbumId) {
		albumGroups.push({ album: sharedAlbum, photos: sharedPhotos });
	} else if (!useFallback) {
		for (const album of galleryAlbums) {
			const grouped = publicPhotos.filter(p => p.album_id === album.id);
			if (grouped.length > 0) albumGroups.push({ album, photos: grouped });
		}
		const standalone = publicPhotos.filter(p => !p.album_id);
		if (standalone.length > 0) albumGroups.push({ album: null, photos: standalone });
	} else {
		albumGroups.push({ album: null, photos: publicPhotos });
	}

	const openLightbox = (groupPhotos: PhotoRow[], index: number, albumTitle: string) => {
		setDirection(0);
		setLightbox({ photos: groupPhotos, index, albumTitle });
	};

	const closeLightbox = () => setLightbox(null);

	const navigate = useCallback((dir: number) => {
		if (!lightbox) return;
		const next = lightbox.index + dir;
		if (next < 0 || next >= lightbox.photos.length) return;
		setDirection(dir);
		setLightbox(lb => lb ? { ...lb, index: next } : null);
	}, [lightbox]);

	// Keyboard nav
	useEffect(() => {
		if (!lightbox) return;
		const handler = (e: KeyboardEvent) => {
			if (e.key === 'ArrowRight') navigate(1);
			if (e.key === 'ArrowLeft') navigate(-1);
			if (e.key === 'Escape') closeLightbox();
		};
		window.addEventListener('keydown', handler);
		return () => window.removeEventListener('keydown', handler);
	}, [lightbox, navigate]);

	const variants = {
		enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
		center: { x: 0, opacity: 1 },
		exit: (dir: number) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
	};

	return (
		<div className="min-h-screen bg-white">
			{/* Header */}
			<div className="px-6 pt-6 pb-4 border-b border-gray-100">
				<h1 className="text-[13px] uppercase tracking-widest text-gray-400 font-medium">{pageTitle}</h1>
			</div>

			{/* Photo grid grouped by album */}
			<div className="max-w-[1280px] px-4 py-4 md:px-6 md:py-5">
				{albumGroups.map(({ album, photos: groupPhotos }) => (
					<div key={album?.id ?? 'standalone'} className="mb-8 last:mb-0">
						{album && (
							<div className="flex items-baseline gap-3 mb-4">
								<h2 className="text-[11px] uppercase tracking-widest text-gray-900 font-medium">{album.title}</h2>
								{album.description && <span className="text-[11px] text-gray-400">{album.description}</span>}
							</div>
						)}
						{(() => {
							const visible = groupPhotos.filter(p => !erroredIds.has(p.id) && p.url);

							return (
								<div className="grid grid-cols-1 gap-x-5 gap-y-16 sm:grid-cols-2">
									{visible.map((photo) => {
										const idx = visible.findIndex(p => p.id === photo.id);
										return (
											<div key={photo.id}
												className="cursor-pointer group"
												onClick={() => openLightbox(visible, idx, album?.title ?? (photo.caption || 'Photo'))}>
												<figure>
													<div className="flex min-h-[calc(100dvh-210px)] items-start justify-center bg-white">
														<img
															src={photo.url}
															alt={photo.caption}
															className="block max-h-[calc(100dvh-210px)] max-w-full object-contain group-hover:opacity-90 transition-opacity duration-300"
															onError={() => markErrored(photo.id)}
															onLoad={e => {
																const img = e.currentTarget;
																if (img.naturalWidth === 0 || img.naturalHeight === 0) {
																	markErrored(photo.id);
																}
															}}
														/>
													</div>
													{photo.caption && (
														<figcaption className="text-[10px] leading-4 text-gray-400 mt-1 truncate">{photo.caption}</figcaption>
													)}
												</figure>
											</div>
										);
									})}
								</div>
							);
						})()}
					</div>
				))}
			</div>

			{/* Lightbox */}
			<AnimatePresence>
				{lightbox && (
					<motion.div
						initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
						className="fixed inset-0 z-50 bg-black/95 flex flex-col"
						onClick={closeLightbox}
					>
						{/* Top bar */}
						<div className="flex items-center justify-between px-6 py-4 shrink-0" onClick={e => e.stopPropagation()}>
							<div>
								<p className="text-white text-[13px] tracking-wide font-medium">{lightbox.albumTitle}</p>
								<p className="text-white/40 text-[11px] tracking-widest mt-0.5">
									{lightbox.index + 1} / {lightbox.photos.length}
								</p>
							</div>
							<button onClick={closeLightbox} className="text-white/60 hover:text-white transition-colors p-1">
								<X size={22} />
							</button>
						</div>

						{/* Photo */}
						<div className="flex-1 relative overflow-hidden" onClick={e => e.stopPropagation()}>
							<AnimatePresence custom={direction} mode="wait">
								<motion.div
									key={lightbox.index}
									custom={direction}
									variants={variants}
									initial="enter" animate="center" exit="exit"
									transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
									className="absolute inset-0 flex items-center justify-center p-4"
								>
									<img
										src={lightbox.photos[lightbox.index].url}
										alt={lightbox.photos[lightbox.index].caption}
										className="max-w-full max-h-full object-contain select-none"
										draggable={false}
									/>
								</motion.div>
							</AnimatePresence>

							{/* Prev / Next */}
							<button
								onClick={() => navigate(-1)}
								disabled={lightbox.index === 0}
								className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition disabled:opacity-20 text-white"
							>
								<ChevronLeft size={20} />
							</button>
							<button
								onClick={() => navigate(1)}
								disabled={lightbox.index === lightbox.photos.length - 1}
								className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition disabled:opacity-20 text-white"
							>
								<ChevronRight size={20} />
							</button>
						</div>

						{/* Caption */}
						{lightbox.photos[lightbox.index].caption && (
							<div className="px-6 py-3 shrink-0 text-center" onClick={e => e.stopPropagation()}>
								<p className="text-white/60 text-[12px] tracking-wide">{lightbox.photos[lightbox.index].caption}</p>
							</div>
						)}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
