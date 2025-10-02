import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TeachingModule } from './teaching/teaching.module';

@Module({
  imports: [TeachingModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
