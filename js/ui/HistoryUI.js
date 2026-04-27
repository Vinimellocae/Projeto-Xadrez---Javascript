export class HistoryUI {
    constructor() {
        this.tbody = document.querySelector('tbody')
        this.scroll = document.querySelector('.tabela-scroll')
        this.numeroLance = 0
        this.linhas = {}
    }

    atualizarHistorico(infoLance, cor) {

        if (cor === 'branco') {
            this.numeroLance++
            const tr = document.createElement('tr')

            this.linhas[this.numeroLance] = tr

            const numeroDoLance = document.createElement('td')
            numeroDoLance.innerText = this.numeroLance

            const td = document.createElement('td')
            td.innerText = infoLance

            this.tbody.append(tr)
            tr.append(numeroDoLance)
            tr.append(td)
            
        } else {
            const LinhaTabela = this.linhas[this.numeroLance]
            const DataTabela = document.createElement('td')
            DataTabela.innerText = infoLance

            if (LinhaTabela) {
                LinhaTabela.append(DataTabela)
            }
        }
    }

    isAtBottom() {
        return this.scroll.scrollTop + this.scroll.clientHeight >= this.scroll.scrollHeight - 5;
    }

    scrollToBottom() {
        const shouldScroll = this.isAtBottom()

        if (shouldScroll) {
            this.scroll.scrollTo({
                top: scroll.scrollHeight,
                behavior: "smooth"
            });
        }
    }
}