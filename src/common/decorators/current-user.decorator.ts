import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface UsuarioJwt {
  userId: number;
  email: string;
  role: string;
  tallerId?: number | null;
}

/**
 * Inyecta el usuario autenticado (payload del JWT) en el handler.
 * Ej: obtener(@CurrentUser() user: UsuarioJwt)
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UsuarioJwt | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
