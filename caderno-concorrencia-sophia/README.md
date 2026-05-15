# Caderno de Concorrência — Sophia Riviera

Ferramenta interna de leitura estratégica para a equipe comercial do Sophia Riviera.

**Uso interno. Não compartilhar com clientes.**

---

## O que é esta ferramenta

O Caderno de Concorrência é um mini site estático que substitui PDFs fixos e apresentações desatualizadas. Ele centraliza as informações sobre os concorrentes do Sophia Riviera em um formato consultável, filtrável e atualizável.

A ferramenta não depende de servidor nem de banco de dados. Funciona com HTML, CSS e JavaScript puro. Os dados ficam em arquivos JSON na pasta `data/`.

---

## Estrutura do projeto

```
caderno-concorrencia-sophia/
  index.html              — interface principal
  styles.css              — identidade visual Sophia Riviera
  script.js               — lógica de filtros, cards, modais e renderização
  data/
    concorrentes.json     — dados de todos os concorrentes (base principal)
    objecoes.json         — objeções mapeadas e respostas consultivas
    pendencias.json       — pendências de validação por empreendimento
    frases.json           — frases de bolso e frases proibidas
  docs/
    guia-atualizacao.md   — guia detalhado de atualização para a equipe
  README.md               — este arquivo
```

---

## Como rodar localmente

O projeto precisa de um servidor HTTP local porque carrega arquivos JSON via `fetch()`. Abrir o `index.html` diretamente pelo clique duplo não funcionará.

**Opção 1 — Node.js (recomendado):**
```bash
npx serve .
```
Acesse: `http://localhost:3000`

**Opção 2 — Python:**
```bash
python -m http.server 8080
```
Acesse: `http://localhost:8080`

**Opção 3 — VS Code:**
Instale a extensão "Live Server" e clique em "Go Live" na barra inferior.

---

## Como publicar

### GitHub Pages
1. Crie um repositório no GitHub (pode ser privado com plano pago, ou público).
2. Faça o upload de todos os arquivos do projeto.
3. Em Settings > Pages, selecione a branch `main` e a pasta `/root`.
4. O site ficará disponível em `https://seuusuario.github.io/nome-do-repositorio/`.

### Netlify
1. Acesse netlify.com e crie uma conta gratuita.
2. Arraste a pasta do projeto para o painel do Netlify (drag & drop).
3. O site sobe em segundos com URL automática.
4. Para atualizar: arraste novamente a pasta com os arquivos novos.

### Vercel
```bash
npx vercel
```
Siga as instruções no terminal.

---

## Como atualizar os dados

Veja o guia completo em `docs/guia-atualizacao.md`.

Resumo:
1. Edite a planilha "Cadastrode Resumo Concorrentes Sophia" no Google Drive.
2. Execute o script Python de exportação (ver guia).
3. Substitua os arquivos JSON na pasta `data/`.
4. Publique novamente (ou faça commit no repositório).

---

## Mapeamento de dados — planilha para JSON

### concorrentes.json

| Campo no JSON | Coluna na planilha (aba Cadastro_Resumo) |
|---|---|
| nome | Empreendimento padronizado |
| incorporadora | Incorporadora / responsável |
| cidade | Cidade / localidade |
| tipo_produto | Tipo de produto |
| status | Status atual |
| entrega | Previsão de entrega |
| preco_inicial | Preço inicial |
| faixa_preco | Faixa de preço |
| relacao_praia | Relação real com a praia |
| distancia_praia | Distância real da praia |
| total_unidades | Quantidade total de unidades/lotes |
| tipologias | Tipologias disponíveis |
| metragens | Metragens |
| condicao_pagamento | Condição de pagamento |
| itens_lazer | Itens de lazer |
| politica_locacao | Política de locação |
| diferencial_venda | Diferencial mais usado na venda |
| ponto_atencao | Principal ponto de atenção |
| objecao_gerada | Objeção gerada |
| fonte_principal | Fonte principal |
| link_anexo | Link/print/anexo |
| forca_percebida | Força principal percebida (aba Leitura_Estrategica) |
| como_reposicionar | Como o consultor deve reposicionar (aba Leitura_Estrategica) |
| nivel_risco | Nível de risco da informação (aba Leitura_Estrategica) |
| o_que_nao_dizer | O que não dizer (aba Leitura_Estrategica) |

### objecoes.json

| Campo no JSON | Coluna na planilha (aba Objeções_CRM) |
|---|---|
| objecao | Objeção provável |
| empreendimento | Empreendimento relacionado |
| leitura_real | Leitura real da objeção |
| risco_consultor | Risco para o consultor |
| resposta_estrategica | Resposta estratégica |
| pergunta_avanco | Pergunta de avanço |
| cuidado_comercial | Cuidado comercial |

### pendencias.json

| Campo no JSON | Coluna na planilha (aba Pendencias_Detalhadas) |
|---|---|
| empreendimento | Empreendimento |
| campo | Campo pendente |
| informacao_necessaria | Informação necessária |
| prioridade | Prioridade |
| fonte_recomendada | Fonte recomendada |
| responsavel | Responsável sugerido |
| status | Status |
| observacao | Observação |

---

## Classificação automática de risco

O sistema classifica o risco de cada concorrente com base no campo `nivel_risco` do JSON:

- **Crítico**: texto contém a palavra "crítico"
- **Médio**: texto contém "médio"
- **Baixo**: qualquer outro valor

Para alterar o risco de um concorrente, edite o campo `nivel_risco` no `concorrentes.json` ou na aba `Leitura_Estrategica` da planilha.

---

## Próximos passos recomendados

1. **Publicar em GitHub Pages ou Netlify** para acesso da equipe via link simples.
2. **Criar rotina mensal de atualização** da planilha e reexportação dos JSONs.
3. **Completar as pendências de prioridade alta** listadas na seção "Pendências".
4. **Adicionar as objeções faltantes** ainda sem resposta estruturada (ver nota na seção Objeções).
5. **Validar os dados do Brisas de Barra Grande** via contato com imobiliárias locais.
6. **Revisar o Costa do Sardin** após confirmação de entrega pelos compradores.
7. **Adicionar novos concorrentes** conforme identificação pela equipe comercial.
8. **Conectar ao Google Sheets** via CSV publicado quando a planilha for tornada pública ou semipública (ver guia).

---

## Suporte técnico

Para dúvidas sobre atualização ou publicação, consulte o arquivo `docs/guia-atualizacao.md`.
