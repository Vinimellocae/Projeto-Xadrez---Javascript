import { IA } from "../controllers/bot.js"
import { Historic } from "./historic.js"

export class Game {
  constructor(cor) {
    this.pecas = PosicaoInicial()
    this.turno = 'branco'
    this.peaoEnPassant = null
    this.historico = []
    this.cor = cor
    this.infoDoUltimoLance
    this.fimDeJogo = false
    this.resultadoFinal = null
    this.Estados = new Historic(
      this.pecas.map(p => ({ ...p }))
    )
  }

  configurarModo(modo, onUpdate) {
    this.modo = modo
    this.onUpdate = onUpdate

    if (modo === 'bot') {
      this.bot = new IA(this, this.cor === 'branco' ? 'preto' : 'branco')

      if (this.bot.cor === 'branco') {
        this.executarTurnoDoBot()
      }
    }
  }

  buscarPeca(posicao) {
    return this.pecas.find(p => p.posicao === posicao)
  }

  mover(origem, destino) {
    if (this.fimDeJogo) return null

    const peca = this.buscarPeca(origem)
    if (!peca) return null
    if (peca.cor !== this.turno) return null

    if (!this.validarMovimento(peca, destino)) return null

    const resultado = this.aplicarMovimento(peca, destino)

    if (this.fimDeJogo) {
      this.infoDoUltimoLance = resultado
      return resultado
    }

    if (this.modo === 'bot' && resultado.promocao) {
      if (peca.cor === this.bot.cor) {
        const resultadoPromocaoBot = this.promocao(peca, this.bot.promocao(), origem, resultado.houveCaptura, resultado.roque)
        this.infoDoUltimoLance = resultadoPromocaoBot

        return resultadoPromocaoBot
      }
    }

    if (!resultado.promocao) {
      this.trocarTurno()
      this.infoDoUltimoLance = resultado
      this.Estados.AdicionarAoHistorico(this.pecas, this.infoDoUltimoLance)
    }

    return resultado
  }

  trocarTurno() {
    if (this.fimDeJogo) return

    this.turno = this.turno === 'branco' ? 'preto' : 'branco'
    this.executarTurnoDoBot()
  }

  aplicarMovimento(peca, destino) {
    let capturada = this.buscarPeca(destino)
    let houveCaptura = false
    let roque = null
    let promocao = false
    const origem = peca.posicao

    if (capturada) {
      this.pecas = this.pecas.filter(p => p !== capturada)
      houveCaptura = true
    }

    // Roque
    if (peca.tipo === 'rei') {
      const tipoDoRoque = this.identificarRoque(peca.posicao, destino)

      if (tipoDoRoque) {
        const { linha, coluna } = PosicaoParaIndice(peca.posicao)

        switch (tipoDoRoque) {
          case 'roque curto':
            const torreCurta = this.buscarPeca(IndiceParaPosicao(linha, 7))
            if (torreCurta) {
              torreCurta.posicao = IndiceParaPosicao(linha, coluna + 1)
              torreCurta.movida = true
              roque = 'O-O'
            }
            break;

          case 'roque longo':
            const torreLonga = this.buscarPeca(IndiceParaPosicao(linha, 0))
            if (torreLonga) {
              torreLonga.posicao = IndiceParaPosicao(linha, coluna - 1)
              torreLonga.movida = true
              roque = 'O-O-O'
            }
            break;
        }
      }
    }

    // En Passant
    if (peca.tipo === 'peao' && this.peaoEnPassant) {

      const { linha: linhaPeao, coluna: colunaPeao } = PosicaoParaIndice(this.peaoEnPassant.posicao)
      const { linha: linhaDestino, coluna: colunaDestino } = PosicaoParaIndice(destino)

      const capturaValida =
        peca.cor === 'branco'
          ? linhaDestino === linhaPeao - 1 && colunaDestino === colunaPeao
          : linhaDestino === linhaPeao + 1 && colunaDestino === colunaPeao

      if (capturaValida) {
        capturada = this.peaoEnPassant
        this.pecas = this.pecas.filter(p => p !== capturada)
        houveCaptura = true
      }
    }

    let notacao

    const estado = this.executarMovimentoSimulado(origem, destino); {

      peca.posicao = destino
      peca.movida = true

      // Promocao
      if (peca.tipo === 'peao') {
        const casaDePromocao = peca.cor === 'branco' ? '8' : '1'

        if (destino[1] === casaDePromocao) {
          promocao = true
        }
      }

      this.VerificarSeEAlvoDeEnPassant(peca, origem)

      const status = this.statusDoJogo(peca)

      this.VerificarFimDeJogo(status)


      if (!promocao) {
        this.desfazerMovimentoSimulado(estado)
        notacao = this.gerarNotacao(peca, destino, origem, houveCaptura, status, roque)
        this.historico.push(notacao)
      } else {
        this.desfazerMovimentoSimulado(estado)
      }
    }

    peca.posicao = destino
    peca.movida = true

    this.VerificarSeEAlvoDeEnPassant(peca, origem)

    const status = this.statusDoJogo(peca)

    this.VerificarFimDeJogo(status)

    return {
      sucesso: true,
      peca,
      destino,
      origem,
      capturada,
      houveCaptura,
      roque,
      promocao,
      status,
      notacao,
      cor: peca.cor
    }
  }

