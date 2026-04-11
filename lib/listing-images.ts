import type { ExistingListingImageData } from "@/types/listing-form";
import type {
  ExistingUnifiedListingImage,
  NewUnifiedListingImage,
  UnifiedListingImage,
} from "@/types/listing-images";

export function createExistingUnifiedListingImages(
  existingImages: ExistingListingImageData[]
): UnifiedListingImage[] {
  return existingImages.map((image) => ({
    key: `existing:${image.id}`,
    kind: "existing",
    imageId: image.id,
    fileUrl: image.fileUrl,
    sortOrder: image.sortOrder,
    isMain: image.isPrimary,
  } satisfies ExistingUnifiedListingImage));
}

export function createNewUnifiedListingImages(files: File[]): UnifiedListingImage[] {
  return files.map((file) => ({
    key: `new:${crypto.randomUUID()}`,
    kind: "new",
    file,
    previewUrl: URL.createObjectURL(file),
    isMain: false,
  } satisfies NewUnifiedListingImage));
}

export function getMainImageKey(listingImages: UnifiedListingImage[]): string | null {
  return listingImages.find((image) => image.isMain)?.key || null;
}

export function getMainImageIndex(listingImages: UnifiedListingImage[]): number {
  const mainImageIndex = listingImages.findIndex((image) => image.isMain);
  return mainImageIndex >= 0 ? mainImageIndex : 0;
}

export function ensureSingleMainImage(
  listingImages: UnifiedListingImage[]
): UnifiedListingImage[] {
  if (listingImages.length === 0) {
    return [];
  }

  const hasMainImage = listingImages.some((image) => image.isMain);

  if (!hasMainImage) {
    return listingImages.map((image, index) => ({
      ...image,
      isMain: index === 0,
    }));
  }

  let mainAlreadyAssigned = false;

  return listingImages.map((image) => {
    if (!image.isMain) {
      return image;
    }

    if (!mainAlreadyAssigned) {
      mainAlreadyAssigned = true;
      return image;
    }

    return {
      ...image,
      isMain: false,
    };
  });
}

export function setMainListingImageByKey(
  listingImages: UnifiedListingImage[],
  imageKey: string
): UnifiedListingImage[] {
  return listingImages.map((image) => ({
    ...image,
    isMain: image.key === imageKey,
  }));
}

export function removeListingImageByKey(
  listingImages: UnifiedListingImage[],
  imageKey: string
): UnifiedListingImage[] {
  const nextImages = listingImages.filter((image) => image.key !== imageKey);
  return ensureSingleMainImage(nextImages);
}

export function getFinalDropIndex(fromIndex: number, toIndex: number): number {
  let finalToIndex = toIndex;

  if (fromIndex < toIndex) {
    finalToIndex = toIndex - 1;
  }

  return finalToIndex;
}

export function moveListingImagesArray(
  listingImages: UnifiedListingImage[],
  fromIndex: number,
  toIndex: number
): { updatedImages: UnifiedListingImage[]; finalToIndex: number } {
  if (fromIndex < 0 || toIndex < 0) {
    return {
      updatedImages: listingImages,
      finalToIndex: fromIndex,
    };
  }

  if (fromIndex >= listingImages.length || toIndex > listingImages.length) {
    return {
      updatedImages: listingImages,
      finalToIndex: fromIndex,
    };
  }

  const finalToIndex = getFinalDropIndex(fromIndex, toIndex);

  if (fromIndex == finalToIndex) {
    return {
      updatedImages: listingImages,
      finalToIndex,
    };
  }

  const updatedImages = [...listingImages];
  const [movedImage] = updatedImages.splice(fromIndex, 1);
  updatedImages.splice(finalToIndex, 0, movedImage);

  return {
    updatedImages,
    finalToIndex,
  };
}

export function getKeptExistingImageIds(listingImages: UnifiedListingImage[]): string[] {
  return listingImages
    .filter((image): image is ExistingUnifiedListingImage => image.kind === "existing")
    .map((image) => image.imageId);
}

export function getNewImageFiles(listingImages: UnifiedListingImage[]): File[] {
  return listingImages
    .filter((image): image is NewUnifiedListingImage => image.kind === "new")
    .map((image) => image.file);
}

export function getNewImageNames(listingImages: UnifiedListingImage[]): string[] {
  return getNewImageFiles(listingImages).map((file) => file.name);
}

export function getNewImageKeys(listingImages: UnifiedListingImage[]): string[] {
  return listingImages
    .filter((image): image is NewUnifiedListingImage => image.kind === "new")
    .map((image) => image.key);
}

export function getOrderedImageKeys(listingImages: UnifiedListingImage[]): string[] {
  return listingImages.map((image) => image.key);
}

export function revokeNewListingImageObjectUrls(
  listingImages: UnifiedListingImage[]
): void {
  listingImages.forEach((image) => {
    if (image.kind === "new") {
      URL.revokeObjectURL(image.previewUrl);
    }
  });
}
