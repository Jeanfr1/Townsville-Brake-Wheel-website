# Implementação - direção travada
O cliente aprovou o site amarelo/preto e depois escolheu a logo A / Selo Heritage. O arquivo `docs/architecture-lock.json` registra a decisão. A composição final com logo A está em `docs/direcao-com-logo-A.png`; é um estudo visual, não captura do HTML.

1. Usar o código entregue como base. Manter inglês australiano, amarelo #F2C329, preto #111111 e branco de apoio.
2. Hero: vintage Falcon GT amarelo, capô preto, tecido prateado; CONTROL monumental com máscara de profundidade. Nada de SUV/Defender ou carro moderno.
3. Integrar `hero-reveal-HD.mp4` como filme do desktop, com poster, pausa, repetição e controle de posição; no mobile, manter a composição vertical e acesso ao filme.
4. Conectar a saída do hero ao close `alignment.webp`. O enquadramento cresce e a máscara abre a cena seguinte. Evitar scroll hijacking.
5. Preservar a seção de serviços como a ÚNICA cor sólida. O layout é um índice técnico aberto; não criar cards com fundos próprios.
6. Usar o PNG real do clássico vermelho como cenário de LOCAL, com tipografia e contraste sobre a foto. A captura inteira permanece acessível.
7. Contato e rodapé ficam sobre a mesma fotografia original da fachada. Não acrescentar outro fundo sólido.
8. Aplicar somente a logo A, arquivo `Townsville-Logo-A-Transparente.png` existente no kit, ao cabeçalho/rodapé. Preservar proporção oval; não comprimir para parecer wordmark.
9. Manter ícones e diagramas como SVG de código; não apresentar medidas reais de diagnóstico que não existem.
10. Executar as verificações e a revisão em navegador indicadas em `validacao.md`.

Arquivos a editar: conteúdo e contatos em index.html; comportamento/serviços em app.js; composição e paleta em styles.css. Todas as fontes e imagens essenciais são locais.

