import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const OrgMembership = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const membership = request.orgMembership;
    return data ? membership?.[data] : membership;
  },
);
