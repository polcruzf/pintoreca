import { NextResponse } from "next/server";
import "dotenv/config";
import { auth, currentUser } from "@clerk/nextjs/server";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
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
];

type ListingSpecialtyInput = {
  specialtyId: string;
  pricePerM2: number;
};

export async function POST(request: Request) {
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

    const displayName =
      typeof formData.get("displayName") === "string"
        ? formData.get("displayName")!.toString().trim()
        : "";

    const description =
      typeof formData.get("description") === "string"
        ? formData.get("description")!.toString().trim()
        : "";

    const yearsExperience =
      typeof formData.get("yearsExperience") === "string"
        ? formData.get("yearsExperience")!.toString()
        : "";

    const availability =
      typeof formData.get("availability") === "string"
        ? formData.get("availability")!.toString()
        : "";

    const budgetType =
      typeof formData.get("budgetType") === "string"
        ? formData.get("budgetType")!.toString()
        : "";

    const postalCode =
      typeof formData.get("postalCode") === "string"
        ? formData.get("postalCode")!.toString().trim()
        : "";

    const city =
      typeof formData.get("city") === "string"
        ? formData.get("city")!.toString().trim()
        : "";

    const citySlug =
      typeof formData.get("citySlug") === "string"
        ? formData.get("citySlug")!.toString().trim()
        : "";

    const province =
      typeof formData.get("province") === "string"
        ? formData.get("province")!.toString().trim()
        : "";

    const provinceSlug =
      typeof formData.get("provinceSlug") === "string"
        ? formData.get("provinceSlug")!.toString().trim()
        : "";

    const latitude = Number(formData.get("latitude"));
    const longitude = Number(formData.get("longitude"));
    const serviceRadiusKm = Number(formData.get("serviceRadiusKm"));
    const mainImageIndex = Number(formData.get("mainImageIndex"));

    const specialtiesRaw = formData.get("specialties");

    const specialties: ListingSpecialtyInput[] =
      typeof specialtiesRaw === "string"
        ? JSON.parse(specialtiesRaw)
        : [];

    const images = formData.getAll("images");

    if (!displayName) {
      return NextResponse.json(
        { error: "El nombre del anuncio es obligatorio" },
        { status: 400 }
      );
    }

    if (!description) {
      return NextResponse.json(
        { error: "La descripción es obligatoria" },
        { status: 400 }
      );
    }

    if (!yearsExperience) {
      return NextResponse.json(
        { error: "Los años de experiencia son obligatorios" },
        { status: 400 }
      );
    }

    if (!availability) {
      return NextResponse.json(
        { error: "La disponibilidad es obligatoria" },
        { status: 400 }
      );
    }

    if (!budgetType) {
      return NextResponse.json(
        { error: "El tipo de presupuesto es obligatorio" },
        { status: 400 }
      );
    }

    if (!city) {
      return NextResponse.json(
        { error: "La ciudad es obligatoria" },
        { status: 400 }
      );
    }

    if (!citySlug) {
      return NextResponse.json(
        { error: "El citySlug es obligatorio" },
        { status: 400 }
      );
    }

    if (!province) {
      return NextResponse.json(
        { error: "La provincia es obligatoria" },
        { status: 400 }
      );
    }

    if (!SPAIN_PROVINCES.includes(province)) {
      return NextResponse.json(
        { error: "La provincia no es válida" },
        { status: 400 }
      );
    }

    if (!provinceSlug) {
      return NextResponse.json(
        { error: "El provinceSlug es obligatorio" },
        { status: 400 }
      );
    }

    if (!postalCode) {
      return NextResponse.json(
        { error: "El código postal es obligatorio" },
        { status: 400 }
      );
    }

    if (!/^\d{5}$/.test(postalCode)) {
      return NextResponse.json(
        { error: "El código postal debe tener exactamente 5 dígitos" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(latitude)) {
      return NextResponse.json(
        { error: "La latitud no es válida" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(longitude)) {
      return NextResponse.json(
        { error: "La longitud no es válida" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(serviceRadiusKm) || serviceRadiusKm <= 0) {
      return NextResponse.json(
        { error: "El radio de servicio debe ser mayor que 0" },
        { status: 400 }
      );
    }

    if (!Array.isArray(specialties) || specialties.length === 0) {
      return NextResponse.json(
        { error: "Debes seleccionar al menos una especialidad" },
        { status: 400 }
      );
    }
        if (!Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: "Debes añadir al menos 1 imagen" },
        { status: 400 }
      );
    }

    if (images.length > 8) {
      return NextResponse.json(
        { error: "No puedes subir más de 8 imágenes" },
        { status: 400 }
      );
    }
        for (const image of images) {
      if (!(image instanceof File)) {
        return NextResponse.json(
          { error: "Uno de los archivos enviados no es válido" },
          { status: 400 }
        );
      }

      if (!image.type.startsWith("image/")) {
        return NextResponse.json(
          { error: "Todos los archivos deben ser imágenes válidas" },
          { status: 400 }
        );
      }
    }
        if (!Number.isInteger(mainImageIndex)) {
      return NextResponse.json(
        { error: "La imagen principal no es válida" },
        { status: 400 }
      );
    }

    if (mainImageIndex < 0 || mainImageIndex >= images.length) {
      return NextResponse.json(
        { error: "El índice de la imagen principal está fuera de rango" },
        { status: 400 }
      );
    }

    for (const specialty of specialties) {
      if (
        !specialty ||
        typeof specialty.specialtyId !== "string" ||
        !specialty.specialtyId.trim()
      ) {
        return NextResponse.json(
          { error: "Cada especialidad debe tener un specialtyId válido" },
          { status: 400 }
        );
      }

      const pricePerM2 =
        typeof specialty.pricePerM2 === "number"
          ? specialty.pricePerM2
          : Number(specialty.pricePerM2);

      if (!Number.isFinite(pricePerM2) || pricePerM2 <= 0) {
        return NextResponse.json(
          { error: "El precio por m² debe ser mayor que 0" },
          { status: 400 }
        );
      }
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "listings");
    await mkdir(uploadsDir, { recursive: true });

    const savedImages = await Promise.all(
      images.map(async (image, index) => {
        const file = image as File;
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const originalName = file.name || `image-${index}.jpg`;
        const safeName = originalName.replace(/\s+/g, "-");
        const fileName = `${Date.now()}-${index}-${safeName}`;

        const absoluteFilePath = path.join(uploadsDir, fileName);
        const publicFileUrl = `/uploads/listings/${fileName}`;

        await writeFile(absoluteFilePath, buffer);

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
        slug: `${citySlug}-${Date.now()}`,
        displayName,
        description,
        yearsExperience,
        availability,
        budgetType,
        status: "DRAFT",
        city,
        citySlug,
        province,
        provinceSlug,
        postalCode,
        latitude,
        longitude,
        serviceRadiusKm,
        specialties: {
          create: specialties.map((specialty) => ({
            specialtyId: specialty.specialtyId.trim(),
            pricePerM2:
              typeof specialty.pricePerM2 === "number"
                ? specialty.pricePerM2
                : Number(specialty.pricePerM2),
          })),
        },
        images: {
          create: savedImages,
        },
      },
    });

    return NextResponse.json(
      {
        message: "Listing creado correctamente",
        listing,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Ha ocurrido un error al crear el listing" },
      { status: 500 }
    );
  }
}