import type {
  Dispatch,
  MutableRefObject,
  SetStateAction,
} from "react";

export type DragInsertPosition = "before" | "after" | null;

export type ImageMessageType = "info" | "error";

export type ExistingUnifiedListingImage = Readonly<{
  key: string;
  kind: "existing";
  imageId: string;
  fileUrl: string;
  sortOrder: number;
  isMain: boolean;
}>;

export type NewUnifiedListingImage = Readonly<{
  key: string;
  kind: "new";
  file: File;
  previewUrl: string;
  isMain: boolean;
}>;

export type UnifiedListingImage =
  | ExistingUnifiedListingImage
  | NewUnifiedListingImage;

export type ListingImagesBlockProps = Readonly<{
  isEditMode: boolean;
  listingImages: UnifiedListingImage[];
  imagesTouched: boolean;
  imageMessages: string[];
  imageMessageType: ImageMessageType;
  imagesOptimizing: boolean;
  draggedImageIndex: number | null;
  dragOverIndex: number | null;
  dragInsertPosition: DragInsertPosition;
  draggedImageIndexRef: MutableRefObject<number | null>;
  transparentDragImageRef: MutableRefObject<HTMLImageElement | null>;
  processIncomingImages: (incomingFiles: File[]) => Promise<void>;
  getFinalDropIndex: (fromIndex: number, toIndex: number) => number;
  moveListingImage: (fromIndex: number, toIndex: number) => number;
  moveListingImageLeft: (indexToMove: number) => void;
  moveListingImageRight: (indexToMove: number) => void;
  removeListingImage: (imageKey: string) => void;
  setListingImageAsMain: (imageKey: string) => void;
  resetDragState: () => void;
  setDraggedImageIndex: Dispatch<SetStateAction<number | null>>;
  setDragOverIndex: Dispatch<SetStateAction<number | null>>;
  setDragInsertPosition: Dispatch<SetStateAction<DragInsertPosition>>;
}>;
