using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GreenChargerAPI.Data;
using GreenChargerAPI.Models;
using GreenChargerAPI.Models.DTOs;

namespace GreenChargerAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class VisitorTrackingController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public VisitorTrackingController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("stats")]
        public async Task<ActionResult<VisitorStatsDto>> GetVisitorStats()
        {
            var stats = await _context.VisitorStats.FirstOrDefaultAsync();
            var currentWeek = GetWeekNumber(DateTime.UtcNow);
            var currentYear = DateTime.UtcNow.Year;
            
            if (stats == null)
            {
                // Create initial stats if none exist
                stats = new VisitorStats
                {
                    TotalVisitors = 0,
                    TotalProductClicks = 0,
                    WeeklyVisitors = 0,
                    WeekNumber = currentWeek,
                    Year = currentYear,
                    LastUpdated = DateTime.UtcNow
                };
                _context.VisitorStats.Add(stats);
                await _context.SaveChangesAsync();
            }
            else
            {
                // Check if we need to reset weekly counter
                if (stats.WeekNumber != currentWeek || stats.Year != currentYear)
                {
                    // Save current week's data to history
                    await SaveWeeklyHistory(stats.WeekNumber, stats.Year, stats.WeeklyVisitors);
                    
                    // Reset weekly counter for new week
                    stats.WeeklyVisitors = 0;
                    stats.WeekNumber = currentWeek;
                    stats.Year = currentYear;
                    stats.LastUpdated = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                }
            }

            return Ok(new VisitorStatsDto
            {
                TotalVisitors = stats.TotalVisitors,
                TotalProductClicks = stats.TotalProductClicks,
                WeeklyVisitors = stats.WeeklyVisitors,
                WeekNumber = stats.WeekNumber,
                Year = stats.Year,
                LastUpdated = stats.LastUpdated
            });
        }

        [HttpGet("product-clicks")]
        public async Task<ActionResult<List<ProductClickDto>>> GetProductClicks()
        {
            var productClicks = await _context.ProductClicks
                .OrderByDescending(pc => pc.ClickCount)
                .Select(pc => new ProductClickDto
                {
                    ProductId = pc.ProductId,
                    ProductName = pc.ProductName,
                    ClickCount = pc.ClickCount,
                    LastClicked = pc.LastClicked
                })
                .ToListAsync();

            return Ok(productClicks);
        }

        [HttpGet("product-clicks/{productId}")]
        public async Task<ActionResult<int>> GetProductClickCount(int productId)
        {
            var productClick = await _context.ProductClicks
                .FirstOrDefaultAsync(pc => pc.ProductId == productId);

            return Ok(productClick?.ClickCount ?? 0);
        }

        [HttpPost("track-visitor")]
        public async Task<ActionResult> TrackVisitor([FromBody] TrackVisitorRequest request)
        {
            try
            {
                var stats = await _context.VisitorStats.FirstOrDefaultAsync();
                var currentWeek = GetWeekNumber(DateTime.UtcNow);
                var currentYear = DateTime.UtcNow.Year;
                
                if (stats == null)
                {
                    stats = new VisitorStats
                    {
                        TotalVisitors = 1,
                        TotalProductClicks = 0,
                        WeeklyVisitors = 1,
                        WeekNumber = currentWeek,
                        Year = currentYear,
                        LastUpdated = DateTime.UtcNow
                    };
                    _context.VisitorStats.Add(stats);
                }
                else
                {
                    // Check if we need to reset weekly counter
                    if (stats.WeekNumber != currentWeek || stats.Year != currentYear)
                    {
                        // Save current week's data to history
                        await SaveWeeklyHistory(stats.WeekNumber, stats.Year, stats.WeeklyVisitors);
                        
                        // Reset weekly counter for new week
                        stats.WeeklyVisitors = 1;
                        stats.WeekNumber = currentWeek;
                        stats.Year = currentYear;
                    }
                    else
                    {
                        // Same week, just increment
                        stats.WeeklyVisitors++;
                    }
                    
                    // Always increment total visitors and update timestamp
                    stats.TotalVisitors++;
                    stats.LastUpdated = DateTime.UtcNow;
                }

                // Track session (optional - for detailed analytics)
                var existingSession = await _context.VisitorSessions
                    .FirstOrDefaultAsync(vs => vs.SessionId == request.SessionId);

                if (existingSession == null)
                {
                    var newSession = new VisitorSession
                    {
                        SessionId = request.SessionId,
                        IpAddress = request.IpAddress,
                        UserAgent = request.UserAgent,
                        FirstVisit = DateTime.UtcNow,
                        LastVisit = DateTime.UtcNow,
                        PageViews = 1,
                        IsNewVisitor = true
                    };
                    _context.VisitorSessions.Add(newSession);
                }
                else
                {
                    existingSession.LastVisit = DateTime.UtcNow;
                    existingSession.PageViews++;
                    existingSession.IsNewVisitor = false;
                }

                await _context.SaveChangesAsync();
                return Ok();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error tracking visitor: {ex.Message}");
            }
        }

        [HttpPost("track-product-click")]
        public async Task<ActionResult> TrackProductClick([FromBody] TrackProductClickRequest request)
        {
            try
            {
                // Update total product clicks
                var stats = await _context.VisitorStats.FirstOrDefaultAsync();
                if (stats == null)
                {
                    stats = new VisitorStats
                    {
                        TotalVisitors = 0,
                        TotalProductClicks = 1,
                        LastUpdated = DateTime.UtcNow
                    };
                    _context.VisitorStats.Add(stats);
                }
                else
                {
                    stats.TotalProductClicks++;
                    stats.LastUpdated = DateTime.UtcNow;
                }

                // Update or create product click record
                var productClick = await _context.ProductClicks
                    .FirstOrDefaultAsync(pc => pc.ProductId == request.ProductId);

                if (productClick == null)
                {
                    productClick = new ProductClick
                    {
                        ProductId = request.ProductId,
                        ProductName = request.ProductName,
                        ClickCount = 1,
                        LastClicked = DateTime.UtcNow
                    };
                    _context.ProductClicks.Add(productClick);
                }
                else
                {
                    productClick.ClickCount++;
                    productClick.LastClicked = DateTime.UtcNow;
                    productClick.ProductName = request.ProductName; // Update name in case it changed
                }

                await _context.SaveChangesAsync();
                return Ok();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error tracking product click: {ex.Message}");
            }
        }

        [HttpPost("reset-stats")]
        public async Task<ActionResult> ResetStats()
        {
            try
            {
                // Reset visitor stats
                var stats = await _context.VisitorStats.FirstOrDefaultAsync();
                if (stats != null)
                {
                    stats.TotalVisitors = 0;
                    stats.TotalProductClicks = 0;
                    stats.WeeklyVisitors = 0;
                    stats.LastUpdated = DateTime.UtcNow;
                }

                // Clear product clicks
                _context.ProductClicks.RemoveRange(_context.ProductClicks);

                // Clear visitor sessions
                _context.VisitorSessions.RemoveRange(_context.VisitorSessions);

                await _context.SaveChangesAsync();
                return Ok();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error resetting stats: {ex.Message}");
            }
        }

        [HttpGet("weekly-history")]
        public async Task<ActionResult<List<WeeklyVisitorHistoryDto>>> GetWeeklyHistory()
        {
            var history = await _context.WeeklyVisitorHistories
                .OrderByDescending(h => h.Year)
                .ThenByDescending(h => h.WeekNumber)
                .Select(h => new WeeklyVisitorHistoryDto
                {
                    WeekNumber = h.WeekNumber,
                    Year = h.Year,
                    VisitorCount = h.VisitorCount,
                    WeekStartDate = h.WeekStartDate,
                    WeekEndDate = h.WeekEndDate
                })
                .ToListAsync();

            return Ok(history);
        }

        private int GetWeekNumber(DateTime date)
        {
            var culture = System.Globalization.CultureInfo.CurrentCulture;
            var calendar = culture.Calendar;
            return calendar.GetWeekOfYear(date, culture.DateTimeFormat.CalendarWeekRule, culture.DateTimeFormat.FirstDayOfWeek);
        }

        private async Task SaveWeeklyHistory(int weekNumber, int year, int visitorCount)
        {
            if (visitorCount > 0) // Only save if there were visitors
            {
                var weekStart = GetWeekStartDate(year, weekNumber);
                var weekEnd = weekStart.AddDays(6);

                var history = new WeeklyVisitorHistory
                {
                    WeekNumber = weekNumber,
                    Year = year,
                    VisitorCount = visitorCount,
                    WeekStartDate = weekStart,
                    WeekEndDate = weekEnd
                };

                _context.WeeklyVisitorHistories.Add(history);
            }
        }

        private DateTime GetWeekStartDate(int year, int weekNumber)
        {
            var jan1 = new DateTime(year, 1, 1);
            var daysOffset = DayOfWeek.Monday - jan1.DayOfWeek;
            var firstMonday = jan1.AddDays(daysOffset);
            var firstWeek = firstMonday.AddDays((weekNumber - 1) * 7);
            return firstWeek;
        }
    }
}
