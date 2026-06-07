import { supabase } from "./supabase";

export interface PhotoAlbumLink {
  photo_id: string;
  album_id: string;
  sort_order?: number | null;
}

export interface PhotoWithAlbumIds {
  id: string;
  album_id: string | null;
  sort_order?: number;
  album_ids?: string[];
  album_sort_orders?: Record<string, number>;
}

export function getPhotoAlbumIds(photo: PhotoWithAlbumIds) {
  const ids = photo.album_ids ?? [];
  if (photo.album_id && !ids.includes(photo.album_id)) return [photo.album_id, ...ids];
  return ids;
}

export function photoBelongsToAlbum(photo: PhotoWithAlbumIds, albumId: string) {
  return getPhotoAlbumIds(photo).includes(albumId);
}

export function getPhotoAlbumSortOrder(
  photo: PhotoWithAlbumIds,
  albumId: string,
) {
  return photo.album_sort_orders?.[albumId] ?? photo.sort_order ?? 0;
}

export function sortPhotosForAlbum<T extends PhotoWithAlbumIds>(
  photos: T[],
  albumId: string,
) {
  return [...photos].sort((a, b) => {
    const orderDiff =
      getPhotoAlbumSortOrder(a, albumId) - getPhotoAlbumSortOrder(b, albumId);
    if (orderDiff !== 0) return orderDiff;
    return a.id.localeCompare(b.id);
  });
}

export function mergePhotoAlbumIds<T extends PhotoWithAlbumIds>(
  photos: T[],
  links: PhotoAlbumLink[],
) {
  const linksByPhoto = new Map<string, string[]>();
  const ordersByPhoto = new Map<string, Record<string, number>>();

  for (const link of links) {
    const ids = linksByPhoto.get(link.photo_id) ?? [];
    if (!ids.includes(link.album_id)) ids.push(link.album_id);
    linksByPhoto.set(link.photo_id, ids);

    if (typeof link.sort_order === "number") {
      const orders = ordersByPhoto.get(link.photo_id) ?? {};
      orders[link.album_id] = link.sort_order;
      ordersByPhoto.set(link.photo_id, orders);
    }
  }

  return photos.map((photo) => ({
    ...photo,
    album_ids: getPhotoAlbumIds({
      ...photo,
      album_ids: linksByPhoto.get(photo.id) ?? [],
    }),
    album_sort_orders: ordersByPhoto.get(photo.id) ?? {},
  }));
}

export async function loadPhotoAlbumLinks() {
  const { data, error } = await supabase
    .from("photo_album_links")
    .select("*");

  if (error) {
    console.warn("Could not load photo album links:", error.message);
    return [];
  }

  return data ?? [];
}

export async function savePhotoAlbumLinks(photoId: string, albumIds: string[]) {
  const uniqueAlbumIds = Array.from(new Set(albumIds.filter(Boolean)));
  const existingLinks = await loadPhotoAlbumLinks();
  const existingForPhoto = existingLinks.filter(
    (link) => link.photo_id === photoId,
  );
  const nextOrderByAlbum = new Map<string, number>();

  for (const link of existingLinks) {
    const currentMax = nextOrderByAlbum.get(link.album_id) ?? -1;
    nextOrderByAlbum.set(
      link.album_id,
      Math.max(currentMax, link.sort_order ?? currentMax),
    );
  }

  const { error: deleteError } = await supabase
    .from("photo_album_links")
    .delete()
    .eq("photo_id", photoId);

  if (deleteError) throw deleteError;
  if (uniqueAlbumIds.length === 0) return;

  const { error: insertError } = await supabase.from("photo_album_links").insert(
    uniqueAlbumIds.map((albumId) => {
      const existingOrder = existingForPhoto.find(
        (link) => link.album_id === albumId,
      )?.sort_order;
      const nextOrder = (nextOrderByAlbum.get(albumId) ?? -1) + 1;
      if (existingOrder === undefined || existingOrder === null) {
        nextOrderByAlbum.set(albumId, nextOrder);
      }

      return {
        photo_id: photoId,
        album_id: albumId,
        sort_order: existingOrder ?? nextOrder,
      };
    }),
  );

  if (insertError) throw insertError;
}

export async function savePhotoAlbumOrder(
  albumId: string,
  photoIds: string[],
) {
  const updates = await Promise.all(
    photoIds.map(async (photoId, sortOrder) => {
      const updateResult = await supabase
        .from("photo_album_links")
        .update({ sort_order: sortOrder })
        .eq("album_id", albumId)
        .eq("photo_id", photoId)
        .select("photo_id");

      if (updateResult.error || updateResult.data.length > 0) {
        return updateResult;
      }

      return supabase.from("photo_album_links").insert({
        photo_id: photoId,
        album_id: albumId,
        sort_order: sortOrder,
      });
    }),
  );

  const failed = updates.find((result) => result.error);
  if (failed?.error) throw failed.error;
}
