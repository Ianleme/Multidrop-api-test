import axios from "axios"

const TiktokApi = axios.create({
    baseURL: "https://business-api.tiktok.com/open_api/v1.3"
})

const FacebookAdsApi = axios.create({
    baseURL: "https://graph.facebook.com/v14.0"
})

const GoogleAnalytcsApi = axios.create({
    baseURL: "https://www.google-analytics.com"
})

export { TiktokApi, FacebookAdsApi, GoogleAnalytcsApi }