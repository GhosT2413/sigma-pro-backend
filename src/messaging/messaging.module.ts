import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email.service';
import { NotificationsGateway } from './gateways/notifications.gateway';
import { JwtModule } from '@nestjs/jwt';

@Global()
@Module({
  imports: [
    ConfigModule,
    JwtModule.register({}),
  ],
  providers: [EmailService, NotificationsGateway],
  exports: [EmailService, NotificationsGateway],
})
export class MessagingModule {}