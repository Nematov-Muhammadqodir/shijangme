import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Member, Members } from '../../libs/dto/member/member';
import { Model, ObjectId } from 'mongoose';
import {
  LoginInput,
  MemberInput,
  MembersInquiry,
  VendorsInquiry,
} from '../../libs/dto/member/member.input';
import { AuthService } from '../auth/auth.service';
import { Direction, Message } from '../../libs/enums/common.enum';
import { MemberStatus, MemberType } from '../../libs/enums/member.enum';
import { MemberUpdate } from '../../libs/dto/member/member.update';
import { ViewInput } from '../../libs/dto/view/view.input';
import { ViewGroup } from '../../libs/enums/view.enum';
import { ViewService } from '../view/view.service';
import { StatisticModifier, T } from '../../libs/types/common';
import { LikeInput } from '../../libs/dto/like/like.input';
import { LikeGroup } from '../../libs/enums/like.enum';
import { LikeService } from '../like/like.service';
import { Follower, Following, MeFollowed } from '../../libs/dto/follow/follow';
import { lookupAuthMemberLiked } from '../../libs/config';

@Injectable()
export class MemberService {
  constructor(
    @InjectModel('Member') private readonly memberModel: Model<Member>,
    @InjectModel('Follow')
    private readonly followModel: Model<Follower | Following>,
    private authService: AuthService,
    private viewService: ViewService,
    private likeService: LikeService,
  ) {}

  public async signup(input: MemberInput): Promise<Member> {
    input.memberPassword = await this.authService.hashPassword(
      input.memberPassword,
    );

    try {
      const result: Member = await this.memberModel.create(input);
      //TODO Auth with tokens
      result.accessToken = await this.authService.createToken(result);

      return result;
    } catch (error) {
      console.log('MemberService signup Error', error);
      throw new BadRequestException(Message.USED_MEMBER_NICK_OR_PHONE);
    }
  }

  public async login(input: LoginInput): Promise<Member> {
    const { memberNick, memberPassword } = input;
    const response: Member = await this.memberModel
      .findOne({ memberNick: memberNick })
      .select('+memberPassword')
      .exec();
    if (!response || response.memberStatus === MemberStatus.DELETE) {
      throw new InternalServerErrorException(Message.NO_DATA_FOUND);
    } else if (response.memberStatus === MemberStatus.BLOCK) {
      throw new InternalServerErrorException(Message.BLOCKED_USER);
    }
    const isMatch = await this.authService.comparePassword(
      memberPassword,
      response.memberPassword,
    );
    if (!isMatch)
      throw new InternalServerErrorException(Message.WRONG_PASSWORD);

    response.accessToken = await this.authService.createToken(response);

    return response;
  }

  public async updateMember(
    memberId: ObjectId,
    input: MemberUpdate,
  ): Promise<Member> {
    const result = await this.memberModel
      .findByIdAndUpdate(
        { _id: memberId, memberStatus: MemberStatus.ACTIVE },
        input,
        { new: true },
      )
      .exec();

    if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

    result.accessToken = await this.authService.createToken(result);

    return result;
  }

  public async getMember(
    memberId: ObjectId,
    targetId: ObjectId,
  ): Promise<Member> {
    const search: T = {
      _id: targetId,
      memberStatus: { $in: [MemberStatus.ACTIVE, MemberStatus.BLOCK] },
    };
    const targetMember = await this.memberModel.findOne(search).lean().exec();
    if (!targetMember)
      throw new InternalServerErrorException(Message.NO_DATA_FOUND);

    if (memberId) {
      const viewInquery: ViewInput = {
        viewGroup: ViewGroup.MEMBER,
        viewRefId: targetId,
        memberId: memberId,
      };

      const newView = await this.viewService.recordView(viewInquery);
      //^RECORD VIEW
      if (newView) {
        await this.memberModel
          .findOneAndUpdate(search, { $inc: { memberViews: 1 } }, { new: true })
          .exec();

        targetMember.memberViews++;
      }
      //& ME_LIKED
      const likeInput: LikeInput = {
        memberId: memberId,
        likeRefId: targetId,
        likeGroup: LikeGroup.MEMBER,
      };

      targetMember.meLiked =
        await this.likeService.checkLikeExistance(likeInput);

      //! ME_FOLLOWED

      targetMember.meFollowed = await this.checkSubscription(
        memberId,
        targetId,
      );
    }
    return targetMember;
  }

