FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["Sentinela.Api.csproj", "./"]
RUN dotnet restore "Sentinela.Api.csproj"

COPY . .
RUN dotnet build "Sentinela.Api.csproj" -c Release -o /app/build
RUN dotnet publish "Sentinela.Api.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# QuestPDF (gerador de PDF das multas anexadas por e-mail) renderiza texto via
# SkiaSharp, que precisa de uma fonte instalada no sistema — a imagem base do
# ASP.NET não vem com nenhuma. Sem isso, a geração do PDF falha em runtime
# (capturado com fallback em NotificacaoService, mas o e-mail sai sem anexo).
RUN apt-get update \
    && apt-get install -y --no-install-recommends fontconfig fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "Sentinela.Api.dll"]
