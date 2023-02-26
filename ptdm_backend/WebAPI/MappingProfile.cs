using AutoMapper;
using WebAPI.DTOs;
using WebAPI.Models;

namespace WebAPI;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<Product, ProductInsertDTO>().ReverseMap();
        CreateMap<Sale, SaleDTO>().ReverseMap();
        CreateMap<SaleProduct, SaleProductDTO>().ReverseMap();
    }
}