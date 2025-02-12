import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Interacao {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  data: string;

  @Column()
  horario: string;

  @Column('jsonb', { nullable: true })
  dados: any; // Dados adicionais podem ser armazenados aqui
}