  calcularMovimentos(peca) {
    switch (peca.tipo) {
      case "peao":
        return this.MovimentoPeao(peca)
      case "cavalo":
        return this.MovimentoCavalo(peca)
      case "bispo":
        return this.MovimentoBispo(peca)
      case "torre":
        return this.MovimentoTorre(peca)
      case "rainha":
        return this.MovimentoRainha(peca)
      case "rei":
        return this.MovimentoRei(peca)

      default:
        return []
    }
  }

  ObterMovimentosLegais(posicao) {
    const Peca = this.buscarPeca(posicao)

    const Movimentos = this.calcularMovimentos(Peca)
    let MovimentosLegais = []

    Movimentos.forEach(m => {
      if (this.validarMovimento(Peca, m)) {
        MovimentosLegais.push(m)
      }
    })

    return MovimentosLegais
  }

  MovimentoPeao(peca, somenteAtaque = false) {
    const movimentos = []
    const { linha, coluna } = PosicaoParaIndice(peca.posicao)
    let direcoes = []

    if (!somenteAtaque) {

      const PrimeiraCasaBloqueada = peca.cor === 'branco'
        ? this.buscarPeca(IndiceParaPosicao(linha - 1, coluna))
        : this.buscarPeca(IndiceParaPosicao(linha + 1, coluna))

      // Primeiro movimento
      if (peca.cor === 'branco' && !PrimeiraCasaBloqueada) direcoes.push(-1)
      if (peca.cor === 'preto' && !PrimeiraCasaBloqueada) direcoes.push(1)

      const PossuiDirecao = direcoes.length === 1

      // Segundo movimento
      if (PossuiDirecao && !peca.movida) {
        const SegundaCasaBloqueada = this.buscarPeca(IndiceParaPosicao(linha + direcoes[0] * 2, coluna))

        if (!SegundaCasaBloqueada) {
          direcoes.push(direcoes[0] * 2)
        }
      }
    }

    // En Passant
    if (this.peaoEnPassant) {
      const capturaPossivel =
        this.peaoEnPassant.posicao === IndiceParaPosicao(linha, coluna + 1) ||
        this.peaoEnPassant.posicao === IndiceParaPosicao(linha, coluna - 1)

      if (capturaPossivel) {

        const { coluna: colunaPeao } = PosicaoParaIndice(this.peaoEnPassant.posicao)

        const capturaEnPassant = peca.cor === 'branco'
          ? IndiceParaPosicao(linha - 1, colunaPeao)
          : IndiceParaPosicao(linha + 1, colunaPeao)


        movimentos.push(capturaEnPassant)
      }
    }

    // Captura nas diagonais
    const CapturaNaDiagonal = peca.cor === 'branco'
      ? [-1, 1, -1]
      : [1, -1, 1]

    const Captura1 = IndiceParaPosicao(linha + CapturaNaDiagonal[0], coluna + CapturaNaDiagonal[1])
    const Captura2 = IndiceParaPosicao(linha + CapturaNaDiagonal[0], coluna + CapturaNaDiagonal[2])

    const alvo1 = this.buscarPeca(Captura1)
    const alvo2 = this.buscarPeca(Captura2)

    if (alvo1 && alvo1.cor != peca.cor) movimentos.push(Captura1)
    if (alvo2 && alvo2.cor != peca.cor) movimentos.push(Captura2)

    direcoes.forEach(direcao => {
      const novaLinha = linha + direcao

      if (novaLinha >= 0 && novaLinha < 8) {
        const novaPosicao = IndiceParaPosicao(novaLinha, coluna)

        if (!this.buscarPeca(novaPosicao)) {
          movimentos.push(novaPosicao)
        }
      }
    })

    return movimentos
  }

