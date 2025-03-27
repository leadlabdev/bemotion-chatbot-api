import { Injectable } from '@nestjs/common';
import { TrinksService } from 'src/trinks/trinks.service';

@Injectable()
export class AgendamentoService {
  constructor(private readonly trinksService: TrinksService) {}

  // Profissionais mockados
  private profissionais = [
    { id: 702154, nome: 'Profissional Teste' },
    { id: 702165, nome: 'Manicure Teste' },
  ];

  // Serviços mockados
  private servicos = [
    { id: 4858024, nome: 'MANICURE' },
    { id: 5666359, nome: 'Corte (Senior)' },
  ];

  async listarServicos() {
    return this.servicos;
  }

  async listarProfissionais() {
    return this.profissionais;
  }

  async criarAgendamento(
    clienteId: number,
    servicoId: number,
    profissionalId: number,
    dataHoraInicio: string,
    duracaoEmMinutos: number,
    valor: number,
    observacoes: string,
  ) {
    return await this.trinksService.createAgendamento(
      clienteId,
      servicoId,
      profissionalId,
      dataHoraInicio,
      duracaoEmMinutos,
      valor,
      observacoes,
    );
  }
}
