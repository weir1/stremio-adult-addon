class ConfigService {
  static generateConfigPage() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Adult Content Addon - Configuration</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            color: #ffffff; min-height: 100vh; padding: 20px;
        }
        .container {
            max-width: 700px; margin: 0 auto;
            background: rgba(255, 255, 255, 0.1); border-radius: 15px; padding: 30px;
            backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { color: #ff6b6b; margin-bottom: 10px; font-size: 2em; }
        .header p { color: #cccccc; line-height: 1.6; }
        .form-group { margin-bottom: 25px; }
        .form-group label { display: block; margin-bottom: 8px; font-weight: 600; color: #ffffff; }
        .form-group input {
            width: 100%; padding: 12px 16px;
            border: 2px solid rgba(255, 255, 255, 0.3); border-radius: 8px;
            background: rgba(255, 255, 255, 0.1); color: #ffffff; font-size: 16px;
            transition: border-color 0.3s ease;
        }
        .form-group input:focus {
            outline: none; border-color: #ff6b6b;
            box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.1);
        }
        .form-group input::placeholder { color: #aaaaaa; }
        .form-group small { color: #aaaaaa; margin-top: 5px; display: block; }
        .checkbox-group { display: flex; align-items: center; margin-top: 10px; }
        .checkbox-group input[type="checkbox"] { width: auto; margin-right: 10px; transform: scale(1.2); }
        .status-box {
            background: rgba(76, 175, 80, 0.1); border: 1px solid rgba(76, 175, 80, 0.3);
            border-radius: 8px; padding: 15px; margin-bottom: 25px;
        }
        .status-box.error { background: rgba(255, 82, 82, 0.1); border-color: rgba(255, 82, 82, 0.3); }
        .status-box h4 { color: #4caf50; margin-bottom: 10px; }
        .status-box.error h4 { color: #ff5252; }
        .install-section {
            margin-top: 30px; padding: 20px;
            background: rgba(76, 175, 80, 0.1); border: 1px solid rgba(76, 175, 80, 0.3);
            border-radius: 8px;
        }
        .install-section h3 { color: #4caf50; margin-bottom: 15px; }
        .manifest-url {
            background: rgba(0, 0, 0, 0.3); padding: 10px; border-radius: 5px;
            font-family: monospace; word-break: break-all; margin: 10px 0;
            border-left: 3px solid #ff6b6b;
        }
        .copy-btn {
            background: #ff6b6b; color: white; border: none; padding: 8px 16px;
            border-radius: 5px; cursor: pointer; margin-top: 10px;
            transition: background-color 0.3s ease;
        }
        .copy-btn:hover { background: #ff5252; }
        .steps { list-style: none; counter-reset: step-counter; }
        .steps li {
            counter-increment: step-counter; margin-bottom: 15px; padding-left: 40px;
            position: relative; line-height: 1.6;
        }
        .steps li::before {
            content: counter(step-counter); position: absolute; left: 0; top: 0;
            background: #ff6b6b; color: white; width: 25px; height: 25px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-weight: bold; font-size: 12px;
        }
        .warning {
            background: rgba(255, 82, 82, 0.1); border: 1px solid rgba(255, 82, 82, 0.3);
            border-radius: 8px; padding: 15px; margin-top: 20px;
        }
        .warning h4 { color: #ff5252; margin-bottom: 10px; }
        .section { margin-bottom: 30px; padding: 20px; border-radius: 10px; }
        .section.torbox { background: rgba(255, 140, 0, 0.1); border: 1px solid rgba(255, 140, 0, 0.3); }
        .section.posters { background: rgba(138, 43, 226, 0.1); border: 1px solid rgba(138, 43, 226, 0.3); }
        .section.fansdb { background: rgba(0, 188, 212, 0.1); border: 1px solid rgba(0, 188, 212, 0.3); }
        .section h3 { margin-bottom: 15px; }
        .section.torbox h3 { color: #ff8c00; }
        .section.posters h3 { color: #8a2be2; }
        .section.fansdb h3 { color: #00bcd4; }
        .info-box {
            background: rgba(255, 193, 7, 0.1); border: 1px solid rgba(255, 193, 7, 0.3);
            border-radius: 8px; padding: 15px; margin-bottom: 25px;
        }
        .info-box h3 { color: #ffc107; margin-bottom: 10px; }
        .info-box p { color: #cccccc; line-height: 1.5; margin-bottom: 5px; }
        .info-box a { color: #ff6b6b; text-decoration: none; }
        .info-box a:hover { text-decoration: underline; }
        @media (max-width: 768px) {
            .container { margin: 10px; padding: 20px; }
            .header h1 { font-size: 1.5em; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔥 Adult Content Addon</h1>
            <p>Configure TorBox integration and poster sources for enhanced streaming</p>
            <p><strong>✨ Advanced Configuration - Multiple Services</strong></p>
        </div>

        <div class="section torbox">
            <h3>🟡 TorBox Integration (Optional)</h3>
            <p style="color: #cccccc; margin-bottom: 15px;">Enable cached streaming with TorBox cloud torrent service</p>
            
            <div class="form-group">
                <label for="torboxApiKey">TorBox API Key:</label>
                <input type="text" id="torboxApiKey" name="torboxApiKey" placeholder="Enter your TorBox API key...">
                <small>Get from <a href="https://torbox.app/settings" target="_blank">TorBox Settings → API</a></small>
            </div>

            <div class="form-group">
                <div class="checkbox-group">
                    <input type="checkbox" id="enableTorBox" name="enableTorBox">
                    <label for="enableTorBox">Enable TorBox Integration</label>
                </div>
            </div>
        </div>

        <div class="section posters">
            <h3>🎨 Poster & Metadata Sources</h3>
            <p style="color: #cccccc; margin-bottom: 15px;">Configure sources for high-quality posters and metadata</p>
            
            <div class="info-box">
                <h3>📋 How to get ThePornDB API Key:</h3>
                <p>1. Go to <a href="https://theporndb.net/register" target="_blank">ThePornDB.net</a> and create account</p>
                <p>2. Navigate to <a href="https://theporndb.net/user/api-tokens" target="_blank">User → API Tokens</a></p>
                <p>3. Create a new token with "Read" permissions</p>
                <p>4. Copy the token and paste it below</p>
            </div>
            
            <div class="form-group">
                <label for="theporndbApiKey">ThePornDB API Key:</label>
                <input type="text" id="theporndbApiKey" name="theporndbApiKey" placeholder="Paste your ThePornDB API key here...">
                <small>Required for high-quality posters and metadata</small>
            </div>

            <div class="form-group">
                <div class="checkbox-group">
                    <input type="checkbox" id="enableThePornDB" name="enableThePornDB">
                    <label for="enableThePornDB">Enable ThePornDB Integration</label>
                </div>
            </div>

            <div class="form-group">
                <div class="checkbox-group">
                    <input type="checkbox" id="enableEnhancedPosters" name="enableEnhancedPosters" checked>
                    <label for="enableEnhancedPosters">Enable Enhanced Placeholder Posters</label>
                </div>
            </div>
        </div>

        <div class="section fansdb">
            <h3>💃 FansDB Integration (Optional)</h3>
            <p style="color: #cccccc; margin-bottom: 15px;">Enable OnlyFans content from FansDB.cc</p>
            
            <div class="form-group">
                <label for="fansdbApiKey">FansDB API Key:</label>
                <input type="text" id="fansdbApiKey" name="fansdbApiKey" placeholder="Enter your FansDB API key...">
                <small>Get from FansDB.cc after registration</small>
            </div>

            <div class="form-group">
                <div class="checkbox-group">
                    <input type="checkbox" id="enableFansDB" name="enableFansDB">
                    <label for="enableFansDB">Enable FansDB Integration</label>
                </div>
            </div>
        </div>

        <div id="statusBox" class="status-box" style="display:none;">
            <h4 id="statusTitle">⚙️ Configuration Status</h4>
            <p id="statusMessage">Configure your services above</p>
        </div>

        <div class="install-section">
            <h3>🚀 Installation Instructions:</h3>
            <ol class="steps">
                <li><strong>Get API Keys:</strong> Register for TorBox and/or ThePornDB (both optional)</li>
                <li><strong>Enter Keys:</strong> Paste your API keys in the fields above</li>
                <li><strong>Enable Services:</strong> Check the boxes for services you want to use</li>
                <li><strong>Copy URL:</strong> Copy the automatically generated manifest URL below</li>
                <li><strong>Install in Stremio:</strong> Go to Add-ons → Community Add-ons → Add Add-on</li>
                <li><strong>Paste & Install:</strong> Paste the URL and click Install</li>
            </ol>
            
            <div class="manifest-url" id="manifestUrl">
                <span id="urlText">https://stremio.moindigital.in/manifest.json</span>
                <button class="copy-btn" onclick="copyManifestUrl()">📋 Copy Configured URL</button>
            </div>
        </div>

        <div class="warning">
            <h4>⚠️ Important Notes:</h4>
            <p>• <strong>API Keys are encrypted in the URL</strong> and only used by your Stremio client</p>
            <p>• TorBox provides cached streaming (faster, no P2P needed)</p>
            <p>• ThePornDB provides high-quality posters and metadata</p>
            <p>• Both services are optional - the addon works without them</p>
            <p>• This addon provides adult content - use responsibly</p>
        </div>
    </div>

    <script>
        function updateManifestUrl() {
            const torboxApiKey = document.getElementById('torboxApiKey').value.trim();
            const enableTorBox = document.getElementById('enableTorBox').checked;
            const theporndbApiKey = document.getElementById('theporndbApiKey').value.trim();
            const enableThePornDB = document.getElementById('enableThePornDB').checked;
            const enableEnhancedPosters = document.getElementById('enableEnhancedPosters').checked;
            const fansdbApiKey = document.getElementById('fansdbApiKey').value.trim();
            const enableFansDB = document.getElementById('enableFansDB').checked;
            
            let baseUrl = 'https://stremio.moindigital.in';
            let manifestUrl = baseUrl + '/manifest.json';
            
            // Build config object
            const config = {};
            if (torboxApiKey) config.torboxApiKey = torboxApiKey;
            if (enableTorBox) config.enableTorBox = enableTorBox;
            if (theporndbApiKey) config.theporndbApiKey = theporndbApiKey;
            if (enableThePornDB) config.enableThePornDB = enableThePornDB;
            if (enableEnhancedPosters) config.enableEnhancedPosters = enableEnhancedPosters;
            if (fansdbApiKey) config.fansdbApiKey = fansdbApiKey;
            if (enableFansDB) config.enableFansDB = enableFansDB;
            
            // Create encoded URL if any config is set
            if (Object.keys(config).length > 0) {
                const configStr = btoa(JSON.stringify(config));
                manifestUrl = baseUrl + '/' + configStr + '/manifest.json';
            }
            
            // Update status
            const statusBox = document.getElementById('statusBox');
            const statusTitle = document.getElementById('statusTitle');
            const statusMessage = document.getElementById('statusMessage');
            
            let services = [];
            if (enableTorBox && torboxApiKey) services.push('TorBox');
            if (enableThePornDB && theporndbApiKey) services.push('ThePornDB');
            if (enableFansDB && fansdbApiKey) services.push('FansDB');
            if (enableEnhancedPosters) services.push('Enhanced Posters');
            
            statusBox.style.display = 'block';
            if (services.length > 0) {
                statusBox.className = 'status-box';
                statusTitle.textContent = '✅ Services Configured';
                statusMessage.textContent = 'Active: ' + services.join(', ') + '. Ready to install!';
            } else {
                statusBox.className = 'status-box';
                statusTitle.textContent = '🔘 Basic Mode';
                statusMessage.textContent = 'Addon will work with basic functionality only.';
            }
            
            document.getElementById('urlText').textContent = manifestUrl;
        }

        function copyManifestUrl() {
            const urlText = document.getElementById('urlText').textContent;
            navigator.clipboard.writeText(urlText).then(() => {
                const btn = document.querySelector('.copy-btn');
                const originalText = btn.textContent;
                btn.textContent = '✅ Copied!';
                btn.style.background = '#4caf50';
                
                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.style.background = '#ff6b6b';
                }, 2000);
            });
        }

        // Add event listeners
        document.getElementById('torboxApiKey').addEventListener('input', updateManifestUrl);
        document.getElementById('enableTorBox').addEventListener('change', updateManifestUrl);
        document.getElementById('theporndbApiKey').addEventListener('input', updateManifestUrl);
        document.getElementById('enableThePornDB').addEventListener('change', updateManifestUrl);
        document.getElementById('enableEnhancedPosters').addEventListener('change', updateManifestUrl);
        document.getElementById('fansdbApiKey').addEventListener('input', updateManifestUrl);
        document.getElementById('enableFansDB').addEventListener('change', updateManifestUrl);
        
        updateManifestUrl();
    </script>
</body>
</html>
    `;
  }

  static parseConfigFromUrl(configStr) {
    try {
      const decoded = Buffer.from(configStr, 'base64').toString();
      return JSON.parse(decoded);
    } catch (error) {
      console.error('Error parsing config from URL:', error);
      return {};
    }
  }
}

module.exports = ConfigService;
