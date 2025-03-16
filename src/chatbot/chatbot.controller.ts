import { Controller, Post, Body } from '@nestjs/common';
import { TwilioService } from '../twilio/twilio.service';
import { GptService } from 'src/openai/openai.service';
import { TrinksService } from 'src/trinks/trinks.service';

@Controller('chatbot')
export class ChatbotController {
  constructor(
    private readonly twilioService: TwilioService,
    private readonly openAiService: GptService,
    private readonly trinksService: TrinksService,
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
        nextEtapa = 'menu_principal';
        prompt = `Crie uma mensagem de boas-vindas para ${cliente.nome}, perguntando como podemos ajudar com o agendamento no salão de beleza hoje.`;
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
          await this.trinksService.createCliente(session.nome, session.sexo, {
            ddd: telefoneFormatado.substring(0, 2),
            numero: telefoneFormatado.substring(2),
            tipoId: 1,
          });

          // Cadastro realizado com sucesso
          nextEtapa = 'concluido';
          prompt = `O cadastro do cliente ${session.nome} foi realizado com sucesso. Crie uma mensagem comemorativa informando o sucesso do cadastro e perguntando como podemos ajudar hoje.`;
          messageContext = { nome: session.nome, sexo: session.sexo };
        } catch (error) {
          console.error('Erro ao criar cliente:', error);
          prompt =
            'Ocorreu um erro ao criar o cadastro do cliente. Crie uma mensagem de desculpas e peça que tente novamente mais tarde.';
          nextEtapa = 'erro';
        }
      }
    } else if (
      session.etapa === 'concluido' ||
      session.etapa === 'menu_principal'
    ) {
      // Cliente já cadastrado e enviou uma mensagem
      prompt = `O cliente ${session.nome} enviou a seguinte mensagem: "${userMessage}". 
      Este é um chatbot de um salão de beleza. Responda de forma útil sobre agendamentos, serviços ou informações do salão. 
      Se for uma pergunta fora do contexto de salão de beleza, educadamente direcione a conversa de volta para o tema de agendamentos ou serviços.`;
      messageContext = { nome: session.nome, mensagem: userMessage };
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
