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

    const session = this.sessions.get(telefoneFormatado) || {};
    console.log('Sessão atual recuperada:', session);

    if (!session.etapa) {
      const clientes =
        await this.trinksService.identificarClientePorTelefone(
          telefoneFormatado,
        );

      if (clientes.length === 0) {
        this.sessions.set(telefoneFormatado, {
          etapa: 'solicitar_nome',
        });
        await this.twilioService.sendMessage(
          From,
          'Olá! Para continuar, informe seu nome.',
        );
        return;
      } else {
        const cliente = clientes[0];
        await this.twilioService.sendMessage(
          From,
          `Olá, ${cliente.nome}! Como posso ajudá-lo com o agendamento hoje?`,
        );
        return;
      }
    }

    if (session.etapa === 'solicitar_nome') {
      session.nome = userMessage;
      session.etapa = 'solicitar_sexo';

      this.sessions.set(telefoneFormatado, session);
      console.log('Sessão atualizada com nome:', session);

      await this.twilioService.sendMessage(
        From,
        'Ótimo! Agora informe seu sexo (M ou F).',
      );
      return;
    }

    if (session.etapa === 'solicitar_sexo') {
      if (!['M', 'F'].includes(userMessage.toUpperCase())) {
        await this.twilioService.sendMessage(
          From,
          'Por favor, informe M para masculino ou F para feminino.',
        );
        return;
      }

      session.sexo = userMessage.toUpperCase();
      session.etapa = 'cadastrar_cliente';

      this.sessions.set(telefoneFormatado, session);
      console.log('Sessão atualizada com sexo:', session);

      try {
        await this.trinksService.createCliente(session.nome, session.sexo, {
          ddd: telefoneFormatado.substring(0, 2),
          numero: telefoneFormatado.substring(2),
          tipoId: 1,
        });

        this.sessions.set(telefoneFormatado, {
          etapa: 'concluido',
          nome: session.nome,
        });
        console.log('Cadastro concluído, sessão atualizada');

        await this.twilioService.sendMessage(
          From,
          `Cadastro realizado com sucesso, ${session.nome}! Como posso ajudá-lo hoje?`,
        );
      } catch (error) {
        console.error('Erro ao criar cliente:', error);
        await this.twilioService.sendMessage(
          From,
          'Ocorreu um erro ao criar seu cadastro. Tente novamente mais tarde.',
        );
      }
      return;
    }

    if (session.etapa === 'concluido') {
      await this.twilioService.sendMessage(
        From,
        'Você já está cadastrado! Como posso ajudá-lo hoje?',
      );
    }
  }
}
