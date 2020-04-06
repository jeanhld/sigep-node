/**
 * @author: waldson Vital
 */

const Helper = require('./helpers')
const BuscaClienteService = require('../services/BuscaCliente')
const ConsultaCEPService = require('../services/ConsultaCep')
const VerificaDispService = require('../services/VerificaDisponibilidadeServico')
const VerificaDispCardService = require('../services/verificaStatusCartaoPostagem')
const SolicitarEtiquetas = require('../services/SolicitaEtiquetas')
const CalcPrecoPrazo = require('../services/CalcPrecoPrazo')
const { geraDigito, callGerarDigitos } = require('../services/GeraDigitoVerificador')
const FechaPlp = require('../services/FechaPlp')
const SolicitaJsonPLP = require('../services/solicitaJsonPlp')
const bloquearObjetos = require('../services/BloquearObjeto')
const { base, objeto_postal_item } = require('../models/FechaPLPModel')

/**
 * @class: Services
 * @classdesc: Serviços disponivel dos SIGEP
 */
class Services {
    constructor(user){
        this.user = user
        this.PLPModel = {
            plp: base,
            objetoPostal: objeto_postal_item
        }

        //init nos dados do client
        this.buscaCliente()
        this.helpers = new Helper( this.user )
    }

    /**
     * Verifica a disponibilidade do serviço para o CEP de destino
     * O cepOrigem não nãé obrigatótio
     *
     * @params {Object} data { cepDestino, numeroServico, cepOrigem=? }
     */
    async verificaDisponibilidadeServico( data ){

        data = this.helpers.clearCEP( data )

        let userData = this.user.getUser()
        let params = {
            ...userData,
            ...data
        }

        return await VerificaDispService( params )
    }

    /**
     * Metodo retorna o endereço do CEP pesquisado
     * @params {String} cep CEP que deseja encontrar o endereço
     * @returns {Object}
     */
    async consultaCEP( cep ){
        cep = this.helpers.clearCEP( cep )

        let result = await ConsultaCEPService(cep)

        return result
    }

    async solicitaEtiquetas(data){
        let userData = this.user.getUser()
        let params = {
            ...userData,
            ...data
        }

        let result = await SolicitarEtiquetas( params )

        return {
            status: result.length? true : false,
            data: result
        }
    }

    geraDigitoVerificadorEtiquetas( listTags ){
        return listTags.map(( tag ) => {
            return geraDigito(tag)
        })
    }

    async fechaPlpVariosServicos({ json, idPlpCliente, listaEtiquetas,}){
        let user = this.user.getUser()
        // console.log(JSON.stringify( user ))
        let data = {
            json,
            idPlpCliente,
            cartaoPostagem: user.idCartaoPostagem,
            listaEtiquetas,
            usuario: user.usuario,
            senha: user.senha
        }

        return await FechaPlp(data)
    }

    async solicitaJsonPlp( idPLP ){
        let user = this.user.getUser()

        let params = {
            idPlpMaster: idPLP,
            ...user
        }

        return await SolicitaJsonPLP( params )
    }

    /**
     * Calcula o Prazo e Valor do Frete
     *
     * @params {Object} params
     *
     * campos do objeto:
     * nCdEmpresa - numero do contrato ( não obrigatório - envie '' )
     * sDsSenha - senha do contrato, pode ser os 8 primeiros digitos do CNPJ ( não obrigatório - envie '' )
     * nCdServico - código do serviço
     * sCepOrigem - CEP de origem
     * sCepDestino - CEP de Destino
     * nVlPeso - Decimal ex: 1 = 1kg
     * nCdFormato - 1 – Formato caixa/pacote, 2 – Formato rolo/prisma, 3 – Envelope
     * nVlComprimento - Decimal ex: 1 = 1cm
     * nVlAltura = Decimal ex: 1 = 1cm
     * nVlLargura = Decimal ex: 1 = 1cm
     * nVlDiametro = Decimal ex: 1 = 1cm
     * sCdMaoPropria = "S" = sim, "N" = não
     * nVlValorDeclarado = Decimal ex: 1 = R$1,00
     * sCdAvisoRecebimento = "S" = sim, "N" = não
     */
    async calcPrecoPrazo( params ){
        //limpa os ceps
        params.sCepOrigem = this.helpers.clearCEP( params.sCepOrigem )
        params.sCepDestino = this.helpers.clearCEP( params.sCepDestino )

        return await CalcPrecoPrazo( params )
    }

    /**
     * Metodo retorna os dados do client inicializados na instacia do modulo
     * @returns {Object}
     */
    async buscaCliente(){
        let userData = this.user.getUser()
        let result = await BuscaClienteService( userData )

        if( Object.keys( userData.clienteData ).length === 0 ){
            this.user._setClienteData( result )
        }

        return result
    }

    rastrearObjeto(){

    }

    /**
     * Verifica a disponibilidade do cartão de postagem
     *
     * @params {String} idCartaoPostagem Campo não obrigatorio do id do cartão de postagem
     * @returns {Object}
     */
    async verificarStatusCartaoPostagem( idCartaoPostagem = null ){
        let user = this.user.getUser()

        if( idCartaoPostagem ){
            user.idCartaoPostagem = idCartaoPostagem
        }

        return await VerificaDispCardService( user )
    }

    async bloquearObjeto( etiqueta, idPLP ){
        let user = this.user.getUser()

        let result = await bloquearObjetos( etiqueta, idPLP, user.usuario, user.senha )

        return result
    }

    cancelarObjeto = () => {

    }
}

module.exports = Services