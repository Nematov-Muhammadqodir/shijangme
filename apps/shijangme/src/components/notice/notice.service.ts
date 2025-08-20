import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Notice } from '../../libs/dto/notice/notice';
import { NoticeInput, NoticeInquery } from '../../libs/dto/notice/notice.input';
import { Message } from '../../libs/enums/common.enum';
import { NoticeUpdate } from '../../libs/dto/notice/notice.update';
import { NoticeStatus } from '../../libs/enums/notice.enum';

@Injectable()
export class NoticeService {
  constructor(
    @InjectModel('Notice') private readonly noticeModel: Model<Notice>,
  ) {}

  public async createNotice(
    memberId: ObjectId,
    input: NoticeInput,
  ): Promise<Notice> {
    input.memberId = memberId;

    try {
      const newNotice = this.noticeModel.create(input);

      return newNotice;
    } catch (error) {
      console.log('Error createNotice', error);
      throw new BadRequestException(Message.CREATE_FAILED);
    }
  }

  public async updateNotice(
    memberId: ObjectId,
    input: NoticeUpdate,
  ): Promise<Notice> {
    const result = await this.noticeModel.findOneAndUpdate(
      {
        _id: input._id,
      },
      input,
      { new: true },
    );

    if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

    return result;
  }

  public async getNotices(input: NoticeInquery): Promise<Notice[]> {
    return await this.noticeModel.find({
      noticeStatus: NoticeStatus.ACTIVE,
      noticeFor: input.noticeFor,
    });
  }

  public async getAllNoticesByAdmin(): Promise<Notice[]> {
    return await this.noticeModel.find();
  }
}
