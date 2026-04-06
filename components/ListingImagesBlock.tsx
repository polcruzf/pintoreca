"use client";

import {
  type MouseEvent,
  type DragEvent,
  type ChangeEvent,
} from "react";

import type { ListingImagesBlockProps } from "@/types/listing-images";

const preventButtonDrag = (e: MouseEvent<HTMLButtonElement>) => {
  e.stopPropagation();
};

export default function ListingImagesBlock({
  images,
  imagePreviews,
  imagesTouched,
  imageMessages,
  imageMessageType,
  imagesOptimizing,
  mainImageIndex,
  draggedImageIndex,
  dragOverIndex,
  dragInsertPosition,
  draggedImageIndexRef,
  transparentDragImageRef,
  processIncomingImages,
  getFinalDropIndex,
  moveImage,
  moveImageLeft,
  moveImageRight,
  removeImage,
  setAsMainImage,
  resetDragState,
  setDraggedImageIndex,
  setDragOverIndex,
  setDragInsertPosition,
}: ListingImagesBlockProps) {
  const handleUploadAreaDragOver = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
  };

  const handleUploadAreaDrop = async (
    e: DragEvent<HTMLLabelElement>
  ) => {
    e.preventDefault();

    if (imagesOptimizing) return;

    await processIncomingImages(Array.from(e.dataTransfer.files || []));
  };

  const handleInputChange = async (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const input = e.target;
    await processIncomingImages(Array.from(input.files || []));
    input.value = "";
  };

  const handleImageDragStart = (
    e: DragEvent<HTMLDivElement>,
    index: number
  ) => {
    draggedImageIndexRef.current = index;
    setDraggedImageIndex(index);

    if (transparentDragImageRef.current) {
      e.dataTransfer.setDragImage(transparentDragImageRef.current, 0, 0);
    }

    e.dataTransfer.effectAllowed = "move";
  };

  const handleImageDragOver = (
    e: DragEvent<HTMLDivElement>,
    index: number
  ) => {
    e.preventDefault();

    const currentDraggedIndex = draggedImageIndexRef.current;
    if (currentDraggedIndex === null) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const middleX = rect.left + rect.width / 2;
    const position = e.clientX < middleX ? "before" : "after";

    setDragOverIndex(index);
    setDragInsertPosition(position);

    const targetIndex = position === "after" ? index + 1 : index;
    const finalTargetIndex = getFinalDropIndex(currentDraggedIndex, targetIndex);

    if (currentDraggedIndex === finalTargetIndex) return;

    const newIndex = moveImage(currentDraggedIndex, targetIndex);
    draggedImageIndexRef.current = newIndex;
    setDraggedImageIndex(newIndex);
  };

  const handleMoveToEndDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    const currentDraggedIndex = draggedImageIndexRef.current;
    if (currentDraggedIndex === null) return;

    setDragOverIndex(images.length);
    setDragInsertPosition("after");

    const finalTargetIndex = getFinalDropIndex(
      currentDraggedIndex,
      images.length
    );

    if (currentDraggedIndex === finalTargetIndex) return;

    const newIndex = moveImage(currentDraggedIndex, images.length);
    draggedImageIndexRef.current = newIndex;
    setDraggedImageIndex(newIndex);
  };

  return (
    <>
      {/* IMAGES BLOCK START */}
      <div className="listing-images-section">
        <div className="listing-images-upload-area">
          <label className="label">
            Imágenes del anuncio <span className="required">*</span>
          </label>

          <label
            onDragOver={handleUploadAreaDragOver}
            onDrop={handleUploadAreaDrop}
            className={`listing-image-dropzone${
              imagesOptimizing ? " is-disabled" : ""
            }`}
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
              Suelta aquí tus imágenes
            </p>

            <p className="listing-image-dropzone-text">
              O haz clic para seleccionarlas desde tu ordenador.
            </p>

            <p className="listing-image-dropzone-text">
              Puedes subir entre 1 y 8 imágenes. Puedes añadir más en varias
              tandas. Se optimizarán automáticamente antes del envío.
            </p>
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
            La imagen principal será la que se mostrará primero en los
            resultados. También puedes cambiar el orden con las flechas.
          </p>

          <p
            className={`listing-image-count${
              images.length >= 8 ? " is-limit" : ""
            }`}
          >
            {images.length} / 8 imágenes seleccionadas
          </p>

          {imagesTouched && images.length === 0 && (
            <p className="form-helper-error">
              Debes añadir al menos 1 imagen.
            </p>
          )}
        </div>

        <div className="listing-images-grid-area">
          {images.length > 0 && (
            <div className="listing-image-grid">
              {images.map((image, index) => (
                <div
                  key={index}
                  draggable
                  onDragStart={(e) => handleImageDragStart(e, index)}
                  onDragOver={(e) => handleImageDragOver(e, index)}
                  onDrop={resetDragState}
                  onDragEnd={resetDragState}
                  className={`listing-image-card${
                    draggedImageIndex === index ? " is-dragging" : ""
                  }${
                    dragOverIndex === index && dragInsertPosition === "before"
                      ? " is-drag-over-before"
                      : ""
                  }${
                    dragOverIndex === index && dragInsertPosition === "after"
                      ? " is-drag-over-after"
                      : ""
                  }`}
                >
                  <img
                    src={imagePreviews[index]}
                    alt={`preview-${index}`}
                    draggable={false}
                    className={`listing-image-preview${
                      index === mainImageIndex ? " is-main" : ""
                    }${
                      draggedImageIndex === index ? " is-dragging" : ""
                    }`}
                  />

                  {index === mainImageIndex && (
                    <div className="listing-image-badge-main">Principal</div>
                  )}

                  {index !== mainImageIndex && (
                    <button
                      type="button"
                      onMouseDown={preventButtonDrag}
                      onClick={() => {
                        setAsMainImage(index);
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
                      moveImageLeft(index);
                    }}
                    disabled={index === 0}
                    className="listing-image-action-button listing-image-move-left-button"
                  >
                    ←
                  </button>

                  <button
                    type="button"
                    onMouseDown={preventButtonDrag}
                    onClick={() => {
                      moveImageRight(index);
                    }}
                    disabled={index === images.length - 1}
                    className="listing-image-action-button listing-image-move-right-button"
                  >
                    →
                  </button>

                  <button
                    type="button"
                    onMouseDown={preventButtonDrag}
                    onClick={() => {
                      removeImage(index);
                    }}
                    className="listing-image-remove-button"
                  >
                    ×
                  </button>
                </div>
              ))}

              <div
                onDragOver={handleMoveToEndDragOver}
                onDrop={resetDragState}
                onDragEnd={resetDragState}
                className={`listing-image-move-end-dropzone${
                  dragOverIndex === images.length ? " is-active" : ""
                }`}
              >
                Suelta aquí para mover al final
              </div>
            </div>
          )}
        </div>
      </div>
      {/* IMAGES BLOCK END */}
    </>
  );
}