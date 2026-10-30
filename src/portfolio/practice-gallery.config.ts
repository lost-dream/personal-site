import catalog from "./practice-gallery-photos.json";
import type { Photo } from "./content";

export const practiceGalleryMotion = {
  dwellMs: 1500,
  opacity: 0.94,
  featherPx: 5,
} as const;

export const practiceGalleryGroups = catalog.map((group) => {
  const photos: Photo[] = group.photos.map((photo, index) => ({
    id: `practice-gallery-${photo.id}`,
    title: `${group.title} ${String(index + 1).padStart(2, "0")}`,
    alt: `${group.title}相册，第 ${index + 1} 张照片`,
    src: `${import.meta.env.BASE_URL}media/practice-gallery/${photo.file}`,
    thumbnail: `${import.meta.env.BASE_URL}media/practice-gallery/${photo.thumbnail}`,
    width: photo.width,
    height: photo.height,
  }));
  return {
    id: group.id,
    title: group.title,
    photos,
    // The wall uses small derivatives; the viewer always opens the larger file.
    wallPhotos: photos.map((photo) => ({ ...photo, src: photo.thumbnail })),
  };
});
