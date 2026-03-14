/* eslint-disable prettier/prettier */
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ChromaClient, Collection } from 'chromadb';
import { GoogleGeminiEmbeddingFunction } from '@chroma-core/google-gemini';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ListingPublishedMessage } from './types/listing.type';

@Injectable()
export class ListingsService implements OnModuleInit {
  private readonly logger = new Logger(ListingsService.name);
  private chromaClient: ChromaClient;
  private collection: Collection;
  private genAI: GoogleGenerativeAI;
  private embedder: GoogleGeminiEmbeddingFunction;

  async onModuleInit() {
    this.chromaClient = new ChromaClient({
      path: process.env.CHROMA_HOST || 'http://localhost:2222',
    });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY is not set');
    }

    this.genAI = new GoogleGenerativeAI(apiKey || 'uninitialized');

    this.embedder = new GoogleGeminiEmbeddingFunction({
      apiKey: apiKey || 'uninitialized',
      modelName: 'gemini-embedding-2-preview',
    });
    this
    try {
      this.collection = await this.chromaClient.getOrCreateCollection({
        name: 'listings',
        embeddingFunction: this.embedder,
      });
      this.logger.log('ChromaDB collection initialized.');
    } catch (e) {
      this.logger.error('Error connecting to ChromaDB', e);
    }
  }

  async processListingPublish(listing: ListingPublishedMessage) {
    this.logger.log(`Processing listing: ${listing.listingId}`);

    // Create text document describing the listing
    const textDocument = `
      Listing ID: ${listing.listingId}
      Title: ${listing.title}
      Description: ${listing.description}
      Type: ${listing.propertyType} ${listing.listingType}
      Price: ${listing.price} ${listing.priceCurrency}
      Address: ${listing.streetAddress}, ${listing.wardName}, ${listing.provinceName}, ${listing.countryName}
      Bedrooms: ${listing.bedrooms}, Bathrooms: ${listing.bathrooms}
      Amenities: ${listing.amenityNames.join(', ')}
    `;

    const imageUrls = [
      listing.featuredImageUrl,
      ...listing.imagesJson.map((img) => img.url),
    ].filter(Boolean);

    // Prepare metadata
    const metadata = {
      listingId: listing.listingId,
      propertyName: listing.title,
      price: listing.price,
      images: JSON.stringify(imageUrls),
    };

    // Note: To use the new gemini-embedding-2-preview fully for images,
    // you typically pass the images via the 'uris' field. (URLs or file paths).
    try {
      const ids = [listing.listingId];
      const documents = [textDocument];
      const uris: string[] = imageUrls.length > 0 ? [imageUrls[0]] : [];
      const metadatas = [metadata];

      // Embedding additional images independently to make them searchable
      for (let i = 1; i < imageUrls.length; i++) {
        ids.push(`${listing.listingId}-img-${i}`);
        documents.push(`Listing ${listing.listingId} Image ${i}`);
        uris.push(imageUrls[i]);
        metadatas.push(metadata);
      }

      await this.collection.add({
        ids,
        documents,
        uris: uris.filter((u) => u !== undefined).length > 0 ? uris : undefined,
        metadatas,
      });
      this.logger.log(
        `Listing ${listing.listingId} embedded and stored in ChromaDB.`,
      );
    } catch (e) {
      this.logger.error(
        `Error saving listing ${listing.listingId} into ChromaDB`,
        e,
      );
    }
  }

  async queryListings(queryText: string, imageBase64?: string) {
    let finalQueryText = queryText;

    // Optional: Refine the query with Gemini if an image is provided
    // if (imageBase64) {
    //   this.logger.log('Refining query using Gemini with provided image...');
    //   finalQueryText = await this.refineQueryWithImage(queryText, imageBase64);
    //   this.logger.log(`Refined query: ${finalQueryText}`);
    // } else {
    //   // We can also refine purely text search to extract intents.
    //   finalQueryText = await this.refineTextQuery(queryText);
    // }

    try {
      const results = await this.collection.query({
        queryTexts: [finalQueryText],
        nResults: 5,
      });

      return results;
    } catch (e) {
      this.logger.error('Error querying ChromaDB', e);
      throw e;
    }
  }

  private async refineQueryWithImage(
    text: string,
    base64Image: string,
  ): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.5-flash' });
    const prompt = `Convert the following user intent and the provided image into an optimized search query for a real estate listing database. User intent: "${text}"`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: 'image/jpeg',
        },
      },
    ]);
    return result.response.text();
  }

  private async refineTextQuery(text: string): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.5-flash' });
    const prompt = `You are a real estate search assistant. Reformulate this user query into a highly descriptive semantic search query for a vector database. Query: "${text}"`;

    const result = await model.generateContent([prompt]);
    return result.response.text();
  }
}
