using System.ComponentModel.DataAnnotations;

namespace GreenChargerAPI.Models
{
    public class VisitorStats
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public int TotalVisitors { get; set; }
        
        [Required]
        public int TotalProductClicks { get; set; }
        
        [Required]
        public int WeeklyVisitors { get; set; }
        
        [Required]
        public int WeekNumber { get; set; }
        
        [Required]
        public int Year { get; set; }
        
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class WeeklyVisitorHistory
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public int WeekNumber { get; set; }
        
        [Required]
        public int Year { get; set; }
        
        [Required]
        public int VisitorCount { get; set; }
        
        [Required]
        public DateTime WeekStartDate { get; set; }
        
        [Required]
        public DateTime WeekEndDate { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class ProductClick
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public int ProductId { get; set; }
        
        [Required]
        public string ProductName { get; set; } = string.Empty;
        
        [Required]
        public int ClickCount { get; set; }
        
        public DateTime LastClicked { get; set; } = DateTime.UtcNow;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation property
        public Product? Product { get; set; }
    }

    public class VisitorSession
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public string SessionId { get; set; } = string.Empty;
        
        [Required]
        public string IpAddress { get; set; } = string.Empty;
        
        [Required]
        public string UserAgent { get; set; } = string.Empty;
        
        public DateTime FirstVisit { get; set; } = DateTime.UtcNow;
        
        public DateTime LastVisit { get; set; } = DateTime.UtcNow;
        
        public int PageViews { get; set; } = 0;
        
        public bool IsNewVisitor { get; set; } = true;
    }
}
