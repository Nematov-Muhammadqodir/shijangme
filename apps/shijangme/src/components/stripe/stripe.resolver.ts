// payment.resolver.ts

import { Resolver, Mutation, Args, Int } from '@nestjs/graphql';
import { StripeService } from './stripe.service';

@Resolver()
export class StripeResolver {
  constructor(private readonly stripeService: StripeService) {}

  @Mutation(() => String)
  async createPaymentIntent(
    @Args('amount', { type: () => Int }) amount: number,
  ) {
    return this.stripeService.createPaymentIntent(amount);
  }
}
