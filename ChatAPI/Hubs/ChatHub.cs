using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using ChatAPI.Data;
using ChatAPI.Services;
using ChatAPI.Models;
using System.Security.Claims;
using Microsoft.Extensions.DependencyInjection;

namespace ChatAPI.Hubs;

[Authorize]
public class ChatHub : Hub
{
    private readonly AppDbContext _context;
    private readonly TranslationService _translationService;
    private readonly IServiceScopeFactory _serviceScopeFactory;

    public ChatHub(AppDbContext context, TranslationService translationService, IServiceScopeFactory serviceScopeFactory)
    {
        _context = context;
        _translationService = translationService;
        _serviceScopeFactory = serviceScopeFactory;
        
        Console.WriteLine("=== CHAT HUB CREATED ===");
    }

    private int? GetUserId()
    {
        var userIdClaim = Context.User?.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
            return userId;
        return null;
    }

   public async Task SendMessage(int receiverId, string message, string targetLanguage)
{
    var senderId = GetUserId();
    if (!senderId.HasValue) return;

    Console.WriteLine($"📨 Sending: '{message}' to {receiverId}, Target Lang: {targetLanguage}");

    // Translate the message FIRST
    var translatedText = await _translationService.TranslateAsync(message, targetLanguage);
    var sourceLanguage = await _translationService.DetectLanguageAsync(message);
    
    Console.WriteLine($"🔄 Translation: '{message}' → '{translatedText}'");

    // Create message with translated text
    var newMessage = new Message
    {
        SenderId = senderId.Value,
        ReceiverId = receiverId,
        OriginalText = message,
        TranslatedText = translatedText,
        SourceLanguage = sourceLanguage,
        TargetLanguage = targetLanguage,
        Timestamp = DateTime.Now,
        IsRead = false
    };

    _context.Messages.Add(newMessage);
    await _context.SaveChangesAsync();

    // Send to receiver
    await Clients.User(receiverId.ToString()).SendAsync("ReceiveMessage", new
    {
        newMessage.Id,
        newMessage.OriginalText,
        newMessage.TranslatedText,
        newMessage.SenderId,
        newMessage.Timestamp
    });

    // Confirm to sender
    await Clients.Caller.SendAsync("MessageSent", new
    {
        newMessage.Id,
        newMessage.OriginalText,
        newMessage.TranslatedText,
        newMessage.Timestamp
    });
}
    public async Task Typing(int receiverId)
    {
        var senderId = GetUserId();
        if (!senderId.HasValue) return;
        
        await Clients.User(receiverId.ToString()).SendAsync("UserTyping", senderId.Value);
    }

    public override async Task OnConnectedAsync()
    {
        var userId = GetUserId();
        if (userId.HasValue)
        {
            var user = await _context.Users.FindAsync(userId.Value);
            if (user != null)
            {
                user.IsOnline = true;
                await _context.SaveChangesAsync();
            }
            await Clients.All.SendAsync("UserOnline", userId.Value);
            Console.WriteLine($"🟢 User {userId} connected");
        }
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = GetUserId();
        if (userId.HasValue)
        {
            var user = await _context.Users.FindAsync(userId.Value);
            if (user != null)
            {
                user.IsOnline = false;
                await _context.SaveChangesAsync();
            }
            await Clients.All.SendAsync("UserOffline", userId.Value);
            Console.WriteLine($"🔴 User {userId} disconnected");
        }
        await base.OnDisconnectedAsync(exception);
    }
}