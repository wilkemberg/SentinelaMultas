using Microsoft.EntityFrameworkCore;
using Sentinela.Api.Models;

namespace Sentinela.Api.Data;

public class SentinelaDbContext : DbContext
{
    public SentinelaDbContext(DbContextOptions<SentinelaDbContext> options) : base(options) { }

    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Veiculo> Veiculos => Set<Veiculo>();
    public DbSet<Multa> Multas => Set<Multa>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // ─── Usuario ───────────────────────────────────────────────────────────
        modelBuilder.Entity<Usuario>(e =>
        {
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.Nome).HasMaxLength(200);
            e.Property(u => u.Email).HasMaxLength(300);
            e.Property(u => u.SenhaHash).HasMaxLength(500);
            e.Property(u => u.WhatsAppNumero).HasMaxLength(20);
            e.Property(u => u.Cpf).HasMaxLength(11);
            e.Property(u => u.NumeroRegistroCnh).HasMaxLength(20);
            e.Property(u => u.CategoriaCnh).HasMaxLength(5);
            // Mapeadas como "date" (sem fuso/hora) — evita a exceção do Npgsql 6+
            // ao gravar DateTime com Kind=Unspecified em coluna timestamptz.
            e.Property(u => u.DataNascimento).HasColumnType("date");
            e.Property(u => u.DataExpedicaoCnh).HasColumnType("date");
            e.Property(u => u.NomeMae).HasMaxLength(200);
            e.Property(u => u.SituacaoCnh).HasMaxLength(50);
            // Mesma regra do DataExpedicaoCnh acima — validade real vem sem hora.
            e.Property(u => u.ValidadeCnhOficial).HasColumnType("date");
        });

        // ─── Veiculo ───────────────────────────────────────────────────────────
        modelBuilder.Entity<Veiculo>(e =>
        {
            e.HasIndex(v => new { v.Placa, v.Renavam }).IsUnique();
            e.Property(v => v.Placa).HasMaxLength(10);
            e.Property(v => v.Renavam).HasMaxLength(20);
            e.Property(v => v.Uf).HasMaxLength(2);

            e.HasOne(v => v.Usuario)
             .WithMany(u => u.Veiculos)
             .HasForeignKey(v => v.UsuarioId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // ─── Multa ─────────────────────────────────────────────────────────────
        modelBuilder.Entity<Multa>(e =>
        {
            // Evita duplicata de auto dentro do mesmo veículo
            e.HasIndex(m => new { m.VeiculoId, m.NumeroAutoInfracao }).IsUnique();

            e.Property(m => m.NumeroAutoInfracao).HasMaxLength(50);
            e.Property(m => m.OrgaoAutuador).HasMaxLength(100);
            e.Property(m => m.CodigoInfracaoCtb).HasMaxLength(20);
            e.Property(m => m.ArtigoCtb).HasMaxLength(100);
            e.Property(m => m.DescricaoInfracao).HasMaxLength(500);
            e.Property(m => m.Valor).HasPrecision(10, 2);
            e.Property(m => m.LocalInfracao).HasMaxLength(300);
            e.Property(m => m.Municipio).HasMaxLength(100);

            // URLs de documentos (PDF/HTML) retornadas pela consulta — sem limite fixo.
            e.Property(m => m.AutuacaoPdfUrl).HasColumnType("text");
            e.Property(m => m.BoletoPdfUrl).HasColumnType("text");

            // Textos longos gerados pela IA
            e.Property(m => m.AnaliseIa).HasColumnType("text");
            e.Property(m => m.FundamentacaoRecurso).HasColumnType("text");
            e.Property(m => m.TextoDefesa).HasColumnType("text");
            e.Property(m => m.ComoEvitarNoFuturo).HasColumnType("text");
            e.Property(m => m.OndeRecorrer).HasColumnType("text");
            e.Property(m => m.OndeObterDesconto).HasColumnType("text");

            e.HasOne(m => m.Veiculo)
             .WithMany(v => v.Multas)
             .HasForeignKey(m => m.VeiculoId)
             .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