  private async checkSubscription(
    followerId: ObjectId,
    followingId: ObjectId,
  ): Promise<MeFollowed[]> {
    const result = await this.followModel.findOne({
      followingId: followingId,
      followerId: followerId,
    });

    return result
      ? [
          {
            followerId: followerId,
            followingId: followingId,
            myFollowing: true,
          },
        ]
      : [];
  }

  public async getVendors(
    memberId: ObjectId,
    input: VendorsInquiry,
  ): Promise<Members> {
    const { text } = input.search;
    const match: T = {
      memberType: MemberType.VENDOR,
      memberStatus: MemberStatus.ACTIVE,
    };

    const sort: T = {
      [input?.sort ?? 'createdAt']: input.direction ?? Direction.DESC,
    };

    if (text) match.memberNick = { $regex: new RegExp(text, 'i') };

    const result = await this.memberModel
      .aggregate([
        { $match: match },
        { $sort: sort },
        {
          $facet: {
            list: [
              { $skip: (input.page - 1) * input.limit },
              { $limit: input.limit },
              lookupAuthMemberLiked(memberId),
            ],
            metaCounter: [{ $count: 'total' }],
          },
        },
      ])
      .exec();

    if (!result.length)
      throw new InternalServerErrorException(Message.NO_DATA_FOUND);

    return result[0];
  }

  public async likeTargetMember(
    memberId: ObjectId,
    likeRefId: ObjectId,
  ): Promise<Member> {
    const targetMember = await this.memberModel
      .findOne({
        _id: likeRefId,
        memberStatus: MemberStatus.ACTIVE,
      })
      .exec();

    if (!targetMember)
      throw new InternalServerErrorException(Message.NO_DATA_FOUND);

    const likeInput: LikeInput = {
      memberId: memberId,
      likeRefId: likeRefId,
      likeGroup: LikeGroup.MEMBER,
    };

    const modifier: number = await this.likeService.toggleLike(likeInput);

    const result = await this.memberStatsEditor({
      _id: likeRefId,
      targetKey: 'memberLikes',
      modifier: modifier,
    });

    if (!result)
      throw new InternalServerErrorException(Message.SOMETHING_WENT_WRONG);

    return result;
  }

  //^ ADMIN RELATED APIs

  public async getAllMembersByAdmin(input: MembersInquiry): Promise<Members> {
    const { memberStatus, memberType, text } = input.search;
    const match: T = {};
    const sort: T = {
      [input?.sort ?? 'createdAt']: input.direction ?? Direction.DESC,
    };

    if (memberStatus) match.MemberStatus = memberStatus;
    if (memberType) match.memberType = memberType;
    if (text) match.memberNick = { $regex: new RegExp(text, 'i') };
    console.log('match', match);

    const result = await this.memberModel
      .aggregate([
        { $match: match },
        { $sort: sort },
        {
          $facet: {
            list: [
              { $skip: (input.page - 1) * input.limit },
              { $limit: input.limit },
            ],
            metaCounter: [{ $count: 'total' }],
          },
        },
      ])
      .exec();

    if (!result.length)
      throw new InternalServerErrorException(Message.NO_DATA_FOUND);
    return result[0];
  }

  public async updateMemberByAdmin(input: MemberUpdate): Promise<Member> {
    const result: Member = await this.memberModel
      .findOneAndUpdate({ _id: input._id }, input, { new: true })
      .exec();

    if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
    return result;
  }

  //! REUSABLE MEMBER DATA EDITOR
  public async memberStatsEditor(input: StatisticModifier): Promise<Member> {
    console.log('Service: memberStatsEditor');
    const { _id, targetKey, modifier } = input;

    return await this.memberModel
      .findByIdAndUpdate(
        _id,
        { $inc: { [targetKey]: modifier } },
        { new: true },
      )
      .exec();
  }
}
