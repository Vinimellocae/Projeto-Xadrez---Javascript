import { PGN } from "../engine/PGN.js"

export class PopUpUI {
    constructor(jogo) {
        this.jogo = jogo

        this.ConteudoJogo = document.querySelector('#jogo')
        this.ContainerDePromocao = document.querySelector('.Promocao-Container')
        this.PopUpWrapper = document.querySelector('.popUp-wrapper')
        this.BotaoDesistir = document.querySelector('#Desistir')

        this.BotaoDesistir.addEventListener('click', this.Desistir.bind(this))
        this.onEscolherPromocao = null
        this.onFimDeJogo = null
    }

    ExibirTelaDeResultados(resultado) {
        const Content = criarElemento('div', 'popUp-content')
        const CopiarMovimentos = criarElemento('p', 'copiar-movimentos', 'Copiar Movimentos')
        const AnunciamentoVencedor = document.createElement('h1')
        const Derivado = document.createElement('p')

        CopiarMovimentos.addEventListener('click', async () => {
            const pgn = new PGN(this.jogo.historico)
            const pgnTexto = pgn.GerarPGN(this.jogo.resultadoFinal, this.jogo.turno)

            try {
                await navigator.clipboard.writeText(pgnTexto)

                CopiarMovimentos.innerText = 'Movimentos copiados!'
                CopiarMovimentos.classList.add('copiado')

                setTimeout(() => {
                    CopiarMovimentos.innerText = 'Copiar movimentos'
                    CopiarMovimentos.classList.remove('copiado')
                }, 2000)

            } catch (e) {
                console.log('Falha ao copiar PGN: ', e)
            }
        })

        const voltarParaOMenu = criarElemento('a', null, 'Voltar para o menu')
        voltarParaOMenu.href = './../index.html'

        let vencedor = this.jogo.RetornarVencedor(resultado)

        if (vencedor) {
            AnunciamentoVencedor.innerText = `Vitória das ${vencedor}`
        } else {
            AnunciamentoVencedor.innerText = 'Empate'
        }

        switch (resultado) {
            case 'tempo':
                Derivado.innerText = 'Por Tempo Esgotado'
                break
            case 'desistencia':
                Derivado.innerText = 'Por Desistência'
                break
            case 'checkmate':
                Derivado.innerText = 'Por Checkmate'
                break
            case 'material insuficiente':
                Derivado.innerText = 'Por Material Insuficiente'
                break
            case 'empate':
                Derivado.innerText = 'Por Afogamento'
                break
        }

        this.ConteudoJogo.classList.add('efeito-escuro')

        this.PopUpWrapper.appendChild(Content)
        Content.appendChild(AnunciamentoVencedor)
        Content.appendChild(Derivado)
        Content.appendChild(CopiarMovimentos)
        Content.appendChild(voltarParaOMenu)

        if (this.onFimDeJogo) {
            this.onFimDeJogo()
        }

        this.PopUpWrapper.style.display = 'block'
    }

    Desistir() {
        const Content = criarElemento('div', 'popUp-content')
        const Pergunta = criarElemento('h1', null, 'Tem certeza que deseja desistir?')

        const Desistir = criarElemento('button', 'botao-opcao', 'Desistir')
        Desistir.addEventListener('click', () => {
            this.jogo.Desistencia()
            this.PopUpWrapper.innerHTML = ''
            this.ExibirTelaDeResultados('desistencia')
        })

        const NaoDesistir = criarElemento('button', 'botao-opcao', 'Cancelar')
        NaoDesistir.addEventListener('click', () => {
            this.PopUpWrapper.innerHTML = ''
            this.ConteudoJogo.classList.remove('efeito-escuro')
            this.PopUpWrapper.style.display = 'none'
        })

        this.PopUpWrapper.appendChild(Content)
        Content.appendChild(Pergunta)
        Content.appendChild(Desistir)
        Content.appendChild(NaoDesistir)

        this.PopUpWrapper.style.display = 'block'
        this.ConteudoJogo.classList.add('efeito-escuro')
    }

    ExibirPromocoes(peca, posicaoAntiga, houveCaptura, roque) {
        const cor = peca.cor
        const Conteudo = document.createElement('div')
        Conteudo.classList.add('Promocao-Content')

        this.ConteudoJogo.classList.add('efeito-escuro')

        const promocoes = ['knight', 'bishop', 'rook', 'queen']
        const sufixo = cor === 'branco' ? 'white' : 'black'

        for (let i = 0; i < promocoes.length; i++) {
            const botao = document.createElement('button')
            botao.value = i
            const imagem = document.createElement('img')
            imagem.src = `/imgs/${sufixo}-${promocoes[i]}.png`

            this.ContainerDePromocao.appendChild(Conteudo)
            botao.appendChild(imagem)
            Conteudo.appendChild(botao)

            botao.onclick = () => {
                const resultado = this.jogo.promocao(peca, i, posicaoAntiga, houveCaptura, roque)
                this.ConteudoJogo.classList.remove('efeito-escuro')

                this.limparContainerDePromocao()

                if (this.onEscolherPromocao) {
                    this.onEscolherPromocao(resultado)
                }
            }
        }

        this.ContainerDePromocao.style.display = 'block'
    }

    limparContainerDePromocao() {
        this.ContainerDePromocao.style.display = 'none'
        this.ContainerDePromocao.innerHTML = ''
    }
}

function criarElemento(tag, classe = null, texto = null) {
    const elemento = document.createElement(tag)

    if (classe) {
        elemento.classList.add(classe)
    }

    if (texto) {
        elemento.innerText = texto
    }

    return elemento
}