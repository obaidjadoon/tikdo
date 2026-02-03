import os
import time
import uuid
from flask import Flask, render_template, request, jsonify, send_file
import yt_dlp
from pathlib import Path
import threading

app = Flask(__name__)

# Create downloads directory
DOWNLOAD_FOLDER = Path('downloads')
DOWNLOAD_FOLDER.mkdir(exist_ok=True)

# Cleanup old files every hour
def cleanup_old_files():
    """Remove files older than 1 hour to save space"""
    while True:
        try:
            current_time = time.time()
            for file_path in DOWNLOAD_FOLDER.glob('*'):
                if file_path.is_file():
                    # Delete files older than 1 hour
                    if current_time - file_path.stat().st_mtime > 3600:
                        file_path.unlink()
        except Exception as e:
            print(f"Cleanup error: {e}")
        time.sleep(3600)  # Run every hour

# Start cleanup thread
cleanup_thread = threading.Thread(target=cleanup_old_files, daemon=True)
cleanup_thread.start()

@app.route('/')
def index():
    """Main page"""
    return render_template('index.html')

@app.route('/privacy')
def privacy():
    """Privacy policy page"""
    return render_template('privacy.html')

@app.route('/pinterest')
def pinterest():
    """Pinterest downloader page"""
    return render_template('pinterest.html')

@app.route('/disclaimer')
def disclaimer():
    """Disclaimer page"""
    return render_template('disclaimer.html')

@app.route('/robots.txt')
def robots():
    """Serve robots.txt"""
    return send_file('static/robots.txt', mimetype='text/plain')

@app.route('/sitemap.xml')
def sitemap():
    """Serve sitemap.xml"""
    return send_file('static/sitemap.xml', mimetype='application/xml')

@app.route('/get_video_info', methods=['POST'])
def get_video_info():
    """Get video information and available qualities"""
    try:
        data = request.get_json()
        url = data.get('url', '').strip()
        
        if not url:
            return jsonify({'error': 'Please provide a TikTok or Pinterest URL'}), 400
        
        # Validate URL (TikTok or Pinterest)
        url_lower = url.lower()
        if 'tiktok.com' not in url_lower and 'pinterest.com' not in url_lower and 'pin.it' not in url_lower:
            return jsonify({'error': 'Please provide a valid TikTok or Pinterest URL'}), 400
        
        # Get video info without downloading
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'skip_download': True,
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            title = info.get('title', 'TikTok Video')
            thumbnail = info.get('thumbnail', '')
            
            # Determine available qualities
            formats = info.get('formats', [])
            available_qualities = set()
            
            for fmt in formats:
                height = fmt.get('height')
                if height:
                    if height >= 1080:
                        available_qualities.add('1080p')
                    elif height >= 720:
                        available_qualities.add('720p')
                    elif height >= 480:
                        available_qualities.add('480p')
            
            # Always offer these options
            qualities = ['1080p', '720p', '480p']
            
        return jsonify({
            'success': True,
            'title': title,
            'thumbnail': thumbnail,
            'qualities': qualities
        })
        
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': 'Failed to fetch video information. Please check the URL.'}), 500

@app.route('/download', methods=['POST'])
def download_video():
    """Handle video download request"""
    try:
        data = request.get_json()
        url = data.get('url', '').strip()
        quality = data.get('quality', 'best')
        
        if not url:
            return jsonify({'error': 'Please provide a TikTok or Pinterest URL'}), 400
        
        # Validate URL (TikTok or Pinterest)
        url_lower = url.lower()
        if 'tiktok.com' not in url_lower and 'pinterest.com' not in url_lower and 'pin.it' not in url_lower:
            return jsonify({'error': 'Please provide a valid TikTok or Pinterest URL'}), 400
        
        # Detect platform
        platform = 'pinterest' if ('pinterest.com' in url_lower or 'pin.it' in url_lower) else 'tiktok'
        
        # Generate unique filename
        unique_id = str(uuid.uuid4())[:8]
        output_path = DOWNLOAD_FOLDER / f'{platform}_{unique_id}.mp4'
        
        # Set format based on quality selection (simplified to avoid ffmpeg)
        if quality == '1080p':
            format_string = 'best[height<=1080]/best'
        elif quality == '720p':
            format_string = 'best[height<=720]/best'
        elif quality == '480p':
            format_string = 'best[height<=480]/best'
        else:
            format_string = 'best'
        
        # yt-dlp options for downloading without watermark
        ydl_opts = {
            'format': format_string,
            'outtmpl': str(output_path),
            'quiet': True,
            'no_warnings': True,
            'extract_flat': False,
            'nocheckcertificate': True,
        }
        
        # Download the video
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            title = info.get('title', 'tiktok_video')
            
        # Check if file was created
        if not output_path.exists():
            return jsonify({'error': 'Failed to download video. Please try again.'}), 500
        
        return jsonify({
            'success': True,
            'filename': output_path.name,
            'title': title,
            'quality': quality,
            'download_url': f'/get_file/{output_path.name}'
        })
        
    except yt_dlp.utils.DownloadError as e:
        return jsonify({'error': 'Failed to download video. The URL might be invalid or the video is private.'}), 400
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': 'An unexpected error occurred. Please try again.'}), 500

@app.route('/get_file/<filename>')
def get_file(filename):
    """Serve downloaded file"""
    try:
        file_path = DOWNLOAD_FOLDER / filename
        if not file_path.exists():
            return "File not found or expired", 404
        
        return send_file(
            file_path,
            as_attachment=True,
            download_name=f'tiktok_video_{filename}',
            mimetype='video/mp4'
        )
    except Exception as e:
        print(f"Error serving file: {e}")
        return "Error downloading file", 500

@app.errorhandler(404)
def not_found(e):
    return render_template('index.html'), 404

@app.errorhandler(500)
def server_error(e):
    return "Internal server error", 500

if __name__ == '__main__':
    # For production, use a WSGI server like gunicorn
    # For development
    app.run(debug=True, host='0.0.0.0', port=5000)
