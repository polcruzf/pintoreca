import { NextResponse } from "next/server";
import "dotenv/config";
import { auth, currentUser } from "@clerk/nextjs/server";
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

    const body = await request.json();

    const {
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