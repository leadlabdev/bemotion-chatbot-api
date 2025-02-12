import { Cliente } from 'src/clientes/clientes.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

@Entity()
export class Agendamento {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  servico: string;

  @Column()
  dataHora: Date;

  @Column()
  status: 'PENDENTE' | 'CONFIRMADO' | 'CANCELADO';

  @ManyToOne(() => Cliente, (cliente) => cliente.agendamentos)
  cliente: Cliente;
}
