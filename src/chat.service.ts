/* eslint-disable prettier/prettier */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  GoogleGenerativeAI,
  ChatSession,
  FunctionDeclaration,
  Content,
  SchemaType,
} from '@google/generative-ai';
import { ListingsService } from './listings.service';
import * as fs from 'fs/promises';
import * as path from 'path';
import axios from 'axios';
import { ListingPublishedMessage } from './types/listing.type';

export interface ChatResponse {
  text: string;
  listings?: any[];
}

@Injectable()
export class ChatService implements OnModuleInit {
  private readonly logger = new Logger(ChatService.name);
  private genAI: GoogleGenerativeAI;
  private chatSessions: Map<string, ChatSession> = new Map();
  private readonly sessionsDir = path.join(process.cwd(), '.sessions');

  // Define the tool for ChromaDB querying
  private searchListingsDeclaration: FunctionDeclaration = {
    name: 'search_listings',
    description:
      "Searches real estate listings in the vector database using semantic searc\nh based on the user's criteria. Yields matched listing strings and metadata.",      
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        query: {
          type: SchemaType.STRING,
          description:
            'A detailed semantic search string (e.g. "2 bedroom apartment in Ho \nChi Minh City under 1000000 USD")',                                                     
        },
      },
      required: ['query'],
    },
  };

  constructor(private readonly listingsService: ListingsService) {
    const apiKey = process.env.GEMINI_API_KEY || 'uninitialized';
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async onModuleInit() {
    try {
      await fs.mkdir(this.sessionsDir, { recursive: true });
    } catch (e) {
      this.logger.error('Failed to create sessions directory', e);
    }
  }

  private getSessionFilePath(userId: string, sessionId: string): string {       
    return path.join(this.sessionsDir, userId, `${sessionId}.json`);
  }

  private async getSessionHistory(
    userId: string,
    sessionId: string,
  ): Promise<Content[]> {
    const filePath = this.getSessionFilePath(userId, sessionId);
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data) as Content[];
    } catch (e) {
      return [];
    }
  }

  private async saveSessionHistory(
    userId: string,
    sessionId: string,
    history: Content[],
  ) {
    const filePath = this.getSessionFilePath(userId, sessionId);
    try {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(history, null, 2));
    } catch (e) {
      this.logger.error(
        `Failed to save session ${sessionId} for user ${userId}`,
        e,
      );
    }
  }

  private async getChatSession(
    userId: string,
    sessionId: string,
  ): Promise<ChatSession | undefined> {
    const cacheKey = `${userId}:${sessionId}`;
    if (this.chatSessions.has(cacheKey)) {
      return this.chatSessions.get(cacheKey);
    }

    const modelParams = {
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      tools: [{ functionDeclarations: [this.searchListingsDeclaration] }],      
      systemInstruction:
        'You are a helpful real estate assistant. Guide the user to find their i\ndeal property. Ask clarifying questions if requirements are vague. Once you have enough information, use the `search_listings` tool to find matching properties and present them nicely to the user.',                                              
    };

    // As of genAI package updates, `systemInstruction` is passed either in mode\nl init or `startChat`.                                                              // Usually best in `getGenerativeModel`
    const model = this.genAI.getGenerativeModel(modelParams);

    const history = await this.getSessionHistory(userId, sessionId);

    const chat = model.startChat({
      history,
    });

    this.chatSessions.set(cacheKey, chat);
    return chat;
  }

  async createSession(userId: string, sessionId?: string): Promise<ChatResponse> {    
    sessionId = sessionId || crypto.randomUUID();
    const chat = await this.getChatSession(
      userId,
      sessionId,
    );

    this.logger.log(
      `Initializing chat session ${sessionId} for user ${userId}`,
    );

    // save
    await this.saveSessionHistory(userId, sessionId, []);

    // Return a default specified string without making an API call
    return { text: 'Hello! I am your real estate AI assistant. How can I help you find your ideal property today?' };                                                       
  }

  async sendMessage(
    userId: string,
    sessionId: string,
    message: string,
  ): Promise<ChatResponse> {
    const chat = await this.getChatSession(userId, sessionId);

    this.logger.log(
      `Processing message for user ${userId}, session ${sessionId}`,
    );
    let extractedListingIds: string[] = [];
    if (!chat) {
      this.logger.error(
        `Failed to initialize chat session for user ${userId}, session ${sessionId}`,                                                                                 
      );
      return { text: 'Sorry, I am having trouble starting the conversation. Please try again later.' };                                                                       
    }
    
    try {
      let result = await chat.sendMessage(message);
      let response = result.response;

      // Handle function calls if Gemini decides to call the tool
      const functionCalls = response.functionCalls();

      if (functionCalls && functionCalls.length > 0) {
        const call = functionCalls[0];

        if (call.name === 'search_listings') {
          const queryArgs = call.args as { query: string };
          this.logger.log(
            `Tool called: search_listings with query "${queryArgs.query}"`,     
          );

          // Execute the actual search on Chroma DB
          const searchResults = await this.listingsService.queryListings(       
            queryArgs.query,
          );

          // Format the results
          let formattedResults: { document: string; metadata: any }[] = [];     
          if (
            searchResults &&
            searchResults.documents &&
            searchResults.documents.length > 0
          ) {
            const docs = searchResults.documents[0]; // first query's results   
            const metas = searchResults.metadatas[0];
            for (let i = 0; i < docs.length; i++) {
              formattedResults.push({
                document: docs[i] || '',
                metadata: metas ? metas[i] : null,
              });
              
              if (metas && metas[i]) {
                const metaItem = metas[i];
                if (metaItem && metaItem.listingId) {
                  extractedListingIds.push(metaItem.listingId as string);
                }
              }
            }
          }

          // Return tool execution result back to the model
          result = await chat.sendMessage([
            {
              functionResponse: {
                name: 'search_listings',
                response: { result: formattedResults },
              },
            },
          ]);

          response = result.response;
        }
      }

      // Save history after the conversation turn
      const updatedHistory = await chat.getHistory();
      await this.saveSessionHistory(userId, sessionId, updatedHistory);

      const replyText = response.text();
      const listings: ListingPublishedMessage[] = [];

      // Fetch from API Server for each listing ID detected
      if (extractedListingIds.length > 0) {
        // Unique listing IDs
        const uniqueIds = Array.from(new Set(extractedListingIds));
        const apiHost = process.env.CORE_API_URL || 'http://localhost:3000'; // Make sure this matches your monolith

        for (const listingId of uniqueIds) {
          try {
            const apiRes = await axios.get(`${apiHost}/api/v1/listings/${listingId}`);
            if (apiRes.data) {
              listings.push(apiRes.data);
            }
          } catch (apiErr) {
            this.logger.warn(`Could not fetch details for listing ${listingId}`);
          }
        }
      }

      return { text: replyText, listings };
    } catch (e) {
      this.logger.error('Error during chat completion', e);
      return { text: 'Sorry, I encountered an error while trying to process your requirement.' };                                                                             
    }
  }

  async clearSession(userId: string, sessionId: string) {
    const cacheKey = `${userId}:${sessionId}`;
    this.chatSessions.delete(cacheKey);
    const filePath = this.getSessionFilePath(userId, sessionId);
    try {
      await fs.unlink(filePath);
    } catch (e) {
      // Ignore if file does not exist
    }
  }

  async getHistory(userId: string, sessionId: string): Promise<any[]> {
    const history = await this.getSessionHistory(userId, sessionId);
    const enrichedHistory: any[] = [];
    const apiHost = process.env.CORE_API_URL || 'http://localhost:3000';

    let pendingListingIds = new Set<string>();

    for (let i = 0; i < history.length; i++) {
      const item = history[i];
      const enrichedItem: any = { role: item.role, parts: item.parts };

      // Look for function response in current item to collect listing IDs
      for (const part of item.parts) {
        if (part.functionResponse && part.functionResponse.name === 'search_listings') {
          const responseObj = part.functionResponse.response as any;
          const results = responseObj?.result as any[];
          if (Array.isArray(results)) {
            for (const res of results) {
              if (res.metadata && res.metadata.listingId) {
                pendingListingIds.add(res.metadata.listingId);
              }
            }
          }
        }
      }

      // If it's a model response with text and we have pending listings from previous function calls, attach them
      if (item.role === 'model' && item.parts.some((p) => p.text) && pendingListingIds.size > 0) {
        const listings: any[] = [];
        for (const listingId of pendingListingIds) {
          try {
            const apiRes = await axios.get(`${apiHost}/api/v1/listings/${listingId}`);
            if (apiRes.data) {
              listings.push(apiRes.data);
            }
          } catch (e) {
            this.logger.warn(`Could not fetch details for listing ${listingId} in history`);
          }
        }
        enrichedItem.listings = listings;
        pendingListingIds.clear(); // Reset after attaching to the model's message
      }

      enrichedHistory.push(enrichedItem);
    }

    return enrichedHistory;
  }
}
