export class BoardUI {
    constructor(orientacao, jogo) {
        this.orientacaoDoTabuleiro = orientacao
        this.jogo = jogo
        this.tabuleiro = document.querySelector('.tabuleiro')
        this.casas = {}
    }

    RenderizarTabuleiro() {
        this.tabuleiro.innerHTML = ''
        this.casas = {}

        const colunas = this.orientacaoDoTabuleiro === 'branco'
            ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
            : ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a']

        const linhas = this.orientacaoDoTabuleiro === 'branco'
            ? [8, 7, 6, 5, 4, 3, 2, 1]
            : [1, 2, 3, 4, 5, 6, 7, 8]

        linhas.forEach((linha, indexLinha) => {
            colunas.forEach((coluna, indexColuna) => {

                const casa = document.createElement('div')
                const nomeDaCasa = `${coluna}${linha}`

                this.casas[nomeDaCasa] = casa

                const ehBranco = (indexLinha + indexColuna) % 2 === 0
                casa.classList.add(ehBranco ? 'casa-branca' : 'casa-preta')

                casa.dataset.casa = nomeDaCasa
                this.tabuleiro.appendChild(casa)

                if (indexColuna === 0) {
                    const numero = document.createElement('p')
                    numero.classList.add('numero')
                    numero.innerText = linha
                    numero.style.color = ehBranco ? "rgb(105, 92, 85)" : "rgb(224, 222, 185)"
                    casa.appendChild(numero)
                }

                if (indexLinha === 7) {
                    const letraFlutuante = document.createElement('p')
                    letraFlutuante.classList.add('letra')
                    letraFlutuante.innerText = coluna
                    letraFlutuante.style.color = ehBranco ? "rgb(105, 92, 85)" : "rgb(224, 222, 185)"
                    casa.appendChild(letraFlutuante)
                }

            })
        })
    }

    RenderizarPecas(pecas) {
        this.LimparPecasDoTabuleiro()

        pecas.forEach(peca => {
            const casa = this.casas[peca.posicao]

            if (!casa) return

            const elemento = document.createElement('img')
            elemento.classList.add('Pecas-de-Xadrez')

            elemento.src = `/imgs/${simbolos[peca.cor][peca.tipo]}`

            casa.appendChild(elemento)
        })
    }

    LimparPecasDoTabuleiro() {
        const Pecas = document.querySelectorAll('.Pecas-de-Xadrez')

        Pecas.forEach(p => p.remove())
    }

    SelecionarCasa(posicao) {
        this.limparSelecao()

        const peca = this.jogo.buscarPeca(posicao)

        if (peca && peca.cor === this.jogo.turno) {
            if (this.jogo.modo === 'bot' && this.orientacaoDoTabuleiro !== this.jogo.turno) {
                return
            }

            const casa = this.casas[posicao]
            casa.classList.add('casa-selecionada')

            const MovimentosLegais = this.jogo.ObterMovimentosLegais(posicao)

            if (MovimentosLegais.length > 0) {
                this.MostrarMovimentos(MovimentosLegais)
            }

            return posicao
        }
    }

    MostrarMovimentos(lista) {
        lista.forEach(posicao => {
            const casa = this.casas[posicao]

            if (this.jogo.pecas.find(p => p.posicao === posicao)) {
                casa.classList.add('captura')
            } else {
                casa.classList.add('movimento-possivel')
            }
        })
    }

    limparSelecao() {
        Object.values(this.casas).forEach(casa => {
            casa.classList.remove(
                'casa-selecionada',
                'movimento-possivel',
                'captura',
                'casa-origem',
                'casa-destino'
            )
        })
    }

    marcarCasasDoUltimoLance(origem, destino) {
        const casaOrigem = this.casas[origem]
        casaOrigem.classList.add('casa-origem')

        const casaDestino = this.casas[destino]
        casaDestino.classList.add('casa-destino')
    }
}

const simbolos = {
    branco: {
        rei: "white-king.png",
        rainha: "white-queen.png",
        torre: "white-rook.png",
        bispo: "white-bishop.png",
        cavalo: "white-knight.png",
        peao: "white-pawn.png"
    },
    preto: {
        rei: "black-king.png",
        rainha: "black-queen.png",
        torre: "black-rook.png",
        bispo: "black-bishop.png",
        cavalo: "black-knight.png",
        peao: "black-pawn.png"
    }
}