  MovimentoCavalo(peca) {
    const movimentos = []
    const { linha, coluna } = PosicaoParaIndice(peca.posicao)

    const movimentoCavaloEmLinha = [2, 2, -2, -2, 1, -1, 1, -1]
    const movimentoCavaloEmColuna = [-1, 1, 1, -1, 2, 2, -2, -2]

    for (let i = 0; i < movimentoCavaloEmColuna.length; i++) {

      const novaLinha = movimentoCavaloEmLinha[i] + linha
      const novaColuna = movimentoCavaloEmColuna[i] + coluna

      if (novaLinha < 0 || novaLinha > 7 || novaColuna < 0 || novaColuna > 7) {
        continue
      }

      const novaPosicao = IndiceParaPosicao(novaLinha, novaColuna)
      const pecaNaCasa = this.buscarPeca(novaPosicao)

      if (!this.buscarPeca(novaPosicao)) {
        movimentos.push(novaPosicao)
      }
      else if (pecaNaCasa.cor != peca.cor) {
        movimentos.push(novaPosicao)
      }
    }

    return movimentos
  }

  MovimentoBispo(peca) {
    const movimentos = []
    const { linha, coluna } = PosicaoParaIndice(peca.posicao)

    const direcoes = [
      [1, 1],
      [1, -1],
      [-1, -1],
      [-1, 1],
    ]

    direcoes.forEach(([dLinha, dColuna]) => {
      let novaLinha = linha + dLinha
      let novaColuna = coluna + dColuna

      while (novaLinha >= 0 && novaLinha <= 7 && novaColuna >= 0 && novaColuna <= 7) {
        const novaPosicao = IndiceParaPosicao(novaLinha, novaColuna)
        const PecaNoCaminho = this.buscarPeca(novaPosicao)

        if (!PecaNoCaminho) {
          movimentos.push(novaPosicao)
        }
        else if (PecaNoCaminho.cor !== peca.cor) {
          movimentos.push(novaPosicao)
          break
        }
        else {
          break
        }

        novaLinha += dLinha
        novaColuna += dColuna
      }
    })

    return movimentos
  }

  MovimentoTorre(peca) {
    const movimentos = []
    const { linha, coluna } = PosicaoParaIndice(peca.posicao)

    const direcoes = [
      [-1, 0],
      [1, 0],
      [0, 1],
      [0, -1],
    ]

    direcoes.forEach(([dLinha, dColuna]) => {
      let novaLinha = linha + dLinha
      let novaColuna = coluna + dColuna

      while (novaLinha >= 0 && novaLinha <= 7 && novaColuna >= 0 && novaColuna <= 7) {
        const novaPosicao = IndiceParaPosicao(novaLinha, novaColuna)
        const PecaNoCaminho = this.buscarPeca(novaPosicao)

        if (!PecaNoCaminho) {
          movimentos.push(novaPosicao)
        } else if (PecaNoCaminho.cor !== peca.cor) {
          movimentos.push(novaPosicao)
          break
        } else {
          break
        }

        novaLinha += dLinha
        novaColuna += dColuna
      }
    })

    return movimentos
  }

  MovimentoRainha(peca) {
    const movimentos = []
    const { linha, coluna } = PosicaoParaIndice(peca.posicao)

    const direcoes = [
      [-1, 0],
      [1, 0],
      [0, 1],
      [0, -1],
      [1, 1],
      [1, -1],
      [-1, -1],
      [-1, 1],
    ]

    direcoes.forEach(([dLinha, dColuna]) => {
      let novaLinha = linha + dLinha
      let novaColuna = coluna + dColuna

      while (novaLinha >= 0 && novaLinha <= 7 && novaColuna >= 0 && novaColuna <= 7) {
        const novaPosicao = IndiceParaPosicao(novaLinha, novaColuna)

        const PecaNoCaminho = this.buscarPeca(novaPosicao)

        if (!PecaNoCaminho) {
          movimentos.push(novaPosicao)
        } else if (PecaNoCaminho.cor !== peca.cor) {
          movimentos.push(novaPosicao)
          break
        } else {
          break
        }

        novaLinha += dLinha
        novaColuna += dColuna
      }
    })

    return movimentos
  }

