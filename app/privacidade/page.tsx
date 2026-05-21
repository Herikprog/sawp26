import Link from "next/link";
import { Shield, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Política de Privacidade — Troca Stickers",
  description: "Política de Privacidade e Proteção de Dados da aplicação Troca Stickers.",
};

export default function PrivacidadePage() {
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
          padding: "clamp(24px, 5vw, 48px)",
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
              <Shield size={28} />
            </div>
            <div>
              <h1 style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "clamp(24px, 5vw, 32px)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                margin: 0
              }}>
                Política de Privacidade
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
                1. Quem somos e Contactos
              </h2>
              <p>
                A plataforma <strong>Troca Stickers</strong> foi desenvolvida e é operada pela empresa <strong>Braga Work</strong> (denominada &quot;Operador&quot; ou &quot;Nós&quot;). Estamos empenhados em proteger a privacidade e os dados pessoais dos nossos utilizadores em estrita conformidade com a <strong>LGPD</strong> (Lei 13.709/2018 - Brasil) e com o <strong>GDPR</strong> (Regulamento UE 2016/679 - União Europeia).
              </p>
              <p>
                Para exercer qualquer direito de privacidade ou para esclarecer dúvidas relativas ao tratamento dos seus dados, pode contactar o nosso Encarregado de Proteção de Dados (DPO) através do endereço de correio eletrónico:{" "}
                <a href="mailto:suporte@trocastickers.email" style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}>
                  suporte@trocastickers.email
                </a>.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
                2. Dados Recolhidos e Finalidades
              </h2>
              <p>
                Recolhemos dados pessoais estritamente necessários para o funcionamento e segurança da aplicação. A lista de dados e as suas respetivas bases legais e finalidades incluem:
              </p>
              <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <li>
                  <strong>Dados de Registo:</strong> Nome, endereço de email e palavra-passe (guardada de forma encriptada).
                  <br />
                  <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                    *Base Legal:* Execução de contrato (Artigo 6.º, n.º 1, alínea b) do GDPR).
                  </span>
                </li>
                <li>
                  <strong>Geolocalização (GPS):</strong> Coordenadas físicas de latitude e longitude obtidas do seu dispositivo. Esta recolha apenas ocorre mediante o seu <strong>consentimento prévio e explícito</strong> nas definições.
                  <br />
                  <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                    *Base Legal:* Consentimento do titular (Artigo 6.º, n.º 1, alínea a) do GDPR). Usado unicamente para calcular distâncias entre utilizadores e viabilizar matches de troca.
                  </span>
                </li>
                <li>
                  <strong>Atividade Social e Conteúdo:</strong> Publicações no feed, fotos de figurinhas anexadas, gostos, comentários e conversas via chat.
                  <br />
                  <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                    *Base Legal:* Execução do contrato e consentimento para partilha no perfil público.
                  </span>
                </li>
                <li>
                  <strong>Assinatura Premium (Stripe):</strong> Histórico de subscrições e dados de faturação recolhidos de forma encriptada pelo nosso parceiro Stripe.
                  <br />
                  <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                    *Base Legal:* Execução de contrato e obrigações legais fiscais.
                  </span>
                </li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
                3. Serviços Terceiros e Destinatários dos Dados
              </h2>
              <p>
                Os seus dados não são vendidos a terceiros. No entanto, partilhamos dados com fornecedores essenciais para manter a plataforma ativa:
              </p>
              <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <li><strong>Supabase Inc.:</strong> Armazenamento e segurança da base de dados e gestão de credenciais de login.</li>
                <li><strong>Vercel Inc.:</strong> Alojamento web da nossa aplicação Next.js.</li>
                <li><strong>Stripe Inc.:</strong> Processamento de pagamentos para adesões ao plano Premium.</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
                4. Retenção e Segurança dos Dados
              </h2>
              <p>
                Os seus dados pessoais são guardados enquanto mantiver a sua conta ativa na plataforma. A geolocalização guardada refere-se sempre à sua última coordenada ativa; não gravamos nem mantemos histórico das suas coordenadas anteriores. Toda a comunicação de dados na plataforma é protegida via protocolo HTTPS com encriptação SSL/TLS e as palavras-passe são encriptadas de forma unidirecional.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
                5. Os seus Direitos
              </h2>
              <p>
                Tem o direito de exercer gratuitamente os seus direitos previstos pela LGPD e GDPR:
              </p>
              <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <li><strong>Acesso e Retificação:</strong> Consultar os seus dados e alterá-los no seu perfil.</li>
                <li><strong>Portabilidade:</strong> Exportar os seus dados em formato JSON estruturado na sua página de definições.</li>
                <li><strong>Apagamento (&quot;Direito ao Esquecimento&quot;):</strong> Excluir a sua conta e todos os dados associados permanentemente através das definições.</li>
                <li><strong>Revogação do Consentimento:</strong> Desativar o acesso de localização e notificações push a qualquer altura.</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
                6. Alterações à Política
              </h2>
              <p>
                Esta política pode ser modificada ocasionalmente para refletir melhorias no produto ou alterações legislativas. Sempre que fizermos alterações relevantes, solicitaremos um novo consentimento expresso no próximo login na plataforma.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
