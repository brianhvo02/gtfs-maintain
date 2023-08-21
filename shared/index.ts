export interface Feed {
    id: string;
    name: string;
    url: string;
}

export const checkFeed = (feed: any): feed is Feed => feed.id && feed.name && feed.url;