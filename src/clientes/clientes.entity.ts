import { Agendamento } from 'src/agendamentos/agendamentos.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity()
export class Cliente {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nome: string;

  @Column({ unique: true })
  telefone: string;

  @Column({ unique: true, nullable: true })
  email?: string;

  @OneToMany(() => Agendamento, (agendamento) => agendamento.cliente)
  agendamentos: Agendamento[];
}
