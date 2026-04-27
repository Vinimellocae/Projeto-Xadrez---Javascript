export class BoardInteraction {
    constructor(BoardUI, jogo) {
        this.BoardUI = BoardUI
        this.jogo = jogo
        this.Estados = this.jogo.Estados

        this.casaSelecionada = null

        this.onMovimento = null
        this.onPromocao = null
    }

    ManipuladorDeClicks(evento) {
        if (this.jogo.fimDeJogo) return

        let casa

        if (!this.Estados.EstaNoModoExibicao() && !this.jogo.fimDeJogo) {
            casa = evento.target.closest('[data-casa]')
        }

        if (!casa) return

        const posicao = casa.dataset.casa

        if (
            (
                casa.classList.contains('movimento-possivel') ||
                casa.classList.contains('captura')
            ) &&
            this.casaSelecionada &&
            !this.Estados.EstaNoModoExibicao()
        ) {
            const origem = this.casaSelecionada
            const resultado = this.jogo.mover(this.casaSelecionada, posicao)

            if (!resultado) return

            this.casaSelecionada = null

            if (resultado.promocao) {
                const peca = this.jogo.buscarPeca(posicao)

                if (this.onPromocao) {
                    this.onPromocao(peca, origem, resultado.houveCaptura, resultado.roque)
                }
            } else {
                if (this.onMovimento) {
                    this.onMovimento(resultado)
                }
            }
        }

        if (!this.jogo.fimDeJogo) {
            this.casaSelecionada = this.BoardUI.SelecionarCasa(posicao)
        }
    }
}

