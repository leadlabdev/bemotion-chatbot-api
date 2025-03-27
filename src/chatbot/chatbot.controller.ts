import { Controller, Post, Body, Injectable } from '@nestjs/common';
import { TwilioService } from '../twilio/twilio.service';
import { GptService } from 'src/openai/openai.service';
import { TrinksService } from 'src/trinks/trinks.service';
import { AgendamentoService } from 'src/agendamentos/agendamentos.service';
import prompts from '../config/prompts.json';

@Controller('chatbot')
export class ChatbotController {
  constructor(
    private readonly twilioService: TwilioService,
    private readonly openAiService: GptService,
    private readonly trinksService: TrinksService,
    private readonly agendamentoService: AgendamentoService,
  ) {}

  private sessions = new Map();

  @Post('webhook')
  async handleIncomingMessage(@Body() body) {
    const { From, Body: userMessage } = body;

    const telefoneFormatado = From.replace('whatsapp:', '')
      .replace('+55', '')
      .trim();

    const session = this.sessions.get(telefoneFormatado) || {};
    console.log('Sessão atual recuperada:', session);

    let nextEtapa = session.etapa;
    let prompt = '';
    let messageContext = {};

    if (!session.etapa) {
      const clientes =
        await this.trinksService.identificarClientePorTelefone(
          telefoneFormatado,
        );
      if (clientes.length === 0) {
        nextEtapa = 'solicitar_nome';
        prompt = prompts.solicitar_nome.prompt;
      } else {
        const cliente = clientes[0];
        session.clienteId = cliente.id;
        session.nome = cliente.nome;
        nextEtapa = 'menu_principal';
        prompt = prompts.menu_principal_boas_vindas.prompt;
        messageContext = { nome: cliente.nome };
      }
    } else if (session.etapa === 'solicitar_nome') {
      session.nome = userMessage;
      nextEtapa = 'solicitar_sexo';
      prompt = prompts.solicitar_sexo.prompt;
      messageContext = { nome: userMessage };
    } else if (session.etapa === 'solicitar_sexo') {
      if (!['M', 'F'].includes(userMessage.toUpperCase())) {
        prompt = prompts.solicitar_sexo_invalido.prompt;
        messageContext = { nome: session.nome, respostaInvalida: userMessage };
      } else {
        session.sexo = userMessage.toUpperCase();
        nextEtapa = 'cadastrar_cliente';
        try {
          const novoCliente = await this.trinksService.createCliente(
            session.nome,
            session.sexo,
            {
              ddd: telefoneFormatado.substring(0, 2),
              numero: telefoneFormatado.substring(2),
              tipoId: 1,
            },
          );
          session.clienteId = novoCliente.id;
          nextEtapa = 'menu_principal';
          prompt = prompts.cadastrar_cliente_sucesso.prompt;
          messageContext = { nome: session.nome };
        } catch (error) {
          console.error('Erro ao criar cliente:', error);
          prompt = prompts.cadastrar_cliente_erro.prompt;
          messageContext = { nome: session.nome };
          nextEtapa = 'erro';
        }
      }
    } else if (session.etapa === 'menu_principal') {
      const mensagemLowerCase = userMessage.toLowerCase();
      if (
        mensagemLowerCase.includes('agendar') ||
        mensagemLowerCase.includes('marcar')
      ) {
        nextEtapa = 'selecionar_servico';
        const servicos = await this.agendamentoService.listarServicos();
        session.servicos = servicos;
        const listaFormatada = servicos
          .map((s, index) => `${index + 1}. ${s.nome}`)
          .join('\n');
        prompt = prompts.menu_principal_agendar.prompt;
        messageContext = { nome: session.nome, listaFormatada };
      } else if (
        mensagemLowerCase.includes('horário') ||
        mensagemLowerCase.includes('disponível')
      ) {
        prompt = prompts.menu_principal_horarios.prompt;
        messageContext = { nome: session.nome };
      } else {
        prompt = prompts.menu_principal_generico.prompt;
        messageContext = { nome: session.nome, mensagem: userMessage };
      }
    } else if (session.etapa === 'selecionar_servico') {
      const escolha = parseInt(userMessage.trim());
      if (isNaN(escolha) || escolha < 1 || escolha > session.servicos.length) {
        const listaFormatada = session.servicos
          .map((s, index) => `${index + 1}. ${s.nome}`)
          .join('\n');
        prompt = prompts.selecionar_servico_invalido.prompt;
        messageContext = {
          nome: session.nome,
          escolhaInvalida: userMessage,
          servicos: session.servicos,
          listaFormatada,
        };
      } else {
        const servicoIndex = escolha - 1;
        session.servicoSelecionado = session.servicos[servicoIndex];
        nextEtapa = 'selecionar_profissional';
        const profissionais =
          await this.agendamentoService.listarProfissionais();
        session.profissionais = profissionais;
        const listaFormatada = profissionais
          .map((p, index) => `${index + 1}. ${p.nome}`)
          .join('\n');
        prompt = prompts.selecionar_profissional.prompt;
        messageContext = {
          nome: session.nome,
          servicoEscolhido: session.servicoSelecionado.nome,
          listaFormatada,
        };
      }
    } else if (session.etapa === 'selecionar_profissional') {
      const escolha = parseInt(userMessage.trim());
      if (
        isNaN(escolha) ||
        escolha < 1 ||
        escolha > session.profissionais.length
      ) {
        const listaFormatada = session.profissionais
          .map((p, index) => `${index + 1}. ${p.nome}`)
          .join('\n');
        prompt = prompts.selecionar_profissional_invalido.prompt;
        messageContext = {
          nome: session.nome,
          escolhaInvalida: userMessage,
          profissionais: session.profissionais,
          listaFormatada,
        };
      } else {
        const profissionalIndex = escolha - 1;
        session.profissionalSelecionado =
          session.profissionais[profissionalIndex];
        nextEtapa = 'selecionar_data';
        prompt = prompts.selecionar_data.prompt;
        messageContext = {
          nome: session.nome,
          servicoEscolhido: session.servicoSelecionado.nome,
          profissionalEscolhido: session.profissionalSelecionado.nome,
        };
      }
    } else if (session.etapa === 'selecionar_data') {
      const dataRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
      const match = userMessage.match(dataRegex);
      if (!match) {
        prompt = prompts.selecionar_data_invalido.prompt;
        messageContext = { nome: session.nome, dataInvalida: userMessage };
      } else {
        const dia = parseInt(match[1]);
        const mes = parseInt(match[2]) - 1;
        const ano = parseInt(match[3]);
        const dataEscolhida = new Date(ano, mes, dia);
        const hoje = new Date();
        if (dataEscolhida < hoje) {
          prompt = prompts.selecionar_data_passado.prompt;
          messageContext = { nome: session.nome, dataInvalida: userMessage };
        } else {
          session.dataEscolhida = dataEscolhida;
          session.dataFormatada = userMessage;
          nextEtapa = 'selecionar_hora';
          prompt = prompts.selecionar_hora.prompt;
          messageContext = {
            nome: session.nome,
            servicoEscolhido: session.servicoSelecionado.nome,
            profissionalEscolhido: session.profissionalSelecionado.nome,
            dataEscolhida: userMessage,
          };
        }
      }
    } else if (session.etapa === 'selecionar_hora') {
      const horaRegex = /^(\d{1,2}):(\d{2})$/;
      const match = userMessage.match(horaRegex);
      if (!match) {
        prompt = prompts.selecionar_hora_invalido.prompt;
        messageContext = { nome: session.nome, horaInvalida: userMessage };
      } else {
        const hora = parseInt(match[1]);
        const minuto = parseInt(match[2]);
        if (
          hora < 9 ||
          hora >= 19 ||
          (hora === 18 && minuto > 30) ||
          minuto >= 60 ||
          minuto % 30 !== 0
        ) {
          prompt = prompts.selecionar_hora_fora_horario.prompt;
          messageContext = { nome: session.nome, horaInvalida: userMessage };
        } else {
          session.horaEscolhida = `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`;
          const [dia, mes, ano] = session.dataFormatada.split('/');
          const dataHoraInicio = `${ano}-${mes}-${dia}T${session.horaEscolhida}:00`;
          session.dataHoraInicio = dataHoraInicio;
          nextEtapa = 'confirmar_agendamento';
          let duracao = 60;
          let valor = 0;
          if (
            session.servicoSelecionado.nome.toUpperCase().includes('MANICURE')
          ) {
            duracao = 45;
            valor = 45.0;
          } else if (
            session.servicoSelecionado.nome.toUpperCase().includes('CORTE')
          ) {
            duracao = 30;
            valor = 60.0;
          }
          session.duracao = duracao;
          session.valor = valor;
          prompt = prompts.confirmar_agendamento.prompt;
          messageContext = {
            nome: session.nome,
            servicoEscolhido: session.servicoSelecionado.nome,
            profissionalEscolhido: session.profissionalSelecionado.nome,
            dataEscolhida: session.dataFormatada,
            horaEscolhida: session.horaEscolhida,
            duracao,
            valor: valor.toFixed(2),
          };
        }
      }
    } else if (session.etapa === 'confirmar_agendamento') {
      const resposta = userMessage.toLowerCase().trim();
      if (resposta === 'confirmar') {
        try {
          await this.agendamentoService.criarAgendamento(
            session.clienteId,
            session.servicoSelecionado.id,
            session.profissionalSelecionado.id,
            session.dataHoraInicio,
            session.duracao,
            session.valor,
            'Agendamento via WhatsApp',
          );
          nextEtapa = 'menu_principal';
          prompt = prompts.confirmar_agendamento_sucesso.prompt;
          messageContext = {
            nome: session.nome,
            servicoEscolhido: session.servicoSelecionado.nome,
            profissionalEscolhido: session.profissionalSelecionado.nome,
            dataEscolhida: session.dataFormatada,
            horaEscolhida: session.horaEscolhida,
            duracao: session.duracao,
            valor: session.valor.toFixed(2),
          };
        } catch (error) {
          console.error('Erro ao criar agendamento:', error);
          prompt = prompts.confirmar_agendamento_erro.prompt;
          messageContext = { nome: session.nome };
          nextEtapa = 'erro';
        }
      } else if (resposta === 'cancelar') {
        nextEtapa = 'menu_principal';
        prompt = prompts.confirmar_agendamento_cancelar.prompt;
        messageContext = { nome: session.nome };
      } else {
        prompt = prompts.confirmar_agendamento_invalido.prompt;
        messageContext = { nome: session.nome, respostaInvalida: userMessage };
      }
    } else if (session.etapa === 'erro') {
      nextEtapa = 'menu_principal';
      prompt = prompts.erro.prompt;
      messageContext = { nome: session.nome };
    }

    const resposta = await this.openAiService.generateResponse(
      prompt,
      messageContext,
    );
    session.etapa = nextEtapa;
    this.sessions.set(telefoneFormatado, session);
    await this.twilioService.sendMessage(From, resposta);
  }
}
