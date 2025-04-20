import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HttpModule } from '@nestjs/axios';
import { ChatbotModule } from './chatbot/chatbot.module'; // Importar o módulo inteiro

@Module({
  imports: [
    ConfigModule.forRoot(), // Carregar variáveis de ambiente
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get('MONGODB_URI'), // URI do MongoDB
      }),
    }),

    HttpModule,
    ChatbotModule, // Adicionar o ChatbotModule à lista de imports
  ],
  controllers: [AppController], // Remova ChatbotController daqui, pois já está no ChatbotModule
  providers: [AppService],
})
export class AppModule {
  constructor() {
    // Console log para checar a variável de ambiente do MongoDB
    console.log('MongoDB URI:', process.env.MONGODB_URI);
  }
}
