import { Timer } from "../engine/clock.js"

export class ClockUI {
    constructor(config, jogo) {
        this.relogios = {
            jogador1: document.querySelector('.relogio1'),
            jogador2: document.querySelector('.relogio2')
        }

        this.onTimeEnd = null
        this.orientacaoTabuleiro = config.CorDoJogador
        this.tempoInicial = config.Tempo
        this.clock = new Timer(this.tempoInicial, jogo)

        this.atualizar = this.atualizar.bind(this)
    }

    iniciar() {
        const tempoFormatado = this.clock.formatar(this.tempoInicial)

        this.relogios.jogador1.innerText = tempoFormatado
        this.relogios.jogador2.innerText = tempoFormatado

        this.clock.iniciar('jogador1', this.atualizar)
    }

    trocarTurno() {
        this.clock.trocar(this.atualizar)
    }

    atualizar(jogador, tempo, tempoEmSegundos) {
        const invertido = this.orientacaoTabuleiro !== 'branco'

        const alvo = invertido
            ? jogador
            : (jogador === 'jogador1' ? 'jogador2' : 'jogador1')

        this.relogios[alvo].innerText = tempo

        if (tempoEmSegundos <= 60) {
            this.relogios[alvo].classList.toggle("alerta")
        }

        if(this.clock.tempoEsgotado) {
            this.onTimeEnd()
        }
    }

    pararRelogios() {
        this.clock.parar()
    }
}