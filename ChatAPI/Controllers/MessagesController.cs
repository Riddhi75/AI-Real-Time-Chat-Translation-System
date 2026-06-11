using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using ChatAPI.Data;
using ChatAPI.Models;
using ChatAPI.Services;

namespace ChatAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MessagesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly TranslationService _translationService;

    public MessagesController(AppDbContext context, TranslationService translationService)
    {
        _context = context;
        _translationService = translationService;
    }

    private int GetCurrentUserId()
    {
        return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers()
    {
        var currentUserId = GetCurrentUserId();
        var users = await _context.Users
            .Where(u => u.Id != currentUserId)
            .Select(u => new { u.Id, u.Username, u.Email, u.IsOnline })
            .ToListAsync();
        return Ok(users);
    }

    [HttpGet("conversation/{userId}")]
    public async Task<IActionResult> GetConversation(int userId)
    {
        var currentUserId = GetCurrentUserId();
        var messages = await _context.Messages
            .Where(m => (m.SenderId == currentUserId && m.ReceiverId == userId) ||
                       (m.SenderId == userId && m.ReceiverId == currentUserId))
            .OrderBy(m => m.Timestamp)
            .Select(m => new
            {
                m.Id,
                m.SenderId,
                m.ReceiverId,
                m.OriginalText,
                m.TranslatedText,
                m.Timestamp,
                m.IsRead,
                m.SourceLanguage,
                m.TargetLanguage
            })
            .ToListAsync();
        return Ok(messages);
    }

    [HttpPost("send")]
    public async Task<IActionResult> SendMessage(SendMessageDto request)
    {
        var currentUserId = GetCurrentUserId();
        
        var translatedText = await _translationService.TranslateAsync(request.Message, request.TargetLanguage);
        var sourceLanguage = await _translationService.DetectLanguageAsync(request.Message);

        var message = new Message
        {
            SenderId = currentUserId,
            ReceiverId = request.ReceiverId,
            OriginalText = request.Message,
            TranslatedText = translatedText,
            SourceLanguage = sourceLanguage,
            TargetLanguage = request.TargetLanguage,
            Timestamp = DateTime.Now,
            IsRead = false
        };

        _context.Messages.Add(message);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            message.Id,
            message.OriginalText,
            message.TranslatedText,
            message.Timestamp,
            message.SourceLanguage,
            message.TargetLanguage
        });
    }

    [HttpDelete("{messageId}")]
    public async Task<IActionResult> DeleteMessage(int messageId)
    {
        var currentUserId = GetCurrentUserId();
        var message = await _context.Messages.FindAsync(messageId);
        
        if (message == null)
            return NotFound();
        
        if (message.SenderId != currentUserId)
            return Unauthorized();
        
        _context.Messages.Remove(message);
        await _context.SaveChangesAsync();
        
        return Ok(new { message = "Message deleted" });
    }

    [HttpPut("{messageId}")]
    public async Task<IActionResult> EditMessage(int messageId, [FromBody] EditMessageDto request)
    {
        var currentUserId = GetCurrentUserId();
        var message = await _context.Messages.FindAsync(messageId);
        
        if (message == null)
            return NotFound();
        
        if (message.SenderId != currentUserId)
            return Unauthorized();
        
        // Retranslate the edited message
        var translatedText = await _translationService.TranslateAsync(request.Text, message.TargetLanguage);
        
        message.OriginalText = request.Text;
        message.TranslatedText = translatedText;
        await _context.SaveChangesAsync();
        
        return Ok(new { message.Id, message.OriginalText, message.TranslatedText });
    }

    // ✅ PER-MESSAGE TRANSLATION API
    [HttpPost("translate/{messageId}")]
    public async Task<IActionResult> TranslateMessage(int messageId, [FromBody] TranslateMessageDto request)
    {
        var message = await _context.Messages.FindAsync(messageId);
        if (message == null)
            return NotFound();
        
        var translatedText = await _translationService.TranslateAsync(message.OriginalText, request.TargetLanguage);
        
        return Ok(new { translatedText, targetLanguage = request.TargetLanguage });
    }
}

public class SendMessageDto
{
    public int ReceiverId { get; set; }
    public string Message { get; set; } = string.Empty;
    public string TargetLanguage { get; set; } = "hi";
}

public class EditMessageDto
{
    public string Text { get; set; } = string.Empty;
}

public class TranslateMessageDto
{
    public string TargetLanguage { get; set; } = "hi";
}