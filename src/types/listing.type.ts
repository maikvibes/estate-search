import { ApiProperty } from '@nestjs/swagger';


export enum ListingStatus {
  'DRAFT',
  'PENDING_REVIEW',
  'PUBLISHED',
  'REJECTED',
  'EXPIRED',
  'ARCHIVED',
  'DELETED',
}

export class ListingPublishedMessage {
  @ApiProperty()
  listingId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  listingType: string;

  @ApiProperty()
  propertyType: string;

  @ApiProperty({ enum: ListingStatus })
  status: ListingStatus;

  @ApiProperty()
  price: number;

  @ApiProperty()
  priceCurrency: string;

  @ApiProperty({ nullable: true, type: 'string', default: null })
  pricePeriod: null;

  @ApiProperty()
  negotiable: boolean;

  @ApiProperty()
  areaSqm: number;

  @ApiProperty()
  bedrooms: number;

  @ApiProperty()
  bathrooms: number;

  @ApiProperty({ nullable: true, type: 'number', default: null })
  floors: null;

  @ApiProperty()
  floorNumber: number;

  @ApiProperty()
  yearBuilt: number;

  @ApiProperty()
  streetAddress: string;

  @ApiProperty({ nullable: true, type: 'string', default: null })
  buildingName: null;

  @ApiProperty()
  wardName: string;

  @ApiProperty()
  provinceName: string;

  @ApiProperty()
  countryName: string;

  @ApiProperty({ nullable: true, type: 'number', default: null })
  latitude: null;

  @ApiProperty({ nullable: true, type: 'number', default: null })
  longitude: null;

  @ApiProperty()
  featuredImageUrl: string;

  @ApiProperty({ type: [Object] })
  imagesJson: ImagesJSON[];

  @ApiProperty({ nullable: true, type: 'object', additionalProperties: true })
  additionalInfoJson: null;

  @ApiProperty()
  viewCount: number;

  @ApiProperty()
  saveCount: number;

  @ApiProperty()
  contactCount: number;

  @ApiProperty()
  creditsLocked: number;

  @ApiProperty()
  creditsCharged: number;

  @ApiProperty()
  creditsRefunded: number;

  @ApiProperty({ type: [String] })
  amenityNames: string[];

  @ApiProperty()
  hasVirtualTour: boolean;

  @ApiProperty()
  createdAt: number;

  @ApiProperty()
  updatedAt: number;

  @ApiProperty()
  submittedAt: number;

  @ApiProperty()
  publishedAt: number;

  @ApiProperty({ nullable: true, type: 'number', default: null })
  expiredAt: null;

  @ApiProperty()
  freePost: boolean;
}


export interface ImagesJSON {
  url: string;
  order: number;
  caption: string;
  uploadedAt: number;
}
