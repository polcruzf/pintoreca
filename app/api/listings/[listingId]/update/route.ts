import { NextResponse } from "next/server";
import "dotenv/config";
import { auth, currentUser } from "@clerk/nextjs/server";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient,
  ExperienceRange,
  AvailabilityOption,
  BudgetType,
} from "@prisma/client";

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

type RouteContext = {
  params: Promise<{
    listingId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
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

    const { listingId } = await context.params;

    if (!listingId) {
      return NextResponse.json(
        { error: "Falta el identificador del anuncio" },
        { status: 400 }
      );
    }

    const listing = await prisma.listing.findFirst({
      where: {
        id: listingId,
        professionalProfileId: user.professionalProfile.id,
      },
      include: {
        specialties: true,
      },
    });

    if (!listing) {
      return NextResponse.json(
        { error: "No se encontró el anuncio" },
        { status: 404 }
      );
    }

    const body = await request.json();

    const displayName =
      typeof body.displayName === "string" ? body.displayName.trim() : "";
    const description =
      typeof body.description === "string" ? body.description.trim() : "";
    const yearsExperience =
      typeof body.yearsExperience === "string" ? body.yearsExperience : "";
    const availability =
      typeof body.availability === "string" ? body.availability : "";
    const budgetType =
      typeof body.budgetType === "string" ? body.budgetType : "";
    const postalCode =
      typeof body.postalCode === "string" ? body.postalCode.trim() : "";
    const city = typeof body.city === "string" ? body.city.trim() : "";
    const province =
      typeof body.province === "string" ? body.province.trim() : "";
    const serviceRadiusKm = Number(body.serviceRadiusKm);
    const selectedSpecialtyId =
      typeof body.selectedSpecialtyId === "string"
        ? body.selectedSpecialtyId
        : "";
    const pricePerM2 = Number(body.pricePerM2);

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

    if (!province || !SPAIN_PROVINCES.includes(province as (typeof SPAIN_PROVINCES)[number])) {
      return NextResponse.json(
        { error: "La provincia no es válida" },
        { status: 400 }
      );
    }

    if (!/^\d{5}$/.test(postalCode)) {
      return NextResponse.json(
        { error: "El código postal debe tener 5 dígitos" },
        { status: 400 }
      );
    }

    if (!selectedSpecialtyId) {
      return NextResponse.json(
        { error: "Debes seleccionar una especialidad" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(pricePerM2) || pricePerM2 <= 0) {
      return NextResponse.json(
        { error: "El precio por m² debe ser mayor que 0" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(serviceRadiusKm) || serviceRadiusKm <= 0) {
      return NextResponse.json(
        { error: "El radio de servicio debe ser mayor que 0" },
        { status: 400 }
      );
    }

    if (!(yearsExperience in ExperienceRange)) {
      return NextResponse.json(
        { error: "La experiencia no es válida" },
        { status: 400 }
      );
    }

    if (!(availability in AvailabilityOption)) {
      return NextResponse.json(
        { error: "La disponibilidad no es válida" },
        { status: 400 }
      );
    }

    if (!(budgetType in BudgetType)) {
      return NextResponse.json(
        { error: "El tipo de presupuesto no es válido" },
        { status: 400 }
      );
    }

    await prisma.listing.update({
      where: { id: listing.id },
      data: {
        displayName,
        description,
        yearsExperience: yearsExperience as ExperienceRange,
        availability: availability as AvailabilityOption,
        budgetType: budgetType as BudgetType,
        postalCode,
        city,
        citySlug: city.toLowerCase().trim().replace(/\s+/g, "-"),
        province,
        provinceSlug: province.toLowerCase().trim().replace(/\s+/g, "-"),
        latitude: listing.latitude,
        longitude: listing.longitude,
        serviceRadiusKm,
      },
    });

    await prisma.listingSpecialty.deleteMany({
      where: {
        listingId: listing.id,
      },
    });

    await prisma.listingSpecialty.create({
      data: {
        listingId: listing.id,
        specialtyId: selectedSpecialtyId,
        pricePerM2,
      },
    });

    return NextResponse.json({
      message: "Anuncio actualizado correctamente",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Ha ocurrido un error al actualizar el anuncio" },
      { status: 500 }
    );
  }
}