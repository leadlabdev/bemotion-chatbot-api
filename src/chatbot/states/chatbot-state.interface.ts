import { ChatbotController } from '../controllers/chatbot.controller';

export interface ChatbotState {
  handle(
    controller: ChatbotController,
    telefone: string,
    userMessage: string,
  ): Promise<void>;
}
