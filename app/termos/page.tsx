import Link from "next/link";
import { FileText, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Termos e Condições — Troca Stickers",
  description: "Termos e Condições de Serviço da aplicação Troca Stickers.",
};

export default function TermosPage() {
  return (
    <div style={{
      background: "var(--bg-main)",
      minHeight: "100vh",
      color: "var(--text-main)",
      fontFamily: "Inter, sans-serif",
      padding: "60px 20px"
    }}>
      <div style={{
        maxWidth: "800px",
        margin: "0 auto",
      }}>
        {/* Back Link */}
        <Link href="/register" style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          color: "var(--text-muted)",
          textDecoration: "none",
          fontSize: "14px",
          fontWeight: 600,
          marginBottom: "32px",
          transition: "color 0.2s ease"
        }}>
          <ArrowLeft size={16} />
          Voltar para o Registo
        </Link>

        {/* Card Container */}
        <div style={{
          background: "var(--card-bg)",
          border: "1px solid var(--border-color)",
          borderRadius: "24px",
          padding: "48px",
          boxShadow: "var(--shadow-lg)"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "32px",
            borderBottom: "1px solid var(--border-light)",
            paddingBottom: "24px"
          }}>
            <div style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              background: "var(--primary-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--primary)"
            }}>
              <FileText size={28} />
            </div>
            <div>
              <h1 style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "clamp(24px, 5vw, 32px)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                margin: 0
              }}>
                Termos e Condições
              </h1>
              <p style={{
                fontSize: "12px",
                color: "var(--text-muted)",
                margin: "4px 0 0 0"
              }}>
                Última atualização: 20 de maio de 2026
              </p>
            </div>
          </div>

          <div style={{
            fontSize: "15px",
            lineHeight: "1.7",
            color: "var(--text-sec)",
            display: "flex",
            flexDirection: "column",
            gap: "24px"
          }}>
            <section>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
                1. Aceitação dos Termos
              </h2>
              <p>
                Ao criar uma conta ou utilizar a aplicação <strong>Troca Stickers</strong>, o utilizador concorda em cumprir e vincular-se aos presentes Termos e Condições de Serviço. Estes termos aplicam-se a todos os utilizadores, visitantes e colecionadores que utilizam a nossa plataforma.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
                2. Objeto e Âmbito do Serviço
              </h2>
              <p>
                A <strong>Troca Stickers</strong> é uma plataforma de rede social e geolocalização projetada para aproximar colecionadores e facilitar a troca física e de forma presencial das figurinhas da Copa do Mundo 2026.
              </p>
              <p style={{ color: "var(--warning)", fontWeight: 600 }}>
                ⚠️ IMPORTANTE: A Troca Stickers não realiza vendas, processamento de envios postais ou entregas físicas de figurinhas. A plataforma funciona exclusivamente como ferramenta de localização e agendamento de encontros de troca.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
                3. Requisitos de Idade e Registo
              </h2>
              <p>
                A fim de proteger os dados dos nossos utilizadores, a idade mínima exigida para registo direto e autónomo é de:
              </p>
              <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <li><strong>16 anos</strong> para utilizadores residentes na União Europeia (GDPR).</li>
                <li><strong>18 anos</strong> para utilizadores residentes no Brasil (LGPD), exceto menores emancipados ou com consentimento/tutela declarada por encarregado de educação.</li>
              </ul>
              <p>
                Ao submeter o formulário de registo, o utilizador declara sob compromisso de honra que tem a idade regulamentar mínima exigida por lei.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
                4. Regras de Conduta dos Utilizadores
              </h2>
              <p>
                Os utilizadores são os únicos responsáveis pelas informações e conteúdos publicados no feed, propostas de trocas enviadas e comunicações no chat. É estritamente proibido:
              </p>
              <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <li>Publicar conteúdo abusivo, obsceno, odioso ou ameaçador.</li>
                <li>Praticar qualquer atividade de natureza comercial ilícita, publicidade enganosa ou burlas.</li>
                <li>Assediar outros colecionadores ou tentar extrair dados pessoais sem consentimento.</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
                5. Exclusão de Responsabilidade
              </h2>
              <p>
                As trocas presenciais ocorrem inteiramente fora da plataforma online. A Braga Work e a equipa do Troca Stickers não assumem qualquer tipo de responsabilidade civil, contratual ou extrapatrimonial por quaisquer danos físicos, materiais, roubos ou desentendimentos ocorridos nos encontros agendados pelos utilizadores.
              </p>
              <p>
                Recomendamos sempre que os encontros ocorram em espaços públicos de grande movimento, centros comerciais ou locais policiados durante o dia.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
                6. Suspensão e Encerramento de Contas
              </h2>
              <p>
                O incumprimento de qualquer uma das regras de conduta descritas nestes termos confere ao Operador o direito de suspender ou banir permanentemente a conta do utilizador faltoso. Os dados relativos a banimentos serão armazenados em conformidade com as nossas obrigações de auditoria e segurança.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
                7. Resolução de Litígios e Jurisdição
              </h2>
              <p>
                Estes termos regem-se e são interpretados em conformidade com a legislação portuguesa aplicável. Para a resolução de qualquer litígio resultante da utilização da plataforma ou de matérias reguladas nestes termos, é eleito o Foro da Comarca de Braga, Portugal, com expressa renúncia a qualquer outro.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
