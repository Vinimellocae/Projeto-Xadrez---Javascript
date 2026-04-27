export class Historic {
    constructor(posicaoInicial) {
        this.posicaoInicial = posicaoInicial
        this.estados = [{pecas: posicaoInicial, info: null, indice: 0}]
        this.numeroEstado = 0
        this.numeroVisualizacao = 0
    }

    AdicionarAoHistorico(pecas, info) {
        const copia = pecas.map(p => ({ ...p }))

        this.numeroEstado++
        this.estados.push({pecas: copia, info, indice: this.numeroEstado})
        this.numeroVisualizacao = this.numeroEstado
    }

    LanceAnterior() {
        if (this.numeroVisualizacao - 1 < 0) return

        this.numeroVisualizacao--

        return this.estados[this.numeroVisualizacao]
    }

    LancePosterior() {
        if (this.numeroVisualizacao >= this.numeroEstado) return

        this.numeroVisualizacao++

        return this.estados[this.numeroVisualizacao]
    }

    EstaNoModoExibicao() {
        if (this.numeroEstado !== this.numeroVisualizacao) return true
        return false
    }

}