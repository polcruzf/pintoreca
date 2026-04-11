"use client";

import {
  type MouseEvent,
  type DragEvent,
  type ChangeEvent,
  useState,
} from "react";

import type {
  ListingImagesBlockProps,
  UnifiedListingImage,
} from "@/types/listing-images";

const preventButtonDrag = (e: MouseEvent<HTMLButtonElement>) => {
  e.stopPropagation();
};

function getImageDisplayUrl(image: UnifiedListingImage): string {
  return image.kind === "existing" ? image.fileUrl : image.previewUrl;
}

function isFileDragEvent(event: DragEvent<HTMLElement>): boolean {
  return Array.from(event.dataTransfer.types).includes("Files");
}

export default function ListingImagesBlock({
  isEditMode,
  listingImages,
  imagesTouched,
  imageMessages,
  imageMessageType,
  imagesOptimizing,
  draggedImageIndex,
  dragOverIndex,
  dragInsertPosition,
  draggedImageIndexRef,
  transparentDragImageRef,
  processIncomingImages,
  getFinalDropIndex,
  moveListingImage,
  moveListingImageLeft,
  moveListingImageRight,
  removeListingImage,
  setListingImageAsMain,
  resetDragState,
  setDraggedImageIndex,
  setDragOverIndex,
  setDragInsertPosition,
}: ListingImagesBlockProps) {
  const totalImagesCount = listingImages.length;
  const [isUploadAreaActive, setIsUploadAreaActive] = useState(false);

  const handleUploadAreaDragEnter = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();

    if (!isFileDragEvent(e) || imagesOptimizing) return;

    setIsUploadAreaActive(true);
  };

  const handleUploadAreaDragOver = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();

    if (!isFileDragEvent(e) || imagesOptimizing) return;

    setIsUploadAreaActive(true);
    e.dataTransfer.dropEffect = "copy";
  };

  const handleUploadAreaDragLeave = (e: DragEvent<HTMLLabelElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      setIsUploadAreaActive(false);
    }
  };

  const handleUploadAreaDrop = async (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsUploadAreaActive(false);

    if (imagesOptimizing) return;

    await processIncomingImages(Array.from(e.dataTransfer.files || []));
  };

  const handleInputChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    await processIncomingImages(Array.from(input.files || []));
    input.value = "";
  };

  const handleImageDragStart = (
    e: DragEvent<HTMLDivElement>,
    unifiedIndex: number
  ) => {
    draggedImageIndexRef.current = unifiedIndex;
    setDraggedImageIndex(unifiedIndex);
    setDragOverIndex(unifiedIndex);
    setDragInsertPosition(null);

    if (transparentDragImageRef.current) {
      e.dataTransfer.setDragImage(transparentDragImageRef.current, 0, 0);
    }

    e.dataTransfer.effectAllowed = "move";
  };

  const handleImageDragOver = (
    e: DragEvent<HTMLDivElement>,
    unifiedIndex: number
  ) => {
    e.preventDefault();

    const currentDraggedIndex = draggedImageIndexRef.current;
    if (currentDraggedIndex === null) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const middleX = rect.left + rect.width / 2;
    const position = e.clientX < middleX ? "before" : "after";

    setDragOverIndex(unifiedIndex);
    setDragInsertPosition(position);

    const targetIndex = position === "after" ? unifiedIndex + 1 : unifiedIndex;
    const finalTargetIndex = getFinalDropIndex(currentDraggedIndex, targetIndex);

    if (currentDraggedIndex === finalTargetIndex) return;

    const newIndex = moveListingImage(currentDraggedIndex, targetIndex);
    draggedImageIndexRef.current = newIndex;
    setDraggedImageIndex(newIndex);
  };

  const handleMoveToEndDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    const currentDraggedIndex = draggedImageIndexRef.current;
    if (currentDraggedIndex === null) return;

    setDragOverIndex(listingImages.length);
    setDragInsertPosition("after");

    const finalTargetIndex = getFinalDropIndex(
      currentDraggedIndex,
      listingImages.length
    );

    if (currentDraggedIndex === finalTargetIndex) return;

    const newIndex = moveListingImage(currentDraggedIndex, listingImages.length);
    draggedImageIndexRef.current = newIndex;
    setDraggedImageIndex(newIndex);
  };

  const handleMoveToEndDrop = () => {
    resetDragState();
  };

  const isDragging = draggedImageIndex !== null;

  return (
    <>
      <div className="listing-images-section">
        <div className="listing-images-upload-area">
          <label className="label">
            Imágenes del anuncio <span className="required">*</span>
          </label>

          <label
            onDragEnter={handleUploadAreaDragEnter}
            onDragOver={handleUploadAreaDragOver}
            onDragLeave={handleUploadAreaDragLeave}
            onDrop={handleUploadAreaDrop}
            className={`listing-image-dropzone${
              imagesOptimizing ? " is-disabled" : ""
            }${isUploadAreaActive ? " is-active" : ""}`}
          >
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={imagesOptimizing}
              onChange={handleInputChange}
              className="listing-image-input-hidden"
            />

            <p className="listing-image-dropzone-title">
              {isUploadAreaActive ? "Suelta las imágenes para añadirlas" : "Suelta aquí tus imágenes"}
            </p>

            <p className="listing-image-dropzone-text">
              O haz clic para seleccionarlas desde tu ordenador.
            </p>

            <p className="listing-image-dropzone-text">
              Puedes subir entre 1 y 8 imágenes. Puedes añadir más en varias
              tandas. Se optimizarán automáticamente antes del envío.
            </p>

            {isEditMode && totalImagesCount > 0 && (
              <p className="listing-image-dropzone-text">
                Ahora ya puedes arrastrar y mezclar libremente imágenes actuales
                y nuevas dentro de una sola secuencia.
              </p>
            )}
          </label>

          {imagesOptimizing && (
            <p className="form-helper-info">
              Optimizando imágenes... espera un momento.
            </p>
          )}

          {imageMessages.length > 0 && (
            <div className="form-messages-group">
              {imageMessages.map((message, index) => (
                <p
                  key={index}
                  className={
                    imageMessageType === "error"
                      ? "form-helper-error"
                      : "form-helper-info"
                  }
                >
                  {message}
                </p>
              ))}
            </div>
          )}
        </div>

        <div className="listing-images-meta">
          <p className="listing-image-order-help is-highlighted">
            Ahora todas las imágenes comparten una única secuencia real. Puedes
            reordenar imágenes actuales y nuevas con el mismo drag &amp; drop,
            además de seguir usando las flechas laterales si lo prefieres.
          </p>

          <p
            className={`listing-image-count${
              totalImagesCount >= 8 ? " is-limit" : ""
            }`}
          >
            {totalImagesCount} / 8 imágenes seleccionadas
          </p>

          {imagesTouched && totalImagesCount === 0 && (
            <p className="form-helper-error">
              Debes añadir al menos 1 imagen.
            </p>
          )}
        </div>

        <div className="listing-images-grid-area">
          {totalImagesCount > 0 && (
            <>
              <p className="listing-image-order-help">
                Orden final del anuncio
              </p>

              {isDragging && (
                <div className="listing-image-drag-status">
                  Estás reordenando la secuencia. Suelta la imagen sobre otra
                  tarjeta o en la zona final para moverla al último lugar.
                </div>
              )}

              <div className={`listing-image-grid${isDragging ? " is-dragging-grid" : ""}`}>
                {listingImages.map((image, unifiedIndex) => {
                  const isDraggedCard = draggedImageIndex === unifiedIndex;
                  const isBeforeTarget =
                    dragOverIndex === unifiedIndex &&
                    dragInsertPosition === "before";
                  const isAfterTarget =
                    dragOverIndex === unifiedIndex &&
                    dragInsertPosition === "after";

                  return (
                    <div
                      key={image.key}
                      draggable
                      onDragStart={(e) => handleImageDragStart(e, unifiedIndex)}
                      onDragOver={(e) => handleImageDragOver(e, unifiedIndex)}
                      onDrop={resetDragState}
                      onDragEnd={resetDragState}
                      className={`listing-image-card${
                        isDraggedCard ? " is-dragging" : ""
                      }${isBeforeTarget ? " is-drag-over-before" : ""}${
                        isAfterTarget ? " is-drag-over-after" : ""
                      }`}
                    >
                      <div className="listing-image-card-top-badges">
                        <div className="listing-image-drag-handle-badge">
                          Arrastrar
                        </div>

                        {isEditMode && (
                          <div
                            className={`listing-image-source-badge${
                              image.kind === "existing"
                                ? " is-existing"
                                : " is-new"
                            }`}
                          >
                            {image.kind === "existing" ? "Actual" : "Nueva"}
                          </div>
                        )}
                      </div>

                      <img
                        src={getImageDisplayUrl(image)}
                        alt={`preview-${unifiedIndex}`}
                        draggable={false}
                        className={`listing-image-preview${
                          image.isMain ? " is-main" : ""
                        }${isDraggedCard ? " is-dragging" : ""}`}
                      />

                      {image.isMain && (
                        <div className="listing-image-badge-main">Principal</div>
                      )}

                      {!image.isMain && (
                        <button
                          type="button"
                          onMouseDown={preventButtonDrag}
                          onClick={() => {
                            setListingImageAsMain(image.key);
                          }}
                          className="listing-image-action-button listing-image-make-main-button"
                        >
                          Hacer principal
                        </button>
                      )}

                      <button
                        type="button"
                        onMouseDown={preventButtonDrag}
                        onClick={() => {
                          moveListingImageLeft(unifiedIndex);
                        }}
                        disabled={unifiedIndex === 0}
                        className="listing-image-action-button listing-image-move-left-button"
                      >
                        ←
                      </button>

                      <button
                        type="button"
                        onMouseDown={preventButtonDrag}
                        onClick={() => {
                          moveListingImageRight(unifiedIndex);
                        }}
                        disabled={unifiedIndex === totalImagesCount - 1}
                        className="listing-image-action-button listing-image-move-right-button"
                      >
                        →
                      </button>

                      <button
                        type="button"
                        onMouseDown={preventButtonDrag}
                        onClick={() => {
                          removeListingImage(image.key);
                        }}
                        className="listing-image-remove-button"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}

                <div
                  onDragOver={handleMoveToEndDragOver}
                  onDrop={handleMoveToEndDrop}
                  onDragEnd={resetDragState}
                  className={`listing-image-move-end-dropzone${
                    dragOverIndex === listingImages.length ? " is-active" : ""
                  }`}
                >
                  {dragOverIndex === listingImages.length
                    ? "Suelta para colocar la imagen al final"
                    : "Suelta aquí para mover al final"}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
