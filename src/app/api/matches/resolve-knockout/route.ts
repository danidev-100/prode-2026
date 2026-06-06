import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { resolveKnockoutBracket } from "@/lib/knockout";

export async function POST() {
	const session = await auth();
	if (!session?.user || session.user.role !== "ADMIN") {
		return NextResponse.json({ error: "No autorizado" }, { status: 403 });
	}

	try {
		const result = await resolveKnockoutBracket();

		const statusCode = result.errors.length > 0 ? 409 : 200;
		return NextResponse.json(result, { status: statusCode });
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Error desconocido";
		return NextResponse.json(
			{ error: message, errors: [message] },
			{ status: 500 },
		);
	}
}