  MovimentoRei(peca, semRoque = false) {
    const movimentos = []
    const { linha, coluna } = PosicaoParaIndice(peca.posicao)

    const direcoes = [
      [-1, 0],
      [1, 0],
      [0, 1],
      [0, -1],
      [1, 1],
      [1, -1],
      [-1, -1],
      [-1, 1],
    ]

    direcoes.forEach(([dLinha, dColuna]) => {
      let novaLinha = linha + dLinha
      let novaColuna = coluna + dColuna

      if (novaLinha >= 0 && novaLinha <= 7 && novaColuna >= 0 && novaColuna <= 7) {
        const novaPosicao = IndiceParaPosicao(novaLinha, novaColuna)
        const PecaNoCaminho = this.buscarPeca(novaPosicao)

        if (!PecaNoCaminho) {
          movimentos.push(novaPosicao)
        }
        else if (PecaNoCaminho.cor !== peca.cor) {
          movimentos.push(novaPosicao)
        }
        else {
        }
      }
    })

    if (!semRoque) {
      movimentos.push(...this.Roque(peca))
    }

    return movimentos
  }

  ReiEstaEmCheck(cor) {
    const rei = this.pecas.find(p => p.tipo === 'rei' && p.cor === cor)
    const inimigos = this.pecas.filter(p => p.cor !== cor)

    if (!rei) {
      return false
    }

    for (let i = 0; i < inimigos.length; i++) {
      const movimentos = this.CalcularMovimentosSemRoque(inimigos[i])

      if (movimentos.includes(rei.posicao)) {
        return true
      }
    }

    return false
  }

  validarMovimento(peca, destino) {

    const movimentosPossiveis = this.calcularMovimentos(peca)
    const origem = peca.posicao

    if (!movimentosPossiveis.includes(destino)) {
      return false
    }

    const estado = this.executarMovimentoSimulado(origem, destino)

    const emCheck = this.ReiEstaEmCheck(peca.cor)

    this.desfazerMovimentoSimulado(estado)

    return !emCheck
  }

  executarMovimentoSimulado(origem, destino) {
    const Peca = this.buscarPeca(origem)
    let Capturada = this.buscarPeca(destino)

    if (!Capturada && Peca.tipo === 'peao' && this.peaoEnPassant) {
      const { linha: linhaPeao, coluna: colunaPeao } = PosicaoParaIndice(this.peaoEnPassant.posicao)
      const { linha: linhaDestino, coluna: colunaDestino } = PosicaoParaIndice(destino)

      const capturaValida =
        Peca.cor === 'branco'
          ? linhaDestino === linhaPeao - 1 && colunaDestino === colunaPeao
          : linhaDestino === linhaPeao + 1 && colunaDestino === colunaPeao

      if (capturaValida) {
        Capturada = this.peaoEnPassant
      }
    }

    const EstadoAnterior = {
      Peca,
      posicaoOriginal: Peca.posicao,
      Capturada,
      pecas: [...this.pecas],
      enPassantAlvo: this.peaoEnPassant,
      turno: this.turno
    }

    Peca.posicao = destino

    if (Capturada) {
      this.pecas = this.pecas.filter(p => p !== Capturada)
    }

    return EstadoAnterior
  }

  desfazerMovimentoSimulado(EstadoAnterior) {
    EstadoAnterior.Peca.posicao = EstadoAnterior.posicaoOriginal
    this.pecas = EstadoAnterior.pecas
    this.turno = EstadoAnterior.turno
    this.peaoEnPassant = EstadoAnterior.enPassantAlvo
  }

  statusDoJogo(peca) {
    const inimigos = this.pecas.filter(p => p.cor !== peca.cor)
    let existeMovimentoLegal = false

    for (let i = 0; i < inimigos.length; i++) {
      const movimentos = this.calcularMovimentos(inimigos[i])

      for (let j = 0; j < movimentos.length; j++) {
        if (this.validarMovimento(inimigos[i], movimentos[j])) {
          existeMovimentoLegal = true
          break
        }
      }
    }

    const corDoAdversario = peca.cor === 'branco' ? 'preto' : 'branco'

    if (!existeMovimentoLegal && this.ReiEstaEmCheck(corDoAdversario)) {
      return 'checkmate'
    }

    if (!existeMovimentoLegal && !this.ReiEstaEmCheck(corDoAdversario)) {
      return 'empate'
    }

    if (this.VerificarEmpatePorMaterialInsuficiente()) {
      return 'material insuficiente'
    }

    return null
  }

