using Microsoft.EntityFrameworkCore;
using GreenChargerAPI.Data;
using GreenChargerAPI.Interfaces;
using GreenChargerAPI.Models;
using GreenChargerAPI.Repositories;

namespace GreenChargerAPI.Repositories
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly ApplicationDbContext _context;
        private readonly IGenericRepository<Product> _products;
        private readonly IGenericRepository<Category> _categories;
        private readonly IGenericRepository<Order> _orders;
        private readonly IGenericRepository<OrderDetail> _orderDetails;
        private readonly IGenericRepository<Slider> _sliders;
        private readonly IGenericRepository<Cart> _carts;

        public UnitOfWork(ApplicationDbContext context)
        {
            _context = context;
            _products = new GenericRepository<Product>(context);
            _categories = new GenericRepository<Category>(context);
            _orders = new GenericRepository<Order>(context);
            _orderDetails = new GenericRepository<OrderDetail>(context);
            _sliders = new GenericRepository<Slider>(context);
            _carts = new GenericRepository<Cart>(context);
        }

        public IGenericRepository<Product> Products => _products;
        public IGenericRepository<Category> Categories => _categories;
        public IGenericRepository<Order> Orders => _orders;
        public IGenericRepository<OrderDetail> OrderDetails => _orderDetails;
        public IGenericRepository<Slider> Sliders => _sliders;
        public IGenericRepository<Cart> Carts => _carts;
        public async Task<int> CompleteAsync()
        {
            return await _context.SaveChangesAsync();
        }

        public void Dispose()
        {
            _context.Dispose();
        }
    }
}