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
        { error: "No se pudo obtener el usuario" },
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

    if (!dbUser || !dbUser.professionalProfile) {
      return NextResponse.json(
        { error: "Perfil profesional no encontrado" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";

    if (!phone) {
      return NextResponse.json(
        { error: "El teléfono es obligatorio" },
        { status: 400 }
      );
    }

    if (!/^\d{9}$/.test(phone)) {
      return NextResponse.json(
        { error: "El teléfono debe tener 9 dígitos" },
        { status: 400 }
      );
    }

    await prisma.professionalProfile.update({
      where: {
        id: dbUser.professionalProfile.id,
      },
      data: {
        phone,
      },
    });

    return NextResponse.json({
      message: "Teléfono actualizado correctamente",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Error al actualizar el teléfono" },
      { status: 500 }
    );
  }
}