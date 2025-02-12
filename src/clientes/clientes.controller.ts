import { Controller, Get, Post, Body } from '@nestjs/common';
import { ClientesService } from './clientes.service';

@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Post()
  async criar(
    @Body() body: { nome: string; telefone: string; email?: string },
  ) {
    return this.clientesService.criarCliente(
      body.nome,
      body.telefone,
      body.email,
    );
  }

  @Get()
  async listar() {
    return this.clientesService.listarClientes();
  }
}