  Roque(peca) {
    let movimentos = []

    if (!peca.movida && !this.ReiEstaEmCheck(peca.cor) && peca.cor === this.turno) {

      const { caminhoCurtoLivre, caminhoLongoLivre } = this.caminhoLivreParaRoque(peca)
      const { linha, coluna } = PosicaoParaIndice(peca.posicao)

      const torreCurta = this.buscarPeca(IndiceParaPosicao(linha, 7))

      const PodeRocarCurto =
        caminhoCurtoLivre &&
        torreCurta &&
        torreCurta.tipo === 'torre' &&
        !torreCurta.movida

      if (PodeRocarCurto) {
        movimentos.push(IndiceParaPosicao(linha, coluna + 2))
      }

      const torreLonga = this.buscarPeca(IndiceParaPosicao(linha, 0))

      const PodeRocarLongo =
        caminhoLongoLivre &&
        torreLonga &&
        torreLonga.tipo === 'torre' &&
        !torreLonga.movida

      if (PodeRocarLongo) {
        movimentos.push(IndiceParaPosicao(linha, coluna - 2))
      }
    }

    return movimentos
  }

  VerificarEmpatePorMaterialInsuficiente() {
    const pecasSemRei = this.pecas.filter(p => p.tipo !== 'rei')

    if (pecasSemRei.length === 0) return true

    if (pecasSemRei.length === 1) {
      const tipo = pecasSemRei[0].tipo
      return tipo === 'bispo' || tipo === 'cavalo'
    }

    if (pecasSemRei.length === 2) {
      const [p1, p2] = pecasSemRei

      if (p1.tipo === 'bispo' && p2.tipo === 'bispo') {

        const corCasa = (pos) => {
          const { linha, coluna } = PosicaoParaIndice(pos)
          return (linha + coluna) % 2
        }

        return corCasa(p1.posicao) === corCasa(p2.posicao)
      }
    }

    return false
  }

  gerarNotacao(peca, destino, origem, houveCaptura, status, roque, promocao = null) {
    const checkmate = status === 'checkmate'
    const check = this.ReiEstaEmCheck(peca.cor === 'branco' ? 'preto' : 'branco')
    const sufixo = checkmate ? '#' : check ? '+' : ''

    if (roque) {
      return `${roque}${sufixo}`
    }

    const PecasIguais = this.pecas.filter(p => p.tipo === peca.tipo && p.cor === peca.cor)

    const concorrentes = PecasIguais.filter(p => {
      if (p === peca) return false

      const movimentos = this.ObterMovimentosLegais(p.posicao)

      return movimentos.some(m => m === destino)
    })

    const haAmbiguidade = concorrentes.length > 0

    const colunaOrigem = origem[0]
    const linhaOrigem = origem[1]

    if (peca.tipo === 'peao' || promocao) {
      const promo = promocao ? `=${promocao}` : ''
      if (houveCaptura) return `${colunaOrigem}x${destino}${promo}${sufixo}`

      return `${destino}${promo}${sufixo}`
    }

    if (haAmbiguidade) {
      const mesmaColuna = concorrentes.some(p => p.posicao[0] === colunaOrigem)
      const mesmaLinha = concorrentes.some(p => p.posicao[1] === linhaOrigem)
      let desambiguacao = ''

      if (mesmaColuna && mesmaLinha) {
        desambiguacao = origem
      } else if (mesmaColuna) {
        desambiguacao = linhaOrigem
      } else if (mesmaLinha) {
        desambiguacao = colunaOrigem
      } else {
        desambiguacao = colunaOrigem
      }

      if (houveCaptura) return `${peca.notacao}${desambiguacao}x${destino}${sufixo}`
      return `${peca.notacao}${desambiguacao}${destino}${sufixo}`
    }
    else {
      if (houveCaptura) return `${peca.notacao}x${destino}${sufixo}`
      return `${peca.notacao}${destino}${sufixo}`
    }
  }

