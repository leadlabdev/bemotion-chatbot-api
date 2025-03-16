import { Controller, Post, Body } from '@nestjs/common';
import { TwilioService } from '../twilio/twilio.service';
import { GptService } from 'src/openai/openai.service';
import { TrinksService } from 'src/trinks/trinks.service';

@Controller('chatbot')
export class ChatbotController {
  constructor(
    private readonly twilioService: TwilioService,
    private readonly openAiService: GptService,
    private readonly trinksService: TrinksService, // Injetando o serviço
  ) {}
  @Post('webhook')
  async handleIncomingMessage(@Body() body) {
    const { From, Body: userMessage } = body;

    try {
      console.log('🔍 Verificando tipo de solicitação...');
      let reply: string;

      if (this.isAgendamentoRequest(userMessage)) {
        console.log('📅 Solicitando agendamentos...');
        const agendamentos = await this.trinksService.getAgendamentos();
        reply = this.formatAgendamentosResponse(agendamentos);
      } else if (this.isServicosRequest(userMessage)) {
        console.log('💆‍♂️ Solicitando serviços...');
        const servicos = await this.trinksService.getServicos();
        reply = this.formatServicosResponse(servicos);
      } else if (this.isProfissionaisRequest(userMessage)) {
        console.log('👨‍🔧 Solicitando profissionais com agenda...');
        const date = this.extractDate(userMessage);

        if (!date) {
          reply =
            '📅 Por favor, informe uma data válida no formato *DD/MM/YYYY*.';
        } else {
          const profissionais =
            await this.trinksService.getProfissionaisAgenda(date);
          reply = this.formatProfissionaisResponse(profissionais, date);
        }
      } else if (this.isClientCreationRequest(userMessage)) {
        console.log('👤 Criando novo cliente...');
        const clientName = this.extractClientName(userMessage);

        if (!clientName) {
          reply = '❌ Por favor, informe seu nome para realizar o cadastro.';
        } else {
          // Criando um objeto com os campos obrigatórios
          const clienteData = {
            nome: clientName,
            sexo: 'M', // Defina um valor padrão ou obtenha do usuário
            telefones: [
              {
                ddd: '11', // Defina um valor padrão ou obtenha do usuário
                numero: '999999999',
                tipoId: 1, // Tipo de telefone (exemplo: 1 para celular)
              },
            ],
          };

          const newClient = await this.trinksService.createCliente(clienteData);
          reply = `✅ Cliente *${newClient.nome}* cadastrado com sucesso!`;
        }
      } else {
        console.log('🤖 Chamando OpenAI...');
        reply = await this.openAiService.getResponse(userMessage);
      }

      console.log('✉️ Enviando resposta:', reply);
      const result = await this.twilioService.sendMessage(From, reply);
      console.log('✅ Mensagem enviada com sucesso:', result.sid);

      return { success: true, reply, messageSid: result.sid };
    } catch (error) {
      console.error('❌ Erro ao processar mensagem:', error.message);
      return { success: false, message: 'Erro ao processar a mensagem.' };
    }
  }
  private isClientCreationRequest(message: string): boolean {
    const keywords = [
      'me cadastrar',
      'quero ser cliente',
      'criar conta',
      'novo cliente',
    ];
    return keywords.some((word) => message.toLowerCase().includes(word));
  }

  private extractClientName(message: string): string | null {
    const regex = /meu nome é ([a-zA-ZÀ-ÿ\s]+)/i;
    const match = message.match(regex);
    return match ? match[1].trim() : null;
  }

  // Método para detectar pedidos de agendamento
  private isAgendamentoRequest(message: string): boolean {
    const keywords = ['agendamento', 'consulta', 'horário', 'agenda', 'marcar'];
    return keywords.some((word) => message.toLowerCase().includes(word));
  }

  private isServicosRequest(message: string): boolean {
    const keywords = [
      'serviço',
      'serviços',
      'preço',
      'valor',
      'corte',
      'massagem',
      'agenda de serviços',
    ];
    return keywords.some((word) => message.toLowerCase().includes(word));
  }

  private isProfissionaisRequest(message: string): boolean {
    const keywords = [
      'profissional',
      'barbeiro',
      'cabeleireiro',
      'especialista',
    ];
    return keywords.some((word) => message.toLowerCase().includes(word));
  }

  private extractDate(message: string): string | null {
    console.log('📅 Mensagem recebida para extração de data:', message);

    const regex = /(\d{2}\/\d{2}\/\d{4})/;
    const match = message.match(regex);

    if (match) {
      console.log('✅ Data extraída com sucesso:', match[0]);
      const [day, month, year] = match[0].split('/');
      return `${year}-${month}-${day}`; // Converte para YYYY-MM-DD
    }

    console.log('❌ Nenhuma data válida encontrada.');
    return null;
  }

  private formatProfissionaisResponse(
    profissionais: any[],
    date: string,
  ): string {
    if (!profissionais.length) {
      return `📅 Nenhum profissional disponível para o dia ${date}.`;
    }

    const lista = profissionais
      .map((prof) => `👨‍🔧 *${prof.nome}* - ${prof.especialidade}`)
      .join('\n');

    return `📆 Profissionais disponíveis em ${date}:\n\n${lista}\n\nAgende seu horário!`;
  }
  private formatServicosResponse(servicos: any[]): string {
    if (!servicos.length) {
      return '💆‍♀️ No momento, não há serviços disponíveis para exibição.';
    }

    // Pegamos apenas os primeiros 5 serviços visíveis
    const servicosFormatados = servicos
      .filter((servico) => servico.visivelParaCliente)
      .slice(0, 5)
      .map((servico) => `💆‍♂️ *${servico.nome}* - R$${servico.preco}`);

    return (
      `✨ Aqui estão alguns dos nossos serviços disponíveis:\n\n` +
      servicosFormatados.join('\n') +
      `\n\nQuer saber mais? Entre em contato!`
    );
  }
  // Formata a resposta dos agendamentos
  private formatAgendamentosResponse(agendamentos: any[]): string {
    if (!agendamentos.length) {
      return '📅 No momento, não há horários disponíveis para agendamento.';
    }

    // Pegamos apenas as próximas 5 datas disponíveis
    const proximasDatas = agendamentos
      .map((agendamento) =>
        new Date(agendamento.dataHoraInicio).toLocaleDateString('pt-BR', {
          weekday: 'long',
          day: '2-digit',
          month: '2-digit',
        }),
      )
      .slice(0, 5);

    return (
      `📅 Temos horários disponíveis nas seguintes datas:\n\n` +
      proximasDatas.map((data, index) => `👉 ${data}`).join('\n') +
      `\n\nEntre em contato para mais detalhes!`
    );
  }
}
