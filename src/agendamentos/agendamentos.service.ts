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
    // Criar o agendamento no Trinks (lógica original mantida)
    const agendamentoTrinks = await this.trinksService.createAgendamento(
      clienteId,
      servicoId,
      profissionalId,
      dataHoraInicio,
      duracaoEmMinutos,
      valor,
      observacoes,
    );

    // Após sucesso no Trinks, salvar no MongoDB
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

    // Retornar o resultado do Trinks, mantendo a lógica original
    return agendamentoTrinks;
  }
}
