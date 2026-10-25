# Movimento cinematográfico
Conceito: o clássico é revelado; a atenção passa da carroceria para o contato com o chão e o alinhamento.

## Filme utilizado no hero
1920x1080, 30 fps, aproximadamente 11,67 s, sem áudio. Quatro estados de campanha mantêm a pose do carro e a luz:
- 0,00-2,75 s: silhueta sob a capa.
- 2,75-5,50 s: frente e capô revelados.
- 5,50-8,25 s: tecido levantado sobre a traseira.
- 8,25-11,67 s: carro descoberto, leitura da carroceria.
As transições duram 0,65 s; a aproximação 2.5D é progressiva. Não é uma simulação de tecido em tempo real nem uma órbita 3D completa.

## Integração no site
- Filme local e poster: não depender de YouTube ou player externo.
- Respeitar movimento reduzido, economia de dados e visibilidade da página.
- Reproduzir sem áudio; oferecer repetição manual e controle de posição.
- Pausar fora da cena e ao abrir o visualizador.
- Não buscar vídeo pesado automaticamente no mobile; oferecer o visualizador por gesto do visitante.
- Rolagem: o hero ocupa 178svh no desktop e 145svh no mobile, com palco de 100svh.
- A câmera se aproxima e a tipografia desaparece; no fim da rolagem, o close de alinhamento entra de baixo para cima.
- A máscara da palavra CONTROL acompanha a câmera para parecer atrás da carroceria.
- Alinhamento: deslocamento sutil; fotos documentais: ainda mais contido.
- Intervalo amarelo: desenho de roda com rotação pequena, sem números de diagnóstico.
- LOCAL e rodapé: preservar leitura, fotografia e CTA; evitar efeitos repetidos sem função.

O arquivo `animation/render_hero.py` reproduz a edição entregue com FFmpeg. Os PNGs nativos são a origem; os WebPs servem ao site e à renderização.

