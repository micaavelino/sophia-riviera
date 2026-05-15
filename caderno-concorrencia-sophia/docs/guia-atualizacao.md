# Guia de Atualização — Caderno de Concorrência Sophia Riviera

Este guia é para a pessoa responsável por manter o caderno atualizado.  
Não é necessário saber programar para realizar a maioria das tarefas.

---

## Fluxo geral de atualização

```
1. Editar a planilha no Google Drive
        ↓
2. Exportar os dados para CSV (ou rodar o script Python)
        ↓
3. Substituir os arquivos JSON na pasta data/
        ↓
4. Publicar novamente o site (arrastar para Netlify ou fazer commit)
```

---

## Atualização via script Python (recomendado)

O script `exportar_dados.py` lê a planilha Excel local e gera os JSONs automaticamente.

**Pré-requisito:** ter Python instalado e a biblioteca openpyxl.

```bash
pip install openpyxl
python exportar_dados.py
```

O script gera os arquivos:
- `data/concorrentes.json`
- `data/objecoes.json`
- `data/pendencias.json`

O arquivo `data/frases.json` é editado manualmente (frases de bolso e frases proibidas raramente mudam).

---

## Atualização manual do JSON

Se preferir editar o JSON diretamente sem rodar o script:

1. Abra o arquivo `data/concorrentes.json` em qualquer editor de texto.
2. Cada concorrente é um objeto `{ }` separado por vírgula dentro da lista `[ ]`.
3. Edite o campo desejado respeitando as aspas e vírgulas.
4. Salve e substitua o arquivo no servidor.

**Atenção:** JSON não aceita vírgulas soltas no final de uma lista. Se tiver dúvida, use um validador online como jsonlint.com.

---

## Como adicionar um novo concorrente

1. Abra `data/concorrentes.json`.
2. Copie um bloco existente de `{ ... }` completo.
3. Cole após a última chave `}` da lista, precedido de vírgula.
4. Preencha os campos com os dados do novo empreendimento.
5. O campo `id` deve ser único. Use o nome em minúsculas sem espaços: ex. `"id": "novo-empreendimento"`.
6. Salve e atualize o site.

---

## Como atualizar uma objeção

1. Abra `data/objecoes.json`.
2. Localize a objeção pelo campo `"objecao"`.
3. Edite os campos `resposta_estrategica`, `pergunta_avanco` ou `cuidado_comercial`.
4. Salve e atualize o site.

Para adicionar nova objeção, copie um bloco existente e preencha os campos.

---

## Como marcar uma pendência como encerrada

1. Abra `data/pendencias.json`.
2. Localize pelo campo `"empreendimento"` e `"campo"`.
3. Altere o campo `"status"` para `"Encerrado"`.
4. Salve e atualize o site.

---

## Como conectar ao Google Sheets (opcional)

Se quiser que o caderno leia os dados diretamente do Google Sheets sem precisar exportar arquivos:

**Passo 1 — Publicar a aba como CSV:**
1. Abra a planilha no Google Sheets.
2. Vá em Arquivo > Compartilhar > Publicar na web.
3. Selecione a aba desejada (ex: Cadastro_Resumo).
4. Selecione o formato CSV.
5. Clique em Publicar.
6. Copie o link gerado. Ele terá o formato:
   `https://docs.google.com/spreadsheets/d/ID_DA_PLANILHA/gviz/tq?tqx=out:csv&sheet=NOME_DA_ABA`

**Passo 2 — Substituir a fonte no script.js:**

Abra `script.js` e substitua a função `carregarJSON` por uma versão que leia o CSV:

```javascript
const SHEETS_BASE = 'https://docs.google.com/spreadsheets/d/SEU_ID_AQUI/gviz/tq?tqx=out:csv&sheet=';

async function carregarAba(nomeAba) {
  const url = SHEETS_BASE + encodeURIComponent(nomeAba);
  const resp = await fetch(url);
  if (!resp.ok) throw new Error('Planilha não acessível. Verifique se foi publicada.');
  const texto = await resp.text();
  return parseCSV(texto);
}
```

**Atenção:** a planilha precisa estar publicada publicamente. Se contiver dados sensíveis, prefira manter os JSONs locais e atualizar manualmente.

---

## Periodicidade recomendada de atualização

| Tipo de atualização | Frequência sugerida |
|---|---|
| Status de obras dos concorrentes | Mensal |
| Preços e condições de pagamento | Mensal |
| Objeções e respostas | A cada nova situação identificada em campo |
| Pendências | A cada nova informação validada |
| Frases de bolso | Trimestral ou conforme necessidade |
| Novo concorrente | Imediatamente ao identificar |

---

## Checklist antes de publicar nova versão

- [ ] Todos os campos obrigatórios estão preenchidos (nome, tipo, cidade, status)
- [ ] Dados sem fonte estão marcados como "Pendente de validação"
- [ ] Nenhuma informação não confirmada está sendo apresentada como fato
- [ ] O nível de risco de cada concorrente está correto
- [ ] As objeções novas identificadas em campo foram incluídas
- [ ] As pendências encerradas estão com status "Encerrado"
- [ ] O JSON foi validado (sem erro de sintaxe)
- [ ] O site foi testado localmente antes de publicar

---

## Suporte

Em caso de dúvida técnica sobre o caderno, encaminhe para a pessoa responsável pelo projeto.  
O caderno foi desenvolvido em HTML, CSS e JavaScript puro, sem dependências externas.  
Qualquer desenvolvedor front-end consegue fazer manutenções sem necessidade de configuração especial.
