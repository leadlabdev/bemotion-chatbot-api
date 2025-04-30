import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TrinksService } from 'src/trinks/trinks.service';
import { Agendamento } from './agendamentos.schema';

@Injectable()
export class AgendamentoService {
  constructor(
    private readonly trinksService: TrinksService,
    @InjectModel(Agendamento.name) private agendamentoModel: Model<Agendamento>,
  ) {}

  async criarAgendamento(
    clienteId: number,
    servicoId: number,
    profissionalId: number,
    dataHoraInicio: string,
    duracaoEmMinutos: number,
    valor: number,
    observacoes: string,
  ) {
    console.log(
      'payload',
      clienteId,
      servicoId,
      profissionalId,
      dataHoraInicio,
      duracaoEmMinutos,
      valor,
      observacoes,
    );

    try {
      // Criar o agendamento no Trinks
      const agendamentoTrinks = await this.trinksService.createAgendamento(
        clienteId,
        servicoId,
        profissionalId,
        dataHoraInicio,
        duracaoEmMinutos,
        valor,
        observacoes,
      );

      // Salvar no MongoDB
      const novoAgendamento = new this.agendamentoModel({
        clienteId: clienteId.toString(),
        servicoId: servicoId.toString(),
        profissionalId: profissionalId.toString(),
        dataHoraInicio,
        duracao: duracaoEmMinutos,
        valor,
        origem: observacoes,
        status: 'CONFIRMADO',
      });

      await novoAgendamento.save();

      return agendamentoTrinks;
    } catch (error) {
      // Logar detalhes relevantes do erro
      console.error('Erro ao criar agendamento:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
          data: error.config?.data,
        },
      });

      // Logar erros específicos da API Trinks
      if (
        error.response?.data?.Errors &&
        Array.isArray(error.response.data.Errors)
      ) {
        console.error('Erros da API Trinks:');
        error.response.data.Errors.forEach(
          (err: { PropertyName: string; ErrorMessage: string }) => {
            console.error(
              `PropertyName: ${err.PropertyName}, ErrorMessage: ${err.ErrorMessage}`,
            );
          },
        );
      } else {
        console.error('Nenhum erro específico da API Trinks encontrado.');
      }

      // Re-lançar o erro para o chamador
      throw error;
    }
  }
}
