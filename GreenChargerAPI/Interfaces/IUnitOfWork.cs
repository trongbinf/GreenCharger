using GreenChargerAPI.Models;

namespace GreenChargerAPI.Interfaces
{
    public interface IUnitOfWork : IDisposable
    {
        IGenericRepository<Product> Products { get; }
        IGenericRepository<Category> Categories { get; }
        IGenericRepository<Order> Orders { get; }
        IGenericRepository<OrderDetail> OrderDetails { get; }
        IGenericRepository<Slider> Sliders { get; }
         IGenericRepository<Cart> Carts { get; }
        Task<int> CompleteAsync();
    }
}