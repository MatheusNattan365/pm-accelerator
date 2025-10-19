import asyncio
import logging
import os
import re
import time
from typing import List, Optional
from urllib.parse import urlparse, parse_qs

import uvicorn
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from playwright.async_api import async_playwright, Browser, Page
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('yt_scraper.log')
    ]
)
logger = logging.getLogger(__name__)

# Global semaphore for concurrency limiting
semaphore = asyncio.Semaphore(3)

# Pydantic models
class VideoInfo(BaseModel):
    title: str
    url: str
    thumbnail: str
    channelTitle: str

class SearchResponse(BaseModel):
    videos: List[VideoInfo]
    total_results: int

# FastAPI app
app = FastAPI(
    title="YouTube Search Scraper",
    description="A FastAPI service that scrapes YouTube search results using Playwright",
    version="1.0.0"
)

# CORS middleware
cors_origins = os.getenv("CORS_ALLOW_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global browser instance
browser: Optional[Browser] = None

async def ensure_playwright() -> Browser:
    """Initialize and return a browser instance"""
    global browser
    if browser is None:
        logger.info("Initializing Playwright browser...")
        start_time = time.time()
        
        playwright = await async_playwright().start()
        logger.info("Playwright started successfully")
        
        browser = await playwright.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
                "--disable-web-security",
                "--disable-features=VizDisplayCompositor"
            ]
        )
        
        init_time = time.time() - start_time
        logger.info(f"Chromium browser launched successfully in {init_time:.2f}s")
    else:
        logger.info("Using existing browser instance")
    return browser

async def handle_consent(page: Page) -> None:
    """Handle consent banners and cookie dialogs"""
    logger.info("Checking for consent banners...")
    try:
        # Common consent button selectors
        consent_selectors = [
            'button[aria-label*="Accept"]',
            'button[aria-label*="I agree"]',
            'button:has-text("Accept all")',
            'button:has-text("I agree")',
            'button:has-text("Accept")',
            'button:has-text("Agree")',
            '[role="button"]:has-text("Accept")',
            '[role="button"]:has-text("I agree")',
            'yt-button-renderer:has-text("Accept")',
            'yt-button-renderer:has-text("I agree")'
        ]
        
        consent_found = False
        for i, selector in enumerate(consent_selectors):
            try:
                logger.debug(f"Trying consent selector {i+1}/{len(consent_selectors)}: {selector}")
                consent_button = await page.wait_for_selector(selector, timeout=2000)
                if consent_button:
                    logger.info(f"Found consent button with selector: {selector}")
                    await consent_button.click()
                    logger.info("Clicked consent button successfully")
                    await page.wait_for_timeout(1000)
                    consent_found = True
                    break
            except Exception as e:
                logger.debug(f"Consent selector {selector} not found: {e}")
                continue
        
        if not consent_found:
            logger.info("No consent banners found")
                
    except Exception as e:
        logger.warning(f"Error handling consent banners: {e}")
        # If no consent banner is found, continue
        pass

