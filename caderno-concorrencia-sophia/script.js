/* ═══════════════════════════════════════════════════════════════════════════
   CADERNO DE CONCORRÊNCIA — SOPHIA RIVIERA
   script.js — lógica principal
   ═══════════════════════════════════════════════════════════════════════════ */

'use strict';

// ── ESTADO GLOBAL ────────────────────────────────────────────────────────────
const App = {
  concorrentes: [],
  objecoes: [],
  pendencias: [],
  frases: {},
  secaoAtiva: 'visao-geral',
};

// ── UTILITÁRIOS ──────────────────────────────────────────────────────────────
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function vazio(v) {
  return !v || v.trim() === '' || v === 'Não informado' || v === 'Pendente de validação' || v === '-';
}

function pendente(v) {
  if (!v) return true;
  const lc = v.toLowerCase();
  return lc.includes('pendent') || lc.includes('a confirmar') || lc.includes('a validar')
    || lc.includes('não inform') || lc.includes('sem inform') || lc === '-';
}

function classificarRisco(c) {
  const nr = (c.nivel_risco || '').toLowerCase();
  if (nr.includes('crítico')) return 1;
  if (nr.includes('médio') || nr.includes('medio')) return 2;
  return 3;
}

function badgeRisco(nivel) {
  if (nivel === 1) return '<span class="badge badge-risco-critico">Risco Crítico</span>';
  if (nivel === 2) return '<span class="badge badge-risco-medio">Risco Médio</span>';
  return '<span class="badge badge-risco-baixo">Risco Baixo</span>';
}

function classeCardRisco(nivel) {
  if (nivel === 1) return 'risco-critico';
  if (nivel === 2) return 'risco-medio';
  return 'risco-baixo';
}

function exibirValor(v, tipo = 'texto') {
  if (!v || vazio(v)) {
    if (tipo === 'link') return '<span class="mvalor vazio">Não disponível</span>';
    return '<span class="mvalor vazio">Não informado</span>';
  }
  if (pendente(v)) return `<span class="mvalor pendente">${v}</span>`;
  if (tipo === 'link' && v.startsWith('http')) return `<a href="${v}" target="_blank" rel="noopener">${v}</a>`;
  return `<span class="mvalor">${v}</span>`;
}

async function copiarTexto(texto, btn) {
  try {
    await navigator.clipboard.writeText(texto);
    const orig = btn.textContent;
    btn.textContent = 'Copiado!';
    btn.style.background = '#EAF7F2';
    btn.style.color = '#2E7D5E';
    setTimeout(() => { btn.textContent = orig; btn.style.background = ''; btn.style.color = ''; }, 1800);
  } catch {
    prompt('Copie o texto abaixo:', texto);
  }
}

// ── CARREGAMENTO DE DADOS ────────────────────────────────────────────────────
async function carregarJSON(path) {
  const resp = await fetch(path);
  if (!resp.ok) throw new Error(`Erro ao carregar ${path}: ${resp.status}`);
  return resp.json();
}

async function inicializar() {
  try {
    const [conc, obj, pend, frases] = await Promise.all([
      carregarJSON('data/concorrentes.json'),
      carregarJSON('data/objecoes.json'),
      carregarJSON('data/pendencias.json'),
      carregarJSON('data/frases.json'),
    ]);
    App.concorrentes = conc;
    App.objecoes = obj;
    App.pendencias = pend;
    App.frases = frases;
    renderizarTudo();
  } catch (e) {
    document.getElementById('loading').innerHTML =
      `<div class="alerta alerta-critico"><span class="alerta-icone">!</span>
      Erro ao carregar dados: ${e.message}.<br>
      Certifique-se de abrir o index.html via servidor local (ex: <code>npx serve .</code>) e não diretamente pelo navegador.</div>`;
  }
}

