# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["ptdm.sln", "./"]
COPY ["WebAPI/ptdm.Api.csproj", "WebAPI/"]
COPY ["ptdm.Domain/ptdm.Domain.csproj", "ptdm.Domain/"]
COPY ["ptdm.Service/ptdm.Service.csproj", "ptdm.Service/"]
COPY ["ptdm.Data/ptdm.Data.csproj", "ptdm.Data/"]
RUN dotnet restore "WebAPI/ptdm.Api.csproj"
COPY . .
WORKDIR "/src/WebAPI"
RUN dotnet build "ptdm.Api.csproj" -c Release -o /app/build

# Publish Stage
FROM build AS publish
RUN dotnet publish "ptdm.Api.csproj" -c Release -o /app/publish

# Final Stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
EXPOSE 5175
ENV ASPNETCORE_HTTP_PORTS=5175
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "ptdm.Api.dll"]
