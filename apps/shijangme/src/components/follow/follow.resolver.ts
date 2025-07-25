import { Args, Mutation, Resolver, Query } from '@nestjs/graphql';
import { InjectModel } from '@nestjs/mongoose';
import { FollowService } from './follow.service';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Follower, Followings } from '../../libs/dto/follow/follow';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { ObjectId } from 'mongoose';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { WithoutGuard } from '../auth/guards/without.guard';
import { FollowInquiry } from '../../libs/dto/follow/follow.input';

@Resolver()
export class FollowResolver {
  constructor(private readonly followService: FollowService) {}

  @UseGuards(AuthGuard)
  @Mutation(() => Follower)
  public async subscribe(
    @Args('input') input: string,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Follower> {
    console.log('Mutation subscribe');
    const followingId = shapeIntoMongoObjectId(input);
    return await this.followService.subscribe(memberId, followingId);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => Follower)
  public async unsubscribe(
    @Args('input') input: string,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Follower> {
    console.log('Mutation unsubscribe');
    const followingId = shapeIntoMongoObjectId(input);
    return await this.followService.unsubscribe(memberId, followingId);
  }

  @UseGuards(WithoutGuard)
  @Query(() => Followings)
  public async getMemberFollowings(
    @Args('input') input: FollowInquiry,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Followings> {
    console.log('Query getMemberFollowings');

    input.search.followerId = shapeIntoMongoObjectId(input.search.followerId);
    input.search.followingId = shapeIntoMongoObjectId(input.search.followingId);

    return await this.followService.getMemberFollowings(memberId, input);
  }
}
