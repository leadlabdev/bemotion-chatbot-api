import { Module } from '@nestjs/common';
import { AgendamentoService } from 'src/agendamentos/agendamentos.service';
import { GptService } from 'src/openai/openai.service';
import { TrinksService } from 'src/trinks/trinks.service';
import { TwilioService } from 'src/twilio/twilio.service';
import { SessionService } from './services/session.service';
import { MessageFormatterService } from './services/message-formatter.service';
import { InitialState } from './states/initial.state';
import { ErrorState } from './states/error.state';
import { StateFactory } from './states/state.factory';
import { ChatbotController } from './controllers/chatbot.controller';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Agendamento,
  AgendamentoSchema,
} from 'src/agendamentos/agendamentos.schema';
import {
  IniciarCadastroCliente,
  SolicitarNomeState,
  SolicitarSexoState,
} from './states/iniciar-cadastro-cliente';
import { MenuPrincipalState } from './states/menu-principal.state';
import {
  ConfirmarAgendamentoState,
  IniciarAgendamento,
  SelecionarDataState,
  SelecionarHoraState,
  SelecionarProfissionalState,
  SelecionarServicoState,
} from './states/iniciar-agendamento';
import { MensagemLivreService } from './services/message-livre.service';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    MongooseModule.forFeature([
      { name: Agendamento.name, schema: AgendamentoSchema },
    ]),
  ],
  providers: [
    TwilioService,
    GptService,
    TrinksService,
    AgendamentoService,
    SessionService,
    MessageFormatterService,
    MensagemLivreService,
    InitialState,
    IniciarCadastroCliente,
    IniciarAgendamento,
    SolicitarNomeState,
    SolicitarSexoState,
    MenuPrincipalState,
    SelecionarServicoState,
    SelecionarProfissionalState,
    SelecionarDataState,
    SelecionarHoraState,
    ConfirmarAgendamentoState,
    ErrorState,
    StateFactory,
  ],
  controllers: [ChatbotController],
})
export class ChatbotModule {}