  caminhoLivreParaRoque(rei) {
    const { linha, coluna } = PosicaoParaIndice(rei.posicao)
    const CasasRoqueCurto = [
      IndiceParaPosicao(linha, coluna + 1),
      IndiceParaPosicao(linha, coluna + 2)
    ]

    const CasasRoqueLongo = [
      IndiceParaPosicao(linha, coluna - 1),
      IndiceParaPosicao(linha, coluna - 2),
      IndiceParaPosicao(linha, coluna - 3),
    ]

    const AtaqueInimigo = []
    const Inimigos = this.pecas.filter(p => p.cor != rei.cor)

    Inimigos.forEach(inimigo => {
      const movimentosDoInimigo = this.CalcularMovimentosSemRoque(inimigo)
      AtaqueInimigo.push(...movimentosDoInimigo)
    })

    const CasasCurtasEstaoSendoAtacadas = CasasRoqueCurto.some(c => AtaqueInimigo.includes(c))
    const CasasLongasEstaoSendoAtacadas = CasasRoqueLongo.some(c => AtaqueInimigo.includes(c))

    const caminhoCurtoLivre =
      !this.buscarPeca(CasasRoqueCurto[0]) &&
      !this.buscarPeca(CasasRoqueCurto[1]) &&
      !CasasCurtasEstaoSendoAtacadas

    const caminhoLongoLivre =
      !this.buscarPeca(CasasRoqueLongo[0]) &&
      !this.buscarPeca(CasasRoqueLongo[1]) &&
      !this.buscarPeca(CasasRoqueLongo[2]) &&
      !CasasLongasEstaoSendoAtacadas

    return { caminhoCurtoLivre, caminhoLongoLivre }
  }

  CalcularMovimentosSemRoque(peca) {
    if (peca.tipo === 'rei') {
      return this.MovimentoRei(peca, true)
    }
    if (peca.tipo === 'peao') {
      return this.MovimentoPeao(peca, true)
    }
    return this.calcularMovimentos(peca)
  }

  VerificarSeEAlvoDeEnPassant(peca, posicaoAntiga) {
    if (peca.tipo !== 'peao') {
      this.peaoEnPassant = null
      return
    }

    const { linha, coluna } = PosicaoParaIndice(posicaoAntiga)

    if (IndiceParaPosicao(linha + 2, coluna) === peca.posicao) {
      this.peaoEnPassant = peca
      return
    }

    if (IndiceParaPosicao(linha - 2, coluna) === peca.posicao) {
      this.peaoEnPassant = peca
      return
    }

    this.peaoEnPassant = null
    return
  }

  VerificarFimDeJogo(status) {
    if (status) {
      this.fimDeJogo = true
      this.resultadoFinal = status
    }
  }

  promocao(peca, valor, posicaoAntiga, houveCaptura, roque) {
    switch (valor) {
      case 0:
        peca.tipo = 'cavalo'
        peca.notacao = 'N'
        peca.pontos = 3
        break
      case 1:
        peca.tipo = 'bispo'
        peca.notacao = 'B'
        peca.pontos = 3
        break
      case 2:
        peca.tipo = 'torre'
        peca.notacao = 'R'
        peca.pontos = 5
        break
      case 3:
        peca.tipo = 'rainha'
        peca.notacao = 'Q'
        peca.pontos = 9
        break
    }

    const status = this.statusDoJogo(peca)

    this.VerificarFimDeJogo(status)

    const notacaoDoMovimento = this.gerarNotacao(
      peca, peca.posicao, posicaoAntiga,
      houveCaptura, status,
      roque, peca.notacao
    )

    this.historico.push(notacaoDoMovimento)

    if (this.infoDoUltimoLance) {
      this.infoDoUltimoLance.notacao = notacaoDoMovimento
    }

    this.trocarTurno()

    const resultado = {
      sucesso: true,
      peca,
      origem: posicaoAntiga,
      destino: peca.posicao,
      houveCaptura,
      capturada: null,
      status,
      notacao: notacaoDoMovimento,
      cor: peca.cor
    }

    this.infoDoUltimoLance = resultado

    this.Estados.AdicionarAoHistorico(this.pecas, this.infoDoUltimoLance)

    return resultado
  }

  executarTurnoDoBot() {
    if (this.fimDeJogo) return null

    if (this.modo === 'bot' && this.bot && this.turno === this.bot.cor) {

      setTimeout(() => {
        const lance = this.bot.lanceDaIA()

        if (lance) {
          this.mover(lance.origem, lance.destino)
        }

        if (this.onUpdate) {
          this.onUpdate()
        }

      }, 1100)
    }
  }

