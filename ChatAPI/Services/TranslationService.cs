using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;

namespace ChatAPI.Services;

public class TranslationService
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;
    private readonly string _region;
    private readonly IMemoryCache _cache;
    private static readonly Dictionary<string, string> _translationCache = new();

    public TranslationService(IConfiguration config, IMemoryCache cache)
    {
        _cache = cache;
        _httpClient = new HttpClient();
        _apiKey = config["AzureTranslator:ApiKey"];
        _region = config["AzureTranslator:Region"];
        
        Console.WriteLine($"🔑 API Key exists: {!string.IsNullOrEmpty(_apiKey)}");
        Console.WriteLine($"🌍 Region: {_region ?? "NULL"}");
        
        if (!string.IsNullOrEmpty(_apiKey))
        {
            Console.WriteLine("✅ Azure Translator Ready (REST API Mode)");
        }
        else
        {
            Console.WriteLine("⚠️ Using Demo Mode - No API Key");
        }
    }

    public async Task<string> TranslateAsync(string text, string targetLanguage)
    {
        Console.WriteLine($"🔍 Translating: '{text}' to {targetLanguage}");
        
        if (string.IsNullOrWhiteSpace(text))
            return text;

        // Check cache first
        var cacheKey = $"{text}_{targetLanguage}";
        
        // Check memory cache
        if (_translationCache.ContainsKey(cacheKey))
        {
            Console.WriteLine($"📦 Cache hit: {text} → {_translationCache[cacheKey]}");
            return _translationCache[cacheKey];
        }
        
       
        if (_cache.TryGetValue(cacheKey, out string cached))
        {
            Console.WriteLine($"📦 IMemoryCache hit: {text} → {cached}");
            _translationCache[cacheKey] = cached;
            return cached;
        }

        string translatedText;

        // Use Azure if API key exists
        if (!string.IsNullOrEmpty(_apiKey) && _apiKey.Length > 10)
        {
            try
            {
                var url = $"https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to={targetLanguage}";
                
                var requestBody = new[] { new { Text = text } };
                var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
                
                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Add("Ocp-Apim-Subscription-Key", _apiKey);
                _httpClient.DefaultRequestHeaders.Add("Ocp-Apim-Subscription-Region", _region);
                
                var response = await _httpClient.PostAsync(url, content);
                var responseString = await response.Content.ReadAsStringAsync();
                
                if (response.IsSuccessStatusCode)
                {
                    using var doc = JsonDocument.Parse(responseString);
                    translatedText = doc.RootElement[0].GetProperty("translations")[0].GetProperty("text").GetString();
                    Console.WriteLine($"✅ Azure translation: {text} → {translatedText}");
                }
                else
                {
                    Console.WriteLine($"❌ Azure error: {responseString}");
                    translatedText = GetDemoTranslation(text, targetLanguage);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Translation error: {ex.Message}");
                translatedText = GetDemoTranslation(text, targetLanguage);
            }
        }
        else
        {
            translatedText = GetDemoTranslation(text, targetLanguage);
            Console.WriteLine($"📱 Demo translation: {text} → {translatedText}");
        }

        // Store in caches
        _translationCache[cacheKey] = translatedText;
        _cache.Set(cacheKey, translatedText, TimeSpan.FromHours(1));
        
        return translatedText;
    }

    private string GetDemoTranslation(string text, string targetLanguage)
    {
        var lowerText = text.ToLower();
        if (targetLanguage == "hi")
        {
            if (lowerText.Contains("hello")) return "नमस्ते";
            if (lowerText.Contains("how are you")) return "आप कैसे हैं";
            if (lowerText.Contains("good")) return "अच्छा";
            if (lowerText.Contains("thanks")) return "धन्यवाद";
            if (lowerText.Contains("morning")) return "सुप्रभात";
            if (lowerText.Contains("bye")) return "अलविदा";
        }
        return text;
    }

    public async Task<string> DetectLanguageAsync(string text)
    {
        // Simple detection for demo
        if (text.Any(c => c >= 0x0900 && c <= 0x097F))
            return "hi";
        return "en";
    }
}