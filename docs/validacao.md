# Validação
Data: 25/10/2026.

Verificação automatizada: sintaxe JavaScript; cinco seções na ordem escolhida; quatro fundos de imagem e exatamente um fundo de cor; paleta amarela/preta; logo A; caminhos HTML/CSS/JS de assets; fontes; âncoras/diálogos; JSON/SVG; metadados de vídeo; hashes dos originais e checksums.

O filme Full HD foi conferido por metadados e amostras de quadros. O PDF foi renderizado e inspecionado. A logo preserva canal alpha.

## Limite
Navegador não verificado. Na preparação original, o supervisor de preview estava indisponível. Na implementação local de 25/10/2026, a ferramenta de navegação retornou inventário vazio de navegadores e aplicativos; por isso, a revisão visual/interativa permanece pendente.

Revisar no destino: 1440x900 e 1024x768; 390x844 e 360x800; carregamento do filme, máscara da tipografia, revelação e repetição; rolagem para alinhamento; cortes das capturas originais; ausência de overflow; foco/menu/diálogos/Escape; formulário e abertura de e-mail; pausa e movimento reduzido. Não considerar esses testes aprovados antes de fazê-los.

## Conteúdo e publicação
Não há agenda conectada, envio automático de formulário, banco de dados, rastreamento ou confirmação de reserva. Nenhum site foi publicado.

## Implementação do projeto GitHub — 25/10/2026

- Referências de logo corrigidas para o PNG transparente existente no kit (3072×2048), preservado byte a byte em relação a `originals/`. Manifesto de assets e hash da arquitetura atualizados para esse arquivo.
- Reprodução do hero pausa em diálogos, fora da cena e ao ocultar a página; retorno à cena retoma apenas a reprodução anteriormente ativa. A saída do modo mobile restaura a camada do filme já carregado.
- `npm run check` aprovado: sintaxe JavaScript, arquitetura, assets, fontes, originais, transparência, JSON, SVG e checksums.
- `npm run build` aprovado: gera `dist/` somente com arquivos públicos do site.
- CI configurada para executar essas verificações e guardar o build como artefato. Configurações de hospedagem incluídas para Vercel e Netlify.
- Revisão visual e testes interativos em navegador continuam pendentes; os resultados automatizados não os substituem.

