namespace GreenChargerAPI.Models.DTOs
{
    public class OrderDetailProductDto
    {
        public string Name { get; set; } = string.Empty;
        public string MainImageUrl { get; set; } = string.Empty;
    }

    public class OrderDetailDto
    {
        public int Id { get; set; }
        public int OrderId { get; set; }
        public int ProductId { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal Subtotal { get; set; }
        public OrderDetailProductDto? Product { get; set; } // nullable
    }

    public class OrderDto
    {
        public int Id { get; set; }
        public required string CustomerName { get; set; }
        public required string CustomerEmail { get; set; }
        public required string CustomerPhone { get; set; }
        public required string ShippingAddress { get; set; }
        public decimal TotalAmount { get; set; }
        public required string Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public List<OrderDetailDto> OrderDetails { get; set; } = new();
    }
}
