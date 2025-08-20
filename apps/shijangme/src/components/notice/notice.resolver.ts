import { Args, Mutation, Resolver, Query } from '@nestjs/graphql';
import { NoticeService } from './notice.service';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Notice, Notices } from '../../libs/dto/notice/notice';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { NoticeInput, NoticeInquery } from '../../libs/dto/notice/notice.input';
import { ObjectId } from 'mongoose';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { NoticeUpdate } from '../../libs/dto/notice/notice.update';
import { WithoutGuard } from '../auth/guards/without.guard';

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

  @UseGuards(WithoutGuard)
  @Query(() => [Notice])
  public async getNotices(
    @Args('input') input: NoticeInquery,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Notice[]> {
    console.log('Query getNotices');
    return await this.noticeService.getNotices(input);
  }

  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Query(() => [Notice])
  public async getAllNoticesByAdmin(): Promise<Notice[]> {
    console.log('Query getAllNoticesByAdmin');
    return await this.noticeService.getAllNoticesByAdmin();
  }
}
