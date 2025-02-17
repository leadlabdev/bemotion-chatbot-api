import { Controller, Get, Post, Body, Query, Headers } from '@nestjs/common';
import { GptService } from 'src/openai/openai.service';
import { WhatsappService } from 'src/whatsapp/whatsapp.service';
import { InteracaoService } from 'src/interacao/interacao.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly openAiService: GptService,
    private readonly whatsappService: WhatsappService,
    private readonly interacaoService: InteracaoService,
  ) {}

  /**
   * 📌 1️⃣ Webhook do WhatsApp - Verificação do Meta
   */
  @Get('whatsapp')
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ) {
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN; // Pegando do .env

    if (mode === 'subscribe' && token === verifyToken) {
      console.log('✅ Webhook verificado com sucesso!');
      return challenge; // WhatsApp espera receber esse valor
    }

    console.error('❌ Erro na verificação do webhook');
    return { message: 'Erro na verificação do webhook' };
  }

  /**
   * 📌 2️⃣ Webhook do WhatsApp - Processar mensagens recebidas
   */
  @Post('whatsapp')
  async handleWhatsappWebhook(@Body() body: any) {
    console.log(
      '📩 Webhook recebido do WhatsApp:',
      JSON.stringify(body, null, 2),
    );

    if (!body.entry) return { success: false };

    for (const entry of body.entry) {
      for (const change of entry.changes) {
        if (change.value.messages) {
          const message = change.value.messages[0];
          const sender = message.from;
          const text = message.text?.body;

          if (text) {
            // 🔥 Chama OpenAI para gerar resposta
            const respostaGPT = await this.openAiService.getResponse(text);

            // 📲 Responde pelo WhatsApp
            await this.whatsappService.sendMessage(sender, respostaGPT);

            // 🗂️ Registra interação no banco de dados
            await this.interacaoService.criarInteracao(
              new Date().toISOString().split('T')[0], // Data atual
              new Date().toISOString().split('T')[1].split('.')[0], // Hora atual
              {
                cliente: sender,
                mensagem: text,
                resposta: respostaGPT,
              },
            );
          }
        }
      }
    }
    return { success: true };
  }

  /**
   * 📌 3️⃣ Webhook do Trinks - Receber e responder agendamentos
   */
  @Post('trinks')
  async handleTrinksWebhook(
    @Body() body: any,
    @Headers('authorization') token: string,
  ) {
    if (token !== process.env.TRINKS_WEBHOOK_SECRET) {
      return { message: 'Unauthorized' };
    }

    console.log('📆 Novo agendamento recebido do Trinks:', body);

    // 🔥 Geração da resposta via OpenAI
    const respostaGPT = await this.openAiService.getResponse(
      `Cliente ${body.cliente} agendou um serviço ${body.servico}. Como podemos responder?`,
    );

    // 📲 Envio da resposta pelo WhatsApp
    await this.whatsappService.sendMessage(body.telefone, respostaGPT);

    // 🗂️ Registro da interação no banco de dados
    await this.interacaoService.criarInteracao(
      new Date().toISOString().split('T')[0], // Data atual (YYYY-MM-DD)
      new Date().toISOString().split('T')[1].split('.')[0], // Hora atual (HH:mm:ss)
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
