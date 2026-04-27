export class CapturedUI {
    constructor(jogo) {
        this.jogo = jogo
        this.corDoJogador = this.jogo.cor
        
        this.barraDoAdversario = document.querySelector('#barra-adversario')
        this.barraDoJogador = document.querySelector('#barra-jogador')
        this.pontosEl = document.createElement('p')
        this.pontosEl.classList.add('pontos')

        this.arrayCapturadas = []
        this.pontos = this.jogo.RetornarDisplayDePontos()
    }

    ExibirPecasCapturadas(peca) {
        this.arrayCapturadas.push(peca)

        if (peca.cor === this.corDoJogador) {
            this.pontos -= peca.pontos
        } else {
            this.pontos += peca.pontos
        }

        const imagemPeca = document.createElement('img')
        imagemPeca.src = `/imgs/${simbolos[peca.cor][peca.tipo]}`
        imagemPeca.classList.add('imagem-da-barra-dos-jogadores')

        if (peca.cor === this.corDoJogador) {
            this.barraDoAdversario.appendChild(imagemPeca)
        } else {
            this.barraDoJogador.appendChild(imagemPeca)
        }

        this.AtualizarPontos()
    }

    AtualizarPontos() {
        this.pontosEl.remove()

        if (this.pontos === 0) return

        this.pontosEl.textContent = `+${Math.abs(this.pontos)}`

        if (this.pontos > 0) {
            this.barraDoJogador.appendChild(this.pontosEl)
        } else {
            this.barraDoAdversario.appendChild(this.pontosEl)
        }
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