import { NextResponse } from "next/server";
import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL no está definida");
}

const pool = new Pool({
  connectionString,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      professionalProfileId,
      displayName,
      description,
      yearsExperience,
      availability,
      budgetType,
      postalCode,
      city,
      citySlug,
      province,
      provinceSlug,
      latitude,
      longitude,
      serviceRadiusKm,
      specialties,
    } = body;

    if (
      !professionalProfileId ||
      !displayName ||
      !description ||
      !yearsExperience ||
      !availability ||
      !budgetType ||
      !postalCode ||
      !city ||
      !citySlug ||
      !province ||
      !provinceSlug ||
      latitude === undefined ||
      longitude === undefined ||
      !serviceRadiusKm ||
      !specialties ||
      !Array.isArray(specialties) ||
      specialties.length === 0
    ) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios" },
        { status: 400 }
      );
    }

    const professionalProfile = await prisma.professionalProfile.findUnique({
      where: { id: professionalProfileId },
    });

    if (!professionalProfile) {
      return NextResponse.json(
        { error: "El perfil profesional no existe" },
        { status: 404 }
      );
    }

    const listing = await prisma.listing.create({
      data: {
        professionalProfileId,
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
          create: specialties.map(
            (specialty: { specialtyId: string; pricePerM2: number }) => ({
              specialtyId: specialty.specialtyId,
              pricePerM2: specialty.pricePerM2,
            })
          ),
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