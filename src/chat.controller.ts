import { Controller, Post, Get, Body, Delete, Param, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { SendMessageDto } from './dto/sendMessage.dto';
import { ChatSessionResponseDto, ChatClearSessionResponseDto, ChatHistoryResponseDto } from './dto/chatResponse.dto';
import * as crypto from 'crypto';

@ApiTags('Chat')
@ApiBearerAuth()
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @ApiOperation({ summary: 'Initialize a new AI Chat session for the user' })
  @ApiResponse({ status: 201, description: 'Chat session created and greeting generated.', type: ChatSessionResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async createSession(@CurrentUser() userId: string) {
    if (!userId) {
      throw new UnauthorizedException('Missing or invalid bearer token');
    }

    const sessionId = crypto.randomUUID();
    const reply = await this.chatService.createSession(userId, sessionId);

    return {
      userId,
      sessionId,
      reply,
    };
  }

  @Post(':sessionId')
  @ApiOperation({ summary: 'Send a message to the AI Chat Assistant via user token and session ID' })
  @ApiParam({ name: 'sessionId', description: 'Unique identifier for the chat session' })
  @ApiResponse({ status: 201, description: 'Message sent successfully.', type: ChatSessionResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async sendMessage(
    @CurrentUser() userId: string,
    @Param('sessionId') sessionId: string,
    @Body() body: SendMessageDto,
  ) {
    if (!userId) {
      throw new UnauthorizedException('Missing or invalid bearer token');
    }
    if (!body.message) {
      return { error: 'Message body cannot be empty' };
    }

    const reply = await this.chatService.sendMessage(userId, sessionId, body.message);

    return {
      userId,
      sessionId,
      reply,
    };
  }

  @Delete(':sessionId')
  @ApiOperation({ summary: 'Clear a specific chat session history for the current user' })
  @ApiParam({ name: 'sessionId', description: 'Unique identifier for the chat session to clear' })
  @ApiResponse({ status: 200, description: 'Chat session cleared successfully.', type: ChatClearSessionResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async clearSession(
    @CurrentUser() userId: string,
    @Param('sessionId') sessionId: string,
  ) {
    if (!userId) {
      throw new UnauthorizedException('Missing or invalid bearer token');
    }
    await this.chatService.clearSession(userId, sessionId);
    return { success: true, message: `Session ${sessionId} for user ${userId} cleared.` };
  }

  @Get(':sessionId/history')
  @ApiOperation({ summary: 'Retrieve the chat history context for a specific session' })
  @ApiParam({ name: 'sessionId', description: 'Unique identifier for the chat session' })
  @ApiResponse({ status: 200, description: 'Chat history retrieved successfully.', type: ChatHistoryResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getChatHistory(
    @CurrentUser() userId: string,
    @Param('sessionId') sessionId: string,
  ) {
    if (!userId) {
      throw new UnauthorizedException('Missing or invalid bearer token');
    }
    const history = await this.chatService.getHistory(userId, sessionId);
    return {
      userId,
      sessionId,
      history,
    };
  }
}
