// Main JavaScript for TikDo

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('downloadForm');
    const urlInput = document.getElementById('videoUrl');
    const downloadBtn = document.getElementById('downloadBtn');
    const loadingDiv = document.getElementById('loading');
    const resultDiv = document.getElementById('result');
    const errorDiv = document.getElementById('error');
    
    let currentUrl = '';
    let currentVideoInfo = null;

    // Handle form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const url = urlInput.value.trim();
        
        // Validate URL
        if (!url) {
            showError('Please enter a TikTok URL');
            return;
        }
        
        if (!url.includes('tiktok.com')) {
            showError('Please enter a valid TikTok URL (must contain tiktok.com)');
            return;
        }
        
        currentUrl = url;
        
        // Reset UI
        hideError();
        hideResult();
        showLoading();
        downloadBtn.disabled = true;
        
        try {
            // Get video info first
            const response = await fetch('/get_video_info', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url: url })
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                currentVideoInfo = data;
                showQualityOptions(data);
            } else {
                showError(data.error || 'Failed to fetch video information. Please try again.');
            }
            
        } catch (error) {
            console.error('Error:', error);
            showError('Network error. Please check your connection and try again.');
        } finally {
            hideLoading();
            downloadBtn.disabled = false;
        }
    });
    
    // Show quality selection options
    function showQualityOptions(videoInfo) {
        resultDiv.innerHTML = `
            <div class="text-center">
                <h4 class="mb-3">Select Video Quality</h4>
                <p class="mb-4"><strong>${escapeHtml(videoInfo.title)}</strong></p>
                <div class="quality-buttons">
                    <button class="btn btn-quality btn-lg mb-2" data-quality="1080p">
                        <i class="fas fa-hd-video me-2"></i>1080p HD
                        <span class="badge bg-danger ms-2">Ad</span>
                    </button>
                    <button class="btn btn-quality btn-lg mb-2" data-quality="720p">
                        <i class="fas fa-film me-2"></i>720p HD
                        <span class="badge bg-danger ms-2">Ad</span>
                    </button>
                    <button class="btn btn-quality btn-lg mb-2" data-quality="480p">
                        <i class="fas fa-video me-2"></i>480p
                    </button>
                </div>
                <p class="mt-3 text-muted small">
                    <i class="fas fa-info-circle"></i> HD quality requires viewing a short ad
                </p>
            </div>
        `;
        resultDiv.style.display = 'block';
        
        // Add event listeners to quality buttons
        document.querySelectorAll('.btn-quality').forEach(btn => {
            btn.addEventListener('click', function() {
                const quality = this.getAttribute('data-quality');
                handleQualitySelection(quality);
            });
        });
    }
    
    // Handle quality selection
    async function handleQualitySelection(quality) {
        // Check if ad is required (720p or 1080p)
        if (quality === '720p' || quality === '1080p') {
            showAdThenDownload(quality);
        } else {
            // Download directly for 480p
            startDownload(quality);
        }
    }
    
    // Show ad then download
    function showAdThenDownload(quality) {
        // Show ad modal
        resultDiv.innerHTML = `
            <div class="text-center">
                <h4 class="mb-3">Please wait...</h4>
                <div class="ad-modal-content">
                    <div class="ad-placeholder">
                        <p class="mb-3">Advertisement</p>
                        <div id="monetag-interstitial" class="mb-3">
                            <!-- Monetag Interstitial Ad -->
                            <div style="min-height: 250px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.2rem;">
                                <div>
                                    <i class="fas fa-ad fa-3x mb-3"></i>
                                    <p>Advertisement Space</p>
                                    <p class="small">Replace with Monetag code</p>
                                </div>
                            </div>
                            <!-- Replace above with actual Monetag interstitial code -->
                            <script async="async" data-cfasync="false" src="//thubanoa.com/1?z=YOUR_INTERSTITIAL_ZONE_ID"></script>
                        </div>
                        <button class="btn btn-success btn-lg" id="closeAdBtn">
                            <i class="fas fa-times me-2"></i>Close Ad & Download
                        </button>
                        <p class="mt-3 text-muted small" id="countdown">You can close this in <span id="timer">5</span> seconds...</p>
                    </div>
                </div>
            </div>
        `;
        
        // Countdown timer
        let timeLeft = 5;
        const timerSpan = document.getElementById('timer');
        const closeBtn = document.getElementById('closeAdBtn');
        const countdownText = document.getElementById('countdown');
        
        closeBtn.disabled = true;
        closeBtn.style.opacity = '0.5';
        
        const countdown = setInterval(() => {
            timeLeft--;
            if (timerSpan) {
                timerSpan.textContent = timeLeft;
            }
            
            if (timeLeft <= 0) {
                clearInterval(countdown);
                closeBtn.disabled = false;
                closeBtn.style.opacity = '1';
                if (countdownText) {
                    countdownText.innerHTML = '<i class="fas fa-check-circle text-success"></i> You can now close the ad';
                }
            }
        }, 1000);
        
        // Close ad button click
        closeBtn.addEventListener('click', function() {
            if (!this.disabled) {
                clearInterval(countdown);
                startDownload(quality);
                
                // Track ad view
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'ad_view', {
                        'event_category': 'Advertisement',
                        'event_label': quality + ' Quality Selected'
                    });
                }
            }
        });
    }
    
    // Start download
    async function startDownload(quality) {
        showLoading();
        
        try {
            const response = await fetch('/download', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    url: currentUrl,
                    quality: quality 
                })
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                showDownloadReady(data);
            } else {
                showError(data.error || 'Failed to download video. Please try again.');
            }
            
        } catch (error) {
            console.error('Error:', error);
            showError('Network error. Please check your connection and try again.');
        } finally {
            hideLoading();
        }
    }
    
    // Show download ready
    function showDownloadReady(data) {
        resultDiv.innerHTML = `
            <div class="text-center">
                <i class="fas fa-check-circle text-success mb-3" style="font-size: 3rem;"></i>
                <h4 class="mb-3 text-success">Video Ready!</h4>
                <p class="mb-2"><strong>${escapeHtml(data.title)}</strong></p>
                <p class="mb-4 text-muted">Quality: ${escapeHtml(data.quality)}</p>
                <a href="${escapeHtml(data.download_url)}" class="btn btn-success btn-lg" download>
                    <i class="fas fa-download me-2"></i>Download Video
                </a>
                <p class="mt-3 text-muted small">
                    <i class="fas fa-info-circle"></i> File will be automatically deleted after 1 hour
                </p>
            </div>
        `;
        resultDiv.style.display = 'block';
        hideLoading();
        
        // Track download
        if (typeof gtag !== 'undefined') {
            gtag('event', 'download', {
                'event_category': 'Video',
                'event_label': 'TikTok Video Downloaded - ' + data.quality
            });
        }
    }
    
    // Show loading state
    function showLoading() {
        loadingDiv.style.display = 'block';
        resultDiv.style.display = 'none';
    }
    
    // Hide loading state
    function hideLoading() {
        loadingDiv.style.display = 'none';
    }
    
    // Show result (deprecated - now using showQualityOptions)
    function showResult(data) {
        showDownloadReady(data);
    }
    
    // Hide result
    function hideResult() {
        resultDiv.style.display = 'none';
        resultDiv.innerHTML = '';
    }
    
    // Show error
    function showError(message) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        hideResult();
        
        // Track error with Google Analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'error', {
                'event_category': 'Download Error',
                'event_label': message
            });
        }
    }
    
    // Hide error
    function hideError() {
        errorDiv.style.display = 'none';
        errorDiv.textContent = '';
    }
    
    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
    
    // Clear input when clicking outside after error
    urlInput.addEventListener('focus', function() {
        if (errorDiv.style.display === 'block') {
            hideError();
        }
    });
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#') {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
});

// Add animation on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all cards
document.querySelectorAll('.step-card, .feature-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(card);
});

// Track page views with Google Analytics
if (typeof gtag !== 'undefined') {
    gtag('event', 'page_view', {
        'page_title': document.title,
        'page_location': window.location.href,
        'page_path': window.location.pathname
    });
}

// Track clicks on important elements
document.querySelectorAll('.nav-link, .footer-links a').forEach(link => {
    link.addEventListener('click', function() {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'click', {
                'event_category': 'Navigation',
                'event_label': this.textContent.trim()
            });
        }
    });
});