// ── NAVEGAÇÃO ────────────────────────────────────────────────────────────────
function navegarPara(id) {
  App.secaoAtiva = id;
  $$('.secao').forEach(s => s.classList.remove('ativa'));
  const alvo = document.getElementById(id);
  if (alvo) alvo.classList.add('ativa');
  $$('.nav li a').forEach(a => {
    a.classList.toggle('ativo', a.dataset.secao === id);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── STATS DA CAPA ────────────────────────────────────────────────────────────
function renderizarStats() {
  const total = App.concorrentes.length;
  const nivel1 = App.concorrentes.filter(c => classificarRisco(c) === 1).length;
  const pendCrit = App.pendencias.filter(p =>
    (p.prioridade || '').toLowerCase().includes('alta') &&
    !(p.status || '').toLowerCase().includes('encerr')
  ).length;
  const objMapeadas = App.objecoes.length;
  const semFonte = App.concorrentes.filter(c => pendente(c.fonte_principal)).length;

  const el = document.getElementById('stats-dinamicos');
  if (!el) return;
  el.innerHTML = `
    <div class="stat-card"><span class="stat-numero">${total}</span><span class="stat-label">Concorrentes cadastrados</span></div>
    <div class="stat-card"><span class="stat-numero">${nivel1}</span><span class="stat-label">Risco nível crítico</span></div>
    <div class="stat-card"><span class="stat-numero">${pendCrit}</span><span class="stat-label">Pendências críticas</span></div>
    <div class="stat-card"><span class="stat-numero">${objMapeadas}</span><span class="stat-label">Objeções mapeadas</span></div>
    <div class="stat-card"><span class="stat-numero">${semFonte}</span><span class="stat-label">Dados sem fonte validada</span></div>
  `;
}

// ── VISÃO GERAL ──────────────────────────────────────────────────────────────
function renderizarVisaoGeral() {
  const grupos = [
    { titulo: 'Loteamentos', filtro: c => (c.tipo_produto||'').toLowerCase().includes('lote') },
    { titulo: 'Condomínios com apelo resort', filtro: c => (c.tipo_produto||'').toLowerCase().includes('resort') },
    { titulo: 'Apartamentos e condomínios de praia', filtro: c => {
      const t = (c.tipo_produto||'').toLowerCase();
      return t.includes('apartamento') || (t.includes('condomínio') && !t.includes('resort') && !t.includes('lote'));
    }},
    { titulo: 'Barra Grande', filtro: c => (c.cidade||'').toLowerCase().includes('barra grande') },
    { titulo: 'Luís Correia', filtro: c => (c.cidade||'').toLowerCase().includes('correia') || (c.cidade||'').toLowerCase().includes('tartaruga') },
    { titulo: 'Produtos em obras', filtro: c => {
      const s = (c.status||'').toLowerCase();
      return s.includes('obra') || s.includes('constru');
    }},
    { titulo: 'Risco comercial crítico', filtro: c => classificarRisco(c) === 1 },
  ];

  const el = document.getElementById('visao-geral-content');
  if (!el) return;

  let html = '';
  grupos.forEach(g => {
    const lista = App.concorrentes.filter(g.filtro);
    if (!lista.length) return;
    html += `<div class="visao-grupo mb-2">
      <h3 style="font-size:1rem;text-transform:uppercase;letter-spacing:.08em;color:var(--turquesa);margin-bottom:.75rem;padding-bottom:.4rem;border-bottom:1px solid var(--areia-clara)">${g.titulo}</h3>
      <div style="display:flex;flex-wrap:wrap;gap:.5rem;margin-bottom:1.5rem">`;
    lista.forEach(c => {
      const nivel = classificarRisco(c);
      html += `<button onclick="abrirModal('${c.id}')" class="tag" style="cursor:pointer;background:var(--branco);border:1px solid var(--areia-clara);padding:.35rem .85rem;border-radius:20px;font-size:.8rem;color:var(--verde)">
        ${c.nome} ${badgeRisco(nivel)}</button>`;
    });
    html += '</div></div>';
  });

  html += `<div class="divider"></div>
  <div class="alerta alerta-info"><span class="alerta-icone">i</span>
  Clique em qualquer concorrente para abrir a análise completa. Use a aba "Concorrentes" para filtrar e buscar.</div>`;

  el.innerHTML = html;
}

// ── CARDS DE CONCORRENTES ────────────────────────────────────────────────────
function renderizarCards(lista) {
  const grid = document.getElementById('cards-concorrentes');
  if (!grid) return;
  if (!lista.length) {
    grid.innerHTML = '<div class="alerta alerta-info"><span class="alerta-icone">i</span>Nenhum concorrente encontrado com os filtros aplicados.</div>';
    return;
  }
  grid.innerHTML = lista.map(c => {
    const nivel = classificarRisco(c);
    const precoLabel = pendente(c.preco_inicial)
      ? '<span class="texto-pendente">A validar</span>'
      : `<strong>${c.preco_inicial}</strong>`;
    return `
    <div class="card ${classeCardRisco(nivel)}" onclick="abrirModal('${c.id}')">
      <div class="card-header">
        <div class="card-nome">${c.nome}</div>
        ${badgeRisco(nivel)}
      </div>
      <div class="card-info">
        <div class="card-linha"><span class="label">Cidade</span><span class="valor">${c.cidade || '—'}</span></div>
        <div class="card-linha"><span class="label">Tipo</span><span class="valor">${c.tipo_produto || '—'}</span></div>
        <div class="card-linha"><span class="label">Praia</span><span class="valor">${c.relacao_praia || '—'}</span></div>
        <div class="card-linha"><span class="label">Status</span><span class="valor">${c.status ? c.status.substring(0,60) + (c.status.length>60?'…':'') : '—'}</span></div>
        <div class="card-linha"><span class="label">Preço inicial</span><span class="valor">${precoLabel}</span></div>
      </div>
      ${c.forca_percebida ? `<div class="card-forca">${c.forca_percebida.substring(0,120)}${c.forca_percebida.length>120?'…':''}</div>` : ''}
      <button class="btn btn-primario" onclick="event.stopPropagation();abrirModal('${c.id}')">Ver análise completa</button>
    </div>`;
  }).join('');
}

function filtrarConcorrentes() {
  const busca = ($('#busca-concorrentes')?.value || '').toLowerCase();
  const tipo  = $('#filtro-tipo')?.value || '';
  const cidade = $('#filtro-cidade')?.value || '';
  const risco = $('#filtro-risco')?.value || '';

  const lista = App.concorrentes.filter(c => {
    if (busca && !c.nome.toLowerCase().includes(busca) && !(c.cidade||'').toLowerCase().includes(busca)) return false;
    if (tipo  && !(c.tipo_produto||'').toLowerCase().includes(tipo.toLowerCase())) return false;
    if (cidade && !(c.cidade||'').toLowerCase().includes(cidade.toLowerCase())) return false;
    if (risco) {
      const n = classificarRisco(c);
      if (risco === '1' && n !== 1) return false;
      if (risco === '2' && n !== 2) return false;
      if (risco === '3' && n !== 3) return false;
    }
    return true;
  });
  renderizarCards(lista);
}

// ── MODAL DE CONCORRENTE ─────────────────────────────────────────────────────
function abrirModal(id) {
  const c = App.concorrentes.find(x => x.id === id);
  if (!c) return;
  const nivel = classificarRisco(c);

  const campos = [
    ['Categoria estratégica', c.categoria_estrategica],
    ['Cidade / localidade', c.cidade],
    ['Relação com a praia', c.relacao_praia],
    ['Distância real da praia', c.distancia_praia],
    ['Status atual', c.status],
    ['Previsão de entrega', c.entrega],
    ['Tipo de produto', c.tipo_produto],
    ['Total de unidades', c.total_unidades],
    ['Unidades disponíveis', c.unidades_disponiveis],
    ['Tipologias', c.tipologias],
    ['Metragens', c.metragens],
    ['Preço inicial', c.preco_inicial],
    ['Faixa de preço', c.faixa_preco],
    ['Condição de pagamento', c.condicao_pagamento],
    ['Taxa / condomínio estimado', c.taxa_condominio],
    ['Itens de lazer', c.itens_lazer],
    ['Lazer entregue ou previsto', c.lazer_entregue],
    ['Política de locação', c.politica_locacao],
    ['Promete rentabilidade?', c.promete_rentabilidade],
    ['Modelo jurídico', c.modelo_juridico],
    ['Memorial disponível?', c.memorial_disponivel],
    ['Tabela comercial disponível?', c.tabela_disponivel],
    ['Plantas disponíveis?', c.plantas_disponiveis],
    ['Diferencial usado na venda', c.diferencial_venda],
    ['Principal ponto de atenção', c.ponto_atencao],
    ['Clientes Sophia compararam?', c.clientes_compararam],
    ['Objeção gerada', c.objecao_gerada],
  ];

  const camposHtml = campos.map(([label, val]) => `
    <div class="modal-campo">
      <span class="mlabel">${label}</span>
      ${exibirValor(val)}
    </div>`).join('');

  const fonteHtml = `
    <div class="modal-campo" style="grid-column:1/-1">
      <span class="mlabel">Fonte principal</span>
      ${exibirValor(c.fonte_principal)}
    </div>
    <div class="modal-campo">
      <span class="mlabel">Tipo de fonte</span>
      ${exibirValor(c.tipo_fonte)}
    </div>
    <div class="modal-campo" style="grid-column:1/-1">
      <span class="mlabel">Link / print / anexo</span>
      ${exibirValor(c.link_anexo, 'link')}
    </div>
    ${c.observacoes ? `<div class="modal-campo" style="grid-column:1/-1">
      <span class="mlabel">Observações</span>
      <span class="mvalor">${c.observacoes}</span>
    </div>` : ''}
  `;

  // Pendências desta aba
  const pendItems = App.pendencias.filter(p =>
    p.empreendimento && c.nome && p.empreendimento.toLowerCase().includes(c.nome.toLowerCase().split(' ')[0])
  );
  const pendHtml = pendItems.length
    ? pendItems.map(p => `<li style="font-size:.83rem;margin-bottom:.3rem"><span class="prioridade-${(p.prioridade||'').toLowerCase()}">[${p.prioridade || 'sem prioridade'}]</span> ${p.campo}: ${p.informacao_necessaria || p.observacao || ''}</li>`).join('')
    : '<li style="font-size:.83rem;color:var(--cinza-suave)">Nenhuma pendência crítica registrada.</li>';

  const html = `
    <div class="modal-header">
      <div>
        <div class="modal-nome">${c.nome}</div>
        <div class="modal-categoria">${c.categoria_estrategica || c.tipo_produto || ''} &nbsp;|&nbsp; ${badgeRisco(nivel)}</div>
      </div>
      <button class="modal-fechar" onclick="fecharModal()" aria-label="Fechar">&#10005;</button>
    </div>
    <div class="modal-body">

      <div class="modal-secao">
        <div class="modal-secao-titulo">Dados do empreendimento</div>
        <div class="modal-grid">${camposHtml}</div>
      </div>

      <div class="modal-secao">
        <div class="modal-secao-titulo">Leitura estratégica</div>
        <div class="bloco-estrategico">
          <h4>Força percebida pelo cliente</h4>
          <p>${c.vantagem_percebida_cliente || c.forca_percebida || 'Dado não registrado.'}</p>
        </div>
        <div class="bloco-estrategico bloco-reposicionar">
          <h4>Como reposicionar o Sophia</h4>
          <p>${c.como_reposicionar || 'Dado não registrado.'}</p>
          ${c.como_reposicionar ? `<button class="btn btn-copia mt-1" onclick="copiarTexto(\`${c.como_reposicionar.replace(/`/g,"'")}\`, this)">Copiar resposta</button>` : ''}
        </div>
        <div class="bloco-estrategico bloco-atencao">
          <h4>Ponto de atenção estratégico</h4>
          <p>${c.ponto_atencao_estrategico || c.ponto_comparacao_sophia || 'Dado não registrado.'}</p>
        </div>
        <div class="bloco-estrategico bloco-cuidado">
          <h4>O que o consultor nao deve dizer</h4>
          <p>${c.o_que_nao_dizer || 'Consulte a seção "O que nunca dizer".'}</p>
        </div>
      </div>

      <div class="modal-secao">
        <div class="modal-secao-titulo">Pendências registradas</div>
        <ul style="list-style:none;padding:0">${pendHtml}</ul>
      </div>

      <div class="modal-secao">
        <div class="modal-secao-titulo">Fonte e rastreabilidade</div>
        <div class="modal-grid">${fonteHtml}</div>
      </div>

    </div>`;

  document.getElementById('modal-conteudo').innerHTML = html;
  document.getElementById('modal-overlay').classList.add('aberto');
  document.body.style.overflow = 'hidden';
}

function fecharModal() {
  document.getElementById('modal-overlay').classList.remove('aberto');
  document.body.style.overflow = '';
}

// ── MATRIZ COMPARATIVA ───────────────────────────────────────────────────────
function renderizarMatriz(lista) {
  const wrapper = document.getElementById('tabela-comparativa');
  if (!wrapper) return;
  if (!lista.length) {
    wrapper.innerHTML = '<div class="alerta alerta-info"><span class="alerta-icone">i</span>Nenhum resultado encontrado.</div>';
    return;
  }
  const linhas = lista.map(c => {
    const nivel = classificarRisco(c);
    const classeRisco = nivel===1?'badge-risco-critico':nivel===2?'badge-risco-medio':'badge-risco-baixo';
    return `<tr>
      <td class="nome-col" onclick="abrirModal('${c.id}')">${c.nome}</td>
      <td>${c.tipo_produto||'—'}</td>
      <td>${c.cidade||'—'}</td>
      <td>${c.relacao_praia||'—'}</td>
      <td>${c.status ? c.status.substring(0,50)+(c.status.length>50?'…':'') : '—'}</td>
      <td>${c.entrega||'—'}</td>
      <td>${pendente(c.preco_inicial)?'<span class="texto-pendente">A validar</span>':c.preco_inicial}</td>
      <td>${c.forca_percebida ? c.forca_percebida.substring(0,80)+(c.forca_percebida.length>80?'…':'') : '—'}</td>
      <td>${c.ponto_atencao ? c.ponto_atencao.substring(0,80)+(c.ponto_atencao.length>80?'…':'') : '—'}</td>
      <td>${c.objecao_gerada ? c.objecao_gerada.substring(0,60)+(c.objecao_gerada.length>60?'…':'') : '—'}</td>
      <td>${c.como_reposicionar ? c.como_reposicionar.substring(0,80)+(c.como_reposicionar.length>80?'…':'') : '—'}</td>
      <td><span class="tag-risco ${classeRisco}">${nivel===1?'Crítico':nivel===2?'Médio':'Baixo'}</span></td>
    </tr>`;
  }).join('');

  wrapper.innerHTML = `
    <div class="tabela-wrapper">
      <table class="comparativa">
        <thead><tr>
          <th>Concorrente</th><th>Tipo</th><th>Localização</th><th>Praia</th>
          <th>Status</th><th>Entrega</th><th>Preço inicial</th>
          <th>Principal força</th><th>Ponto de atenção</th>
          <th>Objeção provável</th><th>Como reposicionar</th><th>Risco</th>
        </tr></thead>
        <tbody>${linhas}</tbody>
      </table>
    </div>`;
}

function filtrarMatriz() {
  const busca = ($('#busca-matriz')?.value || '').toLowerCase();
  const tipo  = $('#mfiltro-tipo')?.value || '';
  const risco = $('#mfiltro-risco')?.value || '';
  const status = $('#mfiltro-status')?.value || '';

  const lista = App.concorrentes.filter(c => {
    if (busca && !c.nome.toLowerCase().includes(busca)) return false;
    if (tipo  && !(c.tipo_produto||'').toLowerCase().includes(tipo.toLowerCase())) return false;
    if (status && !(c.status||'').toLowerCase().includes(status.toLowerCase())) return false;
    if (risco) {
      const n = classificarRisco(c);
      if (risco === '1' && n !== 1) return false;
      if (risco === '2' && n !== 2) return false;
      if (risco === '3' && n !== 3) return false;
    }
    return true;
  });
  renderizarMatriz(lista);
}

// ── RANKING ──────────────────────────────────────────────────────────────────
function renderizarRanking() {
  const el = document.getElementById('ranking-content');
  if (!el) return;

  const niveis = [1, 2, 3];
  const descNivel = {
    1: 'Concorrentes que podem gerar objeção real no atendimento. Requerem preparo específico do consultor.',
    2: 'Concorrentes que aparecem na comparação, mas com proposta diferente do Sophia.',
    3: 'Concorrentes que servem como contexto de mercado regional.',
  };
  const nomesNivel = { 1: 'Risco Crítico', 2: 'Risco Médio', 3: 'Risco Baixo' };

  let html = '';
  niveis.forEach(n => {
    const lista = App.concorrentes.filter(c => classificarRisco(c) === n);
    if (!lista.length) return;
    html += `
      <div class="ranking-nivel">
        <div class="ranking-nivel-header">
          <div class="nivel-badge nivel-${n}">${n}</div>
          <div>
            <h3 style="font-size:1.1rem;margin-bottom:.2rem">${nomesNivel[n]}</h3>
            <p style="font-size:.83rem;color:var(--cinza-suave);margin:0">${descNivel[n]}</p>
          </div>
        </div>
        ${lista.map(c => `
          <div class="ranking-card" onclick="abrirModal('${c.id}')" style="cursor:pointer">
            <div class="ranking-card-header">
              <div class="ranking-card-nome">${c.nome}</div>
              <span class="badge" style="font-size:.7rem;color:var(--cinza-suave)">${c.tipo_produto||''}</span>
            </div>
            <div class="ranking-itens">
              ${c.forca_percebida ? `<div class="ranking-item"><span class="ri-label">Força percebida</span><span>${c.forca_percebida.substring(0,120)}</span></div>` : ''}
              ${c.objecao_gerada ? `<div class="ranking-item"><span class="ri-label">Objeção provável</span><span>${c.objecao_gerada.substring(0,120)}</span></div>` : ''}
              ${c.como_reposicionar ? `<div class="ranking-item"><span class="ri-label">Reposicionamento</span><span>${c.como_reposicionar.substring(0,120)}</span></div>` : ''}
              ${c.o_que_nao_dizer ? `<div class="ranking-item"><span class="ri-label">Cuidado</span><span style="color:var(--vermelho-alerta)">${c.o_que_nao_dizer.substring(0,120)}</span></div>` : ''}
            </div>
          </div>`).join('')}
      </div>`;
  });
  el.innerHTML = html;
}

// ── OBJEÇÕES ─────────────────────────────────────────────────────────────────
function renderizarObjecoes(lista) {
  const el = document.getElementById('objecoes-lista');
  if (!el) return;
  if (!lista.length) {
    el.innerHTML = '<div class="alerta alerta-info"><span class="alerta-icone">i</span>Nenhuma objeção encontrada.</div>';
    return;
  }
  el.innerHTML = lista.map((o, i) => `
    <div class="objecao-card" id="obj-${i}">
      <div class="objecao-header" onclick="toggleObjecao(${i})">
        <div>
          <div class="objecao-titulo">"${o.objecao}"</div>
          <div class="objecao-meta">${o.empreendimento ? 'Relacionado a: ' + o.empreendimento : 'Objeção geral'}</div>
        </div>
        <span class="objecao-expand">&#9660;</span>
      </div>
      <div class="objecao-body">
        <div class="objecao-grid">
          ${o.leitura_real ? `<div class="objecao-bloco">
            <h4>Leitura real da objeção</h4>
            <p>${o.leitura_real}</p>
          </div>` : ''}
          ${o.risco_consultor ? `<div class="objecao-bloco">
            <h4>Risco da resposta errada</h4>
            <p style="color:var(--vermelho-alerta)">${o.risco_consultor}</p>
          </div>` : ''}
          ${o.resposta_estrategica ? `<div class="objecao-bloco destaque">
            <h4>Resposta consultiva recomendada</h4>
            <p>${o.resposta_estrategica}</p>
            <div class="objecao-acoes">
              <button class="btn btn-copia" style="background:rgba(255,255,255,.15);color:var(--areia-clara);border-color:rgba(255,255,255,.2)"
                onclick="copiarTexto(\`${o.resposta_estrategica.replace(/`/g,"'")}\`, this)">Copiar resposta</button>
            </div>
          </div>` : ''}
          ${o.pergunta_avanco ? `<div class="objecao-bloco">
            <h4>Pergunta de avanco</h4>
            <p style="font-style:italic">${o.pergunta_avanco}</p>
            <div class="objecao-acoes">
              <button class="btn btn-copia" onclick="copiarTexto(\`${o.pergunta_avanco.replace(/`/g,"'")}\`, this)">Copiar pergunta</button>
            </div>
          </div>` : ''}
          ${o.cuidado_comercial ? `<div class="objecao-bloco" style="border-left:3px solid var(--amarelo-atencao)">
            <h4 style="color:var(--amarelo-atencao)">Cuidado comercial</h4>
            <p>${o.cuidado_comercial}</p>
          </div>` : ''}
        </div>
      </div>
    </div>`).join('');
}

function toggleObjecao(i) {
  document.getElementById(`obj-${i}`).classList.toggle('expandido');
}

function filtrarObjecoes() {
  const busca = ($('#busca-objecoes')?.value || '').toLowerCase();
  const lista = busca
    ? App.objecoes.filter(o =>
        o.objecao.toLowerCase().includes(busca) ||
        (o.empreendimento||'').toLowerCase().includes(busca))
    : App.objecoes;
  renderizarObjecoes(lista);
}

// ── PENDÊNCIAS ───────────────────────────────────────────────────────────────
function renderizarPendencias(lista) {
  const tbody = document.getElementById('pendencias-tbody');
  if (!tbody) return;
  if (!lista.length) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--cinza-suave);padding:2rem">Nenhuma pendência encontrada.</td></tr>';
    return;
  }
  tbody.innerHTML = lista.map(p => {
    const pr = (p.prioridade || '').toLowerCase();
    const st = (p.status || '').toLowerCase();
    const classPr = pr.includes('alta') ? 'prioridade-alta' : pr.includes('média') || pr.includes('media') ? 'prioridade-media' : 'prioridade-baixa';
    const classSt = st.includes('encerr') || st.includes('resolv') ? 'status-encerrado' : 'status-aberta';
    return `<tr>
      <td><strong style="color:var(--verde)">${p.empreendimento||'—'}</strong></td>
      <td>${p.campo||'—'}</td>
      <td>${p.informacao_necessaria||'—'}</td>
      <td><span class="${classPr}">${p.prioridade||'—'}</span></td>
      <td>${p.fonte_recomendada||'—'}</td>
      <td>${p.responsavel||'—'}</td>
      <td><span class="${classSt}">${p.status||'Em aberto'}</span></td>
      <td style="font-size:.78rem;color:var(--cinza-suave)">${p.observacao||'—'}</td>
    </tr>`;
  }).join('');
}

function filtrarPendencias() {
  const busca  = ($('#busca-pend')?.value || '').toLowerCase();
  const prio   = $('#filtro-prio')?.value || '';
  const status = $('#filtro-pend-status')?.value || '';

  const lista = App.pendencias.filter(p => {
    if (busca && !(p.empreendimento||'').toLowerCase().includes(busca) && !(p.campo||'').toLowerCase().includes(busca)) return false;
    if (prio   && !(p.prioridade||'').toLowerCase().includes(prio.toLowerCase())) return false;
    if (status === 'aberta'    && (p.status||'').toLowerCase().includes('encerr')) return false;
    if (status === 'encerrada' && !(p.status||'').toLowerCase().includes('encerr')) return false;
    return true;
  });
  renderizarPendencias(lista);
}

// ── NUNCA DIZER ──────────────────────────────────────────────────────────────
function renderizarNuncaDizer() {
  const el = document.getElementById('nunca-dizer-lista');
  if (!el || !App.frases.nunca_dizer) return;
  el.innerHTML = App.frases.nunca_dizer.map(item => `
    <div class="nunca-dizer-card">
      <div class="frase-proibida">"${item.frase}"</div>
      <div class="nunca-dizer-grid">
        <div class="nd-bloco">
          <div class="nd-label">Por que prejudica</div>
          <div>${item.por_que}</div>
        </div>
        <div class="nd-bloco">
          <div class="nd-label">O que dizer no lugar</div>
          <div style="color:var(--verde-ok)">${item.substituir_por}</div>
        </div>
      </div>
    </div>`).join('');
}

// ── FRASES DE BOLSO ──────────────────────────────────────────────────────────
function renderizarFrases() {
  const el = document.getElementById('frases-lista');
  if (!el || !App.frases.frases_bolso) return;
  el.innerHTML = `<div class="frases-grid">` + App.frases.frases_bolso.map(f => `
    <div class="frase-card">
      <div class="frase-aspas">"</div>
      <div class="frase-texto">${f.texto}</div>
      ${f.contexto ? `<div class="frase-contexto">${f.contexto}</div>` : ''}
      <button class="btn btn-copia" onclick="copiarTexto(\`${f.texto.replace(/`/g,"'")}\`, this)">Copiar frase</button>
    </div>`).join('') + `</div>`;
}

// ── GUIA DE USO ──────────────────────────────────────────────────────────────
function renderizarGuia() {
  // conteúdo estático renderizado no HTML
}

// ── RENDERIZAR TUDO ──────────────────────────────────────────────────────────
function renderizarTudo() {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('app-content').style.display = '';

  renderizarStats();
  renderizarVisaoGeral();
  renderizarCards(App.concorrentes);
  renderizarMatriz(App.concorrentes);
  renderizarRanking();
  renderizarObjecoes(App.objecoes);
  renderizarPendencias(App.pendencias);
  renderizarNuncaDizer();
  renderizarFrases();

  // Popular selects de filtro dinamicamente
  popularFiltros();
}

function popularFiltros() {
  // Tipos de produto únicos
  const tipos = [...new Set(App.concorrentes.map(c => c.tipo_produto).filter(Boolean))];
  ['filtro-tipo', 'mfiltro-tipo'].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    tipos.forEach(t => {
      const o = document.createElement('option');
      o.value = t; o.textContent = t;
      sel.appendChild(o);
    });
  });

  // Cidades únicas
  const cidades = [...new Set(App.concorrentes.map(c => c.cidade).filter(Boolean))];
  const selCid = document.getElementById('filtro-cidade');
  if (selCid) {
    cidades.forEach(ci => {
      const o = document.createElement('option');
      o.value = ci; o.textContent = ci;
      selCid.appendChild(o);
    });
  }
}

// ── EVENTOS ──────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

  // Navegação
  $$('.nav li a').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      navegarPara(a.dataset.secao);
    });
  });

  // Fechar modal ao clicar fora
  document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) fecharModal();
  });

  // ESC fecha modal
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') fecharModal();
  });

  // Filtros concorrentes
  ['busca-concorrentes','filtro-tipo','filtro-cidade','filtro-risco'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', filtrarConcorrentes);
    document.getElementById(id)?.addEventListener('change', filtrarConcorrentes);
  });

  // Filtros matriz
  ['busca-matriz','mfiltro-tipo','mfiltro-risco','mfiltro-status'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', filtrarMatriz);
    document.getElementById(id)?.addEventListener('change', filtrarMatriz);
  });

  // Filtros objeções
  document.getElementById('busca-objecoes')?.addEventListener('input', filtrarObjecoes);

  // Filtros pendências
  ['busca-pend','filtro-prio','filtro-pend-status'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', filtrarPendencias);
    document.getElementById(id)?.addEventListener('change', filtrarPendencias);
  });

  // Toggle nível 1
  document.getElementById('toggle-nivel1')?.addEventListener('change', function() {
    if (this.checked) renderizarCards(App.concorrentes.filter(c => classificarRisco(c) === 1));
    else renderizarCards(App.concorrentes);
  });

  // Botão imprimir
  document.getElementById('btn-imprimir')?.addEventListener('click', () => window.print());

  // Inicializar
  inicializar();
});
