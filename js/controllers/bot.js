export class IA {
  constructor(game, cor) {
    this.game = game
    this.cor = cor
    this.corAdversario = this.cor === 'branco' ? 'preto' : 'branco'
    this.reiProtegido = false
    this.torresConectadas = false
    this.ultimoLance = null
  }

  GerarAtaques(cor) {
    const pecas = this.game.pecas.filter(p => p.cor === cor)
    const ataques = []

    for(const peca of pecas) {
      ataques.push(this.game.calcularMovimentos(peca))
    }

    return ataques
  }

  GerarMovimentos(cor) {
    const pecasDaRodada = this.game.pecas.filter(
      peca => peca.cor === cor
    )

    const lancesLegais = []

    pecasDaRodada.forEach(peca => {
      const lances = this.game.calcularMovimentos(peca)

      lances.forEach(destino => {
        if (this.game.validarMovimento(peca, destino)) {
          lancesLegais.push({
            origem: peca.posicao,
            destino: destino
          })
        }
      })
    })

    return lancesLegais
  }

  GerarMovimentosDePecaSingular(peca) {

    const movimentos = this.game.calcularMovimentos(peca)
    const movimentosLegais = []

    movimentos.forEach(destino => {
      if (this.game.validarMovimento(peca, destino)) {
        movimentosLegais.push({
          origem: peca.posicao,
          destino: destino
        })
      }
    })

    return movimentosLegais
  }

  sortearLance() {
    const lancesLegais = this.GerarMovimentos(this.cor)

    if (!lancesLegais.length) return null

    const bonsLances = this.filtrarLances(lancesLegais)

    return bonsLances[Math.floor(Math.random() * bonsLances.length)]
  }

  lanceDaIA() {
    const lance = this.sortearLance()

    if (this.game.identificarRoque(lance.origem, lance.destino)) {
      this.reiProtegido = true
    }

    this.ultimoLance = lance
    
    return lance
  }

  filtrarLances(lances) {
    const MelhoresLances = []
    const momento = this.identificarFaseDoJogo()
    let melhorPontuacao = -Infinity
    let pontuacao

    const pecasAmeacadas = this.IdentificarPecasAmeacadas(this.cor)

    for (const lance of lances) {
      pontuacao = 0

      // Chequemate
      if (this.OLanceEhUmCheck(lance) || this.OLanceEhUmaCaptura(lance)) {
        if (this.EncontrarCheckmate(lance)) {
          return [lance]
        }
      }

      if (pecasAmeacadas.length > 0) {
        pontuacao += this.AvaliarLancesQuandoPecasAmeacadas(pecasAmeacadas, lance)
      } else {
        pontuacao += this.AvaliarLances(momento, lance)
      }


      if (pontuacao > melhorPontuacao) {
        melhorPontuacao = pontuacao
        MelhoresLances.length = 0
        MelhoresLances.push(lance)
      }

      else if (pontuacao === melhorPontuacao) {
        MelhoresLances.push(lance)
      }

    }

    if (MelhoresLances.length > 0) {
      return MelhoresLances
    }

    return lances
  }

  AvaliarLances(momento, lance) {
    switch (momento) {
      case 'Abertura':
        return this.AvaliarLancesAbertura(lance)
      case 'Meio-jogo':
        return this.PontosExtrasUniversais(lance)
      case 'Final':
        return this.PontosExtrasUniversais(lance)
    }
  }

  AvaliarLancesQuandoPecasAmeacadas(pecas, lance) {
    const cor = pecas[0].cor
    let pontuacao = 0

    const estado = this.game.executarMovimentoSimulado(lance.origem, lance.destino)

    const movimentosAdversario = this.GerarMovimentos(cor === 'branco' ? 'preto' : 'branco')
    const pecaSimulada = this.game.buscarPeca(lance.destino)

    if (this.IdentificarPecasAmeacadas(cor).length === 0) {
      for (const peca of pecas) {
        pontuacao += peca.pontos
      }

      if (pecaSimulada.pontos <= 5) {
        pontuacao += 1.2
      }
    }

    const novasPecasAmecadas = this.IdentificarPecasAmeacadas(cor)

    if (this.IdentificarPecasAmeacadas(cor).length > 0) {

      for (const peca of pecas) {
        if (movimentosAdversario.some(m => m.destino === peca.posicao)) {
          pontuacao -= peca.pontos
        } else {
          pontuacao += peca.pontos
        }
      }

      if (novasPecasAmecadas.length > 0) {
        for (const peca of novasPecasAmecadas) {
          if (movimentosAdversario.some(m => m.destino === peca.posicao)) {
            pontuacao -= peca.pontos
          } else {
            pontuacao += peca.pontos
          }
        }
      }
    }

    this.game.desfazerMovimentoSimulado(estado)
    pontuacao += this.PontosExtrasUniversais(lance)

    return pontuacao
  }

  AvaliarLancesAbertura(lance) {
    let pontuacao = 0

    const casasCentrais = [
      "c3", "d3", "e3", "f3",
      "c4", "d4", "e4", "f4",
      "c5", "d5", "e5", "f5",
      "c6", "d6", "e6", "f6"
    ]

    const peca = this.game.buscarPeca(lance.origem)

    if (!peca) return -Infinity

    const estado = this.game.executarMovimentoSimulado(lance.origem, lance.destino)

    const pecaSimulada = this.game.buscarPeca(lance.destino)

    if (!pecaSimulada) {
      this.game.desfazerMovimentoSimulado(estado)
      return -Infinity
    }

    const ataquesDaPeca = this.GerarMovimentosDePecaSingular(pecaSimulada)
    const atacaOCentro = ataquesDaPeca.some(m => casasCentrais.includes(m.destino))
    const ataquesDeTodasAsPecas = this.GerarAtaques(this.cor)

    const MelhoresLancesDePeaoComDuasCasas = this.cor === 'branco' ? ['d3', 'e3', 'f3'] : ['d6', 'e6', 'f6']
    const MelhoresLancesDePeaoComUmaCasa = this.cor === 'branco' ? ['d4', 'e4'] : ['d5', 'e5', 'f5']
    const LancesRuinsDeCavalo = ['h6', 'a6', 'a3', 'h3']

    if (atacaOCentro) {
      pontuacao += 0.5
    }

    if (peca.tipo === 'peao' && MelhoresLancesDePeaoComDuasCasas.includes(lance.destino)) {
      pontuacao += 0.35
    }

    if (peca.tipo === 'peao' && MelhoresLancesDePeaoComUmaCasa.includes(lance.destino)) {
      pontuacao += 1
    }

    if (peca.tipo === 'cavalo' || peca.tipo === 'bispo') {
      pontuacao += 0.25

      if (!peca.movida) {
        pontuacao += 0.25
      }
    }

    if (peca.tipo === 'rainha' && this.OLanceEhUmaCaptura(lance)) {
      pontuacao += 0.4
    } else if (peca.tipo === 'rainha') {
      pontuacao -= 0.4
    }

    if (peca.tipo === 'torre') {
      if (this.reiProtegido) {
        pontuacao += 0.1
      } else {
        pontuacao -= 1.25
      }
    }

    if (peca.tipo === 'rei') {
      pontuacao -= 1
    }

    if (peca.tipo === 'cavalo') {
      if (LancesRuinsDeCavalo.includes(lance.destino)) {
        pontuacao -= 0.4
      }
    }

    if (peca.movida && (peca.tipo === 'cavalo' || peca.tipo === 'bispo')) {
      pontuacao -= 0.15
    }

    pontuacao += this.GerarMovimentosDePecaSingular(peca).length * 0.005
    pontuacao += ataquesDeTodasAsPecas.length * 0.002

    this.game.desfazerMovimentoSimulado(estado)

    const roque = this.game.identificarRoque(lance.origem, lance.destino)
    if (roque === 'roque curto' || roque === 'roque longo') {
      pontuacao += 2
    }

    pontuacao += this.PontosExtrasUniversais(lance)

    return pontuacao
  }

  AvaliarLancesMeioJogo(lance) {
    let pontuacao = 0

    const casasCentrais = [
      "c3", "d3", "e3", "f3",
      "c4", "d4", "e4", "f4",
      "c5", "d5", "e5", "f5",
      "c6", "d6", "e6", "f6"
    ]

    const peca = this.game.buscarPeca(lance.origem)

    if (!peca) return -Infinity

    const estado = this.game.executarMovimentoSimulado(lance.origem, lance.destino)

    this.game.desfazerMovimentoSimulado(estado)

  }

  PontosExtrasUniversais(lance) {
    let pontos = 0

    if (this.OLanceEhUmCheck(lance) && this.OLanceAtacaUmaPecaDeMaiorValor(lance)) {
      pontos += 1.4
    }

    if (this.OLanceEhUmCheck(lance)) {
      pontos += 0.3
    }

    if (this.OLanceAtacaUmaPecaDeMaiorValor(lance)) {
      pontos += 0.6
    }

    if (!this.OLanceEhUmaCaptura(lance)) {
      if (this.LanceEntregaMaterialDireto(lance)) {
        const pecasEntregadasDeGraca = this.IdentificarPecasAmeacadas(this.cor)
        let materialPerdido = []

        pecasEntregadasDeGraca.forEach(p => materialPerdido.push(p.pontos))
        materialPerdido.sort()

        pontos -= materialPerdido[materialPerdido.length - 1]
      }
    }

    if (this.OLanceEhUmaCaptura(lance)) {
      const pontuacaoDaCaptura = this.avaliarCaptura(lance)

      if (pontuacaoDaCaptura >= 0) {
        pontos += pontuacaoDaCaptura + 1.2
      } else {
        pontos += pontuacaoDaCaptura
      }
    }

    if (
      this.ultimoLance &&
      lance.origem === this.ultimoLance.destino &&
      lance.destino === this.ultimoLance.origem
    ) {
      pontos -= 2
    }

    return pontos
  }

  OLanceEhUmCheck(lance) {
    const estado = this.game.executarMovimentoSimulado(lance.origem, lance.destino)
    let ehCheck = false

    if (this.game.ReiEstaEmCheck(this.corAdversario)) {
      ehCheck = true
    }

    this.game.desfazerMovimentoSimulado(estado)
    return ehCheck
  }

  OLanceAtacaUmaPecaDeMaiorValor(lance) {
    const Peca = this.game.buscarPeca(lance.origem)
    const PecasAdversario = this.game.pecas.filter(p => p.cor !== Peca.cor)

    const estado = this.game.executarMovimentoSimulado(lance.origem, lance.destino)

    const movimentosDaPeca = this.GerarMovimentosDePecaSingular(Peca)

    const resultado = PecasAdversario.some(p => {
      return movimentosDaPeca.some(m => m.destino === p.posicao) &&
        p.pontos > Peca.pontos
    })

    this.game.desfazerMovimentoSimulado(estado)
    return resultado
  }

  LanceDeixaTorresConetadas(lance) {
    const peca = this.game.buscarPeca(lance.origem)

    const torres = this.game.pecas.filter(p => p.tipo === 'torre' && p.cor === peca.cor)

    if (torres.length < 2) {
      return false
    }

    const estado = this.game.executarMovimentoSimulado(lance.origem, lance.destino)

    const movimentosDaTorre = this.GerarMovimentos(torres[0])

    if (movimentosDaTorre.includes(torres[1]).posicao) {
      this.game.desfazerMovimentoSimulado(estado)
      return true
    }

    this.game.desfazerMovimentoSimulado(estado)
  }

  OLanceEhUmaCaptura(lance) {
    if (this.game.buscarPeca(lance.destino)) {
      return true
    }

    return false
  }

  promocao() {
    return 3
  }

  avaliarCaptura(lance) {
    const pecaAlvo = this.game.buscarPeca(lance.destino)
    const pecaDoBot = this.game.buscarPeca(lance.origem)

    if (!pecaAlvo) return 0

    if (this.pecaDoBotPodeSerCapturada(lance)) {
      return pecaAlvo.pontos - pecaDoBot.pontos
    }

    return pecaAlvo.pontos
  }

  pecaDoBotPodeSerCapturada(lance) {
    const estado = this.game.executarMovimentoSimulado(
      lance.origem,
      lance.destino
    )

    const movimentosAdversario = this.GerarMovimentos(this.corAdversario)

    const podeSerCapturada = movimentosAdversario.some(m => m.destino === lance.destino)

    this.game.desfazerMovimentoSimulado(estado)

    return podeSerCapturada
  }

  pecaEstaSendoDefendida(lance) {
    const pecaAtacada = this.game.buscarPeca(lance.destino)
    const pecaAtacante = this.game.buscarPeca(lance.origem)

    const estado = this.game.executarMovimentoSimulado(
      lance.origem,
      lance.destino
    )

    const movimentosDoBot = this.GerarMovimentos(this.cor)

    let pecaEstaDefendida = movimentosDoBot.some(m => m.destino === lance.destino)

    if (pecaEstaDefendida && pecaAtacada.pontos <= pecaAtacante.pontos) {
      pecaEstaDefendida = true
    } else {
      pecaEstaDefendida = false
    }

    this.game.desfazerMovimentoSimulado(estado)

    return pecaEstaDefendida
  }

  LanceEntregaMaterialDireto(lance) {

    if (this.pecaDoBotPodeSerCapturada(lance)) {

      if (!this.pecaEstaSendoDefendida(lance)) {
        return true
      }

      if (this.pecaEstaSendoDefendida(lance)) {
        return false
      }
    }

    return false
  }

  identificarFaseDoJogo() {
    const Material = this.contarMaterial()

    if (Material > 40) {
      return 'Abertura'
    }
    else if (Material > 20) {
      return 'Meio-jogo'
    }
    else {
      return 'Final'
    }
  }

  contarMaterial(cor = false) {
    const pecas = this.game.pecas
    let material = 0

    if (!cor) {
      pecas.forEach(p => {
        material += p.pontos
      })
    }

    if (cor) {
      pecas.forEach(p => {
        p.cor === cor ? material += p.pontos : null
      })
    }

    return material
  }

  EncontrarCheckmate(lance) {
    const estado = this.game.executarMovimentoSimulado(
      lance.origem,
      lance.destino
    )

    const movimentosDoAdversario = this.GerarMovimentos(this.corAdversario)

    const ehMateEmUm =
      this.game.ReiEstaEmCheck(this.corAdversario) &&
      movimentosDoAdversario.length === 0

    if (ehMateEmUm) {
      this.game.desfazerMovimentoSimulado(estado)
      return ehMateEmUm
    }

    // Calculando o mate em 2
    for (const movimento of movimentosDoAdversario) {
      const estado2 = this.game.executarMovimentoSimulado(
        movimento.origem,
        movimento.destino
      )

      const movimentosDoBot = this.GerarMovimentos(this.cor)

      let EncontrouMate = false

      for (const movimento2 of movimentosDoBot) {
        const estado3 = this.game.executarMovimentoSimulado(
          movimento2.origem,
          movimento2.destino
        )

        const novosMovimentosDoAdversario = this.GerarMovimentos(this.corAdversario)

        const ehMateEmDois =
          this.game.ReiEstaEmCheck(this.corAdversario) &&
          novosMovimentosDoAdversario.length === 0

        if (ehMateEmDois) {
          this.game.desfazerMovimentoSimulado(estado3)
          EncontrouMate = true
          break
        }

        this.game.desfazerMovimentoSimulado(estado3)
      }

      this.game.desfazerMovimentoSimulado(estado2)

      if (!EncontrouMate) {
        this.game.desfazerMovimentoSimulado(estado)
        return false
      }

    }

    this.game.desfazerMovimentoSimulado(estado)
    return true
  }

  LancePermiteCheckmate(lance) {
    const estado = this.game.executarMovimentoSimulado(
      lance.origem,
      lance.destino
    )

    const movimentosDoAdversario = this.GerarMovimentos(this.corAdversario)

    let resultado = false

    for (const m of movimentosDoAdversario) {
      const estado2 = this.game.executarMovimentoSimulado(
        m.origem,
        m.destino
      )
      const movimentosDoBot = this.GerarMovimentos(this.cor)

      if (this.game.ReiEstaEmCheck(this.cor) && movimentosDoBot.length === 0) {
        resultado = true
        this.game.desfazerMovimentoSimulado(estado2)
        break
      }

      this.game.desfazerMovimentoSimulado(estado2)
    }

    this.game.desfazerMovimentoSimulado(estado)

    return resultado

  }

  IdentificarPecasAmeacadas(cor) {
    const corOposta = cor === 'branco' ? 'preto' : 'branco'
    const movimentosDoAtacante = this.GerarMovimentos(corOposta)
    const posicaoDasPecasDoDefensor = []
    const pecasAtacadas = []

    this.game.pecas.forEach(p => {
      if (p.cor === cor) {
        posicaoDasPecasDoDefensor.push(p.posicao)
      }
    })

    movimentosDoAtacante.forEach(movimento => {
      posicaoDasPecasDoDefensor.forEach(p => {
        if (movimento.destino === p) {
          const defensora = this.game.buscarPeca(p)
          const atacante = this.game.buscarPeca(movimento.origem)

          if (this.ehhUmaAmeaca(defensora, atacante, movimento)) {
            if (!pecasAtacadas.includes(defensora)) {
              pecasAtacadas.push(defensora)
            }
          }
        }
      })
    })

    return pecasAtacadas
  }

  ehhUmaAmeaca(pecaAtacada, pecaAtacante, lance) {
    if (pecaAtacada.pontos > pecaAtacante.pontos) {
      return true
    }

    if (pecaAtacada.pontos === pecaAtacante.pontos) {
      if (this.pecaEstaSendoDefendida(lance)) {
        return false
      } else {
        return true
      }
    }

    if (pecaAtacada.pontos < pecaAtacante.pontos) {
      if (this.pecaEstaSendoDefendida(lance)) {
        return false
      } else {
        return true
      }
    }

    return false
  }
}