import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
	try {
		const { email } = await req.json();

		if (!email) {
			return NextResponse.json({ error: "Email requerido" }, { status: 400 });
		}

		const user = await prisma.user.findUnique({ where: { email } });
		if (!user) {
			// No revelar si el email existe o no — misma respuesta
			return NextResponse.json({
				message:
					"Si el email está registrado, recibirás un enlace para resetear tu contraseña.",
			});
		}

		// Invalidar tokens anteriores del mismo usuario
		await prisma.resetToken.updateMany({
			where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } },
			data: { expiresAt: new Date(0) }, // expirar tokens viejos
		});

		// Generar token seguro
		const token = crypto.randomBytes(32).toString("hex");
		const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora de validez

		await prisma.resetToken.create({
			data: {
				userId: user.id,
				token,
				expiresAt,
			},
		});

		const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password/${token}`;

		// En desarrollo, devolvemos el link directamente (útil para testing)
		// En producción, acá iría el envío de email
		console.log(`[RESET PASSWORD] Link para ${email}: ${resetUrl}`);

		// Intentar enviar email si hay servicio configurado
		const emailSent = await sendResetEmail(email, resetUrl);

		return NextResponse.json({
			message:
				"Si el email está registrado, recibirás un enlace para resetear tu contraseña.",
			...(!emailSent ? { devLink: resetUrl } : {}),
		});
	} catch (error) {
		console.error("[forgot-password]", error);
		return NextResponse.json(
			{ error: "Error al procesar la solicitud" },
			{ status: 500 },
		);
	}
}

async function sendResetEmail(
	email: string,
	resetUrl: string,
): Promise<boolean> {
	const host = process.env.SMTP_HOST;
	const port = parseInt(process.env.SMTP_PORT || "587");
	const user = process.env.SMTP_USER;
	const pass = process.env.SMTP_PASS;
	const from =
		process.env.SMTP_FROM || "Prode Mundial 2026 <noreply@prode2026.com>";

	if (!host || !user || !pass) {
		console.log(
			"[RESET PASSWORD] SMTP no configurado. Link para",
			email + ":",
			resetUrl,
		);
		return false;
	}

	try {
		const transporter = nodemailer.createTransport({
			host,
			port,
			secure: port === 465,
			auth: { user, pass },
		});

		await transporter.sendMail({
			from,
			to: email,
			subject: "🔐 Prode Mundial 2026 — Restablecé tu contraseña",
			html: `
				<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
					<div style="text-align: center; margin-bottom: 24px;">
						<span style="font-size: 40px;">🏆</span>
					</div>
					<h1 style="font-size: 20px; margin: 0 0 8px; text-align: center;">
						Prode <span style="color: #22c55e;">Mundial 2026</span>
					</h1>
					<p style="color: #64748b; font-size: 14px; text-align: center; margin: 0 0 24px;">
						Hacé clic en el link para restablecer tu contraseña.
					</p>
					<div style="background: #0d1528; border: 1px solid #1e293b; border-radius: 12px; padding: 24px;">
						<p style="margin: 0 0 16px; font-size: 14px; color: #f1f5f9;">
							Recibimos una solicitud para restablecer la contraseña de tu cuenta.
						</p>
						<a href="${resetUrl}"
							style="display: block; background: #22c55e; color: #000; text-decoration: none;
								font-weight: 700; font-size: 15px; text-align: center; padding: 12px 24px;
								border-radius: 10px; margin-bottom: 16px;">
							Restablecer contraseña
						</a>
						<p style="margin: 0; font-size: 12px; color: #64748b;">
							Este link expira en 1 hora. Si no solicitaste este cambio, ignorá este email.
						</p>
					</div>
					<p style="text-align: center; font-size: 11px; color: #475569; margin-top: 24px;">
						FIFA World Cup 2026 · Canadá 🇨🇦 México 🇲🇽 EE.UU. 🇺🇸
					</p>
				</div>
			`.trim(),
		});

		console.log("[RESET PASSWORD] Email enviado a", email);
		return true;
	} catch (error) {
		console.error("[RESET PASSWORD] Error al enviar email:", error);
		return false;
	}
}
