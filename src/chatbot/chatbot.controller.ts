import { Controller, Post, Body, Injectable } from '@nestjs/common';
import { TwilioService } from '../twilio/twilio.service';
import { GptService } from 'src/openai/openai.service';
import { TrinksService } from 'src/trinks/trinks.service';
import { AgendamentoService } from 'src/agendamentos/agendamentos.service';

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

    // Recuperar a sessão do usuário do mapa em memória
    const session = this.sessions.get(telefoneFormatado) || {};
    console.log('Sessão atual recuperada:', session);

    // Variáveis para controlar o fluxo e mensagem
    let nextEtapa = session.etapa;
    let prompt = ''; // Prompt para o GPT
    let messageContext = {}; // Contexto para personalizar a mensagem

    if (!session.etapa) {
      const clientes =
        await this.trinksService.identificarClientePorTelefone(
          telefoneFormatado,
        );

      if (clientes.length === 0) {
        // Iniciar nova sessão para cadastro
        nextEtapa = 'solicitar_nome';
        prompt =
          'Crie uma mensagem amigável para um novo cliente, pedindo que informe seu nome para iniciar o cadastro no salão de beleza.';
      } else {
        const cliente = clientes[0];
        session.clienteId = cliente.id;
        session.nome = cliente.nome;
        nextEtapa = 'menu_principal';
        prompt = `Crie uma mensagem de boas-vindas para ${cliente.nome}, perguntando como podemos ajudar com o agendamento no salão de beleza hoje. Ofereça opções como "Agendar serviço", "Ver horários disponíveis" ou "Tirar dúvidas".`;
        messageContext = { nome: cliente.nome };
      }
    } else if (session.etapa === 'solicitar_nome') {
      // Atualizar sessão com o nome informado
      session.nome = userMessage;
      nextEtapa = 'solicitar_sexo';
      prompt = `O cliente informou que seu nome é ${userMessage}. Crie uma mensagem agradecendo pelo nome e pedindo para informar o sexo (M ou F) para finalizar o cadastro.`;
      messageContext = { nome: userMessage };
    } else if (session.etapa === 'solicitar_sexo') {
      if (!['M', 'F'].includes(userMessage.toUpperCase())) {
        prompt = `O cliente ${session.nome} informou "${userMessage}" como sexo, que não é válido. Peça educadamente que informe M para masculino ou F para feminino.`;
        messageContext = { nome: session.nome, respostaInvalida: userMessage };
        // Etapa não muda, continua solicitando sexo
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

          // Guarda o ID do cliente para uso posterior
          session.clienteId = novoCliente.id;

          // Cadastro realizado com sucesso
          nextEtapa = 'menu_principal';
          prompt = `O cadastro do cliente ${session.nome} foi realizado com sucesso. Crie uma mensagem comemorativa informando o sucesso do cadastro e apresentando as opções principais: "Agendar serviço", "Ver horários disponíveis" ou "Tirar dúvidas".`;
          messageContext = { nome: session.nome, sexo: session.sexo };
        } catch (error) {
          console.error('Erro ao criar cliente:', error);
          prompt =
            'Ocorreu um erro ao criar o cadastro do cliente. Crie uma mensagem de desculpas e peça que tente novamente mais tarde.';
          nextEtapa = 'erro';
        }
      }
    } else if (session.etapa === 'menu_principal') {
      // Verificar intenção do usuário
      const mensagemLowerCase = userMessage.toLowerCase();

      if (
        mensagemLowerCase.includes('agendar') ||
        mensagemLowerCase.includes('marcar') ||
        mensagemLowerCase.includes('horário')
      ) {
        // Iniciar fluxo de agendamento
        nextEtapa = 'selecionar_servico';

        // Buscar serviços disponíveis
        const servicos = await this.agendamentoService.listarServicos();
        session.servicos = servicos;

        // Criar lista formatada de serviços
        const listaServicos = servicos
          .map((s, index) => `${index + 1}. ${s.nome}`)
          .join('\n');

        prompt = `O cliente ${session.nome} deseja fazer um agendamento. Apresente os serviços disponíveis e peça para escolher um número da lista:\n${listaServicos}\nSeja amigável e explique que este é o primeiro passo para o agendamento.`;
        messageContext = {
          nome: session.nome,
          servicos: servicos,
          listaFormatada: listaServicos,
        };
      } else if (
        mensagemLowerCase.includes('horário') ||
        mensagemLowerCase.includes('disponível')
      ) {
        prompt = `O cliente ${session.nome} está perguntando sobre horários disponíveis. Explique que para verificar a disponibilidade, precisamos primeiro selecionar o serviço desejado e o profissional. Pergunte se gostaria de iniciar um agendamento agora.`;
        messageContext = { nome: session.nome };
      } else {
        // Resposta genérica para o menu principal
        prompt = `O cliente ${session.nome} enviou a seguinte mensagem: "${userMessage}". 
        Este é um chatbot de um salão de beleza. Responda de forma útil sobre agendamentos, serviços ou informações do salão. 
        Se for uma pergunta fora do contexto de salão de beleza, educadamente direcione a conversa de volta para o tema de agendamentos ou serviços. Lembre o cliente que ele pode digitar "agendar" para iniciar um agendamento.`;
        messageContext = { nome: session.nome, mensagem: userMessage };
      }
    } else if (session.etapa === 'selecionar_servico') {
      // Verificar se o usuário escolheu um serviço válido
      const escolha = parseInt(userMessage.trim());

      if (isNaN(escolha) || escolha < 1 || escolha > session.servicos.length) {
        prompt = `O cliente ${session.nome} escolheu uma opção inválida para o serviço. Peça gentilmente que escolha um número da lista de 1 a ${session.servicos.length}:\n${session.servicos.map((s, index) => `${index + 1}. ${s.nome}`).join('\n')}`;
        messageContext = {
          nome: session.nome,
          escolhaInvalida: userMessage,
          servicos: session.servicos,
        };
      } else {
        // Serviço selecionado, guardar na sessão
        const servicoIndex = escolha - 1;
        session.servicoSelecionado = session.servicos[servicoIndex];

        // Próximo passo: selecionar profissional
        nextEtapa = 'selecionar_profissional';

        // Buscar profissionais disponíveis
        const profissionais =
          await this.agendamentoService.listarProfissionais();
        session.profissionais = profissionais;

        // Criar lista formatada de profissionais
        const listaProfissionais = profissionais
          .map((p, index) => `${index + 1}. ${p.nome}`)
          .join('\n');

        prompt = `O cliente ${session.nome} escolheu o serviço "${session.servicoSelecionado.nome}". Agora, apresente os profissionais disponíveis e peça para escolher um número da lista:\n${listaProfissionais}\nSeja amigável e explique que este é o segundo passo para o agendamento.`;
        messageContext = {
          nome: session.nome,
          servicoEscolhido: session.servicoSelecionado.nome,
          profissionais: profissionais,
          listaFormatada: listaProfissionais,
        };
      }
    } else if (session.etapa === 'selecionar_profissional') {
      // Verificar se o usuário escolheu um profissional válido
      const escolha = parseInt(userMessage.trim());

      if (
        isNaN(escolha) ||
        escolha < 1 ||
        escolha > session.profissionais.length
      ) {
        prompt = `O cliente ${session.nome} escolheu uma opção inválida para o profissional. Peça gentilmente que escolha um número da lista de 1 a ${session.profissionais.length}:\n${session.profissionais.map((p, index) => `${index + 1}. ${p.nome}`).join('\n')}`;
        messageContext = {
          nome: session.nome,
          escolhaInvalida: userMessage,
          profissionais: session.profissionais,
        };
      } else {
        // Profissional selecionado, guardar na sessão
        const profissionalIndex = escolha - 1;
        session.profissionalSelecionado =
          session.profissionais[profissionalIndex];

        // Próximo passo: selecionar data e hora
        nextEtapa = 'selecionar_data';

        prompt = `O cliente ${session.nome} escolheu o profissional "${session.profissionalSelecionado.nome}" para o serviço "${session.servicoSelecionado.nome}". Agora, peça que informe a data desejada para o agendamento no formato DD/MM/YYYY. Explique que este é o terceiro passo para o agendamento.`;
        messageContext = {
          nome: session.nome,
          servicoEscolhido: session.servicoSelecionado.nome,
          profissionalEscolhido: session.profissionalSelecionado.nome,
        };
      }
    } else if (session.etapa === 'selecionar_data') {
      // Validar formato da data (DD/MM/YYYY)
      const dataRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
      const match = userMessage.match(dataRegex);

      if (!match) {
        prompt = `O cliente ${session.nome} informou uma data em formato inválido: "${userMessage}". Explique educadamente que a data deve estar no formato DD/MM/YYYY (por exemplo, 25/03/2025) e peça que informe novamente.`;
        messageContext = {
          nome: session.nome,
          dataInvalida: userMessage,
        };
      } else {
        const dia = parseInt(match[1]);
        const mes = parseInt(match[2]) - 1; // JavaScript conta meses de 0-11
        const ano = parseInt(match[3]);

        const dataEscolhida = new Date(ano, mes, dia);
        const hoje = new Date();

        // Verificar se a data é futura
        if (dataEscolhida < hoje) {
          prompt = `O cliente ${session.nome} escolheu uma data no passado: "${userMessage}". Explique gentilmente que só é possível agendar para datas futuras e peça que informe uma nova data no formato DD/MM/YYYY.`;
          messageContext = {
            nome: session.nome,
            dataInvalida: userMessage,
          };
        } else {
          // Data válida, guardar na sessão
          session.dataEscolhida = dataEscolhida;
          session.dataFormatada = userMessage;

          // Próximo passo: selecionar horário
          nextEtapa = 'selecionar_hora';

          prompt = `O cliente ${session.nome} escolheu a data ${userMessage} para o agendamento do serviço "${session.servicoSelecionado.nome}" com ${session.profissionalSelecionado.nome}. Agora, peça que informe o horário desejado no formato HH:MM (por exemplo, 14:30). Informe que o salão funciona das 09:00 às 19:00.`;
          messageContext = {
            nome: session.nome,
            servicoEscolhido: session.servicoSelecionado.nome,
            profissionalEscolhido: session.profissionalSelecionado.nome,
            dataEscolhida: userMessage,
          };
        }
      }
    } else if (session.etapa === 'selecionar_hora') {
      // Validar formato da hora (HH:MM)
      const horaRegex = /^(\d{1,2}):(\d{2})$/;
      const match = userMessage.match(horaRegex);

      if (!match) {
        prompt = `O cliente ${session.nome} informou um horário em formato inválido: "${userMessage}". Explique educadamente que o horário deve estar no formato HH:MM (por exemplo, 14:30) e peça que informe novamente.`;
        messageContext = {
          nome: session.nome,
          horaInvalida: userMessage,
        };
      } else {
        const hora = parseInt(match[1]);
        const minuto = parseInt(match[2]);

        // Verificar se está dentro do horário de funcionamento (09:00 - 19:00)
        if (
          hora < 9 ||
          hora >= 19 ||
          (hora === 18 && minuto > 30) ||
          minuto >= 60 ||
          minuto % 30 !== 0
        ) {
          prompt = `O cliente ${session.nome} escolheu um horário inválido: "${userMessage}". Explique gentilmente que o salão funciona das 09:00 às 19:00, com últimos agendamentos às 18:30, e que os horários devem ser em intervalos de 30 minutos (09:00, 09:30, 10:00, etc). Peça que informe um novo horário válido.`;
          messageContext = {
            nome: session.nome,
            horaInvalida: userMessage,
          };
        } else {
          // Hora válida, guardar na sessão
          session.horaEscolhida = `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`;

          // Montar a data e hora completa para o agendamento
          const [dia, mes, ano] = session.dataFormatada.split('/');
          const dataHoraInicio = `${ano}-${mes}-${dia}T${session.horaEscolhida}:00`;
          session.dataHoraInicio = dataHoraInicio;

          // Próximo passo: confirmação do agendamento
          nextEtapa = 'confirmar_agendamento';

          // Definir valores padrão para duração e valor com base no serviço
          let duracao = 60; // 60 minutos por padrão
          let valor = 0;

          // Definir com base no serviço selecionado
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

          prompt = `O cliente ${session.nome} escolheu o horário ${session.horaEscolhida} na data ${session.dataFormatada} para o serviço "${session.servicoSelecionado.nome}" com ${session.profissionalSelecionado.nome}. A duração estimada é de ${duracao} minutos e o valor é R$ ${valor.toFixed(2)}.

Apresente um resumo do agendamento e peça confirmação. O cliente deve responder "confirmar" para finalizar o agendamento ou "cancelar" para voltar ao menu principal.`;
          messageContext = {
            nome: session.nome,
            servicoEscolhido: session.servicoSelecionado.nome,
            profissionalEscolhido: session.profissionalSelecionado.nome,
            dataEscolhida: session.dataFormatada,
            horaEscolhida: session.horaEscolhida,
            duracao: duracao,
            valor: valor.toFixed(2),
          };
        }
      }
    } else if (session.etapa === 'confirmar_agendamento') {
      const resposta = userMessage.toLowerCase().trim();

      if (resposta === 'confirmar') {
        // Criar o agendamento
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

          // Agendamento concluído, voltar ao menu principal
          nextEtapa = 'menu_principal';

          prompt = `O agendamento do cliente ${session.nome} foi realizado com sucesso! Crie uma mensagem de confirmação com todos os detalhes: serviço "${session.servicoSelecionado.nome}" com ${session.profissionalSelecionado.nome} no dia ${session.dataFormatada} às ${session.horaEscolhida}. Duração: ${session.duracao} minutos. Valor: R$ ${session.valor.toFixed(2)}. Agradeça pela preferência e informe que estamos à disposição para qualquer dúvida.`;
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

          prompt = `Ocorreu um erro ao criar o agendamento para ${session.nome}. Crie uma mensagem de desculpas e peça que tente novamente mais tarde ou entre em contato diretamente com o salão.`;
          nextEtapa = 'erro';
        }
      } else if (resposta === 'cancelar') {
        // Cancelar agendamento e voltar ao menu principal
        nextEtapa = 'menu_principal';

        prompt = `O cliente ${session.nome} cancelou o processo de agendamento. Crie uma mensagem amigável informando que o agendamento foi cancelado e que estamos à disposição para quando desejar reagendar. Apresente novamente as opções do menu principal.`;
        messageContext = { nome: session.nome };
      } else {
        // Resposta não reconhecida
        prompt = `O cliente ${session.nome} não respondeu "confirmar" ou "cancelar", mas sim "${userMessage}". Explique gentilmente que é necessário responder "confirmar" para finalizar o agendamento ou "cancelar" para voltar ao menu principal.`;
        messageContext = {
          nome: session.nome,
          respostaInvalida: userMessage,
        };
      }
    } else if (session.etapa === 'erro') {
      // Resetar a sessão e voltar ao início
      nextEtapa = 'menu_principal';

      prompt = `O cliente ${session.nome} enviou uma mensagem após um erro. Crie uma mensagem de boas-vindas e apresente novamente as opções do menu principal.`;
      messageContext = { nome: session.nome };
    }

    // Gerar resposta personalizada com GPT
    const resposta = await this.openAiService.generateResponse(
      prompt,
      messageContext,
    );

    // Atualizar a sessão com a nova etapa
    session.etapa = nextEtapa;
    this.sessions.set(telefoneFormatado, session);

    // Enviar a resposta gerada pelo GPT
    await this.twilioService.sendMessage(From, resposta);
  }
}
