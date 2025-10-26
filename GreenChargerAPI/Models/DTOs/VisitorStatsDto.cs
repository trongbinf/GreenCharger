namespace GreenChargerAPI.Models.DTOs
{
    public class VisitorStatsDto
    {
        public int TotalVisitors { get; set; }
        public int TotalProductClicks { get; set; }
        public int WeeklyVisitors { get; set; }
        public int WeekNumber { get; set; }
        public int Year { get; set; }
        public DateTime LastUpdated { get; set; }
    }

    public class WeeklyVisitorHistoryDto
    {
        public int WeekNumber { get; set; }
        public int Year { get; set; }
        public int VisitorCount { get; set; }
        public DateTime WeekStartDate { get; set; }
        public DateTime WeekEndDate { get; set; }
    }

    public class ProductClickDto
    {
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public int ClickCount { get; set; }
        public DateTime LastClicked { get; set; }
    }

    public class TrackVisitorRequest
    {
        public string SessionId { get; set; } = string.Empty;
        public string IpAddress { get; set; } = string.Empty;
        public string UserAgent { get; set; } = string.Empty;
    }

    public class TrackProductClickRequest
    {
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string SessionId { get; set; } = string.Empty;
    }
}
