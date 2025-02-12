import { Module } from '@nestjs/common';
import { AgendamentosController } from './agendamentos.controller';

@Module({
  controllers: [AgendamentosController]
})
export class AgendamentosModule {}
