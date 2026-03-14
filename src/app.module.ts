import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [],
  controllers: [AppController, ListingsController, ChatController],
  providers: [AppService, ListingsService, ChatService],
})
export class AppModule {}
