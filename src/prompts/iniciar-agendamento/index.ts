export const iniciarAgendamentoPrompts = {
  selecionar_servico: (
    nome: string,
    listaFormatada: string,
    escolhaInvalida: string,
    servicoEscolhido: string,
    profissionalEscolhido?: string,
    dataEscolhida?: string,
    horarioEscolhido?: string,
    duracao?: string,
    valor?: string,
  ) => ({
    mensagem: listaFormatada
      ? `Aqui estão os serviços disponíveis:\n${listaFormatada}\nPor favor, escolha o número do serviço desejado.`
      : `Desculpe, ${nome}, nenhum serviço disponível no momento.`,
  }),
  selecionar_servico_invalido: (
    nome: string,
    listaFormatada: string,
    escolhaInvalida: string,
    servicoEscolhido: string,
    profissionalEscolhido?: string,
    dataEscolhida?: string,
    horarioEscolhido?: string,
    duracao?: string,
    valor?: string,
  ) => ({
    mensagem: `Desculpe, ${nome} 😕\nA opção *"${escolhaInvalida || ''}"* não é válida.\n\nPor favor, escolha uma das opções abaixo, respondendo com o número correspondente:\n\n${listaFormatada || ''}`,
  }),
  selecionar_profissional: (
    nome: string,
    listaFormatada: string,
    escolhaInvalida: string,
    servicoEscolhido: string,
    profissionalEscolhido?: string,
    dataEscolhida?: string,
    horarioEscolhido?: string,
    duracao?: string,
    valor?: string,
  ) => ({
    mensagem: `${nome}, para o serviço de ${servicoEscolhido || 'desconhecido'}, temos os seguintes profissionais disponíveis:\n${listaFormatada}\nPor favor, escolha o número do profissional desejado.`,
  }),

  sem_profissionais_disponiveis: (
    nome: string,
    listaFormatada: string,
    escolhaInvalida: string,
    servicoEscolhido: string,
    profissionalEscolhido?: string,
    dataEscolhida?: string,
    horarioEscolhido?: string,
    duracao?: string,
    valor?: string,
  ) => ({
    mensagem: `Desculpe, ${nome}, não há profissionais disponíveis para ${servicoEscolhido} no momento. Por favor, escolha outro serviço ou tente novamente mais tarde.`,
  }),
  selecionar_data: (
    nome: string,
    listaFormatada: string,
    escolhaInvalida: string,
    servicoEscolhido: string,
    profissionalEscolhido?: string,
    dataEscolhida?: string,
    horarioEscolhido?: string,
    duracao?: string,
    valor?: string,
  ) => ({
    mensagem: `Você escolheu ${servicoEscolhido || ''} com ${profissionalEscolhido || ''}. Por favor, informe a data desejada para o agendamento (ex.: DD/MM/AAAA).`,
  }),
  erro_data_invalida: (
    nome: string,
    listaFormatada: string,
    escolhaInvalida: string,
    servicoEscolhido: string,
    profissionalEscolhido?: string,
    dataEscolhida?: string,
    horarioEscolhido?: string,
    duracao?: string,
    valor?: string,
  ) => ({
    mensagem: `Desculpe, ${nome}, a data "${dataEscolhida || ''}" não é válida. Por favor, informe uma data no formato DD/MM/AAAA.`,
  }),
  selecionar_horario: (
    nome: string,
    listaFormatada: string,
    escolhaInvalida: string,
    servicoEscolhido: string,
    profissionalEscolhido?: string,
    dataEscolhida?: string,
    horarioEscolhido?: string,
    duracao?: string,
    valor?: string,
  ) => ({
    mensagem: listaFormatada
      ? `Horários disponíveis para ${profissionalEscolhido || ''} em ${dataEscolhida || ''}:\n${listaFormatada}\nPor favor, escolha o número do horário desejado.`
      : `Desculpe, ${nome}, não há horários disponíveis para ${profissionalEscolhido || ''} em ${dataEscolhida || ''}.`,
  }),
  sem_horarios_disponiveis: (
    nome: string,
    listaFormatada: string,
    escolhaInvalida: string,
    servicoEscolhido: string,
    profissionalEscolhido?: string,
    dataEscolhida?: string,
    horarioEscolhido?: string,
    duracao?: string,
    valor?: string,
  ) => ({
    mensagem: `Desculpe, ${nome}, não há horários disponíveis para ${profissionalEscolhido || ''} em ${dataEscolhida || ''}. Por favor, escolha outra data (DD/MM/AAAA).`,
  }),
  confirmar_agendamento: (
    nome: string,
    listaFormatada: string,
    escolhaInvalida: string,
    servicoEscolhido: string,
    profissionalEscolhido?: string,
    dataEscolhida?: string,
    horarioEscolhido?: string,
    duracao?: string,
    valor?: string,
  ) => ({
    mensagem:
      `Por favor, confira os detalhes do seu agendamento:\n` +
      `Serviço: ${servicoEscolhido || ''}\n` +
      `Profissional: ${profissionalEscolhido || ''}\n` +
      `Data: ${dataEscolhida || ''}\n` +
      `Horário: ${horarioEscolhido || ''}\n` +
      `Deseja confirmar o agendamento? Digite 'confirmar' para prosseguir ou 'cancelar' para voltar ao menu principal.`,
  }),
  confirmar_agendamento_sucesso: (
    nome: string,
    listaFormatada: string,
    escolhaInvalida: string,
    servicoEscolhido: string,
    profissionalEscolhido?: string,
    dataEscolhida?: string,
    horarioEscolhido?: string,
    duracao?: string,
    valor?: string,
  ) => ({
    mensagem:
      `Agendamento confirmado!\n` +
      `Serviço: ${servicoEscolhido || ''}\n` +
      `Profissional: ${profissionalEscolhido || ''}\n` +
      `Data: ${dataEscolhida || ''}\n` +
      `Horário: ${horarioEscolhido || ''}\n` +
      `Obrigado, ${nome}!`,
  }),
  confirmar_agendamento_cancelar: (
    nome: string,
    listaFormatada: string,
    escolhaInvalida: string,
    servicoEscolhido: string,
    profissionalEscolhido?: string,
    dataEscolhida?: string,
    horarioEscolhido?: string,
    duracao?: string,
    valor?: string,
  ) => ({
    mensagem: `Agendamento cancelado, ${nome}. Se precisar de algo mais, estou à disposição!`,
  }),
  confirmar_agendamento_invalido: (
    nome: string,
    listaFormatada: string,
    escolhaInvalida: string,
    servicoEscolhido: string,
    profissionalEscolhido?: string,
    dataEscolhida?: string,
    horarioEscolhido?: string,
    duracao?: string,
    valor?: string,
  ) => ({
    mensagem: `Desculpe, ${nome}, não entendi sua resposta "${escolhaInvalida || ''}". Por favor, digite 'confirmar' ou 'cancelar'.`,
  }),
  confirmar_agendamento_erro: (
    nome: string,
    listaFormatada: string,
    escolhaInvalida: string,
    servicoEscolhido: string,
    profissionalEscolhido?: string,
    dataEscolhida?: string,
    horarioEscolhido?: string,
    duracao?: string,
    valor?: string,
  ) => ({
    mensagem: `Desculpe, ${nome}, ocorreu um erro ao tentar confirmar o seu agendamento. Por favor, tente novamente mais tarde ou entre em contato conosco.`,
  }),
};
