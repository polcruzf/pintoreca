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
import { mkdir, writeFile } from "fs/promises";
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

type ListingSpecialtyInput = {
  specialtyId: string;
  pricePerM2: number;
};

function getTrimmedString(formData: FormData, fieldName: string): string {
  const value = formData.get(fieldName);
  return typeof value === "string" ? value.trim() : "";
}

function getStringValue(formData: FormData, fieldName: string): string {
  const value = formData.get(fieldName);
  return typeof value === "string" ? value : "";
}

function toSlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseSpecialties(value: FormDataEntryValue | null): ListingSpecialtyInput[] {
  if (typeof value !== "string" || !value.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => {
        const specialtyId =
          typeof item?.specialtyId === "string" ? item.specialtyId.trim() : "";
        const pricePerM2 = Number(item?.pricePerM2);

        if (!specialtyId || !Number.isFinite(pricePerM2) || pricePerM2 <= 0) {
          return null;
        }

        return {
          specialtyId,
          pricePerM2,
        } satisfies ListingSpecialtyInput;
      })
      .filter((item): item is ListingSpecialtyInput => item !== null);
  } catch {
    return [];
  }
}

function getSubmissionIntent(formData: FormData): "draft" | "publish" {
  return getStringValue(formData, "submissionIntent") === "publish"
    ? "publish"
    : "draft";
}

