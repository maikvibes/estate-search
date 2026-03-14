export interface ListingPublishedMessage {
    listingId:          string;
    userId:             string;
    title:              string;
    description:        string;
    listingType:        string;
    propertyType:       string;
    status:             string;
    price:              number;
    priceCurrency:      string;
    pricePeriod:        null;
    negotiable:         boolean;
    areaSqm:            number;
    bedrooms:           number;
    bathrooms:          number;
    floors:             null;
    floorNumber:        number;
    yearBuilt:          number;
    streetAddress:      string;
    buildingName:       null;
    wardName:           string;
    provinceName:       string;
    countryName:        string;
    latitude:           null;
    longitude:          null;
    featuredImageUrl:   string;
    imagesJson:         ImagesJSON[];
    additionalInfoJson: null;
    viewCount:          number;
    saveCount:          number;
    contactCount:       number;
    creditsLocked:      number;
    creditsCharged:     number;
    creditsRefunded:    number;
    amenityNames:       string[];
    hasVirtualTour:     boolean;
    createdAt:          number;
    updatedAt:          number;
    submittedAt:        number;
    publishedAt:        number;
    expiredAt:          null;
    freePost:           boolean;
}

export interface ImagesJSON {
    url:        string;
    order:      number;
    caption:    string;
    uploadedAt: number;
}
