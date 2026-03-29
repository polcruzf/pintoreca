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
    const { name, email, role } = body;

if (!name || !email) {
  return NextResponse.json(
    { error: "El nombre y el email son obligatorios" },
    { status: 400 }
  );
}

if (role !== "USER" && role !== "PROFESSIONAL") {
  return NextResponse.json(
    { error: "El tipo de cuenta no es válido" },
    { status: 400 }
  );
}

const existingUser = await prisma.user.findUnique({
  where: { email },
});

if (existingUser) {
  return NextResponse.json(
    { error: "Ya existe un usuario con ese email" },
    { status: 409 }
  );
}

const user = await prisma.user.create({
  data: {
    name,
    email,
    role,
    status: "PENDING_VERIFICATION",
    professionalProfile:
      role === "PROFESSIONAL"
        ? {
            create: {
              professionalStatus: "ACTIVE",
            },
          }
        : undefined,
  },
});

    return NextResponse.json(
      {
        message: "Usuario creado correctamente",
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Ha ocurrido un error al crear el usuario" },
      { status: 500 }
    );
  }
}