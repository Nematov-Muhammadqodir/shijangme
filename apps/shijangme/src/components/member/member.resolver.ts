import { Args, Mutation, Resolver, Query } from '@nestjs/graphql';
import { MemberService } from './member.service';
import { Member, Members } from '../../libs/dto/member/member';
import {
  LoginInput,
  MemberInput,
  MembersInquiry,
  VendorsInquiry as VendorsInquiry,
} from '../../libs/dto/member/member.input';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { MemberUpdate } from '../../libs/dto/member/member.update';
import { ObjectId } from 'mongoose';
import { WithoutGuard } from '../auth/guards/without.guard';
import {
  getSerialForImage,
  shapeIntoMongoObjectId,
  validMimeTypes,
} from '../../libs/config';
import { Like } from '../../libs/dto/like/like';
import { GraphQLUpload, FileUpload } from 'graphql-upload';
import { Message } from '../../libs/enums/common.enum';
import { createWriteStream } from 'fs';

@Resolver()
export class MemberResolver {
  constructor(private readonly memberService: MemberService) {}

  @Mutation(() => Member)
  public async signup(@Args('input') input: MemberInput): Promise<Member> {
    console.log('Mutation signup');
    return await this.memberService.signup(input);
  }

  @Mutation(() => Member)
  public async login(@Args('input') input: LoginInput): Promise<Member> {
    console.log('Mutation login');
    return await this.memberService.login(input);
  }

  @UseGuards(AuthGuard)
  @Query(() => String)
  public async checkAuth(@AuthMember('memberNick') memberNick: string) {
    console.log('Query checkAuth');
    return `Hello ${memberNick}`;
  }

  @Roles(MemberType.USER, MemberType.VENDOR)
  @UseGuards(RolesGuard)
  @Query(() => String)
  public async checkAuthRoles(@AuthMember() member: Member) {
    console.log('Query checkAuthRoles');
    console.log('RESULT checkAuthRoles', member);
    return `Hello ${member.memberNick}, you are ${member.memberType}:(${member._id})`;
  }

  @UseGuards(AuthGuard)
  @Mutation(() => Member)
  public async updateMember(
    @Args('input') input: MemberUpdate,
    @AuthMember('_id') memberId: ObjectId,
  ) {
    console.log('Mutation updateMember');
    delete input._id;

    return await this.memberService.updateMember(memberId, input);
  }

  @UseGuards(WithoutGuard)
  @Query(() => Member)
  public async getMember(
    @Args('memberId') input: string,
    @AuthMember('_id') memberId: ObjectId,
  ) {
    console.log('Query getMember');
    const targetId = shapeIntoMongoObjectId(input);

    return await this.memberService.getMember(memberId, targetId);
  }

  @UseGuards(WithoutGuard)
  @Query(() => Members)
  public async getVendors(
    @Args('input') input: VendorsInquiry,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Members> {
    console.log('Query getVendors');
    return await this.memberService.getVendors(memberId, input);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => Member)
  public async likeTargetMember(
    @Args('memberId') input: string,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Member> {
    console.log('Mutation likeTargetMember');

    const likeRefId = shapeIntoMongoObjectId(input);

    return await this.memberService.likeTargetMember(memberId, likeRefId);
  }

  //^ ADMIN RELATED APIs

  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Query(() => Members)
  public async getAllMembersByAdmin(
    @Args('input') input: MembersInquiry,
  ): Promise<Members> {
    console.log('Mutation:getAllMembersByAdmin');

    return await this.memberService.getAllMembersByAdmin(input);
  }

  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Mutation(() => Member)
  public async updateMemberByAdmin(
    @Args('input') input: MemberUpdate,
  ): Promise<Member> {
    console.log('Mutation updateMemberByAdmin');
    return await this.memberService.updateMemberByAdmin(input);
  }

  //*=========================imageUploader👇🏻==============================

  @UseGuards(AuthGuard)
  @Mutation((returns) => String)
  public async imageUploader(
    @Args({ name: 'file', type: () => GraphQLUpload })
    { createReadStream, filename, mimetype }: FileUpload,
    @Args('target') target: String,
  ): Promise<string> {
    console.log('Mutation: imageUploader');

    if (!filename) throw new Error(Message.UPLOAD_FAILED);
    const validMime = validMimeTypes.includes(mimetype);
    if (!validMime) throw new Error(Message.PROVIDE_ALLOWED_FORMAT);

    const imageName = getSerialForImage(filename);
    const url = `uploads/${target}/${imageName}`;
    const stream = createReadStream();

    const result = await new Promise((resolve, reject) => {
      stream
        .pipe(createWriteStream(url))
        .on('finish', async () => resolve(true))
        .on('error', () => reject(false));
    });
    if (!result) throw new Error(Message.UPLOAD_FAILED);

    return url;
  }

  //*===========================imagesUploader👇🏻===========================

  @UseGuards(AuthGuard)
  @Mutation((returns) => [String])
  public async imagesUploader(
    @Args('files', { type: () => [GraphQLUpload] })
    files: Promise<FileUpload>[],
    @Args('target') target: String,
  ): Promise<string[]> {
    console.log('Mutation: imagesUploader');

    const uploadedImages = [];
    const promisedList = files.map(
      async (
        img: Promise<FileUpload>,
        index: number,
      ): Promise<Promise<void>> => {
        try {
          const { filename, mimetype, encoding, createReadStream } = await img;

          const validMime = validMimeTypes.includes(mimetype);
          if (!validMime) throw new Error(Message.PROVIDE_ALLOWED_FORMAT);

          const imageName = getSerialForImage(filename);
          const url = `uploads/${target}/${imageName}`;
          const stream = createReadStream();

          const result = await new Promise((resolve, reject) => {
            stream
              .pipe(createWriteStream(url))
              .on('finish', () => resolve(true))
              .on('error', () => reject(false));
          });
          if (!result) throw new Error(Message.UPLOAD_FAILED);

          uploadedImages[index] = url;
        } catch (err) {
          console.log('Error, file missing!');
        }
      },
    );

    await Promise.all(promisedList);
    return uploadedImages;
  }
}
