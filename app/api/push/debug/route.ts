import { NextResponse } from "next/server";

/**
 * ENDPOINT DESABILITADO POR RAZÕES DE SEGURANÇA
 * 
 * Este endpoint anteriormente expunha informações sensíveis da infraestrutura.
 * Está agora desabilitado. Para diagnosticar problemas, contactar o suporte.
 * 
 * VULNERABILIDADE CORRIGIDA: Exposição de SUPABASE_SERVICE_ROLE_KEY length
 */

export async function GET() {
  return NextResponse.json(
    {
      error: "Debug endpoint disabled",
      message: "Este endpoint foi desabilitado por razões de segurança.",
      contact: "support@trocastickers.com"
    },
    { status: 403 }
  );
}
