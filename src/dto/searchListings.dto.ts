import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SearchListingsDto {
  @ApiProperty({
    description: 'The text query for searching listings.',
    example: 'Find a property that matches this description',
    required: false,
  })
  text?: string;

  @ApiPropertyOptional({
    description: 'A base64 encoded image to refine the search via multimodal query.',
    example: 'data:image/png;base64,iVBORw0KGgo...',
  })
  imageBase64?: string;
}