  identificarRoque(posicaoAntiga, posicaoNova) {

    const { linha, coluna } = PosicaoParaIndice(posicaoAntiga)

    if (IndiceParaPosicao(linha, coluna - 2) === posicaoNova) {
      return 'roque longo'
    } else if (IndiceParaPosicao(linha, coluna + 2) === posicaoNova) {
      return 'roque curto'
    }

    return null
  }

  RetornarVencedor(resultado) {
    switch (resultado) {
      case 'desistencia':
        return this.turno === 'branco' ? 'Pretas' : 'Brancas'
      case 'checkmate':
        return this.turno === 'branco' ? 'Brancas' : 'Pretas'
      case 'tempo':
        return this.VencedorPorTempoEsgotado()
      default:
        return false
    }
  }

  VencedorPorTempoEsgotado() {
    // Melhorar lógica depois

    const VitoriaDoAdversario = this.turno === 'branco' ? 'Pretas' : 'Brancas'
    const adversario = this.turno === 'branco' ? 'preto' : 'branco'
    const PecasAdversario = this.pecas.filter(p => p.cor === adversario && p.tipo !== 'rei');

    const DerrotaCerta = ['peao', 'torre', 'rainha']

    if(PecasAdversario.some(p => DerrotaCerta.includes(p.tipo))) {
      return VitoriaDoAdversario
    }

    const PossuiCavaloEBispo = 
      PecasAdversario.some(p => p.tipo === 'bispo') && 
      PecasAdversario.some(p => p.tipo === 'cavalo')
    
    if(PossuiCavaloEBispo) {
      return VitoriaDoAdversario
    }

    const Bispos = PecasAdversario.filter(p => p.tipo === 'bispo')
    
    if(Bispos.length > 1) {
      return VitoriaDoAdversario
    }

    return false
  }

  Desistencia() {
    this.resultadoFinal = 'desistencia'
    this.fimDeJogo = true
  }

  RetornarDisplayDePontos() {
    let material = 0

    this.pecas.forEach(p => {
      if (p.cor === this.cor) {
        material -= p.pontos
      } else {
        material += p.pontos
      }
    })

    return material
  }
}

class Peca {
  constructor(tipo, cor, pontos, posicao, notacao) {
    this.tipo = tipo
    this.cor = cor
    this.posicao = posicao
    this.movida = false
    this.pontos = pontos
    this.notacao = notacao
    this.id = null
  }
}

function PosicaoParaIndice(posicao) {
  const coluna = posicao.charCodeAt(0) - 97
  const linha = 8 - parseInt(posicao[1])
  return { linha, coluna }
}

function IndiceParaPosicao(linha, coluna) {
  const letra = String.fromCharCode(97 + coluna)
  const numero = 8 - linha
  return letra + numero
}

function PosicaoInicial() {
  const pecas = []

  const pontos = [5, 3, 3, 9, 0, 3, 3, 5]
  const ordem = ['torre', 'cavalo', 'bispo', 'rainha', 'rei', 'bispo', 'cavalo', 'torre']
  const notacao = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']

  for (let i = 0; i < 8; i++) {
    let coluna = String.fromCharCode(97 + i)

    pecas.push(new Peca(ordem[i], 'branco', pontos[i], coluna + '1', notacao[i]))
    pecas.push(new Peca(ordem[i], 'preto', pontos[i], coluna + '8', notacao[i]))

    pecas.push(new Peca('peao', 'branco', 1, coluna + '2', ''))
    pecas.push(new Peca('peao', 'preto', 1, coluna + '7', ''))
  }

  for (let i = 0; i < pecas.length; i++) {
    pecas[i].id = i
  }

  return pecas
}

function posicaoDeTestes() {
  const pecas = []

  const ordem = ['rei']
  const pontos = [0]
  const notacao = ['K']

  let coluna = String.fromCharCode(97)

  pecas.push(new Peca(ordem[0], 'branco', pontos[0], coluna + '1', notacao[0]))
  pecas.push(new Peca(ordem[0], 'preto', pontos[0], coluna + '8', notacao[0]))

  pecas.push(new Peca('peao', 'preto', 1, 'h' + '2', ''))
  pecas.push(new Peca('peao', 'branco', 1, coluna + '2', ''))

  return pecas
}