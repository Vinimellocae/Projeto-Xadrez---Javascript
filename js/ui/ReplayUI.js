export class ReplayUI {
    constructor(boardUI, historyUI, Estados) {
        this.boardUI = boardUI
        this.historyUI = historyUI
        this.Estados = Estados

        this.BotaoAntes = document.querySelector('#Antes')
        this.BotaoDepois = document.querySelector('#Depois')
        this.BotaoAntes.addEventListener('click', this.LanceAnterior.bind(this))
        this.BotaoDepois.addEventListener('click', this.LancePosterior.bind(this))

        this.estadoAtual = null
    }

    LanceAnterior() {
        const Estado = this.Estados.LanceAnterior()

        if (Estado) {
            this.AtualizarInterfaceModoExibicao(Estado)
        }
    }

    LancePosterior() {
        const Estado = this.Estados.LancePosterior()

        if (Estado) {
            this.AtualizarInterfaceModoExibicao(Estado)
        }
    }

    AtualizarInterfaceModoExibicao(Estado) {
        this.boardUI.limparSelecao()
        this.boardUI.RenderizarPecas(Estado.pecas)

        if (Estado.info) {
            this.boardUI.marcarCasasDoUltimoLance(Estado.info.origem, Estado.info.destino)
        }

        this.TratarBotoesDeControle(Estado)
    }

    TratarBotoesDeControle(Estado = null) {
        const indiceAtual = Estado ? Estado.indice : this.Estados.numeroEstado
        const ultimoIndice = this.Estados.numeroEstado

        this.BotaoAntes.disabled = indiceAtual <= 0
        this.BotaoDepois.disabled = indiceAtual >= ultimoIndice
    }
}