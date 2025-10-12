import { Resolver, Mutation, Args, Context } from '@nestjs/graphql';
import { AuthService } from './auth.service';

@Resolver('Auth')
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => String)
  async login(
    @Args('email') email: string,
    @Args('password') password: string,
    @Context() context: any,
  ): Promise<string> {
    const tokenPair = await this.authService.login(email, password);
    const res = context.res;
    res.cookie('session', tokenPair.session, { httpOnly: true });
    return tokenPair.access;
  }

  @Mutation(() => String)
  async refresh(@Context() context: any): Promise<string> {
    const cookies = context.req.cookies.session;
    const tokenPair = await this.authService.refresh(cookies);
    const res = context.res;
    res.cookie('session', tokenPair.session, { httpOnly: true });
    return tokenPair.access;
  }

  @Mutation(() => Boolean)
  logout(@Context() context: any): boolean {
    const res = context.res;
    res.clearCookie('session');
    return true;
  }
}
