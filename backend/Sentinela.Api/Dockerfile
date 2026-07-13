FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["Sentinela.Api.csproj", "./"]
RUN dotnet restore "Sentinela.Api.csproj"

COPY . .
RUN dotnet build "Sentinela.Api.csproj" -c Release -o /app/build
RUN dotnet publish "Sentinela.Api.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "Sentinela.Api.dll"]
