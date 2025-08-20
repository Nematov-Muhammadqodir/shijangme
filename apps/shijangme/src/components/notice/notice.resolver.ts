import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { NoticeService } from './notice.service';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Notice } from '../../libs/dto/notice/notice';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { NoticeInput } from '../../libs/dto/notice/notice.input';
import { ObjectId } from 'mongoose';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { NoticeUpdate } from '../../libs/dto/notice/notice.update';

@Resolver()
export class NoticeResolver {
  constructor(private readonly noticeService: NoticeService) {}

  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Mutation(() => Notice)
  public async createNotice(
    @Args('input') input: NoticeInput,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Notice> {
    console.log('Mutation createNotice');

    return await this.noticeService.createNotice(memberId, input);
  }

  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Mutation(() => Notice)
  public async updateNotice(
    @Args('input') input: NoticeUpdate,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Notice> {
    console.log('Mutation updateNotice');

    return await this.noticeService.updateNotice(memberId, input);
  }
}
