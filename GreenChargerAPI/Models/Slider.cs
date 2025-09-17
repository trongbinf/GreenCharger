using System.ComponentModel.DataAnnotations;

namespace GreenChargerAPI.Models
{
    public class Slider
    {
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public required string Title { get; set; }

        [StringLength(200)]
        public required string Description { get; set; }

        [Required]
        [StringLength(200)]
        public required string ImageUrl { get; set; }

        [StringLength(200)]
        public string? Link { get; set; }

        public int DisplayOrder { get; set; }

        public bool IsActive { get; set; }

        public DateTime StartDate { get; set; }

        public DateTime EndDate { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }
    }
} 