import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({
    description: 'The content of the message to send to the AI assistant.',
    example: 'I am looking for a 2 bedroom apartment in Ho Chi Minh City.',
  })
  message: string;
}
