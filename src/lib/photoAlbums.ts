import { supabase } from "./supabase";

export interface PhotoAlbumLink {
  photo_id: string;
  album_id: string;
}

export interface PhotoWithAlbumIds {
  id: string;
  album_id: string | null;
  album_ids?: string[];
}

export function getPhotoAlbumIds(photo: PhotoWithAlbumIds) {
  const ids = photo.album_ids ?? [];
  if (photo.album_id && !ids.includes(photo.album_id)) return [photo.album_id, ...ids];
  return ids;
}

export function photoBelongsToAlbum(photo: PhotoWithAlbumIds, albumId: string) {
  return getPhotoAlbumIds(photo).includes(albumId);
}

export function mergePhotoAlbumIds<T extends PhotoWithAlbumIds>(
  photos: T[],
  links: PhotoAlbumLink[],
) {
  const linksByPhoto = new Map<string, string[]>();

  for (const link of links) {
    const ids = linksByPhoto.get(link.photo_id) ?? [];
    if (!ids.includes(link.album_id)) ids.push(link.album_id);
    linksByPhoto.set(link.photo_id, ids);
  }

  return photos.map((photo) => ({
    ...photo,
    album_ids: getPhotoAlbumIds({
      ...photo,
      album_ids: linksByPhoto.get(photo.id) ?? [],
    }),
  }));
}

export async function loadPhotoAlbumLinks() {
  const { data, error } = await supabase
    .from("photo_album_links")
    .select("photo_id, album_id");

  if (error) {
    console.warn("Could not load photo album links:", error.message);
    return [];
  }

  return data ?? [];
}

export async function savePhotoAlbumLinks(photoId: string, albumIds: string[]) {
  const uniqueAlbumIds = Array.from(new Set(albumIds.filter(Boolean)));

  const { error: deleteError } = await supabase
    .from("photo_album_links")
    .delete()
    .eq("photo_id", photoId);

  if (deleteError) throw deleteError;
  if (uniqueAlbumIds.length === 0) return;

  const { error: insertError } = await supabase.from("photo_album_links").insert(
    uniqueAlbumIds.map((albumId) => ({
      photo_id: photoId,
      album_id: albumId,
    })),
  );

  if (insertError) throw insertError;
}
