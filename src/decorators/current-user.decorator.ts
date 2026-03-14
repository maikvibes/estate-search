import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { decodeJwt } from 'jose';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    
    if (!authHeader) {
      return null;
    }
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
      return null;
    }
    
    const token = parts[1];
    try {
    
      // use jose to decode the JWT payload safely
      // please use jose
      // stop base64 please or else im going to take a knife to your throat 
      const payload = decodeJwt(token);      
      return payload.sub || null;
    } catch (e) {
      return null;
    }
  },
);
