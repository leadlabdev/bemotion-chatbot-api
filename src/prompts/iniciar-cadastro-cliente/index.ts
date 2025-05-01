export const iniciarCadastroCliente = {
  solicitar_nome: (nome?: string, escolhaInvalida?: string) => ({
    mensagem: `Oi! Qual é o seu nome? 😊`,
  }),
  solicitar_sobrenome: (nome?: string, escolhaInvalida?: string) => ({
    mensagem: `Oi, ${nome}! Que prazer te conhecer! 😄 Qual é o seu sobrenome, por favor?`,
  }),
  nome_invalido: (nome?: string, escolhaInvalida?: string) => ({
    mensagem: `Ops, ${escolhaInvalida || ''} não parece um nome válido. 😕 Pode repetir seu primeiro nome, por favor? 😊`,
  }),
  sobrenome_invalido: (nome?: string, escolhaInvalida?: string) => ({
    mensagem: `Desculpe, ${nome}, não entendi o sobrenome "${escolhaInvalida || ''}". 😅 Pode mandar novamente, por favor?`,
  }),
  solicitar_sexo: (nome?: string, escolhaInvalida?: string) => ({
    mensagem: `Obrigado pelo seu nome, ${nome}! 😄 Estou super animado por você estar entrando pra família Mega Studio Normandia. Só falta um detalhe pro seu cadastro: me diz, por favor, seu sexo (M para masculino ou F para feminino). Mal posso esperar pra começar a te atender!`,
  }),
  solicitar_sexo_invalido: (nome?: string, escolhaInvalida?: string) => ({
    mensagem: `Ops, ${nome}, "${escolhaInvalida || ''}" não é uma opção válida. 😅 Pode informar M para masculino ou F para feminino, por favor? Estamos quase finalizando seu cadastro no Mega Studio Normandia!`,
  }),
  cadastrar_cliente_sucesso: (nome?: string, escolhaInvalida?: string) => ({
    mensagem: `Eba, ${nome}! Seu cadastro no Mega Studio Normandia foi concluído com sucesso! 🎉 Seja muito bem-vindo(a) ao nosso espaço. Agora que você faz parte do nosso espaço, como posso te ajudar ?`,
  }),
  cadastrar_cliente_erro: (nome?: string, escolhaInvalida?: string) => ({
    mensagem: `Nossa, ${nome}, me desculpe! 😔 Houve um probleminha técnico ao tentar criar seu cadastro no Mega Studio Normandia. Será que você pode tentar novamente mais tarde? Se preferir, é só entrar em contato comigo diretamente. Estou ansioso pra te atender com todo carinho!`,
  }),
  confirmar_nome: (nome: string) => ({
    mensagem: `O nome "${nome}" está correto? Responda "Confirmar" para prosseguir ou "Corrigir" para ajustar.`,
  }),
  confirmacao_nome_invalida: (nome: string) => ({
    mensagem: `Por favor, responda "Confirmar" para salvar o nome "${nome}" ou "Corrigir" para ajustar. Qual é a sua escolha?`,
  }),
};
