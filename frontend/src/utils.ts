import { useEffect, useState } from "react";

interface GeolocationResponse {
    status: string;
    country: string;
    countryCode: string;
    region: string;
    regionName: string;
    city: string;
    zip: string;
    lat: number;
    lon: number;
    timezone: string;
    isp: string;
    org: string;
    as: string;
    query: string;
}

export const useGeolocation = () => {
    const [geolocation, setGeolocation] = useState<GeolocationResponse>();
    useEffect(() => {
        fetch('http://ip-api.com/json')
            .then(res => res.json())
            .then(setGeolocation);
    }, []);

    return geolocation;
}

export const isDevelopment = process.env.NODE_ENV === 'development';

export const customFetch = (
    input: RequestInfo | URL,
    init?: RequestInit | undefined, 
    onfulfilled?: (response: Response) => void, 
    onrejected?: (reason: any) => void
) => {
    const controller = new AbortController();
    fetch(input, {
        ...init,
        signal: controller.signal
    }).then(onfulfilled).catch(onrejected);
    return () => controller.abort();
}

export const hexToRgb = (hex: string): [number, number, number] | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [ 
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : null;
}