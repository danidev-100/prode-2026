import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
	try {
		const { name, email, password } = await req.json();

		if (!email || !password || !name) {
			return NextResponse.json(
				{ error: "Nombre, email y contraseña son obligatorios" },
				{ status: 400 },
			);
		}

		if (password.length < 6) {
			return NextResponse.json(
				{ error: "La contraseña debe tener al menos 6 caracteres" },
				{ status: 400 },
			);
		}

		const existingEmail = await prisma.user.findUnique({ where: { email } });
		if (existingEmail) {
			return NextResponse.json(
				{ error: "Ya existe un usuario con ese email" },
				{ status: 400 },
			);
		}

		const existingName = await prisma.user.findUnique({ where: { name } });
		if (existingName) {
			return NextResponse.json(
				{ error: "Ese nombre ya está en uso por otro usuario" },
				{ status: 400 },
			);
		}

		const hashed = await bcrypt.hash(password, 12);

		const user = await prisma.user.create({
			data: { name, email, password: hashed },
		});

		return NextResponse.json(
			{ id: user.id, name: user.name, email: user.email },
			{ status: 201 },
		);
	} catch {
		return NextResponse.json(
			{ error: "Error al registrar usuario" },
			{ status: 500 },
		);
	}
}
