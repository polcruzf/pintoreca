import { NextResponse } from "next/server";
import "dotenv/config";
import { auth, currentUser } from "@clerk/nextjs/server";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient,
  AvailabilityOption,
  BudgetType,
  ExperienceRange,
  ListingStatus,
} from "@prisma/client";
import { mkdir } from "fs/promises";
import path from "path";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL no está definida");
}

const pool = new Pool({
  connectionString,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SPAIN_PROVINCES = [
  "Álava",
  "Albacete",
  "Alicante",
  "Almería",
  "Asturias",
  "Ávila",
  "Badajoz",
  "Barcelona",
  "Burgos",
  "Cáceres",
  "Cádiz",
  "Cantabria",
  "Castellón",
  "Ciudad Real",
  "Córdoba",
  "Cuenca",
  "Girona",
  "Granada",
  "Guadalajara",
  "Gipuzkoa",
  "Huelva",
  "Huesca",
  "Illes Balears",
  "Jaén",
  "A Coruña",
  "La Rioja",
  "Las Palmas",
  "León",
  "Lleida",
  "Lugo",
  "Madrid",
  "Málaga",
  "Murcia",
  "Navarra",
  "Ourense",
  "Palencia",
  "Pontevedra",
  "Salamanca",
  "Santa Cruz de Tenerife",
  "Segovia",
  "Sevilla",
  "Soria",
  "Tarragona",
  "Teruel",
  "Toledo",
  "Valencia",
  "Valladolid",
  "Bizkaia",
  "Zamora",
  "Zaragoza",
  "Ceuta",
  "Melilla",
] as const;

const VALID_EXPERIENCE_RANGES = new Set<string>([
  "EXPERIENCE_0_3",
  "EXPERIENCE_3_5",
  "EXPERIENCE_5_10",
  "EXPERIENCE_10_20",
  "EXPERIENCE_20_PLUS",
]);

const VALID_AVAILABILITY_OPTIONS = new Set<string>([
  "MONDAY_TO_FRIDAY",
  "MONDAY_TO_SATURDAY",
  "MONDAY_TO_SUNDAY",
]);

const VALID_BUDGET_TYPES = new Set<string>(["FREE", "PAID"]);

type RouteContext = {
  params: Promise<{
    listingId: string;
  }>;
};

function parseStringArrayValue(value: FormDataEntryValue | null): string[] {
  if (typeof value !== "string" || !value.trim()) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(value);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.filter(
      (item): item is string => typeof item === "string" && item.trim().length > 0
    );
  } catch {
    return [];
  }
}

async function safeDeleteLocalFile(filePath: string): Promise<void> {
  if (!filePath || !filePath.startsWith("public/uploads/listings/")) {
    return;
  }

  try {
    const fs = await import("fs/promises");
    await fs.unlink(filePath);
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;

    if (nodeError.code !== "ENOENT") {
      console.error("No se pudo eliminar el archivo local:", filePath, error);
    }
  }
}

function getSubmissionIntent(formData: FormData): "draft" | "publish" {
  return formData.get("submissionIntent") === "publish" ? "publish" : "draft";
}

export async function PATCH(request: Request, context: RouteContext) {
  const newlyStoredFilePaths: string[] = [];

  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    const clerkUser = await currentUser();

    if (!clerkUser || !clerkUser.emailAddresses[0]?.emailAddress) {
      return NextResponse.json(
        { error: "No se pudo obtener el usuario de Clerk" },
        { status: 400 }
      );
    }

    const email = clerkUser.emailAddresses[0].emailAddress;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        professionalProfile: true,
      },
    });

    if (!user || user.role !== "PROFESSIONAL" || !user.professionalProfile) {
      return NextResponse.json(
        { error: "Solo los profesionales pueden editar anuncios" },
        { status: 403 }
      );
    }

    if (!user.professionalProfile.phone) {
      return NextResponse.json(
        { error: "Debes completar tu teléfono profesional antes de editar un anuncio" },
        { status: 400 }
      );
    }

    const { listingId } = await context.params;

    const listing = await prisma.listing.findFirst({
      where: {
        id: listingId,
        professionalProfileId: user.professionalProfile.id,
      },
      include: {
        images: {
          orderBy: {
            sortOrder: "asc",
          },
        },
      },
    });

    if (!listing) {
      return NextResponse.json(
        { error: "No se encontró el anuncio" },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const submissionIntent = getSubmissionIntent(formData);
    const targetStatus: ListingStatus =
      submissionIntent === "publish" ? "PUBLISHED" : "DRAFT";

    const rawDisplayName = String(formData.get("displayName") || "").trim();
    const rawDescription = String(formData.get("description") || "").trim();
    const rawCity = String(formData.get("city") || "").trim();
    const rawProvince = String(formData.get("province") || "").trim();
    const rawPostalCode = String(formData.get("postalCode") || "").trim();
    const rawServiceRadiusKm = Number(formData.get("serviceRadiusKm"));
    const rawPricePerM2 = Number(formData.get("pricePerM2"));
    const rawAvailability = String(formData.get("availability") || "");
    const rawBudgetType = String(formData.get("budgetType") || "");
    const rawYearsExperience = String(formData.get("yearsExperience") || "");
    const rawSelectedSpecialtyId = String(formData.get("selectedSpecialtyId") || "").trim();

    const keptExistingImageIds = parseStringArrayValue(
      formData.get("keptExistingImageIds")
    );
    const orderedImageKeys = parseStringArrayValue(formData.get("orderedImageKeys"));
    const newImageKeys = parseStringArrayValue(formData.get("newImageKeys"));
    const mainImageKeyRaw = formData.get("mainImageKey");
    const mainImageKey =
      typeof mainImageKeyRaw === "string" && mainImageKeyRaw.trim().length > 0
        ? mainImageKeyRaw
        : null;

    const newImages = formData
      .getAll("images")
      .filter((entry): entry is File => entry instanceof File);

    if (newImageKeys.length !== newImages.length) {
      return NextResponse.json(
        { error: "Las imágenes nuevas no coinciden con su orden final" },
        { status: 400 }
      );
    }

    const expectedOrderedImagesCount =
      keptExistingImageIds.length + newImageKeys.length;

    if (orderedImageKeys.length !== expectedOrderedImagesCount) {
      return NextResponse.json(
        { error: "El orden final de las imágenes no es válido" },
        { status: 400 }
      );
    }

    const keptExistingImageKeySet = new Set(
      keptExistingImageIds.map((imageId) => `existing:${imageId}`)
    );
    const newImageKeySet = new Set(newImageKeys);
    const allExpectedKeys = new Set([
      ...keptExistingImageKeySet,
      ...newImageKeySet,
    ]);

    const orderedKeysAreValid = orderedImageKeys.every((imageKey) =>
      allExpectedKeys.has(imageKey)
    );

    if (
      !orderedKeysAreValid ||
      new Set(orderedImageKeys).size !== orderedImageKeys.length
    ) {
      return NextResponse.json(
        { error: "La secuencia final de imágenes no es válida" },
        { status: 400 }
      );
    }

    if (mainImageKey && !allExpectedKeys.has(mainImageKey)) {
      return NextResponse.json(
        { error: "La imagen principal indicada no es válida" },
        { status: 400 }
      );
    }

    const keptExistingImages = listing.images.filter(
      (image: { id: string }) => keptExistingImageIds.includes(image.id)
    );

    if (keptExistingImages.length !== keptExistingImageIds.length) {
      return NextResponse.json(
        { error: "Una o varias imágenes actuales ya no existen" },
        { status: 400 }
      );
    }

    const removedExistingImages = listing.images.filter(
      (image: { id: string; filePath: string | null }) =>
        !keptExistingImageIds.includes(image.id)
    );

    const orderedImagePositionMap = new Map(
      orderedImageKeys.map((imageKey, index) => [imageKey, index])
    );

    const displayName =
      rawDisplayName ||
      (submissionIntent === "draft" ? listing.displayName || "Borrador" : "");
    const description =
      rawDescription ||
      (submissionIntent === "draft"
        ? listing.description || "Borrador pendiente de completar"
        : "");
    const city = rawCity || (submissionIntent === "draft" ? listing.city : "");
    const province = SPAIN_PROVINCES.includes(
      rawProvince as (typeof SPAIN_PROVINCES)[number]
    )
      ? rawProvince
      : submissionIntent === "draft"
      ? listing.province || "Barcelona"
      : rawProvince;
    const postalCode = /^\d{5}$/.test(rawPostalCode)
      ? rawPostalCode
      : submissionIntent === "draft"
      ? listing.postalCode || "00000"
      : rawPostalCode;
    const serviceRadiusKm =
      Number.isFinite(rawServiceRadiusKm) && rawServiceRadiusKm > 0
        ? rawServiceRadiusKm
        : submissionIntent === "draft"
        ? listing.serviceRadiusKm || 5
        : rawServiceRadiusKm;
    const availability = VALID_AVAILABILITY_OPTIONS.has(rawAvailability)
      ? (rawAvailability as AvailabilityOption)
      : (listing.availability as AvailabilityOption);
    const budgetType = VALID_BUDGET_TYPES.has(rawBudgetType)
      ? (rawBudgetType as BudgetType)
      : (listing.budgetType as BudgetType);
    const yearsExperience = VALID_EXPERIENCE_RANGES.has(rawYearsExperience)
      ? (rawYearsExperience as ExperienceRange)
      : (listing.yearsExperience as ExperienceRange);

    if (submissionIntent === "publish") {
      if (!displayName || displayName.length < 3) {
        return NextResponse.json(
          { error: "El nombre del anuncio debe tener al menos 3 caracteres" },
          { status: 400 }
        );
      }

      if (!description || description.length < 10) {
        return NextResponse.json(
          { error: "La descripción debe tener al menos 10 caracteres" },
          { status: 400 }
        );
      }

      if (!city || city.length < 3) {
        return NextResponse.json(
          { error: "La ciudad debe tener al menos 3 caracteres" },
          { status: 400 }
        );
      }

      if (!SPAIN_PROVINCES.includes(rawProvince as (typeof SPAIN_PROVINCES)[number])) {
        return NextResponse.json(
          { error: "La provincia no es válida" },
          { status: 400 }
        );
      }

      if (!/^\d{5}$/.test(rawPostalCode)) {
        return NextResponse.json(
          { error: "El código postal debe tener exactamente 5 dígitos" },
          { status: 400 }
        );
      }

      if (!Number.isFinite(rawServiceRadiusKm) || rawServiceRadiusKm <= 0) {
        return NextResponse.json(
          { error: "El radio de servicio debe ser mayor que 0" },
          { status: 400 }
        );
      }

      if (!rawSelectedSpecialtyId || !Number.isFinite(rawPricePerM2) || rawPricePerM2 <= 0) {
        return NextResponse.json(
          { error: "Debes seleccionar una especialidad y un precio válido" },
          { status: 400 }
        );
      }

      if (expectedOrderedImagesCount === 0) {
        return NextResponse.json(
          { error: "Debes añadir al menos 1 imagen" },
          { status: 400 }
        );
      }
    }

    if (expectedOrderedImagesCount > 8) {
      return NextResponse.json(
        { error: "No puedes tener más de 8 imágenes" },
        { status: 400 }
      );
    }

    for (const image of newImages) {
      if (!image.type.startsWith("image/")) {
        return NextResponse.json(
          { error: "Todos los archivos deben ser imágenes válidas" },
          { status: 400 }
        );
      }
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "listings");
    await mkdir(uploadsDir, { recursive: true });

    const preparedNewImages: Array<{
      key: string;
      fileUrl: string;
      filePath: string;
      sortOrder: number;
      isPrimary: boolean;
    }> = [];

    const fs = await import("fs/promises");

    const resolvedMainImageKey =
      mainImageKey || orderedImageKeys[0] || null;

    for (let index = 0; index < newImages.length; index += 1) {
      const file = newImages[index];
      const imageKey = newImageKeys[index];
      const sortOrder = orderedImagePositionMap.get(imageKey);

      if (sortOrder === undefined) {
        return NextResponse.json(
          { error: "No se pudo reconstruir el orden de las imágenes nuevas" },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const fileName = `${Date.now()}-${index}-${file.name}`;
      const filePath = path.join(uploadsDir, fileName);

      await fs.writeFile(filePath, buffer);
      newlyStoredFilePaths.push(filePath);

      preparedNewImages.push({
        key: imageKey,
        fileUrl: `/uploads/listings/${fileName}`,
        filePath,
        sortOrder,
        isPrimary: imageKey === resolvedMainImageKey,
      });
    }

    await prisma.$transaction(async (tx: any) => {
      await tx.listing.update({
        where: { id: listing.id },
        data: {
          displayName,
          description,
          city,
          province,
          postalCode,
          serviceRadiusKm,
          availability,
          budgetType,
          yearsExperience,
          status: targetStatus,
        },
      });

      await tx.listingSpecialty.deleteMany({
        where: { listingId: listing.id },
      });

      if (rawSelectedSpecialtyId && Number.isFinite(rawPricePerM2) && rawPricePerM2 > 0) {
        await tx.listingSpecialty.create({
          data: {
            listingId: listing.id,
            specialtyId: rawSelectedSpecialtyId,
            pricePerM2: rawPricePerM2,
          },
        });
      }

      if (removedExistingImages.length > 0) {
        await tx.listingImage.deleteMany({
          where: {
            id: {
              in: removedExistingImages.map((image: { id: string }) => image.id),
            },
          },
        });
      }

      for (const existingImage of keptExistingImages) {
        const imageKey = `existing:${existingImage.id}`;
        const sortOrder = orderedImagePositionMap.get(imageKey);

        if (sortOrder === undefined) {
          throw new Error("No se pudo reconstruir el orden de una imagen existente");
        }

        await tx.listingImage.update({
          where: { id: existingImage.id },
          data: {
            sortOrder,
            isPrimary: imageKey === resolvedMainImageKey,
          },
        });
      }

      for (const newImage of preparedNewImages) {
        await tx.listingImage.create({
          data: {
            listingId: listing.id,
            fileUrl: newImage.fileUrl,
            filePath: newImage.filePath,
            sortOrder: newImage.sortOrder,
            isPrimary: newImage.isPrimary,
          },
        });
      }
    });

    await Promise.all(
      removedExistingImages.map((image: { filePath: string | null }) =>
        image.filePath ? safeDeleteLocalFile(image.filePath) : Promise.resolve()
      )
    );

    return NextResponse.json({
      message:
        targetStatus === "PUBLISHED"
          ? "Anuncio publicado correctamente"
          : "Borrador guardado correctamente",
    });
  } catch (error) {
    console.error(error);

    await Promise.all(
      newlyStoredFilePaths.map((filePath) => safeDeleteLocalFile(filePath))
    );

    return NextResponse.json(
      { error: "Error al actualizar el anuncio" },
      { status: 500 }
    );
  }
}
