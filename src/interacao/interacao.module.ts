import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Interacao } from './interacao.entity';
import { InteracaoService } from './interacao.service';

@Module({
  imports: [TypeOrmModule.forFeature([Interacao])],
  providers: [InteracaoService],
  exports: [InteracaoService], // Certifique-se de exportar o serviço
})
export class InteracaoModule {}
