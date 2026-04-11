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

type RouteContext = {
  params: Promise<{
    listingId: string;
  }>;
};

export async function GET(_: Request, context: RouteContext) {
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
        { error: "Solo los profesionales pueden cargar datos de anuncios" },
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
        specialties: {
          orderBy: {
            createdAt: "asc",
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

    const primaryListingSpecialty = listing.specialties[0];

    if (!primaryListingSpecialty) {
      return NextResponse.json(
        { error: "El anuncio no tiene especialidad asociada" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      listing: {
        id: listing.id,
        displayName: listing.displayName,
        description: listing.description,
        yearsExperience: listing.yearsExperience,
        availability: listing.availability,
        budgetType: listing.budgetType,
        postalCode: listing.postalCode,
        city: listing.city,
        province: listing.province,
        serviceRadiusKm: String(listing.serviceRadiusKm),
        selectedSpecialtyId: primaryListingSpecialty.specialtyId,
        pricePerM2: primaryListingSpecialty.pricePerM2.toString(),
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Ha ocurrido un error al obtener los datos del anuncio" },
      { status: 500 }
    );
  }
}