def extract_video_id_from_url(url: str) -> Optional[str]:
    """Extract video ID from YouTube URL"""
    patterns = [
        r'(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)',
        r'youtube\.com\/v\/([^&\n?#]+)',
        r'youtube\.com\/watch\?.*v=([^&\n?#]+)'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None

async def extract_videos_from_page(page: Page, max_results: int) -> List[VideoInfo]:
    """Extract video information from the current page"""
    logger.info(f"Extracting videos from current page (max: {max_results})")
    videos = []
    
    # Wait for video elements to load
    logger.debug("Waiting for ytd-video-renderer elements to load...")
    await page.wait_for_selector('ytd-video-renderer', timeout=10000)
    
    # Get all video renderer elements
    video_elements = await page.query_selector_all('ytd-video-renderer')
    logger.info(f"Found {len(video_elements)} video elements on page")
    
    for i, element in enumerate(video_elements):
        if len(videos) >= max_results:
            logger.debug(f"Reached max results limit ({max_results}), stopping extraction")
            break
            
        try:
            logger.debug(f"Processing video element {i+1}/{len(video_elements)}")
            
            # Extract title
            title_element = await element.query_selector('a#video-title')
            title = ""
            url = ""
            if title_element:
                title = await title_element.get_attribute('title') or ""
                url = await title_element.get_attribute('href') or ""
                if url and not url.startswith('http'):
                    url = f"https://www.youtube.com{url}"
            
            # Extract channel name
            channel_element = await element.query_selector('a.yt-simple-endpoint.style-scope.yt-formatted-string')
            channel_title = ""
            if channel_element:
                channel_title = await channel_element.inner_text() or ""
            
            # Extract thumbnail
            thumbnail_element = await element.query_selector('img')
            thumbnail = ""
            if thumbnail_element:
                thumbnail = await thumbnail_element.get_attribute('src') or ""
            
            # If thumbnail is missing or is a data URL, derive from video ID
            if not thumbnail or thumbnail.startswith('data:'):
                video_id = extract_video_id_from_url(url)
                if video_id:
                    thumbnail = f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"
                    logger.debug(f"Generated thumbnail URL for video ID: {video_id}")
            
            # Only add if we have essential data
            if title and url:
                videos.append(VideoInfo(
                    title=title,
                    url=url,
                    thumbnail=thumbnail,
                    channelTitle=channel_title
                ))
                logger.debug(f"Successfully extracted video: '{title[:50]}...' by {channel_title}")
            else:
                logger.warning(f"Skipping video element {i+1}: missing title or URL")
                
        except Exception as e:
            logger.error(f"Error extracting video info from element {i+1}: {e}")
            continue
    
    logger.info(f"Successfully extracted {len(videos)} videos from page")
    return videos

async def scroll_and_load_videos(page: Page, max_results: int) -> List[VideoInfo]:
    """Scroll the page incrementally to load more videos"""
    logger.info(f"Starting scroll and load process for {max_results} videos")
    all_videos = []
    scroll_attempts = 0
    max_scroll_attempts = 10
    
    while len(all_videos) < max_results and scroll_attempts < max_scroll_attempts:
        logger.info(f"Scroll attempt {scroll_attempts + 1}/{max_scroll_attempts} - Current videos: {len(all_videos)}")
        
        # Extract videos from current view
        current_videos = await extract_videos_from_page(page, max_results)
        logger.info(f"Extracted {len(current_videos)} videos from current view")
        
        # Add new videos (avoid duplicates)
        new_videos_count = 0
        for video in current_videos:
            if not any(v.url == video.url for v in all_videos):
                all_videos.append(video)
                new_videos_count += 1
        
        logger.info(f"Added {new_videos_count} new videos (total: {len(all_videos)})")
        
        # If we have enough videos, break
        if len(all_videos) >= max_results:
            logger.info(f"Reached target of {max_results} videos, stopping scroll")
            break
            
        # Scroll down to load more content
        logger.debug("Scrolling down to load more content...")
        await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        await page.wait_for_timeout(2000)  # Wait for new content to load
        logger.debug("Scroll completed, waiting for content to load...")
        
        scroll_attempts += 1
    
    if scroll_attempts >= max_scroll_attempts:
        logger.warning(f"Reached maximum scroll attempts ({max_scroll_attempts})")
    
    final_videos = all_videos[:max_results]
    logger.info(f"Scroll and load completed. Final result: {len(final_videos)} videos")
    return final_videos

@app.get("/search", response_model=SearchResponse)
async def search_youtube(
    q: str = Query(..., description="Search term"),
    maxResults: int = Query(10, ge=1, le=50, description="Maximum number of results (1-50)"),
    hl: str = Query("en", description="Language code"),
    gl: str = Query("US", description="Country code")
):
    """Search YouTube for videos and return results"""
    
    logger.info(f"Starting YouTube search: query='{q}', maxResults={maxResults}, hl={hl}, gl={gl}")
    start_time = time.time()
    
    async with semaphore:
        try:
            logger.info("Acquired semaphore, starting scraping process...")
            
            # Get browser instance
            browser = await ensure_playwright()
            
            # Create new page
            logger.info("Creating new browser page...")
            page = await browser.new_page()
            
            # Set user agent to avoid detection
            logger.debug("Setting user agent headers...")
            await page.set_extra_http_headers({
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            })
            
            # Construct search URL
            search_url = f"https://www.youtube.com/results?search_query={q}&hl={hl}&gl={gl}"
            logger.info(f"Navigating to: {search_url}")
            
            # Navigate to YouTube search page
            await page.goto(search_url, wait_until="networkidle")
            logger.info("Successfully navigated to YouTube search page")
            
            # Handle consent banners
            await handle_consent(page)
            
            # Wait a bit for the page to stabilize
            logger.debug("Waiting for page to stabilize...")
            await page.wait_for_timeout(2000)
            
            # Scroll and extract videos
            logger.info("Starting video extraction process...")
            videos = await scroll_and_load_videos(page, maxResults)
            
            # Close the page
            logger.info("Closing browser page...")
            await page.close()
            
            total_time = time.time() - start_time
            logger.info(f"Search completed successfully in {total_time:.2f}s. Found {len(videos)} videos")
            
            return SearchResponse(
                videos=videos,
                total_results=len(videos)
            )
            
        except Exception as e:
            total_time = time.time() - start_time
            logger.error(f"Error during YouTube scraping after {total_time:.2f}s: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error scraping YouTube: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    logger.info("Health check requested")
    return {"status": "healthy"}

@app.on_event("startup")
async def startup_event():
    """Application startup event"""
    logger.info("YouTube Scraper API starting up...")

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up browser on shutdown"""
    logger.info("YouTube Scraper API shutting down...")
    global browser
    if browser:
        logger.info("Closing browser instance...")
        await browser.close()
        logger.info("Browser closed successfully")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
