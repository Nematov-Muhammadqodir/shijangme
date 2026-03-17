import { Args, Query, Resolver } from '@nestjs/graphql';
import { AiAgentService } from './ai-agent.service';

@Resolver()
export class AiAgentResolver {
  constructor(private readonly aiAgentService: AiAgentService) {}

  @Query(() => String)
  async askAiAgent(
    @Args('question') question: string,
  ): Promise<string> {
    return await this.aiAgentService.askAgent(question);
  }
}
