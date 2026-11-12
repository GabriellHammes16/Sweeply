import { Sparkles, LockKeyhole, ArrowUp, ShieldCheck } from "lucide-react";
export function Assistant() {
  return (
    <section className="assistant">
      <span className="tag">Em breve</span>
      <Sparkles className="assistant-symbol" size={50} strokeWidth={1.4} />
      <h1>
        Seu PC explicado
        <br />
        em linguagem simples.
      </h1>
      <p>
        Um assistente para entender diagnósticos
        <br />e decidir o próximo passo com mais clareza.
      </p>
      <div className="providers">
        <button disabled>
          <strong>OpenAI</strong>
          <LockKeyhole size={16} />
        </button>
        <button disabled>
          <strong>Anthropic</strong>
          <LockKeyhole size={16} />
        </button>
        <button disabled>
          <strong>Modelo local</strong>
          <LockKeyhole size={16} />
        </button>
      </div>
      <div className="assistant-input">
        <span>Pergunte sobre o seu PC…</span>
        <ArrowUp size={19} />
      </div>
      <p className="quiet-note">
        <ShieldCheck size={15} /> Nenhuma conexão com provedores nesta versão.
      </p>
      <p className="assistant-fine">
        A futura integração usará sua própria API ou um modelo local.
        <br />
        Assinaturas do ChatGPT e Claude não incluem créditos de API.
      </p>
    </section>
  );
}
