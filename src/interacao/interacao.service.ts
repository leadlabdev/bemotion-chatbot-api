import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Interacao } from './interacao.entity';

@Injectable()
export class InteracaoService {
  constructor(
    @InjectRepository(Interacao)
    private interacaoRepository: Repository<Interacao>,
  ) {}

  // Método para criar uma nova interação
  async criarInteracao(
    data: string,
    horario: string,
    dados: any,
  ): Promise<Interacao> {
    const interacao = new Interacao();
    interacao.data = data;
    interacao.horario = horario;
    interacao.dados = dados;

    return await this.interacaoRepository.save(interacao);
  }

  // Método para buscar todas as interações
  async obterInteracoes(): Promise<Interacao[]> {
    return await this.interacaoRepository.find();
  }
}
