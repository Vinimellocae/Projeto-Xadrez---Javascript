export class Timer {
    constructor(tempoInicial, jogo) {
        this.jogo = jogo
        this.tempoInicial = tempoInicial

        this.tempos = {
            jogador1: tempoInicial,
            jogador2: tempoInicial
        }

        this.jogadorAtual = null
        this.interval = null
        this.tempoEsgotado = null
    }

    iniciar(jogador, callback) {
        this.parar()

        this.jogadorAtual = jogador
        this.callback = callback

        this.interval = setInterval(() => this.tick(), 1000)
    }

    tick() {
        const jogador = this.jogadorAtual

        this.tempos[jogador]--

        const tempo = this.tempos[jogador]
        const tempoFormatado = this.formatar(tempo)

        this.callback(jogador, tempoFormatado, tempo)

        if (this.tempoEsgotadoCheck(jogador)) {
            this.finalizar(jogador)
        }
    }

    trocar(callback) {
        this.jogadorAtual = this.getProximoJogador()
        this.iniciar(this.jogadorAtual, callback)
    }

    getProximoJogador() {
        return this.jogadorAtual === 'jogador1'
            ? 'jogador2'
            : 'jogador1'
    }

    tempoEsgotadoCheck(jogador) {
        return this.tempos[jogador] <= 0
    }

    finalizar(jogador) {
        this.parar()
        this.tempoEsgotado = jogador
        this.jogo.VerificarFimDeJogo('tempo')

        this.callback(jogador, "00:00", 0)
    }

    parar() {
        if (this.interval) {
            clearInterval(this.interval)
            this.interval = null
        }
    }

    formatar(segundosTotais) {
        const minutos = String(Math.floor(segundosTotais / 60)).padStart(2, '0')
        const segundos = String(segundosTotais % 60).padStart(2, '0')

        return `${minutos}:${segundos}`
    }
}