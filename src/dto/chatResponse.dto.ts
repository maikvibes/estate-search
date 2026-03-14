import type { FunctionCall, FunctionResponse } from '@google/generative-ai';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ListingPublishedMessage } from 'src/types/listing.type';

export class ChatReplyDto {
  @ApiProperty({
    description: 'The text response from the AI assistant.',
    example: 'Here are some listings you might be interested in.',
  })
  text: string;

  @ApiPropertyOptional({
    description: 'An array of matching listing objects fetched from the API.',
    type: [ListingPublishedMessage],
  })
  listings?: ListingPublishedMessage[];
}

export class ChatSessionResponseDto {
  @ApiProperty({ description: 'The user ID derived from the JWT token.' })
  userId: string;

  @ApiProperty({ description: 'The unique ID for this chat session.' })
  sessionId: string;

  @ApiProperty({ type: ChatReplyDto, description: "The AI assistant's reply." })
  reply: ChatReplyDto;
}

export class ChatClearSessionResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Session 123 for user 456 cleared.' })
  message: string;
}

export class ChatHistoryContentPartDto {
  @ApiPropertyOptional({ description: 'Text content if present' })
  text?: string;

  @ApiPropertyOptional({
    description: 'Function call object if present',
    type: Object,
  })
  functionCall?: FunctionCall;

  @ApiPropertyOptional({
    description: 'Function response object if present',
    type: Object,
  })
  functionResponse?: FunctionResponse;
}

export class ChatHistoryContentDto {
  @ApiProperty({
    description: 'The role of the message sender (user or model)',
    example: 'user',
  })
  role: string;

  @ApiProperty({
    type: [ChatHistoryContentPartDto],
    description: 'The parts making up this content payload',
  })
  parts: ChatHistoryContentPartDto[];

  @ApiPropertyOptional({
    description:
      'An array of matching listing objects fetched from the API related to this message.',
    type: [ListingPublishedMessage],
  })
  listings?: ListingPublishedMessage[];
}

export class ChatHistoryResponseDto {
  @ApiProperty({ description: 'The user ID derived from the JWT token.' })
  userId: string;

  @ApiProperty({ description: 'The unique ID for this chat session.' })
  sessionId: string;

  @ApiProperty({
    type: [ChatHistoryContentDto],
    description:
      'The chronologically ordered history of messages in the session.',
  })
  history: ChatHistoryContentDto[];
}

export class ChatSessionListItemDto {
  @ApiProperty({ description: 'The unique ID for a chat session.' })
  sessionId: string;

  @ApiProperty({
    description: 'Last updated time of this session history file in ISO format.',
    example: '2026-03-14T10:22:35.000Z',
  })
  updatedAt: string;
}

export class ChatSessionsListResponseDto {
  @ApiProperty({ description: 'The user ID derived from the JWT token.' })
  userId: string;

  @ApiProperty({ description: 'Current page number.', example: 1 })
  page: number;

  @ApiProperty({ description: 'Number of items per page.', example: 20 })
  limit: number;

  @ApiProperty({ description: 'Total number of chat sessions for the user.', example: 5 })
  total: number;

  @ApiProperty({ type: [ChatSessionListItemDto] })
  sessions: ChatSessionListItemDto[];
}
