import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Agendamento extends Document {
  @Prop({ required: true })
  clienteId: string;

  @Prop({ required: true })
  servicoId: string;

  @Prop({ required: true })
  profissionalId: string;

  @Prop({ required: true })
  dataHoraInicio: Date;

  @Prop({ required: true })
  duracao: number; // em minutos

  @Prop({ required: true })
  valor: number;

  @Prop({ required: true })
  origem: string;

  @Prop({ default: 'PENDENTE' })
  status: string;
}

export const AgendamentoSchema = SchemaFactory.createForClass(Agendamento);
