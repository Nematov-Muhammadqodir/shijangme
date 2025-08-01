import { Module } from '@nestjs/common';
import { FollowService } from './follow.service';
import { MongooseModule } from '@nestjs/mongoose';
import FollowSchema from '../../schemas/Follow.model';
import { AuthModule } from '../auth/auth.module';
import { MemberModule } from '../member/member.module';
import { FollowResolver } from './follow.resolver';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Follow', schema: FollowSchema }]),
    AuthModule,
    MemberModule,
  ],
  providers: [FollowService, FollowResolver],
  exports: [FollowService],
})
export class FollowModule {}
