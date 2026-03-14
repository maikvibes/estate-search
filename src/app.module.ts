import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';

@Module({
  imports: [],
  controllers: [AppController, ListingsController],
  providers: [AppService, ListingsService],
})
export class AppModule {}