export async function POST(request: Request) {
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

    const dbUser = await prisma.user.findUnique({
      where: { email },
      include: {
        professionalProfile: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "Usuario no encontrado en la base de datos" },
        { status: 404 }
      );
    }

    if (dbUser.role !== "PROFESSIONAL") {
      return NextResponse.json(
        { error: "Solo los profesionales pueden crear anuncios" },
        { status: 403 }
      );
    }

    if (!dbUser.professionalProfile) {
      return NextResponse.json(
        { error: "El usuario no tiene perfil profesional" },
        { status: 404 }
      );
    }

    if (!dbUser.professionalProfile.phone) {
      return NextResponse.json(
        { error: "Debes completar tu teléfono profesional antes de crear un anuncio" },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const submissionIntent = getSubmissionIntent(formData);
    const targetStatus: ListingStatus =
      submissionIntent === "publish" ? "PUBLISHED" : "DRAFT";

    const rawDisplayName = getTrimmedString(formData, "displayName");
    const rawDescription = getTrimmedString(formData, "description");
    const rawYearsExperience = getStringValue(formData, "yearsExperience");
    const rawAvailability = getStringValue(formData, "availability");
    const rawBudgetType = getStringValue(formData, "budgetType");
    const rawPostalCode = getTrimmedString(formData, "postalCode");
    const rawCity = getTrimmedString(formData, "city");
    const rawProvince = getTrimmedString(formData, "province");
    const rawCitySlug = getTrimmedString(formData, "citySlug");
    const rawProvinceSlug = getTrimmedString(formData, "provinceSlug");
    const rawServiceRadiusKm = Number(formData.get("serviceRadiusKm"));
    const rawLatitude = Number(formData.get("latitude"));
    const rawLongitude = Number(formData.get("longitude"));
    const selectedSpecialtyId = getTrimmedString(formData, "specialtyId");
    const rawPricePerM2 = Number(formData.get("pricePerM2"));
    const rawMainImageIndex = Number(formData.get("mainImageIndex"));

    const specialtiesFromPayload = parseSpecialties(formData.get("specialties"));
    const specialties: ListingSpecialtyInput[] =
      specialtiesFromPayload.length > 0
        ? specialtiesFromPayload
        : selectedSpecialtyId && Number.isFinite(rawPricePerM2) && rawPricePerM2 > 0
        ? [
            {
              specialtyId: selectedSpecialtyId,
              pricePerM2: rawPricePerM2,
            },
          ]
        : [];

    const images = formData
      .getAll("images")
      .filter((entry): entry is File => entry instanceof File);

    const displayName =
      rawDisplayName ||
      (submissionIntent === "draft"
        ? `Borrador ${new Date().toLocaleDateString("es-ES")}`
        : "");
    const description =
      rawDescription ||
      (submissionIntent === "draft"
        ? "Borrador pendiente de completar"
        : "");
    const yearsExperience = VALID_EXPERIENCE_RANGES.has(rawYearsExperience)
      ? (rawYearsExperience as ExperienceRange)
      : ExperienceRange.EXPERIENCE_10_20;
    const availability = VALID_AVAILABILITY_OPTIONS.has(rawAvailability)
      ? (rawAvailability as AvailabilityOption)
      : AvailabilityOption.MONDAY_TO_FRIDAY;
    const budgetType = VALID_BUDGET_TYPES.has(rawBudgetType)
      ? (rawBudgetType as BudgetType)
      : BudgetType.FREE;
    const city = rawCity || "Pendiente";
    const province = SPAIN_PROVINCES.includes(
      rawProvince as (typeof SPAIN_PROVINCES)[number]
    )
      ? rawProvince
      : "Barcelona";
    const postalCode = /^\d{5}$/.test(rawPostalCode) ? rawPostalCode : "00000";
    const citySlug = rawCitySlug || toSlug(city) || `draft-${Date.now()}`;
    const provinceSlug = rawProvinceSlug || toSlug(province) || "barcelona";
    const latitude = Number.isFinite(rawLatitude) ? rawLatitude : 41.3851;
    const longitude = Number.isFinite(rawLongitude) ? rawLongitude : 2.1734;
    const serviceRadiusKm =
      Number.isFinite(rawServiceRadiusKm) && rawServiceRadiusKm > 0
        ? rawServiceRadiusKm
        : 5;
    const mainImageIndex =
      images.length > 0 &&
      Number.isInteger(rawMainImageIndex) &&
      rawMainImageIndex >= 0 &&
      rawMainImageIndex < images.length
        ? rawMainImageIndex
        : 0;

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

      if (!rawCity || rawCity.length < 3) {
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

      if (specialties.length === 0) {
        return NextResponse.json(
          { error: "Debes seleccionar al menos una especialidad" },
          { status: 400 }
        );
      }

      if (images.length === 0) {
        return NextResponse.json(
          { error: "Debes añadir al menos 1 imagen" },
          { status: 400 }
        );
      }
    }

    if (images.length > 8) {
      return NextResponse.json(
        { error: "No puedes subir más de 8 imágenes" },
        { status: 400 }
      );
    }

    for (const image of images) {
      if (!image.type.startsWith("image/")) {
        return NextResponse.json(
          { error: "Todos los archivos deben ser imágenes válidas" },
          { status: 400 }
        );
      }
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "listings");
    await mkdir(uploadsDir, { recursive: true });

    const savedImages = await Promise.all(
      images.map(async (image, index) => {
        const bytes = await image.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const originalName = image.name || `image-${index}.jpg`;
        const safeName = originalName.replace(/\s+/g, "-");
        const fileName = `${Date.now()}-${index}-${safeName}`;
        const absoluteFilePath = path.join(uploadsDir, fileName);
        const publicFileUrl = `/uploads/listings/${fileName}`;

        await writeFile(absoluteFilePath, buffer);
        newlyStoredFilePaths.push(absoluteFilePath);

        return {
          fileUrl: publicFileUrl,
          filePath: absoluteFilePath,
          sortOrder: index,
          isPrimary: index === mainImageIndex,
        };
      })
    );

    const listing = await prisma.listing.create({
      data: {
        professionalProfileId: dbUser.professionalProfile.id,
        slug: `${toSlug(displayName || city) || "listing"}-${Date.now()}`,
        displayName,
        description,
        yearsExperience,
        availability,
        budgetType,
        status: targetStatus,
        city,
        citySlug,
        province,
        provinceSlug,
        postalCode,
        latitude,
        longitude,
        serviceRadiusKm,
        specialties:
          specialties.length > 0
            ? {
                create: specialties.map((specialty) => ({
                  specialtyId: specialty.specialtyId,
                  pricePerM2: specialty.pricePerM2,
                })),
              }
            : undefined,
        images:
          savedImages.length > 0
            ? {
                create: savedImages,
              }
            : undefined,
      },
    });

    return NextResponse.json(
      {
        message:
          targetStatus === "PUBLISHED"
            ? "Anuncio publicado correctamente"
            : "Borrador creado correctamente",
        listing,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);

    await Promise.all(
      newlyStoredFilePaths.map(async (filePath) => {
        try {
          const fs = await import("fs/promises");
          await fs.unlink(filePath);
        } catch {
          return;
        }
      })
    );

    return NextResponse.json(
      { error: "Ha ocurrido un error al crear el listing" },
      { status: 500 }
    );
  }
}
