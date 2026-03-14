import { Controller, Post, Body } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ListingsService } from './listings.service';
import type { ListingPublishedMessage } from './types/listing.type';

@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @EventPattern('listing-publish')
  async handleListingPublish(@Payload() message: ListingPublishedMessage) {
    if (message && message.listingId) {
      await this.listingsService.processListingPublish(message);
    }
  }

  // REST endpoint to search
  @Post('search')
  async searchListings(@Body() body: { text: string; imageBase64?: string }) {
    if (!body.text && !body.imageBase64) {
      return { error: 'Provide at least text or an imageBase64' };
    }
    
    // Default text if only image is provided
    const text = body.text || 'Find a property matching this image';
    
    const results = await this.listingsService.queryListings(text, body.imageBase64);
    
    return {
      success: true,
      originalText: text,
      results,
    };
  }
}
