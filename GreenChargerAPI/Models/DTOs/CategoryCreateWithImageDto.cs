using Microsoft.AspNetCore.Http;

namespace GreenChargerAPI.Models.DTOs
{
    public class CategoryCreateWithImageDto
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public IFormFile? File { get; set; }
    }
} 