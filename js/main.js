import { Game } from "./engine/game.js"
import { UI } from "./ui/ui.js"

const modo = window.location.hash.replace('#', '')

const configuracao = {
  CorDoJogador: 'preto',
  Tempo: 300 
}

const jogo = new Game(configuracao.CorDoJogador)
const ui = new UI(jogo, configuracao)

jogo.configurarModo(modo, () => {
  ui.AtualizarInterface(jogo.infoDoUltimoLance)
})

ui.Iniciar()

function escolherCor() {
  return Math.random() < 0.5 ? "branco" : "preto"
}