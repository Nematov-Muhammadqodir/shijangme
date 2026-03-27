import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { VendorAiAgentService } from './vendor-ai-agent.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { ObjectId } from 'mongoose';

@Resolver()
export class VendorAiAgentResolver {
  constructor(
    private readonly vendorAiAgentService: VendorAiAgentService,
  ) {}

  @Roles(MemberType.VENDOR)
  @UseGuards(RolesGuard)
  @Mutation(() => String)
  async askVendorAiAgent(
    @Args('question') question: string,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<string> {
    return await this.vendorAiAgentService.askVendorAgent(
      memberId.toString(),
      question,
    );
  }
}
