import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cliente } from './clientes.entity';

@Injectable()
export class ClientesService {
  constructor(
    @InjectRepository(Cliente)
    private readonly clientesRepository: Repository<Cliente>,
  ) {}

  async criarCliente(nome: string, telefone: string, email?: string) {
    const cliente = this.clientesRepository.create({ nome, telefone, email });
    return this.clientesRepository.save(cliente);
  }

  async listarClientes() {
    return this.clientesRepository.find();
  }
}
