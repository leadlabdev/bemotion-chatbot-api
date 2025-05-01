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
      ? `Oi, ${nome}! 😊 Prontinho para escolher seu momento de cuidado no Mega Studio Normandia? Aqui estão nossos serviços incríveis:\n${listaFormatada}\nMe diz o número do serviço que você quer, por favor!`
      : `Nossa, ${nome}, que pena! 😔 No momento, não temos serviços disponíveis. Que tal tentar de novo mais tarde?`,
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
    mensagem: `Ops, ${nome}! 😅 A opção "${escolhaInvalida || ''}" não é válida. Vamos tentar novamente? Escolha um número da lista abaixo:\n${listaFormatada || ''}`,
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
    mensagem: `Perfeito, ${nome}! 🎉 Você escolheu ${servicoEscolhido || 'um serviço incrível'}. Agora, veja nossos experts disponíveis:\n${listaFormatada}\nQual é o número do profissional que você prefere?`,
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
    mensagem: `Nossa, ${nome}, que chato! 😔 Não temos profissionais disponíveis para ${servicoEscolhido} agora. Que tal escolher outro serviço ou tentar novamente mais tarde? Estamos pertinho do metrô Eucaliptos, viu? 🚇`,
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
    mensagem: `Show, ${nome}! 😄 Você escolheu ${servicoEscolhido || ''} com ${profissionalEscolhido || 'um de nossos experts'}. Me diz a data que você prefere para seu agendamento (ex.: DD/MM/AAAA).`,
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
    mensagem: `Ops, ${nome}, a data "${dataEscolhida || ''}" não está certa. 😕 Pode mandar novamente no formato DD/MM/AAAA, por favor?`,
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
      ? `Oba, ${nome}! Aqui estão os horários disponíveis para ${profissionalEscolhido || 'seu profissional'} em ${dataEscolhida || ''}:\n${listaFormatada}\nEscolha o número do horário que combina com você! 😊`
      : `Poxa, ${nome}, não temos horários disponíveis para ${profissionalEscolhido || ''} em ${dataEscolhida || ''}. 😔 Que tal tentar outra data?`,
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
    mensagem: `Nossa, ${nome}, que pena! 😕 Não temos horários para ${profissionalEscolhido || ''} em ${dataEscolhida || ''}. Pode escolher outra data no formato DD/MM/AAAA?`,
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
      `Quase lá, ${nome}! 🎉 Dá uma olhadinha nos detalhes do seu agendamento no Mega Studio Normandia:\n` +
      `Serviço: ${servicoEscolhido || ''}\n` +
      `Profissional: ${profissionalEscolhido || ''}\n` +
      `Data: ${dataEscolhida || ''}\n` +
      `Horário: ${horarioEscolhido || ''}\n` +
      `Tudo certinho? 😊 Digite *confirmar* para fechar ou *cancelar* para voltar ao menu principal.`,
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
      `Eba, ${nome}! Seu agendamento está confirmado! 🥳 Aqui estão os detalhes:\n` +
      `Serviço: ${servicoEscolhido || ''}\n` +
      `Profissional: ${profissionalEscolhido || ''}\n` +
      `Data: ${dataEscolhida || ''}\n` +
      `Horário: ${horarioEscolhido || ''}\n` +
      `Mal posso esperar pra te receber no Mega Studio Normandia, pertinho do metrô Eucaliptos! 🚇`,
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
    mensagem: `Tudo bem, ${nome}, agendamento cancelado. 😊 Se precisar de algo mais, é só me chamar que estou aqui no Mega Studio Normandia pra te ajudar!`,
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
    mensagem: `Ops, ${nome}, não entendi sua resposta "${escolhaInvalida || ''}". 😅 Pode digitar *confirmar* ou *cancelar*, por favor?`,
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
    mensagem: `Nossa, ${nome}, me desculpe! 😔 Algo deu errado ao confirmar seu agendamento no Mega Studio Normandia. Será que você pode tentar de novo mais tarde? Se precisar, é só entrar em contato comigo!`,
  }),
};
