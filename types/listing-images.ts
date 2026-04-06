import type {
  Dispatch,
  SetStateAction,
  MutableRefObject,
} from "react";

export type DragInsertPosition = "before" | "after" | null;

export type ImageMessageType = "info" | "error";

export type ListingImagesBlockProps = Readonly<{
  images: File[];
  imagePreviews: string[];
  imagesTouched: boolean;
  imageMessages: string[];
  imageMessageType: ImageMessageType;
  imagesOptimizing: boolean;
  mainImageIndex: number;
  draggedImageIndex: number | null;
  dragOverIndex: number | null;
  dragInsertPosition: DragInsertPosition;
  draggedImageIndexRef: MutableRefObject<number | null>;
  transparentDragImageRef: MutableRefObject<HTMLImageElement | null>;
  processIncomingImages: (incomingFiles: File[]) => Promise<void>;
  getFinalDropIndex: (fromIndex: number, toIndex: number) => number;
  moveImage: (fromIndex: number, toIndex: number) => number;
  moveImageLeft: (indexToMove: number) => void;
  moveImageRight: (indexToMove: number) => void;
  removeImage: (indexToRemove: number) => void;
  setAsMainImage: (indexToSet: number) => void;
  resetDragState: () => void;
  setDraggedImageIndex: Dispatch<SetStateAction<number | null>>;
  setDragOverIndex: Dispatch<SetStateAction<number | null>>;
  setDragInsertPosition: Dispatch<SetStateAction<DragInsertPosition>>;
}>;