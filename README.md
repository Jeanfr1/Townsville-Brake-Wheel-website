# Townsville Brake & Wheel Alignment Centre
## Kit vintage - site aprovado + logo A / Selo Heritage

## Projeto GitHub

Repositório: https://github.com/Jeanfr1/Townsville-Brake-Wheel-website

Site estático em HTML, CSS e JavaScript, sem dependências de execução. O código aprovado fica em `site/`; os roteiros e materiais de origem permanecem neste repositório.

```sh
git clone https://github.com/Jeanfr1/Townsville-Brake-Wheel-website.git
cd Townsville-Brake-Wheel-website
npm run dev
```

Abra http://localhost:8080. Requer Python 3; os comandos npm e o build requerem Node.js 20 ou superior. Não é necessário executar `npm install`.

```sh
python3 -m pip install -r tools/requirements.txt
npm run check
npm run build
```

O build gera `dist/`, pronto para hospedagem estática. `netlify.toml` e `vercel.json` configuram esse destino. O workflow `.github/workflows/validate.yml` verifica o projeto e disponibiliza `dist/` como artefato; não publica automaticamente um site.

A logo usa o arquivo existente `Townsville-Logo-A-Transparente.png` do kit, com proporção preservada. As referências antigas a arquivos ausentes foram corrigidas. A integridade dos arquivos de origem é registrada em `MANIFEST.sha256`; alterações intencionais exigem atualizar os hashes correspondentes.

## Direção aprovada

Aprovações registradas em 25/10/2026: modelo amarelo/preto com Falcon GT vintage; logo A, escolhida com a mensagem “modelo A”.

Este pacote reúne o site editável, a identidade escolhida, fotografias e quadros de campanha, filme do hero, materiais originais, guia visual e roteiros. Não é apenas um PDF.

## Abrir
Na raiz do kit, execute:
```
python3 -m http.server 8080 --directory site
```
Abra http://localhost:8080. Sem build, instalação de pacotes ou conta. Ctrl+C encerra o servidor local.

## Estrutura escolhida
| Ordem | Cena | Fundo |
| --- | --- | --- |
| 1 | CONTROL / Falcon GT vintage | Campanha fotográfica e filme |
| 2 | EVERY ANGLE MATTERS. | Close de alinhamento |
| 3 | KEEPING YOU ON TRACK. | Única seção sólida: amarelo |
| 4 | LOCAL / carro clássico vermelho | Fotografia original fornecida |
| 5 | GET YOUR NEXT DRIVE SORTED. | Fachada original; contato e rodapé na foto |

Manter a ordem, as composições e a logo A. Não voltar ao magenta, Defender, outro carro moderno ou estrutura de outros projetos.

## Pastas
- `site/`: HTML, CSS, JS, fontes locais, imagens otimizadas e MP4s utilizados.
- `images-master/`: PNGs nativos dos quadros de campanha e alternativa mobile.
- `originals/`: logo A em PNG com alpha e capturas fotográficas reais preservadas.
- `docs/`: guia visual, arquitetura aprovada, conteúdo, fontes, origem e validação.
- `roteiros/`: implementação, filme/movimento e tratamento da identidade.
- `animation/`: código para reproduzir o filme, storyboard e parâmetros.
- `references/`: conceito e vídeo de referência em cópia compacta.
- `tools/check_kit.py`: verifica estrutura, caminhos e integridade.
- `MANIFEST.sha256`: hashes de todos os arquivos do pacote.

## O movimento entregue
O hero usa um filme local de aproximadamente 11,67 s, Full HD/30 fps, composto de quatro estados fotográficos gerados: coberto, meia revelação, tecido levantado, descoberto. A edição usa transições e aproximação 2.5D; não é filmagem do estabelecimento, órbita 3D real ou simulação física contínua de tecido.

No desktop, o filme toca sem áudio, com repetição manual e controle de posição. A rolagem aproxima a câmera e abre o close de alinhamento. No celular, a composição vertical preserva a leitura e o filme pode ser aberto no visualizador. Pausa e preferência por movimento reduzido são respeitadas.

Para reproduzir os MP4s: `python3 animation/render_hero.py`, com FFmpeg instalado.

## Interações
Detalhes dos quatro serviços; navegação por âncoras; menu mobile; foto original em tamanho inteiro; filme em visualizador; telefone, e-mail, Facebook e mapa. O formulário prepara um e-mail no aplicativo do visitante. Não envia automaticamente, não mantém banco de dados e não confirma reserva.

## Idioma e contato
Site em inglês australiano. Telefone: (07) 4775 6161. Endereço: Unit 2, 34 Pilkington Street, Garbutt QLD 4814. E-mail: bjefferies80@outlook.com, conforme o material fornecido.

## Verificar
`python3 tools/check_kit.py` e `node --check site/app.js`. O verificador de imagens usa Pillow: `python3 -m pip install -r tools/requirements.txt`. Abrir o site não exige essa instalação.

As verificações de código, integridade e build passaram. Esta sessão não dispõe de navegador conectado; a revisão visual/interativa permanece pendente. Consulte `docs/validacao.md`.

Nenhum site foi publicado. Os dados de propriedade e os textos legais para publicação não foram inventados.

