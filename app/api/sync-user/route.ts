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

export async function POST() {
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
    const name =
      `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
      "Usuario sin nombre";

const existingUser = await prisma.user.findUnique({
  where: { email },
});

if (existingUser) {
  const updatedUser = await prisma.user.update({
    where: { email },
    data: {
      name,
    },
  });

  return NextResponse.json({
    message: "Usuario actualizado correctamente",
    user: updatedUser,
  });
}

    const user = await prisma.user.create({
      data: {
        name,
        email,
        role: "USER",
        status: "ACTIVE",
        emailVerified: true,
      },
    });

    return NextResponse.json(
      {
        message: "Usuario sincronizado correctamente",
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Ha ocurrido un error al sincronizar el usuario" },
      { status: 500 }
    );
  }
}