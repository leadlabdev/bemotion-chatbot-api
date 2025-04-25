export const iniciarAgendamentoPrompts = {
  selecionar_servico: (nome: string, listaFormatada?: string) => ({
    mensagem: listaFormatada
      ? `Aqui estão os serviços disponíveis:\n${listaFormatada}\nPor favor, escolha o número do serviço desejado.`
      : `Desculpe, ${nome}, nenhum serviço disponível no momento.`,
    isFirstMessage: false,
  }),
  selecionar_servico_invalido: (
    nome: string,
    escolhaInvalida?: string,
    listaFormatada?: string,
  ) => ({
    mensagem: `Desculpe, ${nome}, a opção "${escolhaInvalida || ''}" não é válida. Por favor, escolha um número da lista:\n${listaFormatada || ''}`,
    isFirstMessage: false,
  }),
  selecionar_profissional: (
    nome: string,
    servicoEscolhido?: string,
    listaFormatada?: string,
  ) => ({
    mensagem: listaFormatada
      ? `Você escolheu ${servicoEscolhido || ''}. Aqui estão os profissionais disponíveis:\n${listaFormatada}\nPor favor, escolha o número do profissional desejado.`
      : `Desculpe, ${nome}, não há profissionais disponíveis para ${servicoEscolhido || ''} no momento.`,
    isFirstMessage: false,
  }),
  sem_profissionais_disponiveis: (nome: string, servicoEscolhido?: string) => ({
    mensagem: `Desculpe, ${nome}, não há profissionais disponíveis para ${servicoEscolhido || ''} no momento. Tente novamente mais tarde.`,
    isFirstMessage: false,
  }),
  selecionar_data: (
    nome: string,
    servicoEscolhido?: string,
    profissionalEscolhido?: string,
  ) => ({
    mensagem: `Você escolheu ${servicoEscolhido || ''} com ${profissionalEscolhido || ''}. Por favor, informe a data desejada para o agendamento (ex.: DD/MM/AAAA).`,
    isFirstMessage: false,
  }),
  erro_data_invalida: (nome: string, dataEscolhida?: string) => ({
    mensagem: `Desculpe, ${nome}, a data "${dataEscolhida || ''}" não é válida. Por favor, informe uma data no formato DD/MM/AAAA.`,
    isFirstMessage: false,
  }),
  selecionar_horario: (
    nome: string,
    profissionalEscolhido?: string,
    dataEscolhida?: string,
    listaFormatada?: string,
  ) => ({
    mensagem: listaFormatada
      ? `Horários disponíveis para ${profissionalEscolhido || ''} em ${dataEscolhida || ''}:\n${listaFormatada}\nPor favor, escolha o número do horário desejado.`
      : `Desculpe, ${nome}, não há horários disponíveis para ${profissionalEscolhido || ''} em ${dataEscolhida || ''}.`,
    isFirstMessage: false,
  }),
  sem_horarios_disponiveis: (
    nome: string,
    profissionalEscolhido?: string,
    dataEscolhida?: string,
  ) => ({
    mensagem: `Desculpe, ${nome}, não há horários disponíveis para ${profissionalEscolhido || ''} em ${dataEscolhida || ''}. Por favor, escolha outra data (DD/MM/AAAA).`,
    isFirstMessage: false,
  }),
  confirmar_agendamento: (
    nome: string,
    servicoEscolhido?: string,
    profissionalEscolhido?: string,
    dataEscolhida?: string,
    horarioEscolhido?: string,
  ) => ({
    mensagem:
      `Por favor, confira os detalhes do seu agendamento:\n` +
      `Serviço: ${servicoEscolhido || ''}\n` +
      `Profissional: ${profissionalEscolhido || ''}\n` +
      `Data: ${dataEscolhida || ''}\n` +
      `Horário: ${horarioEscolhido || ''}\n` +
      `Deseja confirmar o agendamento? Digite 'confirmar' para prosseguir ou 'cancelar' para voltar ao menu principal.`,
    isFirstMessage: false,
  }),
  confirmar_agendamento_sucesso: (
    nome: string,
    servicoEscolhido?: string,
    profissionalEscolhido?: string,
    dataEscolhida?: string,
    horarioEscolhido?: string,
  ) => ({
    mensagem:
      `Agendamento confirmado!\n` +
      `Serviço: ${servicoEscolhido || ''}\n` +
      `Profissional: ${profissionalEscolhido || ''}\n` +
      `Data: ${dataEscolhida || ''}\n` +
      `Horário: ${horarioEscolhido || ''}\n` +
      `Obrigado, ${nome}!`,
    isFirstMessage: false,
  }),
  confirmar_agendamento_cancelar: (nome: string) => ({
    mensagem: `Agendamento cancelado, ${nome}. Se precisar de algo mais, estou à disposição!`,
    isFirstMessage: false,
  }),
  confirmar_agendamento_invalido: (nome: string, escolhaInvalida?: string) => ({
    mensagem: `Desculpe, ${nome}, não entendi sua resposta "${escolhaInvalida || ''}". Por favor, digite 'confirmar' ou 'cancelar'.`,
    isFirstMessage: false,
  }),
  confirmar_agendamento_erro: (nome: string) => ({
    mensagem: `Desculpe, ${nome}, ocorreu um erro ao tentar confirmar o seu agendamento. Por favor, tente novamente mais tarde ou entre em contato conosco.`,
    isFirstMessage: false,
  }),
};
