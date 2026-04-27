export class PGN {
    constructor(historico) {
        this.historico = historico
    }

    GerarPGN(status, turno) {
        let j = 1;
        let pgnString = ''

        const resultado = this.RetornarResultado(status, turno)

        for (let i = 0; i < this.historico.length; i++) {
            if (i % 2 === 0) {
                pgnString += `${j}. ${this.historico[i]} `
            } else {
                pgnString += `${this.historico[i]} `
                j++
            }
        }

        const header =
`[Event "Partida casual"]
[Date "${new Date().toISOString().slice(0, 10).replace(/-/g, '.')}"]
[White "Brancas"]
[Black "Pretas"]
[Result "${resultado}"]`

        return header + '\n\n' + pgnString + resultado
    }

    RetornarResultado(status, turno) {
        switch (status) {
            case 'empate':
                return '1/2 - 1/2'

            case 'material insuficiente':
                return '1/2 - 1/2'

            case 'checkmate':
                if (turno === 'preto') {
                    return '1-0'
                } else {
                    return '0-1'
                }

            case 'desistencia':
                if (turno === 'preto') {
                    return '1-0'
                } else {
                    return '0-1'
                }
        }
    }
}