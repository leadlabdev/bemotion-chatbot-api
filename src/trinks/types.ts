// Definição das interfaces para os dados
export interface ClientResponse {
  data: Client[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
}

export interface Client {
  id: number;
  dataCadastro: string;
  email: string | null;
  nome: string;
  telefones: Phone[];
  clienteDetalhes: any | null;
}

export interface Phone {
  ddd: string;
  telefone: string;
}

export interface CreateClientPayload {
  sexo: string;
  nome: string;
  telefones: {
    ddd: string;
    numero: string;
    tipoId: number;
  }[];
}

export interface CreateClientResponse {
  id: number;
}

export interface Service {
  id: number;
  nome: string;
  descricao: string;
  categoria: string;
  duracaoEmMinutos: number;
  preco: number;
  visivelParaCliente: boolean;
}

export interface ServicesResponse {
  data: Service[];
  page?: number;
  pageSize?: number;
  totalPages?: number;
  totalRecords?: number;
}

export interface Professional {
  id: number;
  nome: string;
  cpf: string;
  apelido: string;
}

export interface ProfessionalsResponse {
  data: Professional[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
}

export interface AvailabilityData {
  id: number;
  nome: string;
  horariosVagos: string[];
  intervalosVagos: {
    inicio: string;
    fim: string;
  }[];
}

export interface AvailabilityResponse {
  intervalosVagos: never[];
  horariosVagos: string[];
  data: AvailabilityData[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
}

export interface CreateAppointmentPayload {
  clienteId: number;
  profissionalId: number;
  valor: number;
  servicoId: number;
  duracaoEmMinutos: number;
  dataHoraInicio: string;
  observacoes: string;
}

export interface CreateAppointmentResponse {
  id: number;
}

export interface AppointmentStatus {
  id: number;
  nome: string;
}

export interface AppointmentClient {
  id: number;
  nome: string;
}

export interface AppointmentService {
  id: number;
  nome: string;
}

export interface AppointmentProfessional {
  id: number;
  nome: string;
}

export interface Appointment {
  id: number;
  status: AppointmentStatus;
  cliente: AppointmentClient;
  servico: AppointmentService;
  profissional: AppointmentProfessional;
  dataHoraInicio: string;
  duracaoEmMinutos: number;
  observacoesDoEstabelecimento: string | null;
  observacoesDoCliente: string | null;
  valor: number;
}

export interface AppointmentsResponse {
  data: Appointment[];
  page?: number;
  pageSize?: number;
  totalPages?: number;
  totalRecords?: number;
}

export interface ListAppointmentsFilters {
  status?: string;
  clientId?: number;
  professionalId?: number;
  serviceId?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}
