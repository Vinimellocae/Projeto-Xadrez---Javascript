import { ClockUI } from "./ClockUi.js"
import { BoardUI } from "./BoardUI.js"
import { BoardInteraction } from "./BoardInteraction.js"
import { PopUpUI } from "./PopUpUI.js"
import { ReplayUI } from "./ReplayUI.js"
import { HistoryUI } from "./HistoryUI.js"
import { CapturedUI } from "./CapturedUI.js"

export class UI {
    constructor(jogo, config) {
        this.jogo = jogo
        this.config = config
        this.orientacaoDoTabuleiro = this.config.CorDoJogador
        this.Estados = this.jogo.Estados

        this.Tabuleiro = new BoardUI(this.orientacaoDoTabuleiro, this.jogo)
        this.PopUps = new PopUpUI(this.jogo)
        this.Historico = new HistoryUI()
        this.Replay = new ReplayUI(this.Tabuleiro, this.Historico, this.jogo.Estados)
        this.Clock = new ClockUI(this.config, this.jogo)
        this.Interaction = new BoardInteraction(this.Tabuleiro, this.jogo)
        this.Capturas = new CapturedUI(this.jogo)
    }

    Iniciar() {
        this.Tabuleiro.RenderizarTabuleiro()
        this.Tabuleiro.RenderizarPecas(this.jogo.pecas)

        this.Tabuleiro.tabuleiro.addEventListener('click', this.Interaction.ManipuladorDeClicks.bind(this.Interaction))

        this.Interaction.onMovimento = (resultado) => {
            this.AtualizarInterface(resultado)
        }

        this.PopUps.onEscolherPromocao = (resultado) => {
            this.AtualizarInterface(resultado)
        }

        this.Interaction.onPromocao = (peca, origem, captura, roque) => {
            this.PopUps.ExibirPromocoes(peca, origem, captura, roque)
        }

        this.PopUps.onFimDeJogo = () => {
            this.Clock.pararRelogios()
        }

        this.Clock.onTimeEnd = () => {
            this.PopUps.ExibirTelaDeResultados('tempo')
        }

        this.Replay.TratarBotoesDeControle()
        this.Clock.iniciar()
    }

    AtualizarInterface(info) {
        this.Tabuleiro.limparSelecao()
        this.Tabuleiro.RenderizarPecas(this.jogo.pecas)
        this.Tabuleiro.marcarCasasDoUltimoLance(info.origem, info.destino)

        if (info.status) {
            setTimeout(() => {
                this.PopUps.ExibirTelaDeResultados(info.status)
            }, 200)
        }

        if (info.houveCaptura) {
            this.Capturas.ExibirPecasCapturadas(info.capturada)
        }

        this.Historico.atualizarHistorico(info.notacao, info.cor)

        this.Clock.trocarTurno()

        this.Replay.TratarBotoesDeControle()
    }
}