import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Follower, Following, Followings } from '../../libs/dto/follow/follow';
import { MemberService } from '../member/member.service';
import { Direction, Message } from '../../libs/enums/common.enum';
import { FollowInquiry } from '../../libs/dto/follow/follow.input';
import { T } from '../../libs/types/common';
import {
  lookupAuthMemberFollowed,
  lookupAuthMemberLiked,
  lookupFollowingData,
} from '../../libs/config';

@Injectable()
export class FollowService {
  constructor(
    @InjectModel('Follow')
    private readonly followModel: Model<Follower | Following>,
    private readonly memberService: MemberService,
  ) {}

  public async subscribe(
    followerId: ObjectId,
    followingId: ObjectId,
  ): Promise<Follower> {
    if (followerId.toString() === followingId.toString()) {
      throw new InternalServerErrorException(Message.SELF_SUBSCRIPTION_DENIED);
    }

    const targetMember = await this.memberService.getMember(null, followingId);
    if (!targetMember)
      throw new InternalServerErrorException(Message.NO_DATA_FOUND);

    const result = await this.registerSubscription(followerId, followingId);

    await this.memberService.memberStatsEditor({
      _id: followerId,
      targetKey: 'memberFollowings',
      modifier: 1,
    });

    await this.memberService.memberStatsEditor({
      _id: followingId,
      targetKey: 'memberFollowers',
      modifier: 1,
    });

    return result;
  }

  private async registerSubscription(
    followerId: ObjectId,
    followingId: ObjectId,
  ): Promise<Follower> {
    try {
      console.log('Registring subscription...');
      return await this.followModel.create({
        followingId: followingId,
        followerId: followerId,
      });
    } catch (err) {
      console.log('Error, Service => registerSubscription:', err.message);
      throw new InternalServerErrorException(Message.CREATE_FAILED);
    }
  }

  public async unsubscribe(
    followerId: ObjectId,
    followingId: ObjectId,
  ): Promise<Follower> {
    const targetMember = await this.memberService.getMember(null, followingId);

    if (!targetMember)
      throw new InternalServerErrorException(Message.NO_DATA_FOUND);

    const result = await this.followModel.findOneAndDelete({
      followerId: followerId,
      followingId: followingId,
    });

    if (!result) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

    await this.memberService.memberStatsEditor({
      _id: followerId,
      targetKey: 'memberFollowings',
      modifier: -1,
    });
    await this.memberService.memberStatsEditor({
      _id: followingId,
      targetKey: 'memberFollowers',
      modifier: -1,
    });

    return result;
  }

  public async getMemberFollowings(
    memberId: ObjectId,
    input: FollowInquiry,
  ): Promise<Followings> {
    const { page, limit, search } = input;

    if (!search.followerId)
      throw new InternalServerErrorException(Message.BAD_REQUEST);
    const match: T = { followerId: search?.followerId };
    const sort: T = { createdAt: Direction.DESC };

    const result = await this.followModel
      .aggregate([
        { $match: match },
        { $sort: sort },
        {
          $facet: {
            list: [
              { $skip: (page - 1) * limit },
              { $limit: limit },
              lookupAuthMemberLiked(memberId, '$followingId'),
              lookupAuthMemberFollowed({
                followerId: memberId,
                followingId: '$followingId',
              }),
              lookupFollowingData,
              { $unwind: '$followingData' },
            ],
            metaCounter: [{ $count: 'total' }],
          },
        },
      ])
      .exec();

    if (!result.length)
      throw new InternalServerErrorException(Message.NO_DATA_FOUND);

    return result[0] as Followings;
  }
}
