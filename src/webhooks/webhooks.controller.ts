import { Controller, Post, Body, Headers } from '@nestjs/common';
import { OpenAiService } from 'src/openai/openai.service';
import { WhatsappService } from 'src/whatsapp/whatsapp.service';
import { InteracaoService } from 'src/interacao/interacao.service'; // Importe o serviço de interações

@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly openAiService: OpenAiService,
    private readonly whatsappService: WhatsappService,
    private readonly interacaoService: InteracaoService, // Injete o serviço de interações
  ) {}

  @Post('trinks')
  async handleTrinksWebhook(
    @Body() body: any,
    @Headers('authorization') token: string,
  ) {
    if (token !== process.env.TRINKS_WEBHOOK_SECRET) {
      return { message: 'Unauthorized' };
    }

    // Geração da resposta com OpenAI
    const respostaGPT = await this.openAiService.generateResponse(
      `Cliente ${body.cliente} agendou um serviço ${body.servico}. Como podemos responder?`,
    );

    // Envio da mensagem via WhatsApp
    await this.whatsappService.sendMessage(body.telefone, respostaGPT);

    // Criar uma nova interação no banco de dados
    await this.interacaoService.criarInteracao(
      new Date().toISOString().split('T')[0], // Data atual (formato YYYY-MM-DD)
      new Date().toISOString().split('T')[1].split('.')[0], // Horário atual (formato HH:mm:ss)
      {
        cliente: body.cliente,
        servico: body.servico,
        telefone: body.telefone,
        resposta: respostaGPT,
      },
    );

    return { message: 'Mensagem enviada com sucesso' };
  }
}
