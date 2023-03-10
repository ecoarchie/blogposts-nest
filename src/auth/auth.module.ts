import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Session, SessionSchema } from '../users/sessions/session.schema';
import { SessionRepository } from '../users/sessions/sessions.repository';
import { UserModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Session.name,
        schema: SessionSchema,
      },
    ]),
    UserModule,
  ],
  exports: [AuthService],
  controllers: [AuthController],
  providers: [AuthService, SessionRepository],
})
export class AuthModule {}
