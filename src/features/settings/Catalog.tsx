import { useState } from "react";
import { Check, Info, Search } from "lucide-react";
import {
  Dialog,
  Logo,
  Ring,
  Busy,
  Empty,
  Notice,
} from "../../design-system/ui";
export function Catalog() {
  const [dialog, setDialog] = useState(false);
  return (
    <>
      <div className="page-heading compact">
        <div>
          <span className="eyebrow">SWEEPLY / DESIGN SYSTEM</span>
          <h1>Uma linguagem, todo o app.</h1>
          <p>Catálogo vivo dos componentes, nos dois temas.</p>
        </div>
        <Logo wordmark />
      </div>
      <div className="catalog-grid">
        <section className="panel">
          <h2>Ações</h2>
          <div className="catalog-row">
            <button className="primary" onClick={() => setDialog(true)}>
              Abrir diálogo
            </button>
            <button className="secondary" onClick={() => setDialog(true)}>
              Secundário
            </button>
            <button className="secondary" disabled>
              Indisponível
            </button>
          </div>
        </section>
        <section className="panel">
          <h2>Controles nativos</h2>
          <div className="catalog-row">
            <label>
              <input type="checkbox" /> Selecionar
            </label>
            <input
              className="switch"
              type="checkbox"
              role="switch"
              aria-label="Alternar exemplo"
            />
            <select aria-label="Selecionar exemplo">
              <option>Opção um</option>
              <option>Opção dois</option>
            </select>
            <label className="search">
              <Search size={16} />
              <input aria-label="Buscar no exemplo" placeholder="Buscar…" />
            </label>
          </div>
        </section>
        <section className="panel">
          <h2>Cores funcionais</h2>
          <div className="swatches">
            {["cpu", "ram", "storage", "danger"].map((c) => (
              <div key={c}>
                <span style={{ background: `var(--${c})` }} />
                {c}
              </div>
            ))}
          </div>
          <Notice>Informação deve acompanhar a cor.</Notice>
          <span className="tag">
            <Check size={14} /> Concluído
          </span>
        </section>
        <section className="panel">
          <h2>Indicadores · dados de exemplo</h2>
          <Ring
            value={42}
            label="Exemplo de uso"
            color="var(--ram)"
            detail="Somente catálogo visual"
          />
          <progress max="100" value="42" aria-label="Progresso de exemplo" />
        </section>
        <section className="panel">
          <h2>Carregamento e erro</h2>
          <Busy>Carregando exemplo…</Busy>
          <div className="error-box">
            <Info size={16} /> Não foi possível concluir o exemplo.
          </div>
          <div className="skeleton" aria-label="Exemplo de skeleton" />
        </section>
        <section className="panel">
          <Empty title="Nenhum item">
            Um estado vazio explica o próximo passo.
          </Empty>
          <details>
            <summary>Detalhes expansíveis</summary>
            <p>Conteúdo adicional sob demanda.</p>
          </details>
        </section>
      </div>
      {dialog && (
        <Dialog title="Exemplo de confirmação" close={() => setDialog(false)}>
          <p>
            Este diálogo usa foco e navegação por teclado do navegador.
            Pressione Escape para fechar.
          </p>
          <div className="dialog-actions">
            <button className="primary" onClick={() => setDialog(false)}>
              Entendi
            </button>
          </div>
        </Dialog>
      )}
    </>
  );
}
